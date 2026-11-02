import { randomUUID } from 'node:crypto';

/**
 * Product hero/gallery media live in a public Supabase Storage bucket. The
 * admin form uploads one file at a time; the returned URL is stored in
 * `Venture.imageUrl` or `Venture.gallery`.
 */

export const PRODUCT_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

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
  const bucket = process.env.SUPABASE_PRODUCT_BUCKET ?? 'product-media';
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl, serviceKey, bucket };
}

export function isProductMediaConfigured(): boolean {
  return getStorageConfig() !== null;
}

export function validateProductPhoto(file: { size: number; type: string }): string | null {
  if (!MIME_EXTENSIONS[file.type]) return 'Use a JPG, PNG or WebP photo.';
  if (file.size <= 0) return 'The photo is empty.';
  if (file.size > PRODUCT_PHOTO_MAX_BYTES) return 'Each photo must be under 5 MB.';
  return null;
}

export async function uploadProductPhoto(file: File): Promise<string> {
  const config = getStorageConfig();
  if (!config) {
    throw new ProductMediaError('Product media storage is not configured yet.', 'NOT_CONFIGURED');
  }

  const invalid = validateProductPhoto(file);
  if (invalid) throw new ProductMediaError(invalid, 'INVALID_FILE');

  const extension = MIME_EXTENSIONS[file.type];
  const month = new Date().toISOString().slice(0, 7);
  const path = `products/${month}/${randomUUID()}.${extension}`;
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
        'cache-control': '31536000',
      },
      body: Buffer.from(await file.arrayBuffer()),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Product photo upload failed:', response.status, detail.slice(0, 300));
    throw new ProductMediaError('Could not upload the photo. Please try again.', 'UPLOAD_FAILED');
  }

  return `${config.baseUrl}/storage/v1/object/public/${config.bucket}/${encodedPath}`;
}
