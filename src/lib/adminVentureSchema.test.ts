import { adminVariantSchema, normaliseSlotTime, slotInputSchema } from './adminVentureSchema';
import { summariseRevenue } from './revenue';

describe('admin slot input', () => {
  it('normalises common time formats', () => {
    expect(normaliseSlotTime('8:00am')).toBe('08:00 AM');
    expect(normaliseSlotTime(' 01:30 pm ')).toBe('01:30 PM');
    expect(normaliseSlotTime('19:00')).toBe('19:00');
  });

  it('parses and normalises a valid slot', () => {
    const parsed = slotInputSchema.parse({ time: '9:00 am', maxCapacity: 8 });
    expect(parsed).toEqual({ time: '09:00 AM', maxCapacity: 8, isAvailable: true });
  });

  it('rejects malformed times and capacities', () => {
    expect(slotInputSchema.safeParse({ time: 'morning', maxCapacity: 8 }).success).toBe(false);
    expect(slotInputSchema.safeParse({ time: '08:00 AM', maxCapacity: 0 }).success).toBe(false);
    expect(slotInputSchema.safeParse({ time: '08:00 AM', maxCapacity: 101 }).success).toBe(false);
  });
});

describe('revenue summary', () => {
  const bookings = [
    { bookingDate: '2026-11-01', totalPrice: 1000000, paxCount: 2, fulfillmentMode: 'SELF_DRIVE', productTitle: 'Tubing' },
    { bookingDate: '2026-11-01', totalPrice: 500000, paxCount: 1, fulfillmentMode: 'PRIVATE_TRANSFER', productTitle: 'Tubing' },
    { bookingDate: '2026-11-02', totalPrice: 750000, paxCount: 3, fulfillmentMode: 'SHARED_TRANSFER', productTitle: 'Rafting' },
  ];

  it('totals revenue, bookings and guests', () => {
    const summary = summariseRevenue(bookings);
    expect(summary.totalRevenue).toBe(2250000);
    expect(summary.bookingCount).toBe(3);
    expect(summary.guestCount).toBe(6);
    expect(summary.averageBookingValue).toBe(750000);
  });

  it('groups by date, product and mode', () => {
    const summary = summariseRevenue(bookings);
    expect(summary.byDate[0]).toMatchObject({ key: '2026-11-02', revenue: 750000 });
    expect(summary.byDate[1]).toMatchObject({ key: '2026-11-01', revenue: 1500000, bookings: 2 });
    expect(summary.byProduct[0]).toMatchObject({ label: 'Tubing', revenue: 1500000 });
    expect(summary.byMode.find((bucket) => bucket.key === 'PRIVATE_TRANSFER')?.label).toBe('Private transfer');
  });

  it('handles an empty report', () => {
    const summary = summariseRevenue([]);
    expect(summary.totalRevenue).toBe(0);
    expect(summary.averageBookingValue).toBe(0);
    expect(summary.byDate).toEqual([]);
  });
});

describe('admin variant input', () => {
  const base = {
    title: 'South Bali: Shared Pickup',
    shortDescription: 'Shared hotel shuttle from Kuta, Seminyak, Canggu or Sanur',
    fulfillmentMode: 'SHARED_TRANSFER' as const,
    pickupZoneId: 'zone-2',
    priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 450000 }],
  };

  it('accepts a zone-locked package', () => {
    const parsed = adminVariantSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it('rejects a pickup zone on a self-drive package', () => {
    const parsed = adminVariantSchema.safeParse({
      ...base,
      fulfillmentMode: 'SELF_DRIVE',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].path).toEqual(['pickupZoneId']);
    }
  });

  it('rejects overlapping price tiers', () => {
    const parsed = adminVariantSchema.safeParse({
      ...base,
      priceTiers: [
        { minPax: 1, maxPax: 4, pricePerPax: 450000 },
        { minPax: 3, maxPax: 10, pricePerPax: 400000 },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a tier whose max pax is below its min pax', () => {
    const parsed = adminVariantSchema.safeParse({
      ...base,
      priceTiers: [{ minPax: 5, maxPax: 2, pricePerPax: 450000 }],
    });
    expect(parsed.success).toBe(false);
  });

  it('requires at least one price tier', () => {
    expect(adminVariantSchema.safeParse({ ...base, priceTiers: [] }).success).toBe(false);
  });
});