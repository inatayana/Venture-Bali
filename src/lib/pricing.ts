import type { PriceTier } from '@/types/venture';
import { convertFromIDR, formatCurrency, type Currency } from './fx';

export interface PriceBreakdown {
  pricePerPax: number;
  totalPrice: number;
  tier: PriceTier;
  paxCount: number;
  currency: Currency;
}

/**
 * Find the applicable price tier for a given pax count
 * Tiers are expected to be sorted by minPax ascending
 */
export function getPriceTierForPax(
  priceTiers: PriceTier[],
  paxCount: number
): PriceTier {
  if (!priceTiers || priceTiers.length === 0) {
    throw new Error('No price tiers available');
  }

  // Find tier where paxCount falls within min/max range
  const tier = priceTiers.find(
    (t) => paxCount >= t.minPax && paxCount <= t.maxPax
  );

  if (tier) return tier;

  // If paxCount exceeds all tiers, return the highest tier
  // If paxCount is below all tiers, return the lowest tier
  return paxCount > priceTiers[priceTiers.length - 1].maxPax
    ? priceTiers[priceTiers.length - 1]
    : priceTiers[0];
}

/**
 * Calculate price breakdown for a variant and pax count
 */
export function calculatePriceBreakdown(
  priceTiers: PriceTier[],
  paxCount: number,
  currency: Currency = 'IDR'
): PriceBreakdown {
  const tier = getPriceTierForPax(priceTiers, paxCount);
  const pricePerPax = tier.pricePerPax;
  const totalPrice = pricePerPax * paxCount;

  return {
    pricePerPax,
    totalPrice,
    tier,
    paxCount,
    currency,
  };
}

/**
 * Get all price tiers with per-pax and total price for a given pax count
 * Useful for displaying pricing table
 */
export function getAllTiersWithPricing(
  priceTiers: PriceTier[],
  paxCount: number,
  currency: Currency = 'IDR'
): Array<PriceBreakdown & { isActive: boolean }> {
  return priceTiers.map((tier) => ({
    ...calculatePriceBreakdown([tier], paxCount, currency),
    isActive: paxCount >= tier.minPax && paxCount <= tier.maxPax,
  }));
}

/**
 * Check if a variant is available for a given date (blackout dates)
 */
export function isDateAvailable(
  variant: { blackoutDates: string[] },
  date: string // YYYY-MM-DD
): boolean {
  return !variant.blackoutDates.includes(date);
}

/**
 * Get available slot times for a variant on a given date
 */
export function getAvailableSlots(
  variant: { slotTimes?: Array<{ time: string; maxCapacity: number; currentBookings: number; isAvailable: boolean }> },
  paxCount: number
): Array<{ time: string; capacity: number; booked: number; available: number }> {
  if (!variant.slotTimes) return [];

  return variant.slotTimes
    .filter((slot) => slot.isAvailable && slot.maxCapacity - slot.currentBookings >= paxCount)
    .map((slot) => ({
      time: slot.time,
      capacity: slot.maxCapacity,
      booked: slot.currentBookings,
      available: slot.maxCapacity - slot.currentBookings,
    }));
}

/**
 * Format price for display in given currency
 */
export async function formatPriceForDisplay(
  amountIdr: number,
  currency: Currency
): Promise<string> {
  if (currency === 'IDR') {
    return formatCurrency(amountIdr, 'IDR');
  }
  const converted = await convertFromIDR(amountIdr, currency);
  return formatCurrency(converted, currency);
}

/**
 * Get price display string for a variant and pax count
 * e.g. "Rp 1.100.000" or "$ 73" (for 2 pax)
 */
export async function getPriceDisplay(
  priceTiers: PriceTier[],
  paxCount: number,
  currency: Currency = 'IDR'
): Promise<string> {
  const breakdown = calculatePriceBreakdown(priceTiers, paxCount, currency);
  return formatPriceForDisplay(breakdown.totalPrice, currency);
}