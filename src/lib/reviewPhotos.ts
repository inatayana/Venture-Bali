import { randomUUID } from 'node:crypto';

/**
 * Guest review photos live in a public Supabase Storage bucket. Uploads are
 * authorised by the same scoped review token as the review itself, and the
 * review row only stores URLs returned by this module.
 */

export const REVIEW_PHOTO_LIMIT = 3;
export const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class ReviewPhotoError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_CONFIGURED' | 'INVALID_FILE' | 'UPLOAD_FAILED',
  ) {
    super(message);
    this.name = 'ReviewPhotoError';
  }
}

interface StorageConfig {
  baseUrl: string;
  serviceKey: string;
  bucket: string;
}

function getStorageConfig(): StorageConfig | null {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const bucket = process.env.SUPABASE_REVIEW_BUCKET ?? 'reviews';
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl, serviceKey, bucket };
}

export function isReviewPhotoStorageConfigured(): boolean {
  return getStorageConfig() !== null;
}

export function validateReviewPhoto(file: { size: number; type: string }): string | null {
  if (!MIME_EXTENSIONS[file.type]) {
    return 'Use a JPG, PNG or WebP photo.';
  }
  if (file.size <= 0) return 'The photo is empty.';
  if (file.size > REVIEW_PHOTO_MAX_BYTES) return 'Each photo must be under 5 MB.';
  return null;
}

/** Only URLs produced by our bucket are accepted on submit. */
export function isAllowedReviewPhotoUrl(url: string): boolean {
  const config = getStorageConfig();
  if (!config) return false;
  const prefix = `${config.baseUrl}/storage/v1/object/public/${config.bucket}/`;
  return url.startsWith(prefix) && !url.includes('..');
}

export async function uploadReviewPhoto(file: File, bookingId: string): Promise<string> {
  const config = getStorageConfig();
  if (!config) {
    throw new ReviewPhotoError('Photo uploads are not configured yet.', 'NOT_CONFIGURED');
  }

  const invalid = validateReviewPhoto(file);
  if (invalid) throw new ReviewPhotoError(invalid, 'INVALID_FILE');

  const extension = MIME_EXTENSIONS[file.type];
  const safeBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '');
  const path = `${safeBookingId}/${randomUUID()}.${extension}`;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${config.bucket}/${encodedPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
        'Content-Type': file.type,
        'x-upsert': 'false',
        'cache-control': '3600',
      },
      body: Buffer.from(await file.arrayBuffer()),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Review photo upload failed:', response.status, detail.slice(0, 300));
    throw new ReviewPhotoError('Could not upload the photo. Please try again.', 'UPLOAD_FAILED');
  }

  return `${config.baseUrl}/storage/v1/object/public/${config.bucket}/${encodedPath}`;
}
