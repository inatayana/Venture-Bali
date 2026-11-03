import {
  adminVariantSchema,
  adminVentureWriteSchema,
  normaliseSlotTime,
  slotInputSchema,
} from './adminVentureSchema';
import { summariseRevenue } from './revenue';
import { buildVentureSlug } from './slug';

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

  it('accepts an optional cover that reuses a product photo', () => {
    const parsed = adminVariantSchema.safeParse({
      ...base,
      imageUrl: '/images/tubing-hero.webp',
    });
    expect(parsed.success).toBe(true);

    expect(adminVariantSchema.safeParse({ ...base, imageUrl: null }).success).toBe(true);
    expect(adminVariantSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a variant cover that is not a local path or https URL', () => {
    for (const imageUrl of ['javascript:alert(1)', '', 'ftp://example.com/photo.webp']) {
      expect(adminVariantSchema.safeParse({ ...base, imageUrl }).success).toBe(false);
    }
  });
});

const validProduct = {
  title: 'Ubud River Tubing: Hidden Canyon Adventure with Lunch',
  category: 'tubing',
  hook3Sec: 'Float a hidden canyon, then lunch by the river.',
  duration: '3 hours',
  imageUrl: '/images/tubing.webp',
  gallery: ['/images/tubing-1.webp', '/images/tubing-2.webp'],
};

describe('admin venture write schema', () => {
  it('accepts a valid product and normalises the category', () => {
    const parsed = adminVentureWriteSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe('River Tubing');
      expect(parsed.data.languages).toEqual(['en', 'id']);
    }
  });

  it('rejects forbidden categories and bad asset URLs', () => {
    expect(adminVentureWriteSchema.safeParse({ ...validProduct, category: 'hotel' }).success).toBe(
      false
    );
    expect(
      adminVentureWriteSchema.safeParse({
        ...validProduct,
        imageUrl: 'javascript:alert(1)',
      }).success
    ).toBe(false);
  });

  it('caps the gallery at 6 itinerary photos (1 main cover + 6 per product)', () => {
    expect(
      adminVentureWriteSchema.safeParse({
        ...validProduct,
        gallery: Array.from({ length: 6 }, (_, index) => `/images/${index}.webp`),
      }).success
    ).toBe(true);
    expect(
      adminVentureWriteSchema.safeParse({
        ...validProduct,
        gallery: Array.from({ length: 7 }, (_, index) => `/images/${index}.webp`),
      }).success
    ).toBe(false);
  });

  it('requires a meeting point name and coordinates together', () => {
    expect(
      adminVentureWriteSchema.safeParse({ ...validProduct, meetingPoint: 'Ubud bridge' }).success
    ).toBe(false);
    expect(
      adminVentureWriteSchema.safeParse({
        ...validProduct,
        meetingPoint: 'Ubud bridge',
        meetingPointLat: -8.5,
        meetingPointLng: 115.2,
      }).success
    ).toBe(true);
  });

  it('enforces the 45-60 character title', () => {
    expect(adminVentureWriteSchema.safeParse({ ...validProduct, title: 'Too short' }).success).toBe(
      false
    );
  });
});

describe('buildVentureSlug', () => {
  it('creates a URL-safe slug', () => {
    expect(buildVentureSlug('Ubud River Tubing: Hidden Canyon Adventure with Lunch')).toBe(
      'ubud-river-tubing-hidden-canyon-adventure-with-lunch'
    );
  });
});
