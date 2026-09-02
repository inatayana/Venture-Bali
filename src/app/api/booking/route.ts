import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockVentures, mockPickupZones, mockVehicleClasses } from '@/data/mockVentures';
import type { Booking, Variant } from '@/types/venture';
import {
  calculateTotalPrice,
  validateAddonModeCombinations,
  isBookable,
  isDateAvailable,
  getAvailableSlots,
} from '@/lib/pricing';

const bookingSchema = z.object({
  ventureId: z.string().min(1, 'Venture ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be YYYY-MM-DD'),
  slotTimeId: z.string().min(1, 'Time slot ID is required'),
  fulfillmentMode: z.enum(['SELF_DRIVE', 'PRIVATE_TRANSFER']),
  pickupZoneId: z.string().optional(),
  vehicleClassType: z.enum(['STANDARD_SUV', 'PREMIUM_MPV', 'MINIVAN']).optional(),
  hotelAddress: z.string().optional(),
  paxCount: z.number().int().min(1, 'At least 1 participant required'),
  selectedAddons: z.array(z.string()).optional(),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email format'),
  customerWhatsApp: z.string().min(10, 'WhatsApp number required'),
});

function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const validated = bookingSchema.parse(await request.json());

    const venture = mockVentures.find((v) => v.id === validated.ventureId);
    const variant: Variant | undefined = venture?.variants?.find((v) => v.id === validated.variantId);
    if (!venture || !variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Venture or variant not found' } },
        { status: 404 }
      );
    }

    // Blackout date check
    if (!isDateAvailable(variant, validated.bookingDate)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAVAILABLE', message: 'Selected date is not available' } },
        { status: 400 }
      );
    }

    // Slot capacity check (by id, fallback by time label)
    const slots = getAvailableSlots(variant, validated.paxCount);
    const slot = variant.slotTimes?.find(
      (s) => s.id === validated.slotTimeId || s.time === validated.slotTimeId
    );
    if (!slot || !slots.some((s) => s.time === slot.time)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAVAILABLE', message: 'Selected time slot is not available' } },
        { status: 400 }
      );
    }

    // Transfer requirements
    const isTransfer = validated.fulfillmentMode === 'PRIVATE_TRANSFER';
    const zone = isTransfer ? mockPickupZones.find((z) => z.id === validated.pickupZoneId) ?? null : null;
    const vehicleClass = isTransfer
      ? mockVehicleClasses.find((c) => c.name === validated.vehicleClassType) ?? null
      : null;

    if (isTransfer && (!zone || !vehicleClass)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Pickup zone and vehicle class are required for PRIVATE_TRANSFER' } },
        { status: 400 }
      );
    }

    // Dependent combo guard (BOOKING_ARCHITECTURE §2b)
    const violations = validateAddonModeCombinations(
      variant.addons ?? [],
      validated.selectedAddons ?? [],
      validated.fulfillmentMode
    );
    if (violations.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Some selected add-ons require PRIVATE_TRANSFER' } },
        { status: 400 }
      );
    }

    // Server-side price recalculation — client total is never trusted
    const breakdown = calculateTotalPrice(variant.priceTiers, validated.paxCount, validated.fulfillmentMode, {
      zone,
      vehicleClass,
      selectedAddons: (variant.addons ?? []).filter((a) => (validated.selectedAddons ?? []).includes(a.id)),
    });

    // Cut-off check (SELF_DRIVE H-2 / TRANSFER 22:00 WITA D-1, Zone 4 = quote only)
    const [y, m, d] = validated.bookingDate.split('-').map(Number);
    const activityTime = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    if (!isBookable(activityTime, validated.fulfillmentMode, new Date(), zone)) {
      return NextResponse.json(
        { success: false, error: { code: 'CUT_OFF', message: isTransfer && zone?.isCustomQuote ? 'Outer area requires a custom quote' : 'Booking cut-off has passed for this slot' } },
        { status: 400 }
      );
    }

    const booking: Booking = {
      id: `booking_${Date.now()}`,
      bookingCode: generateBookingCode(),
      variantId: variant.id,
      variant,
      customerId: `customer_${Date.now()}`,
      bookingDate: validated.bookingDate,
      slotTimeId: slot.id,
      slotTime: slot,
      fulfillmentMode: validated.fulfillmentMode,
      pickupZoneId: zone?.id,
      pickupZone: zone ?? undefined,
      vehicleClassId: vehicleClass?.id,
      vehicleClass: vehicleClass ?? undefined,
      hotelAddress: validated.hotelAddress,
      paxCount: validated.paxCount,
      vehicleCount: breakdown.transfer.vehicleCount,
      zoneSurchargeIdr: breakdown.transfer.totalFeeIdr,
      selectedAddons: (variant.addons ?? [])
        .filter((a) => (validated.selectedAddons ?? []).includes(a.id))
        .map((a) => ({ id: a.id, name: a.name, price: a.price })),
      totalPrice: breakdown.totalPriceIdr,
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          booking,
          redirectUrl: `/checkout/${booking.id}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking' } },
      { status: 500 }
    );
  }
}
