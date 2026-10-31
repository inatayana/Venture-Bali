import type { Variant } from '@/types/venture';

export interface VariantPriceDisplay {
  /** Lowest list price per guest across the price tiers (IDR). */
  listPriceIdr: number;
  /** Active promo price per guest, or null when there is none. */
  promoPriceIdr: number | null;
  /** Price actually charged per guest: the promo price when active, else the list price. */
  priceIdr: number;
  /** Rounded saving of the active promo, or null when no promo is active. */
  discountPercent: number | null;
}

/**
 * Display-only price summary for a package (variant).
 *
 * Mirrors the pricing rule in docs/BOOKING_ARCHITECTURE.md: a promo price is
 * only active when it is set and lower than the list price of every tier.
 */
export function getVariantPriceDisplay(variant: Variant): VariantPriceDisplay {
  const prices = (variant.priceTiers ?? []).map((tier) => tier.pricePerPax);
  const listPriceIdr = prices.length > 0 ? Math.min(...prices) : 0;
  const promo = variant.promoPriceIdr ?? 0;
  const promoPriceIdr = promo > 0 && promo < listPriceIdr ? promo : null;
  const priceIdr = promoPriceIdr ?? listPriceIdr;
  const discountPercent =
    promoPriceIdr !== null && listPriceIdr > 0
      ? Math.round(((listPriceIdr - promoPriceIdr) / listPriceIdr) * 100)
      : null;

  return { listPriceIdr, promoPriceIdr, priceIdr, discountPercent };
}

/**
 * Coupons never stack on an active promo price (docs/BOOKING_ARCHITECTURE.md §5),
 * so the coupon hint is only shown for packages sold at list price.
 */
export function couponAppliesTo(variant: Variant): boolean {
  return getVariantPriceDisplay(variant).promoPriceIdr === null;
}
