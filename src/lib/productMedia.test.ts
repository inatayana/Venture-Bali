import {
  isProductMediaConfigured,
  PRODUCT_PHOTO_MAX_BYTES,
  uploadProductPhoto,
  validateProductPhoto,
} from './productMedia';

describe('product media rules', () => {
  const ORIGINAL_FETCH = global.fetch;
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousBucket = process.env.SUPABASE_ASSETS_BUCKET;

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousBucket === undefined) delete process.env.SUPABASE_ASSETS_BUCKET;
    else process.env.SUPABASE_ASSETS_BUCKET = previousBucket;
    if (ORIGINAL_FETCH) global.fetch = ORIGINAL_FETCH;
    else delete (global as { fetch?: unknown }).fetch;
    jest.restoreAllMocks();
  });

  it('accepts compressed WebP masters within the byte budget', () => {
    expect(validateProductPhoto({ size: 1000, type: 'image/webp' })).toBeNull();
    expect(validateProductPhoto({ size: PRODUCT_PHOTO_MAX_BYTES, type: 'image/webp' })).toBeNull();
  });

  it('rejects non-WebP types, empty files and oversized masters', () => {
    expect(validateProductPhoto({ size: 1000, type: 'image/jpeg' })).toMatch(/webp/i);
    expect(validateProductPhoto({ size: 1000, type: 'image/png' })).toMatch(/webp/i);
    expect(validateProductPhoto({ size: 0, type: 'image/webp' })).toMatch(/empty/i);
    expect(validateProductPhoto({ size: PRODUCT_PHOTO_MAX_BYTES + 1, type: 'image/webp' })).toMatch(
      /300 KB/i
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

  it('uploads to the venture-assets bucket with a content-hash path and upsert', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    process.env.SUPABASE_ASSETS_BUCKET = 'venture-assets';

    const webp = Buffer.from('fake-webp-bytes');
    const file = {
      size: webp.length,
      type: 'image/webp',
      arrayBuffer: async () => webp,
    } as unknown as File;

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const url = await uploadProductPhoto(file);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toMatch(/\/storage\/v1\/object\/venture-assets\/products\/\d{4}-\d{2}\/[0-9a-f]{12}\.webp$/);
    expect(init.headers).toMatchObject({
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
      'cache-control': '31536000',
    });
    expect(url).toMatch(/\/storage\/v1\/object\/public\/venture-assets\/products\//);

    // The same photo maps to the same path: no duplicates on re-upload.
    await uploadProductPhoto(file);
    const secondUrl = fetchMock.mock.calls[1]?.[0] as string;
    expect(secondUrl).toBe(requestUrl);
  });
});
