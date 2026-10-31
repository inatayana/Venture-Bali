import { couponAppliesTo, getVariantPriceDisplay } from './variantDisplay';
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
