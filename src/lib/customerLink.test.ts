import {
  buildCustomerTripsUrl,
  createBookingViewToken,
  createCustomerLinkToken,
  createReviewToken,
  verifyBookingViewTokenAny,
  verifyCustomerLinkToken,
  verifyReviewAccess,
  verifyReviewToken,
} from './customerLink';

const SECRET = 'test-customer-link-secret-32chars';

describe('customer magic link', () => {
  const previousSecret = process.env.CUSTOMER_LINK_SECRET;
  const previousAdminSecret = process.env.ADMIN_SESSION_SECRET;

  beforeAll(() => {
    process.env.CUSTOMER_LINK_SECRET = SECRET;
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.CUSTOMER_LINK_SECRET;
    else process.env.CUSTOMER_LINK_SECRET = previousSecret;

    if (previousAdminSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousAdminSecret;
  });

  it('extracts the booking id from a booking-scoped bl1 token', () => {
    const token = createBookingViewToken('booking-1');
    expect(verifyBookingViewTokenAny(token)).toEqual({ bookingId: 'booking-1' });
    expect(verifyBookingViewTokenAny(`${token?.slice(0, -1)}X`)).toBeNull();
    expect(verifyBookingViewTokenAny(createCustomerLinkToken('customer-1'))).toBeNull();
  });

  it('round-trips a signed token', () => {
    const token = createCustomerLinkToken('customer-1');
    expect(token).not.toBeNull();
    expect(verifyCustomerLinkToken(token)).toEqual({ customerId: 'customer-1' });
  });

  it('rejects a tampered payload or signature', () => {
    const token = createCustomerLinkToken('customer-1') as string;
    const [scheme, , signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ cid: 'customer-2', exp: Math.floor(Date.now() / 1000) + 60 }),
    ).toString('base64url');

    expect(verifyCustomerLinkToken(`${scheme}.${forgedPayload}.${signature}`)).toBeNull();
    expect(verifyCustomerLinkToken(`${token}x`)).toBeNull();
    expect(verifyCustomerLinkToken(undefined)).toBeNull();
    expect(verifyCustomerLinkToken('garbage')).toBeNull();
  });

  it('builds the public Trip Hub URL', () => {
    const url = buildCustomerTripsUrl('customer-1');
    expect(url).toContain('/trips?token=');
  });

  it('issues a scoped review token for one booking', () => {
    const token = createReviewToken('customer-1', 'booking-1');
    expect(token).not.toBeNull();
    expect(verifyReviewToken(token, 'booking-1')).toEqual({
      customerId: 'customer-1',
      bookingId: 'booking-1',
    });
    expect(verifyReviewToken(token, 'booking-2')).toBeNull();
    expect(verifyReviewAccess(token, 'booking-1')).toEqual({ customerId: 'customer-1' });
    expect(verifyReviewAccess(token, 'booking-2')).toBeNull();
  });

  it('keeps legacy account links usable for reviews', () => {
    const accountToken = createCustomerLinkToken('customer-1');
    expect(verifyReviewAccess(accountToken, 'any-booking')).toEqual({ customerId: 'customer-1' });
  });

  it('rejects a review token whose signature was tampered with', () => {
    const token = createReviewToken('customer-1', 'booking-1') as string;
    expect(verifyReviewToken(`${token}x`, 'booking-1')).toBeNull();
  });

  it('issues nothing when no secret is configured', () => {
    delete process.env.CUSTOMER_LINK_SECRET;
    delete process.env.ADMIN_SESSION_SECRET;

    expect(createCustomerLinkToken('customer-1')).toBeNull();
    expect(buildCustomerTripsUrl('customer-1')).toBeNull();
    expect(createReviewToken('customer-1', 'booking-1')).toBeNull();
    expect(verifyCustomerLinkToken('cl1.abc.def')).toBeNull();
  });
});
