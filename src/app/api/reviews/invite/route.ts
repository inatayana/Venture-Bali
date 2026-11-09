import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { findCountry } from '@/lib/countries';
import { verifyInviteToken } from '@/lib/reviewInvite';
import { inviteReviewInputSchema } from '@/lib/reviewInviteSchema';
import { assessReviewForPublishing } from '@/lib/reviewModeration';
import { isAllowedReviewPhotoUrl } from '@/lib/reviewPhotos';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';

/**
 * Submit a founding-guest review through a signed, single-use invite.
 *
 * These reviews are real but not linked to an online booking, so they are
 * labelled FOUNDING_GUEST internally and published immediately.
 */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`review-invite:${clientIp(request)}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many review submissions. Try again shortly.' },
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const parsed = inviteReviewInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      },
      { status: 400 },
    );
  }

  const { token, inviteId, rating, comment, guestName, guestCountryCode, photos } = parsed.data;

  if (!verifyInviteToken(inviteId, token)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'This review link is invalid or expired.' },
      },
      { status: 401 },
    );
  }

  const invite = await prisma.reviewInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      venture: { select: { id: true, slug: true, title: true, tenantId: true } },
    },
  });

  if (!invite) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Invite not found' } },
      { status: 404 },
    );
  }
  if (invite.status !== 'UNUSED' || invite.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVITE_USED', message: 'This invite has already been used or expired.' },
      },
      { status: 409 },
    );
  }

  const safePhotos = (photos ?? []).filter((url) => isAllowedReviewPhotoUrl(url));
  if ((photos ?? []).length !== safePhotos.length) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'One of the photos is not valid.' },
      },
      { status: 400 },
    );
  }

  // Founding guests are real but unverified bookings, so never auto-publish.
  const decision = assessReviewForPublishing({
    rating,
    comment,
    verifiedBooking: false,
    photoCount: safePhotos.length,
  });

  let reviewId: string;
  try {
    reviewId = await prisma.$transaction(async (tx) => {
      const claimed = await tx.reviewInvite.updateMany({
        where: { id: inviteId, status: 'UNUSED', expiresAt: { gt: new Date() } },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
      if (claimed.count === 0) throw new Error('INVITE_USED');

      const review = await tx.review.create({
        data: {
          ventureId: invite.venture.id,
          customerId: null,
          bookingId: null,
          inviteId: invite.id,
          source: 'FOUNDING_GUEST',
          rating,
          comment,
          guestName,
          guestLocation: findCountry(guestCountryCode).name,
          isApproved: decision.autoPublish,
          photos: safePhotos,
          tenantId: invite.venture.tenantId,
        },
        select: { id: true },
      });
      return review.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITE_USED') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVITE_USED', message: 'This invite has already been used or expired.' },
        },
        { status: 409 },
      );
    }
    console.error('Founding guest review failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not save the review' } },
      { status: 500 },
    );
  }

  revalidatePath('/admin/reviews');
  revalidatePath('/admin/reviews/invites');
  revalidatePath(`/experiences/${invite.venture.id}/${invite.venture.slug}`);

  return NextResponse.json(
    { success: true, data: { reviewId, published: decision.autoPublish } },
    { status: 201 },
  );
}
