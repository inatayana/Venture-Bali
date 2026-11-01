import { buildReviewQrUrl, buildReviewUrl } from './reviewLink';

describe('review links', () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://venture-bali.com/';
  });

  afterAll(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it('builds the public review form URL with the signed token', () => {
    expect(buildReviewUrl('bk 1', 'cl1.a/b+c')).toBe(
      'https://venture-bali.com/review/bk%201?token=cl1.a%2Fb%2Bc'
    );
  });

  it('builds the QR image endpoint URL', () => {
    expect(buildReviewQrUrl('bk-1', 'cl1.token.sig')).toBe(
      'https://venture-bali.com/api/reviews/qr?bookingId=bk-1&token=cl1.token.sig'
    );
  });
});
