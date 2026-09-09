import { Prisma, type Booking as PrismaBooking } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { BookingInput } from '@/lib/bookingSchema';
import type { Addon, VehicleClass } from '@/types/venture';
import {
  calculateTotalPrice,
  isBookable,
  isDateAvailable,
  validateAddonModeCombinations,
} from '@/lib/pricing';

const PENDING_HOLD_MINUTES = 15;
const SERIALIZATION_RETRY_LIMIT = 3;

export class BookingServiceError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'UNAVAILABLE' | 'VALIDATION_ERROR' | 'CUT_OFF',
    message: string,
  ) {
    super(message);
  }
}

function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
}

function getPendingHoldStartedAt(now: Date): Date {
  return new Date(now.getTime() - PENDING_HOLD_MINUTES * 60 * 1000);
}

export async function createPersistedBooking(input: BookingInput): Promise<PrismaBooking> {
  for (let attempt = 0; attempt < SERIALIZATION_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => createBookingInTransaction(tx, input),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isSerializationFailure(error) && attempt < SERIALIZATION_RETRY_LIMIT - 1) continue;
      throw error;
    }
  }

  throw new Error('Unable to reserve booking capacity');
}

async function createBookingInTransaction(
  tx: Prisma.TransactionClient,
  input: BookingInput,
): Promise<PrismaBooking> {
  const venture = await tx.venture.findUnique({
    where: { id: input.ventureId },
    include: {
      variants: {
        where: { id: input.variantId },
        include: { priceTiers: true, slotTimes: true, addons: true },
      },
    },
  });
  const variant = venture?.variants[0];
  if (!venture || !variant) {
    throw new BookingServiceError('NOT_FOUND', 'Venture or variant not found');
  }

  if (!isDateAvailable({ blackoutDates: stringArray(variant.blackoutDates) }, input.bookingDate)) {
    throw new BookingServiceError('UNAVAILABLE', 'Selected date is not available');
  }

  const slot = variant.slotTimes.find((item) => item.id === input.slotTimeId);
  if (!slot || !slot.isAvailable) {
    throw new BookingServiceError('UNAVAILABLE', 'Selected time slot is not available');
  }

  const isTransfer = input.fulfillmentMode === 'PRIVATE_TRANSFER';
  const [zone, vehicleClass] = isTransfer
    ? await Promise.all([
        tx.pickupZone.findFirst({ where: { id: input.pickupZoneId, isActive: true } }),
        tx.vehicleClass.findFirst({ where: { name: input.vehicleClassType, isActive: true } }),
      ])
    : [null, null];

  if (isTransfer && (!zone || !vehicleClass)) {
    throw new BookingServiceError('VALIDATION_ERROR', 'Pickup zone and vehicle class are required for PRIVATE_TRANSFER');
  }

  if (zone?.isCustomQuote) {
    throw new BookingServiceError('UNAVAILABLE', 'Outer area requires a custom quote');
  }

  const availableAddons = variant.addons.map(toAddon);
  const selectedAddons = availableAddons.filter((addon) => input.selectedAddons.includes(addon.id));
  if (selectedAddons.length !== new Set(input.selectedAddons).size) {
    throw new BookingServiceError('VALIDATION_ERROR', 'One or more selected add-ons are not available for this package');
  }

  if (validateAddonModeCombinations(availableAddons, input.selectedAddons, input.fulfillmentMode).length > 0) {
    throw new BookingServiceError('VALIDATION_ERROR', 'Some selected add-ons require PRIVATE_TRANSFER');
  }

  const [year, month, day] = input.bookingDate.split('-').map(Number);
  const activityTime = new Date(Date.UTC(year, month - 1, day));
  if (!isBookable(activityTime, input.fulfillmentMode, new Date(), zone)) {
    throw new BookingServiceError('CUT_OFF', 'Booking cut-off has passed for this slot');
  }

  await tx.$queryRaw`SELECT "id" FROM "SlotTime" WHERE "id" = ${slot.id} FOR UPDATE`;

  const reserved = await tx.booking.aggregate({
    where: {
      slotTimeId: slot.id,
      bookingDate: input.bookingDate,
      OR: [
        { paymentStatus: 'PAID' },
        { paymentStatus: 'PENDING', createdAt: { gte: getPendingHoldStartedAt(new Date()) } },
      ],
    },
    _sum: { paxCount: true },
  });
  if ((reserved._sum.paxCount ?? 0) + input.paxCount > slot.maxCapacity) {
    throw new BookingServiceError('UNAVAILABLE', 'Selected time slot no longer has enough capacity');
  }

  const breakdown = calculateTotalPrice(variant.priceTiers, input.paxCount, input.fulfillmentMode, {
    zone,
    vehicleClass: vehicleClass ? toVehicleClass(vehicleClass) : null,
    selectedAddons,
  });

  const customer = await tx.customer.upsert({
    where: { email: input.customerEmail.toLowerCase() },
    create: {
      email: input.customerEmail.toLowerCase(),
      name: input.customerName,
      countryCode: input.countryCode,
      whatsapp: input.customerWhatsApp,
    },
    update: {
      name: input.customerName,
      countryCode: input.countryCode,
      whatsapp: input.customerWhatsApp,
    },
  });

  return tx.booking.create({
    data: {
      bookingCode: generateBookingCode(),
      variantId: variant.id,
      customerId: customer.id,
      bookingDate: input.bookingDate,
      slotTimeId: slot.id,
      fulfillmentMode: input.fulfillmentMode,
      pickupZoneId: zone?.id,
      vehicleClassId: vehicleClass?.id,
      hotelAddress: input.hotelAddress,
      paxCount: input.paxCount,
      vehicleCount: breakdown.transfer.vehicleCount,
      zoneSurchargeIdr: breakdown.transfer.totalFeeIdr,
      selectedAddons: selectedAddons.map((addon) => ({ id: addon.id, name: addon.name, price: addon.price })),
      totalPrice: breakdown.totalPriceIdr,
      paymentStatus: 'PENDING',
    },
  });
}

function isSerializationFailure(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
}

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : [];
}

function toAddon(addon: {
  id: string;
  variantId: string;
  name: string;
  price: number;
  description: string | null;
  requiresTransfer: boolean;
  isCombo: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Addon {
  return { ...addon, description: addon.description ?? undefined };
}

function toVehicleClass(vehicleClass: {
  id: string;
  name: VehicleClass['name'];
  label: string;
  description: string | null;
  vehicleMaxPax: number;
  deltaIdr: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): VehicleClass {
  return { ...vehicleClass, description: vehicleClass.description ?? undefined };
}
