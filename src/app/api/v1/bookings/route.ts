import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bookingSchema } from '@/lib/bookingSchema';
import { BookingServiceError, createPersistedBooking } from '@/lib/bookingService';
import { clientIp, rateLimit } from '@/lib/rateLimit';

/**
 * Create booking
 *
 * Public API v1: persists through the shared booking service so pricing,
 * promos, coupons, holds and cut-offs behave identically to the internal flow.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`api-v1-booking:${clientIp(request)}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many booking attempts. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const booking = await createPersistedBooking(bookingSchema.parse(await request.json()));

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
    if (error instanceof BookingServiceError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'UNAVAILABLE' ? 409 : 400;
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    console.error('POST /api/v1/bookings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking' } },
      { status: 500 }
    );
  }
}
