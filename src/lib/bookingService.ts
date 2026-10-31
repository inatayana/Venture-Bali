import { Prisma, type Booking as PrismaBooking } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { BookingInput } from '@/lib/bookingSchema';
import type { Addon, VehicleClass } from '@/types/venture';
import {
  COUPON_REJECTION_MESSAGES,
  computeQuote,
  isDateAvailable,
  isSlotBookable,
  validateAddonModeCombinations,
} from '@/lib/pricing';
import { holdExpiresAt } from '@/lib/bookingLifecycle';
import { WAIVER_VERSION } from '@/lib/legal';

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

  if (variant.fulfillmentMode !== input.fulfillmentMode) {
    throw new BookingServiceError(
      'VALIDATION_ERROR',
      `This package is sold as ${variant.fulfillmentMode}, not ${input.fulfillmentMode}`,
    );
  }

  if (!isDateAvailable({ blackoutDates: stringArray(variant.blackoutDates) }, input.bookingDate)) {
    throw new BookingServiceError('UNAVAILABLE', 'Selected date is not available');
  }

  const slot = variant.slotTimes.find((item) => item.id === input.slotTimeId);
  if (!slot || !slot.isAvailable) {
    throw new BookingServiceError('UNAVAILABLE', 'Selected time slot is not available');
  }

  const needsPickup = input.fulfillmentMode !== 'SELF_DRIVE';
  const zone = needsPickup
    ? await tx.pickupZone.findFirst({ where: { id: input.pickupZoneId, isActive: true } })
    : null;
  const vehicleClass =
    input.fulfillmentMode === 'PRIVATE_TRANSFER'
      ? await tx.vehicleClass.findFirst({ where: { name: input.vehicleClassType, isActive: true } })
      : null;

  if (needsPickup && !zone) {
    throw new BookingServiceError('VALIDATION_ERROR', 'Pickup zone is required for a transfer booking');
  }

  if (input.fulfillmentMode === 'PRIVATE_TRANSFER' && !vehicleClass) {
    throw new BookingServiceError('VALIDATION_ERROR', 'Vehicle class is required for PRIVATE_TRANSFER');
  }

  if (zone?.isCustomQuote) {
    throw new BookingServiceError('UNAVAILABLE', 'Outer area requires a custom quote');
  }

  const coupon = input.couponCode
    ? await tx.coupon.findFirst({ where: { code: input.couponCode } })
    : null;
  if (input.couponCode && !coupon) {
    throw new BookingServiceError('VALIDATION_ERROR', 'Coupon code not found');
  }

  const availableAddons = variant.addons.map(toAddon);
  const selectedAddons = availableAddons.filter((addon) => input.selectedAddons.includes(addon.id));
  if (selectedAddons.length !== new Set(input.selectedAddons).size) {
    throw new BookingServiceError('VALIDATION_ERROR', 'One or more selected add-ons are not available for this package');
  }

  if (validateAddonModeCombinations(availableAddons, input.selectedAddons, input.fulfillmentMode).length > 0) {
    throw new BookingServiceError('VALIDATION_ERROR', 'Some selected add-ons require a transfer package');
  }

  if (!isSlotBookable(input.bookingDate, slot.time, input.fulfillmentMode, new Date())) {
    throw new BookingServiceError('CUT_OFF', 'Booking cut-off has passed for this slot');
  }

  await tx.$queryRaw`SELECT "id" FROM "SlotTime" WHERE "id" = ${slot.id} FOR UPDATE`;

  const reserved = await tx.booking.aggregate({
    where: {
      slotTimeId: slot.id,
      bookingDate: input.bookingDate,
      OR: [
        { paymentStatus: 'PAID' },
        { paymentStatus: 'PENDING', expiresAt: { gt: new Date() } },
      ],
    },
    _sum: { paxCount: true },
  });
  if ((reserved._sum.paxCount ?? 0) + input.paxCount > slot.maxCapacity) {
    throw new BookingServiceError('UNAVAILABLE', 'Selected time slot no longer has enough capacity');
  }

  const breakdown = computeQuote({
    priceTiers: variant.priceTiers,
    paxCount: input.paxCount,
    fulfillmentMode: input.fulfillmentMode,
    promoPriceIdr: variant.promoPriceIdr,
    coupon,
    minimumSpendIdr: variant.minimumSpendIdr,
    slotTimeLabel: slot.time,
    zone,
    vehicleClass: vehicleClass ? toVehicleClass(vehicleClass) : null,
    selectedAddons,
  });

  if (input.couponCode && breakdown.couponRejection) {
    throw new BookingServiceError(
      'VALIDATION_ERROR',
      COUPON_REJECTION_MESSAGES[breakdown.couponRejection],
    );
  }

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
      hotelAddress: input.isTba ? null : input.hotelAddress,
      isTba: input.isTba,
      paxCount: input.paxCount,
      vehicleCount: breakdown.transfer.vehicleCount,
      zoneSurchargeIdr: breakdown.transfer.totalFeeIdr,
      nightSurchargeIdr: breakdown.nightSurchargeIdr,
      discountIdr: breakdown.discountIdr,
      appliedCouponCode: breakdown.couponCode,
      selectedAddons: selectedAddons.map((addon) => ({ id: addon.id, name: addon.name, price: addon.price })),
      totalPrice: breakdown.totalPriceIdr,
      paymentStatus: 'PENDING',
      lifecycleStatus: 'AWAITING_PAYMENT',
      expiresAt: holdExpiresAt(),
      termsAcceptedAt: new Date(),
      waiverAcceptedAt: new Date(),
      waiverVersion: WAIVER_VERSION,
      billingAddress: input.billingAddress as unknown as Prisma.InputJsonValue,
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
