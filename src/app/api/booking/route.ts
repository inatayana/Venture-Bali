import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bookingSchema } from '@/lib/bookingSchema';
import { BookingServiceError, createPersistedBooking } from '@/lib/bookingService';

export async function POST(request: NextRequest) {
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
