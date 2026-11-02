import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyReviewAccess } from '@/lib/customerLink';
import { canReviewBooking } from '@/lib/reviewSchema';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import {
  ReviewPhotoError,
  REVIEW_PHOTO_MAX_BYTES,
  uploadReviewPhoto,
  validateReviewPhoto,
} from '@/lib/reviewPhotos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Upload one review photo before submitting the review.
 *
 * Authorisation is the same scoped review token. Files are compressed in the
 * browser, checked again here, then written to the public Supabase bucket.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`review-photo:${clientIp(request)}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many uploads. Try again shortly.' },
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid upload' } },
      { status: 400 },
    );
  }

  const token = String(form.get('token') ?? '');
  const bookingId = String(form.get('bookingId') ?? '');
  const file = form.get('file');

  if (!token || !bookingId || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing photo or booking' } },
      { status: 400 },
    );
  }

  const session = verifyReviewAccess(token, bookingId);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'This review link is invalid or expired.' } },
      { status: 401 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      paymentStatus: true,
      bookingDate: true,
      lifecycleStatus: true,
      review: { select: { id: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
      { status: 404 },
    );
  }

  if (booking.customerId !== session.customerId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
      { status: 404 },
    );
  }

  const reviewable = {
    paymentStatus: booking.paymentStatus,
    bookingDate: booking.bookingDate,
    reviewId: booking.review?.id ?? null,
    lifecycleStatus: booking.lifecycleStatus,
  };
  if (!canReviewBooking(reviewable)) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_REVIEWABLE', message: 'This trip cannot be reviewed.' } },
      { status: 409 },
    );
  }

  if (file.size > REVIEW_PHOTO_MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: { code: 'FILE_TOO_LARGE', message: 'Each photo must be under 5 MB.' } },
      { status: 413 },
    );
  }

  const invalid = validateReviewPhoto(file);
  if (invalid) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_FILE', message: invalid } },
      { status: 400 },
    );
  }

  try {
    const url = await uploadReviewPhoto(file, bookingId);
    return NextResponse.json({ success: true, data: { url } }, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewPhotoError) {
      const status = error.code === 'NOT_CONFIGURED' ? 503 : 502;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status },
      );
    }
    console.error('Review photo failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not upload the photo' } },
      { status: 500 },
    );
  }
}
