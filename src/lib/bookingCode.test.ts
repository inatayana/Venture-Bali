import { formatBookingCode, generateBookingCode, isBookingCode } from './bookingCode';

describe('booking codes', () => {
  it('formats BW-YYYY-XXXX codes in uppercase with zero padding', () => {
    const date = new Date('2026-11-25T00:00:00.000Z');
    expect(formatBookingCode(0, date)).toBe('BW-2026-0000');
    expect(formatBookingCode(1234, date)).toBe('BW-2026-00YA');
  });

  it('generates a valid fresh code', () => {
    const code = generateBookingCode();
    expect(code).toMatch(/^BW-\d{4}-[0-9A-Z]{4}$/);
    expect(isBookingCode(code)).toBe(true);
  });

  it('keeps legacy BK codes valid and rejects garbage', () => {
    expect(isBookingCode('BK-MJX8FT-AB12CD')).toBe(true);
    expect(isBookingCode('BW-2026-00YA')).toBe(true);
    expect(isBookingCode('')).toBe(false);
    expect(isBookingCode('BW-2026-!!!!')).toBe(false);
    expect(isBookingCode('drop table bookings')).toBe(false);
  });
});
