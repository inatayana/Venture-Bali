import {
  CUSTOMER_SESSION_TTL_SECONDS,
  createCustomerSessionToken,
  customerCookieName,
  customerCookieOptions,
  getCustomerSessionSecret,
  hashSessionId,
  verifyCustomerSessionToken,
} from './customerSession';

const TEST_SECRET = 'test-customer-session-secret-32-chars';
const SESSION_ID = 'a'.repeat(43); // ~256-bit base64url id

describe('customer session tokens', () => {
  const originalSecret = process.env.CUSTOMER_SESSION_SECRET;

  beforeEach(() => {
    process.env.CUSTOMER_SESSION_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CUSTOMER_SESSION_SECRET;
    else process.env.CUSTOMER_SESSION_SECRET = originalSecret;
  });

  it('signs and verifies an opaque session id', async () => {
    const token = await createCustomerSessionToken(SESSION_ID);
    expect(token.startsWith('cs1.')).toBe(true);
    expect(await verifyCustomerSessionToken(token)).toBe(SESSION_ID);
  });

  it('rejects tampered, malformed and foreign tokens', async () => {
    const token = await createCustomerSessionToken(SESSION_ID);
    const [scheme, id, signature] = token.split('.');

    expect(await verifyCustomerSessionToken(`${scheme}.${id}.${signature.slice(0, -1)}X`)).toBeNull();
    expect(await verifyCustomerSessionToken(`v1.${id}.${signature}`)).toBeNull();
    expect(await verifyCustomerSessionToken('not-a-token')).toBeNull();
    expect(await verifyCustomerSessionToken(undefined)).toBeNull();
    expect(await verifyCustomerSessionToken('')).toBeNull();
    expect(await verifyCustomerSessionToken(`cs1.short.${signature}`)).toBeNull();
  });

  it('fails closed when the secret is missing or too short', async () => {
    const token = await createCustomerSessionToken(SESSION_ID);

    delete process.env.CUSTOMER_SESSION_SECRET;
    expect(getCustomerSessionSecret()).toBeNull();
    expect(await verifyCustomerSessionToken(token)).toBeNull();

    process.env.CUSTOMER_SESSION_SECRET = 'short';
    expect(getCustomerSessionSecret()).toBeNull();
    expect(await verifyCustomerSessionToken(token)).toBeNull();
  });

  it('never puts PII in the cookie and hashes the id for storage', async () => {
    const token = await createCustomerSessionToken(SESSION_ID);
    expect(token).not.toContain('@');
    expect(token).not.toContain('email');

    const hash = await hashSessionId(SESSION_ID);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(SESSION_ID);
    expect(await hashSessionId(SESSION_ID)).toBe(hash);
  });

  it('uses a production __Host- cookie only over HTTPS', () => {
    expect(customerCookieName(true)).toBe('__Host-bw_customer');
    expect(customerCookieOptions(true)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: CUSTOMER_SESSION_TTL_SECONDS,
    });

    expect(customerCookieName(false)).toBe('bw_customer');
    expect(customerCookieOptions(false).secure).toBe(false);
  });
});
