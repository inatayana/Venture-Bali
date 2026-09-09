import { bookingSchema } from './bookingSchema';

const baseBooking = {
  ventureId: 'venture-1',
  variantId: 'variant-1',
  bookingDate: '2026-10-10',
  slotTimeId: 'slot-1',
  fulfillmentMode: 'SELF_DRIVE' as const,
  paxCount: 2,
  customerName: 'Made Wijaya',
  customerEmail: 'made@example.com',
  customerWhatsApp: '+628123456789',
};

describe('bookingSchema', () => {
  it('accepts a valid self-drive booking and defaults optional collections', () => {
    const result = bookingSchema.parse(baseBooking);

    expect(result.selectedAddons).toEqual([]);
    expect(result.countryCode).toBe('ID');
  });

  it('rejects malformed dates and customer contact data', () => {
    const result = bookingSchema.safeParse({
      ...baseBooking,
      bookingDate: '10/10/2026',
      customerEmail: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });
});
