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
  billingAddress: {
    name: 'Made Wijaya',
    street: 'Jl. Raya Seminyak 12',
    city: 'Badung',
    postalCode: '80361',
    countryCode: 'ID',
  },
  termsAccepted: true,
  waiverAccepted: true,
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

  it('requires a pickup area and an address (or TBA) for transfer bookings', () => {
    const missingZone = bookingSchema.safeParse({ ...baseBooking, fulfillmentMode: 'SHARED_TRANSFER', hotelAddress: 'Villa A' });
    expect(missingZone.success).toBe(false);

    const missingAddress = bookingSchema.safeParse({ ...baseBooking, fulfillmentMode: 'SHARED_TRANSFER', pickupZoneId: 'zone-2' });
    expect(missingAddress.success).toBe(false);

    const tba = bookingSchema.safeParse({
      ...baseBooking,
      fulfillmentMode: 'SHARED_TRANSFER',
      pickupZoneId: 'zone-2',
      isTba: true,
    });
    expect(tba.success).toBe(true);
  });

  it('accepts shared transfer without a vehicle class', () => {
    const result = bookingSchema.safeParse({
      ...baseBooking,
      fulfillmentMode: 'SHARED_TRANSFER',
      pickupZoneId: 'zone-2',
      hotelAddress: 'Villa A, Seminyak',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a vehicle class on shared transfer', () => {
    const result = bookingSchema.safeParse({
      ...baseBooking,
      fulfillmentMode: 'SHARED_TRANSFER',
      pickupZoneId: 'zone-2',
      hotelAddress: 'Villa A',
      vehicleClassType: 'STANDARD_SUV',
    });
    expect(result.success).toBe(false);
  });

  it('requires a vehicle class for private transfer', () => {
    const result = bookingSchema.safeParse({
      ...baseBooking,
      fulfillmentMode: 'PRIVATE_TRANSFER',
      pickupZoneId: 'zone-2',
      hotelAddress: 'Villa A',
    });
    expect(result.success).toBe(false);
  });

  it('caps a single booking at 10 guests', () => {
    const result = bookingSchema.safeParse({ ...baseBooking, paxCount: 11 });
    expect(result.success).toBe(false);
  });

  it('normalises coupon codes to uppercase', () => {
    const result = bookingSchema.parse({ ...baseBooking, couponCode: ' trybali2026 ' });
    expect(result.couponCode).toBe('TRYBALI2026');
  });

  it('requires the booking terms and the safety waiver', () => {
    expect(bookingSchema.safeParse({ ...baseBooking, termsAccepted: false }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...baseBooking, waiverAccepted: false }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...baseBooking, termsAccepted: undefined }).success).toBe(false);
  });

  it('requires a complete billing address', () => {
    const missingStreet = bookingSchema.safeParse({
      ...baseBooking,
      billingAddress: { ...baseBooking.billingAddress, street: '' },
    });
    expect(missingStreet.success).toBe(false);

    const missingPostal = bookingSchema.safeParse({
      ...baseBooking,
      billingAddress: { name: 'Made', street: 'Jl. Raya 1', city: 'Badung', countryCode: 'ID' },
    });
    expect(missingPostal.success).toBe(false);
  });
});
