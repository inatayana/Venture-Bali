import { createHash } from 'node:crypto';

/**
 * Product hero/gallery media live in a public Supabase Storage bucket
 * (`venture-assets`, prefix `products/`). The admin form compresses each
 * photo in the browser to a single WebP master (see
 * `docs/MEMO_MEDIA_ARCHITECTURE.md`); this module stores exactly one file
 * per photo. Names are content hashes, so re-uploading the same photo never
 * creates a duplicate.
 */

/** Final compressed WebP master the admin form uploads. */
export const PRODUCT_PHOTO_MAX_BYTES = 300 * 1024;
/** Raw request cap before the browser compressor runs (defence in depth). */
export const PRODUCT_PHOTO_RAW_MAX_BYTES = 15 * 1024 * 1024;

export class ProductMediaError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_CONFIGURED' | 'INVALID_FILE' | 'UPLOAD_FAILED',
  ) {
    super(message);
    this.name = 'ProductMediaError';
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
  const bucket = process.env.SUPABASE_ASSETS_BUCKET ?? 'venture-assets';
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl, serviceKey, bucket };
}

export function isProductMediaConfigured(): boolean {
  return getStorageConfig() !== null;
}

export function validateProductPhoto(file: { size: number; type: string }): string | null {
  if (file.type !== 'image/webp') {
    return 'Only WebP photos are accepted — the form compresses uploads automatically.';
  }
  if (file.size <= 0) return 'The photo is empty.';
  if (file.size > PRODUCT_PHOTO_MAX_BYTES) {
    return `Each photo must be ${PRODUCT_PHOTO_MAX_BYTES / 1024} KB or less after compression.`;
  }
  return null;
}

export async function uploadProductPhoto(file: File): Promise<string> {
  const config = getStorageConfig();
  if (!config) {
    throw new ProductMediaError('Product media storage is not configured yet.', 'NOT_CONFIGURED');
  }

  const invalid = validateProductPhoto(file);
  if (invalid) throw new ProductMediaError(invalid, 'INVALID_FILE');

  const bytes = Buffer.from(await file.arrayBuffer());
  // Content-hash naming: an identical photo maps to an identical path, so a
  // re-upload overwrites (upsert) instead of duplicating the stored file.
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const month = new Date().toISOString().slice(0, 7);
  const path = `products/${month}/${hash}.webp`;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${config.bucket}/${encodedPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
        'Content-Type': 'image/webp',
        'x-upsert': 'true',
        'cache-control': '31536000',
      },
      body: bytes,
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Product photo upload failed:', response.status, detail.slice(0, 300));
    throw new ProductMediaError('Could not upload the photo. Please try again.', 'UPLOAD_FAILED');
  }

  return `${config.baseUrl}/storage/v1/object/public/${config.bucket}/${encodedPath}`;
}
