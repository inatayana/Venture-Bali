import {
  isProductMediaConfigured,
  PRODUCT_PHOTO_MAX_BYTES,
  validateProductPhoto,
} from './productMedia';

describe('product media rules', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousBucket = process.env.SUPABASE_PRODUCT_BUCKET;

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousBucket === undefined) delete process.env.SUPABASE_PRODUCT_BUCKET;
    else process.env.SUPABASE_PRODUCT_BUCKET = previousBucket;
  });

  it('accepts jpg, png and webp under 5 MB', () => {
    expect(validateProductPhoto({ size: 1000, type: 'image/jpeg' })).toBeNull();
    expect(validateProductPhoto({ size: 1000, type: 'image/png' })).toBeNull();
    expect(validateProductPhoto({ size: 1000, type: 'image/webp' })).toBeNull();
  });

  it('rejects unsupported types, empty files and oversized photos', () => {
    expect(validateProductPhoto({ size: 1000, type: 'image/gif' })).toMatch(/jpg/i);
    expect(validateProductPhoto({ size: 0, type: 'image/jpeg' })).toMatch(/empty/i);
    expect(validateProductPhoto({ size: PRODUCT_PHOTO_MAX_BYTES + 1, type: 'image/jpeg' })).toMatch(
      /5 MB/i
    );
  });

  it('reports when storage is configured', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isProductMediaConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    expect(isProductMediaConfigured()).toBe(true);
  });
});
