import {
  isAllowedReviewPhotoUrl,
  REVIEW_PHOTO_MAX_BYTES,
  validateReviewPhoto,
} from './reviewPhotos';

describe('review photo rules', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousBucket = process.env.SUPABASE_REVIEW_BUCKET;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    process.env.SUPABASE_REVIEW_BUCKET = 'reviews';
  });

  afterAll(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousBucket === undefined) delete process.env.SUPABASE_REVIEW_BUCKET;
    else process.env.SUPABASE_REVIEW_BUCKET = previousBucket;
  });

  it('accepts jpg, png and webp under 5 MB', () => {
    expect(validateReviewPhoto({ size: 1000, type: 'image/jpeg' })).toBeNull();
    expect(validateReviewPhoto({ size: 1000, type: 'image/png' })).toBeNull();
    expect(validateReviewPhoto({ size: 1000, type: 'image/webp' })).toBeNull();
  });

  it('rejects unsupported types, empty files and oversized photos', () => {
    expect(validateReviewPhoto({ size: 1000, type: 'image/gif' })).toMatch(/jpg/i);
    expect(validateReviewPhoto({ size: 0, type: 'image/jpeg' })).toMatch(/empty/i);
    expect(validateReviewPhoto({ size: REVIEW_PHOTO_MAX_BYTES + 1, type: 'image/jpeg' })).toMatch(
      /5 MB/i
    );
  });

  it('only accepts URLs from the configured public bucket', () => {
    expect(
      isAllowedReviewPhotoUrl('https://demo.supabase.co/storage/v1/object/public/reviews/bk-1/a.webp')
    ).toBe(true);
    expect(isAllowedReviewPhotoUrl('https://evil.example.com/a.webp')).toBe(false);
    expect(
      isAllowedReviewPhotoUrl('https://demo.supabase.co/storage/v1/object/public/other/a.webp')
    ).toBe(false);
    expect(
      isAllowedReviewPhotoUrl('https://demo.supabase.co/storage/v1/object/public/reviews/../a.webp')
    ).toBe(false);
  });
});
