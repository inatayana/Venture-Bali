import {
  generateOtpCode,
  hashOtpCode,
  normaliseEmail,
  otpExpiresAt,
  verifyOtpCode,
} from './customerAuth';

const TEST_SECRET = 'test-customer-session-secret-32-chars';

describe('customer OTP helpers', () => {
  const originalSecret = process.env.CUSTOMER_SESSION_SECRET;
  const originalTtl = process.env.CUSTOMER_OTP_TTL_MINUTES;

  beforeEach(() => {
    process.env.CUSTOMER_SESSION_SECRET = TEST_SECRET;
    delete process.env.CUSTOMER_OTP_TTL_MINUTES;
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CUSTOMER_SESSION_SECRET;
    else process.env.CUSTOMER_SESSION_SECRET = originalSecret;
    if (originalTtl === undefined) delete process.env.CUSTOMER_OTP_TTL_MINUTES;
    else process.env.CUSTOMER_OTP_TTL_MINUTES = originalTtl;
  });

  it('generates a zero-padded 6-digit code', () => {
    for (let i = 0; i < 25; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it('hashes deterministically and binds the hash to the purpose', () => {
    const hash = hashOtpCode('123456', 'ACTIVATE');
    expect(hash).toBe(hashOtpCode('123456', 'ACTIVATE'));
    expect(hash).not.toBe(hashOtpCode('654321', 'ACTIVATE'));
    expect(hash).not.toBe(hashOtpCode('123456', 'SIGN_IN'));
    expect(hash).toHaveLength(64);
  });

  it('verifies a matching code in constant time and rejects others', () => {
    const stored = hashOtpCode('123456', 'ACTIVATE') ?? '';
    expect(verifyOtpCode('123456', stored, 'ACTIVATE')).toBe(true);
    expect(verifyOtpCode('123457', stored, 'ACTIVATE')).toBe(false);
    expect(verifyOtpCode('123456', stored, 'SIGN_IN')).toBe(false);
    expect(verifyOtpCode('12345', stored, 'ACTIVATE')).toBe(false);
    expect(verifyOtpCode('123456', 'garbage', 'ACTIVATE')).toBe(false);
  });

  it('fails closed without a secret', () => {
    delete process.env.CUSTOMER_SESSION_SECRET;
    expect(hashOtpCode('123456', 'ACTIVATE')).toBeNull();
    expect(verifyOtpCode('123456', 'a'.repeat(64), 'ACTIVATE')).toBe(false);
  });

  it('uses a 10-minute default TTL and clamps configured values', () => {
    const now = new Date('2026-11-25T00:00:00.000Z');
    expect(otpExpiresAt(now).getTime() - now.getTime()).toBe(10 * 60_000);

    process.env.CUSTOMER_OTP_TTL_MINUTES = '999';
    expect(otpExpiresAt(now).getTime() - now.getTime()).toBe(60 * 60_000);

    process.env.CUSTOMER_OTP_TTL_MINUTES = '0';
    expect(otpExpiresAt(now).getTime() - now.getTime()).toBe(60_000);
  });

  it('normalises email addresses', () => {
    expect(normaliseEmail('  Guest@Example.COM ')).toBe('guest@example.com');
  });
});
