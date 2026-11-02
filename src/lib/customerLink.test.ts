import {
  buildCustomerBookingsUrl,
  createCustomerLinkToken,
  createReviewToken,
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

  it('builds the public bookings URL', () => {
    const url = buildCustomerBookingsUrl('customer-1');
    expect(url).toContain('/my/bookings?token=');
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
    expect(buildCustomerBookingsUrl('customer-1')).toBeNull();
    expect(createReviewToken('customer-1', 'booking-1')).toBeNull();
    expect(verifyCustomerLinkToken('cl1.abc.def')).toBeNull();
  });
});
