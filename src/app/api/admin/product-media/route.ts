import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/adminGuard';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';
import {
  ProductMediaError,
  PRODUCT_PHOTO_MAX_BYTES,
  PRODUCT_PHOTO_RAW_MAX_BYTES,
  uploadProductPhoto,
  validateProductPhoto,
} from '@/lib/productMedia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Upload one hero/gallery photo for the product manager. */
export async function POST(request: NextRequest) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  const limit = await rateLimit(`product-media:${clientIp(request)}`, 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many uploads. Try again shortly.' },
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  // Cap the raw request before parsing the body (defence in depth — the
  // browser compressor normally keeps uploads far below this).
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > PRODUCT_PHOTO_RAW_MAX_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Uploads must be 15 MB or less — the form compresses photos automatically.',
        },
      },
      { status: 413 },
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

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Choose a photo to upload' } },
      { status: 400 },
    );
  }

  if (file.size > PRODUCT_PHOTO_MAX_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Each photo must be ${PRODUCT_PHOTO_MAX_BYTES / 1024} KB or less after compression.`,
        },
      },
      { status: 413 },
    );
  }

  const invalid = validateProductPhoto(file);
  if (invalid) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_FILE', message: invalid } },
      { status: 400 },
    );
  }

  try {
    const url = await uploadProductPhoto(file);
    return NextResponse.json({ success: true, data: { url } }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductMediaError) {
      const status = error.code === 'NOT_CONFIGURED' ? 503 : 502;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status },
      );
    }
    console.error('Product media upload failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not upload the photo' } },
      { status: 500 },
    );
  }
}
