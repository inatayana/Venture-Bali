import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockVentures } from '@/data/mockVentures';
import type { VentureItem, Variant, SlotTime, Booking, FulfillmentMode } from '@/types/venture';
import { calculatePriceBreakdown, isDateAvailable, getAvailableSlots } from '@/lib/pricing';

const bookingSchema = z.object({
  ventureId: z.string().min(1, 'Venture ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be YYYY-MM-DD'),
  slotTimeId: z.string().min(1, 'Time slot ID is required'),
  fulfillmentMode: z.enum(['SELF_DRIVE', 'PRIVATE_TRANSFER']),
  pickupZoneId: z.string().optional(),
  hotelAddress: z.string().optional(),
  paxCount: z.number().int().min(1, 'At least 1 participant required'),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email format'),
  customerWhatsApp: z.string().min(10, 'WhatsApp number required'),
  selectedAddons: z.array(z.string()).optional(),
});

function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
}

function findVentureAndVariant(ventureId: string, variantId: string): { venture: VentureItem; variant: Variant } | null {
  const venture = mockVentures.find(v => v.id === ventureId);
  if (!venture) return null;

  const variant = venture.variants?.find(v => v.id === variantId);
  if (!variant) return null;

  return { venture, variant };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bookingSchema.parse(body);

    const { venture, variant } = findVentureAndVariant(validated.ventureId, validated.variantId) || { venture: null, variant: null };
    if (!venture || !variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Venture or variant not found' } },
        { status: 404 }
      );
    }

    // Validate date availability
    if (!isDateAvailable(variant, validated.bookingDate)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAVAILABLE', message: 'Selected date is not available' } },
        { status: 400 }
      );
    }

    // Validate slot time
    const availableSlots = getAvailableSlots(variant, validated.paxCount);
    const selectedSlot = availableSlots.find(s => s.time === validated.slotTimeId);
    if (!selectedSlot) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAVAILABLE', message: 'Selected time slot is not available' } },
        { status: 400 }
      );
    }

    // Calculate pricing
    const priceBreakdown = calculatePriceBreakdown(variant.priceTiers, validated.paxCount);
    let totalPrice = priceBreakdown.totalPrice;

    // Add pickup zone surcharge if private transfer
    let zoneSurcharge = 0;
    if (validated.fulfillmentMode === 'PRIVATE_TRANSFER' && validated.pickupZoneId) {
      // In real implementation, fetch pickup zone from DB
      zoneSurcharge = 150000; // Example surcharge
      totalPrice += zoneSurcharge;
    }

    // Add addons
    const addonTotal = (validated.selectedAddons || []).reduce((sum, addonId) => {
      const addon = variant.addons?.find(a => a.id === addonId);
      return sum + (addon?.price || 0);
    }, 0);
    totalPrice += addonTotal;

    // Create booking object
    const booking: Booking = {
      id: `booking_${Date.now()}`,
      bookingCode: generateBookingCode(),
      variantId: validated.variantId,
      variant,
      customerId: `customer_${Date.now()}`,
      customer: undefined,
      bookingDate: validated.bookingDate,
      slotTimeId: validated.slotTimeId,
      slotTime: variant.slotTimes?.find(s => s.id === validated.slotTimeId),
      fulfillmentMode: validated.fulfillmentMode,
      pickupZoneId: validated.pickupZoneId,
      hotelAddress: validated.hotelAddress,
      paxCount: validated.paxCount,
      vehicleCount: Math.ceil(validated.paxCount / 4), // 4 pax per vehicle
      zoneSurchargeIdr: zoneSurcharge,
      selectedAddons: (validated.selectedAddons || []).map(id => {
        const addon = variant.addons?.find(a => a.id === id);
        return addon ? { id, name: addon.name, price: addon.price } : { id, name: '', price: 0 };
      }).filter(a => a.price > 0),
      totalPrice,
      paymentStatus: 'PENDING',
      payment: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In real implementation, save to database
    // await prisma.booking.create({ data: booking });

    return NextResponse.json({
      success: true,
      data: {
        booking,
        redirectUrl: `/checkout/${booking.id}`,
      },
    }, { status: 201 });

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