import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bookingSchema } from '@/lib/bookingSchema';
import { BookingServiceError, createPersistedBooking } from '@/lib/bookingService';
import { createBookingViewToken } from '@/lib/customerLink';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`booking:${clientIp(request)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many booking attempts. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const booking = await createPersistedBooking(bookingSchema.parse(await request.json()));

    // Scoped read token: the following pages fetch booking details (PII) so the
    // details/voucher/checkout chain must present it, and nothing else can.
    const accessToken = createBookingViewToken(booking.id);
    const redirectUrl = accessToken
      ? `/checkout/${booking.id}?access=${encodeURIComponent(accessToken)}`
      : `/checkout/${booking.id}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          booking,
          redirectUrl,
          ...(accessToken ? { accessToken } : {}),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    if (error instanceof BookingServiceError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.code === 'NOT_FOUND' ? 404 : 400 },
      );
    }

    console.error('Booking creation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking' } },
      { status: 500 },
    );
  }
}
