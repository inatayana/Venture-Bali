import { createCheckInToken, verifyCheckInToken } from './checkInToken';

const SECRET = 'qr-signing-secret-at-least-16-chars';

describe('check-in QR tokens', () => {
  const original = process.env.QR_SIGNING_SECRET;

  beforeEach(() => {
    process.env.QR_SIGNING_SECRET = SECRET;
  });

  afterAll(() => {
    if (original === undefined) delete process.env.QR_SIGNING_SECRET;
    else process.env.QR_SIGNING_SECRET = original;
  });

  it('signs and verifies a scoped payload with a nonce', async () => {
    const token = createCheckInToken({
      bookingId: 'booking-1',
      participantId: 'participant-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(token?.startsWith('ci1.')).toBe(true);
    const payload = verifyCheckInToken(token);
    expect(payload).toMatchObject({ bookingId: 'booking-1', participantId: 'participant-1' });
    expect(payload?.nonce).toHaveLength(16); // 12 random bytes in base64url
    expect(verifyCheckInToken(createCheckInToken({ bookingId: 'booking-1', expiresAt: new Date(Date.now() + 60_000) }))?.nonce)
      .not.toBe(payload?.nonce);
  });

  it('rejects tampered, expired and wrong-scheme tokens', () => {
    const token = createCheckInToken({ bookingId: 'booking-1', expiresAt: new Date(Date.now() + 60_000) }) ?? '';
    const [scheme, payload, signature] = token.split('.');
    const expired = createCheckInToken({ bookingId: 'booking-1', expiresAt: new Date(Date.now() - 1000) });

    expect(verifyCheckInToken(`${scheme}.${payload}.${signature.slice(0, -1)}X`)).toBeNull();
    expect(verifyCheckInToken(`xx1.${payload}.${signature}`)).toBeNull();
    expect(verifyCheckInToken(expired)).toBeNull();
    expect(verifyCheckInToken('')).toBeNull();
  });

  it('fails closed without its own secret', () => {
    delete process.env.QR_SIGNING_SECRET;
    expect(createCheckInToken({ bookingId: 'b', expiresAt: new Date() })).toBeNull();
    expect(verifyCheckInToken('ci1.payload.sig')).toBeNull();
  });
});
