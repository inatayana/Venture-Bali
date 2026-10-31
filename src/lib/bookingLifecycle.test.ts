import {
  DEFAULT_HOLD_MINUTES,
  getHoldMinutes,
  holdExpiresAt,
  isHoldActive,
  lifecycleForPaymentStatus,
} from './bookingLifecycle';

describe('booking lifecycle & holds', () => {
  const previous = process.env.BOOKING_HOLD_MINUTES;

  afterEach(() => {
    if (previous === undefined) delete process.env.BOOKING_HOLD_MINUTES;
    else process.env.BOOKING_HOLD_MINUTES = previous;
  });

  it('defaults to a 10-minute hold and allows an env override', () => {
    delete process.env.BOOKING_HOLD_MINUTES;
    expect(getHoldMinutes()).toBe(DEFAULT_HOLD_MINUTES);
    expect(DEFAULT_HOLD_MINUTES).toBe(10);

    process.env.BOOKING_HOLD_MINUTES = '7';
    expect(getHoldMinutes()).toBe(7);

    process.env.BOOKING_HOLD_MINUTES = 'not-a-number';
    expect(getHoldMinutes()).toBe(DEFAULT_HOLD_MINUTES);
  });

  it('computes the hold expiry from the booking creation time', () => {
    const now = new Date('2026-11-01T00:00:00.000Z');
    expect(holdExpiresAt(now, 10).toISOString()).toBe('2026-11-01T00:10:00.000Z');
  });

  it('treats a pending booking as active only inside its hold window', () => {
    const now = new Date('2026-11-01T00:05:00.000Z');
    const active = { paymentStatus: 'PENDING' as const, expiresAt: new Date('2026-11-01T00:10:00.000Z') };
    const expired = { paymentStatus: 'PENDING' as const, expiresAt: new Date('2026-11-01T00:04:00.000Z') };

    expect(isHoldActive(active, now)).toBe(true);
    expect(isHoldActive(expired, now)).toBe(false);
    expect(isHoldActive({ paymentStatus: 'PENDING', expiresAt: null }, now)).toBe(false);
    expect(isHoldActive({ paymentStatus: 'PAID', expiresAt: null }, now)).toBe(true);
    expect(isHoldActive({ paymentStatus: 'CANCELLED', expiresAt: active.expiresAt }, now)).toBe(false);
  });

  it('maps the gateway status onto the operational lifecycle', () => {
    expect(lifecycleForPaymentStatus('PAID')).toBe('CONFIRMED');
    expect(lifecycleForPaymentStatus('CANCELLED')).toBe('CANCELLED');
    expect(lifecycleForPaymentStatus('PENDING')).toBe('AWAITING_PAYMENT');
    expect(lifecycleForPaymentStatus('FAILED')).toBe('AWAITING_PAYMENT');
  });
});
