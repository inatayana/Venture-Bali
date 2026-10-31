import { couponAppliesTo, getVariantPickupDisplay, getVariantPriceDisplay } from './variantDisplay';
import { formatPrice } from './i18n';
import type { Variant } from '@/types/venture';

function buildVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    id: 'var-001',
    ventureId: 'vtr-001',
    title: 'River Tubing with Meeting Point',
    shortDescription: 'Gear, guide and lunch included.',
    fulfillmentMode: 'SELF_DRIVE',
    sortOrder: 1,
    blackoutDates: [],
    priceTiers: [
      { minPax: 1, maxPax: 1, pricePerPax: 450000 },
      { minPax: 2, maxPax: 2, pricePerPax: 400000 },
      { minPax: 3, maxPax: 10, pricePerPax: 350000 },
    ],
    createdAt: new Date('2026-01-15T08:00:00Z'),
    updatedAt: new Date('2026-08-01T10:30:00Z'),
    ...overrides,
  };
}

describe('getVariantPriceDisplay', () => {
  it('uses the lowest tier price as the list price', () => {
    expect(getVariantPriceDisplay(buildVariant()).listPriceIdr).toBe(350000);
  });

  it('applies a promo price that is lower than the list price', () => {
    const display = getVariantPriceDisplay(buildVariant({ promoPriceIdr: 300000 }));

    expect(display.promoPriceIdr).toBe(300000);
    expect(display.priceIdr).toBe(300000);
    expect(display.discountPercent).toBe(14);
  });

  it('ignores a promo price that is not cheaper than the list price', () => {
    const display = getVariantPriceDisplay(buildVariant({ promoPriceIdr: 900000 }));

    expect(display.promoPriceIdr).toBeNull();
    expect(display.priceIdr).toBe(350000);
    expect(display.discountPercent).toBeNull();
  });

  it('falls back to zero when there are no price tiers', () => {
    const display = getVariantPriceDisplay(buildVariant({ priceTiers: [] }));

    expect(display.listPriceIdr).toBe(0);
    expect(display.promoPriceIdr).toBeNull();
    expect(display.priceIdr).toBe(0);
    expect(display.lowestTierMinPax).toBe(1);
  });

  it('reports the min pax of the cheapest tier', () => {
    const display = getVariantPriceDisplay(buildVariant());

    // The Rp 350.000 tier starts at 3 guests.
    expect(display.lowestTierMinPax).toBe(3);
  });
});

describe('couponAppliesTo', () => {
  it('is true for packages sold at list price', () => {
    expect(couponAppliesTo(buildVariant())).toBe(true);
  });

  it('is false when a promo price is already applied', () => {
    expect(couponAppliesTo(buildVariant({ promoPriceIdr: 300000 }))).toBe(false);
  });
});

describe('getVariantPickupDisplay', () => {
  it('points self-drive packages at the meeting point', () => {
    expect(getVariantPickupDisplay(buildVariant())).toEqual({
      label: 'Meeting point',
      detail: 'Make your own way',
    });
  });

  it('returns null for transfers whose area is picked at checkout', () => {
    expect(
      getVariantPickupDisplay(
        buildVariant({ fulfillmentMode: 'SHARED_TRANSFER', pickupZone: undefined })
      )
    ).toBeNull();
  });

  it('summarises a free pickup zone as included', () => {
    expect(
      getVariantPickupDisplay(
        buildVariant({
          fulfillmentMode: 'SHARED_TRANSFER',
          pickupZoneId: 'zone-1',
          pickupZone: {
            id: 'zone-1',
            name: 'Core Area — Ubud & Gianyar',
            areaType: 'ZONE_1',
            surchargeIdr: 0,
            isCustomQuote: false,
            vehicleMaxPax: 6,
          },
        })
      )
    ).toEqual({ label: 'Ubud', detail: 'Pickup included' });
  });

  it('shows the per-guest surcharge for shared pickup', () => {
    expect(
      getVariantPickupDisplay(
        buildVariant({
          fulfillmentMode: 'SHARED_TRANSFER',
          pickupZoneId: 'zone-2',
          pickupZone: {
            id: 'zone-2',
            name: 'South 1 — Kuta, Seminyak, Canggu, Sanur',
            areaType: 'ZONE_2',
            surchargeIdr: 224000,
            isCustomQuote: false,
            vehicleMaxPax: 6,
          },
        })
      )
    ).toEqual({ label: 'South Bali', detail: `+${formatPrice(224000)}/guest` });
  });

  it('shows the per-vehicle surcharge for private pickup', () => {
    expect(
      getVariantPickupDisplay(
        buildVariant({
          fulfillmentMode: 'PRIVATE_TRANSFER',
          pickupZoneId: 'zone-2',
          pickupZone: {
            id: 'zone-2',
            name: 'South 1 — Kuta, Seminyak, Canggu, Sanur',
            areaType: 'ZONE_2',
            surchargeIdr: 224000,
            isCustomQuote: false,
            vehicleMaxPax: 6,
          },
        })
      )
    ).toEqual({ label: 'South Bali', detail: `+${formatPrice(224000)}/vehicle` });
  });

  it('flags custom-quote zones', () => {
    expect(
      getVariantPickupDisplay(
        buildVariant({
          fulfillmentMode: 'SHARED_TRANSFER',
          pickupZoneId: 'zone-4',
          pickupZone: {
            id: 'zone-4',
            name: 'Outer — Amed, Lovina, Pemuteran, Tulamben',
            areaType: 'ZONE_4',
            surchargeIdr: 0,
            isCustomQuote: true,
            vehicleMaxPax: 6,
          },
        })
      )
    ).toEqual({ label: 'Outer Bali', detail: 'Custom quote' });
  });
});
