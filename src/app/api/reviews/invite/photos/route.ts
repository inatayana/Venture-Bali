import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInviteToken } from '@/lib/reviewInvite';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';
import {
  ReviewPhotoError,
  REVIEW_PHOTO_MAX_BYTES,
  uploadReviewPhoto,
  validateReviewPhoto,
} from '@/lib/reviewPhotos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Upload one photo for a founding-guest review invite. */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`review-invite-photo:${clientIp(request)}`, 20, 60_000);
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
  const inviteId = String(form.get('inviteId') ?? '');
  const file = form.get('file');

  if (!token || !inviteId || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing photo or invite' } },
      { status: 400 },
    );
  }

  if (!verifyInviteToken(inviteId, token)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'This review link is invalid or expired.' } },
      { status: 401 },
    );
  }

  const invite = await prisma.reviewInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, status: true, expiresAt: true },
  });
  if (!invite || invite.status !== 'UNUSED' || invite.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { success: false, error: { code: 'INVITE_USED', message: 'This invite is no longer available.' } },
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
    const url = await uploadReviewPhoto(file, `invite-${invite.id}`);
    return NextResponse.json({ success: true, data: { url } }, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewPhotoError) {
      const status = error.code === 'NOT_CONFIGURED' ? 503 : 502;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status },
      );
    }
    console.error('Invite photo failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not upload the photo' } },
      { status: 500 },
    );
  }
}
