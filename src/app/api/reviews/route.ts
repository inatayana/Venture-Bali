import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { canReviewBooking, reviewBlockedReason, reviewInputSchema } from '@/lib/reviewSchema';

/**
 * Submit a review for a paid, finished trip.
 *
 * Authorisation is the customer magic-link token: no account, no password.
 * Reviews are stored unapproved and appear on the product page after moderation.
 */
export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = reviewInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      },
      { status: 400 }
    );
  }

  const { token, bookingId, rating, comment } = parsed.data;

  const session = verifyCustomerLinkToken(token);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'This review link is invalid or has expired. Open the link from your booking message.',
        },
      },
      { status: 401 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      paymentStatus: true,
      bookingDate: true,
      review: { select: { id: true } },
      variant: {
        select: {
          ventureId: true,
          venture: { select: { id: true, slug: true } },
        },
      },
    },
  });

  if (!booking || booking.customerId !== session.customerId || !booking.variant) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
      { status: 404 }
    );
  }

  const reviewable = {
    paymentStatus: booking.paymentStatus,
    bookingDate: booking.bookingDate,
    reviewId: booking.review?.id ?? null,
  };

  if (!canReviewBooking(reviewable)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_REVIEWABLE',
          message: reviewBlockedReason(reviewable) ?? 'This booking cannot be reviewed.',
        },
      },
      { status: 409 }
    );
  }

  try {
    await prisma.review.create({
      data: {
        ventureId: booking.variant.ventureId,
        customerId: booking.customerId,
        bookingId: booking.id,
        rating,
        comment,
        isApproved: false,
        photos: [],
      },
    });
  } catch (error) {
    // Unique bookingId guard: two tabs submitting at once.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_REVIEWED', message: 'You already reviewed this trip.' },
        },
        { status: 409 }
      );
    }
    console.error('Review submission failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not save the review' } },
      { status: 500 }
    );
  }

  revalidatePath('/my/bookings');
  revalidatePath(`/experiences/${booking.variant.venture.id}/${booking.variant.venture.slug}`);

  return NextResponse.json({ success: true, data: { pendingModeration: true } }, { status: 201 });
}
