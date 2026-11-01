import { buildConfirmationText, buildReminderText, buildReviewRequestText, getWitaDateKey } from './notifications';

const booking = {
  id: 'booking-1',
  bookingCode: 'BK-TEST-001',
  bookingDate: '2026-11-06',
  paxCount: 3,
  totalPrice: 1992000,
  fulfillmentMode: 'SHARED_TRANSFER',
  hotelAddress: null,
  isTba: true,
  customer: {
    id: 'customer-1',
    name: 'Made Wijaya',
    email: 'made@example.com',
    whatsapp: '+628123456789',
  },
  variant: { title: 'River Tubing with Shared Transfer' },
  slotTime: { time: '08:00 AM' },
};

describe('notification date handling (WITA)', () => {
  it('keeps the WITA calendar day across the UTC boundary', () => {
    // 15:59 UTC = 23:59 WITA on the same day
    expect(getWitaDateKey(new Date('2026-11-05T15:59:00.000Z'))).toBe('2026-11-05');
    // 16:00 UTC = 00:00 WITA on the next day
    expect(getWitaDateKey(new Date('2026-11-05T16:00:00.000Z'))).toBe('2026-11-06');
  });

  it('computes the H-24 reminder target date in WITA', () => {
    // 20:00 UTC on Nov 5 = 04:00 WITA on Nov 6 -> tomorrow is Nov 7
    expect(getWitaDateKey(new Date('2026-11-05T20:00:00.000Z'), 1)).toBe('2026-11-07');
  });
});

describe('notification templates', () => {
  it('builds a confirmation with code, date, total and voucher link', () => {
    const text = buildConfirmationText(booking);

    expect(text).toContain('BK-TEST-001');
    expect(text).toContain('River Tubing with Shared Transfer');
    expect(text).toContain('6 November 2026');
    expect(text).toContain('08:00 AM');
    expect(text).toContain('1.992.000');
    expect(text).toContain('/voucher/verify/BK-TEST-001');
    expect(text).toContain('to be confirmed by H-1');
  });

  it('mentions the hotel address for a confirmed pickup', () => {
    const text = buildConfirmationText({
      ...booking,
      isTba: false,
      hotelAddress: 'Villa Melati, Seminyak',
    });
    expect(text).toContain('Villa Melati, Seminyak');
    expect(text).not.toContain('to be confirmed by H-1');
  });

  it('builds a reminder that names the H-24 window', () => {
    const text = buildReminderText(booking, 24);
    expect(text).toContain('tomorrow');
    expect(text).toContain('BK-TEST-001');
    expect(text).toContain('arrive 15 minutes early');
  });
});

describe('buildReviewRequestText', () => {
  it('links straight to the review form', () => {
    const text = buildReviewRequestText(booking as never, 'https://baliwild.com/review/b1?token=abc');

    expect(text).toContain('How was your');
    expect(text).toContain('https://baliwild.com/review/b1?token=abc');
    expect(text).toContain('BK-TEST-001');
  });
});