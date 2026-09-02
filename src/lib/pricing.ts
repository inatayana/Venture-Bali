import type { PriceTier, PickupZone, VehicleClass, Addon, FulfillmentMode } from '@/types/venture';
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

// ============ TRANSFER & COMBO ENGINE (Klook-style, BOOKING_ARCHITECTURE.md §2, §2b) ============

export interface TransferFeeBreakdown {
  vehicleCount: number;
  zoneSurchargeIdr: number;
  vehicleClassDeltaIdr: number;
  feePerVehicleIdr: number;
  totalFeeIdr: number;
}

/**
 * Calculate transfer fee for PRIVATE_TRANSFER:
 * fee = (zone surcharge + vehicle class delta) × ceil(pax / vehicleClass.vehicleMaxPax)
 * SELF_DRIVE always costs 0.
 */
export function calculateTransferFee(
  paxCount: number,
  zone: PickupZone | null,
  vehicleClass: VehicleClass | null
): TransferFeeBreakdown {
  if (!zone || !vehicleClass) {
    return {
      vehicleCount: 0,
      zoneSurchargeIdr: 0,
      vehicleClassDeltaIdr: 0,
      feePerVehicleIdr: 0,
      totalFeeIdr: 0,
    };
  }

  const vehicleCount = Math.max(1, Math.ceil(paxCount / vehicleClass.vehicleMaxPax));
  const feePerVehicleIdr = zone.surchargeIdr + vehicleClass.deltaIdr;
  return {
    vehicleCount,
    zoneSurchargeIdr: zone.surchargeIdr,
    vehicleClassDeltaIdr: vehicleClass.deltaIdr,
    feePerVehicleIdr,
    totalFeeIdr: feePerVehicleIdr * vehicleCount,
  };
}

export interface TotalPriceBreakdown extends PriceBreakdown {
  fulfillmentMode: FulfillmentMode;
  transfer: TransferFeeBreakdown;
  addonsTotalIdr: number;
  totalPriceIdr: number;
}

/**
 * Full real-time price calculation:
 * Total = (Base × Pax) + Transfer Fee + (Selected Add-ons × Pax)
 */
export function calculateTotalPrice(
  priceTiers: PriceTier[],
  paxCount: number,
  fulfillmentMode: FulfillmentMode,
  options: {
    zone?: PickupZone | null;
    vehicleClass?: VehicleClass | null;
    selectedAddons?: Addon[];
  } = {}
): TotalPriceBreakdown {
  const base = calculatePriceBreakdown(priceTiers, paxCount);

  const isTransfer = fulfillmentMode === 'PRIVATE_TRANSFER';
  const transfer = isTransfer
    ? calculateTransferFee(paxCount, options.zone ?? null, options.vehicleClass ?? null)
    : calculateTransferFee(0, null, null);

  const selectedAddons = options.selectedAddons ?? [];
  const addonsTotalIdr = selectedAddons.reduce((sum, a) => sum + a.price, 0) * paxCount;

  return {
    ...base,
    fulfillmentMode,
    transfer,
    addonsTotalIdr,
    totalPriceIdr: base.totalPrice + transfer.totalFeeIdr + addonsTotalIdr,
  };
}

/**
 * Dependent selection matrix: filter add-ons allowed for a fulfillment mode.
 * Add-ons with requiresTransfer=true are only bookable with PRIVATE_TRANSFER.
 */
export function filterAddonsForMode(
  addons: Addon[],
  fulfillmentMode: FulfillmentMode
): Array<Addon & { isDisabled: boolean }> {
  return addons.map((addon) => ({
    ...addon,
    isDisabled: addon.requiresTransfer && fulfillmentMode !== 'PRIVATE_TRANSFER',
  }));
}

/**
 * Validate server-side: addons requiring transfer must not be selected without transfer.
 * Returns list of violated addon ids (empty = valid).
 */
export function validateAddonModeCombinations(
  addons: Addon[],
  selectedAddonIds: string[],
  fulfillmentMode: FulfillmentMode
): string[] {
  if (fulfillmentMode === 'PRIVATE_TRANSFER') return [];
  const selected = new Set(selectedAddonIds);
  return addons
    .filter((a) => selected.has(a.id) && a.requiresTransfer)
    .map((a) => a.id);
}

// ============ CUT-OFF RULES (BOOKING_ARCHITECTURE.md §4, WITA = UTC+8) ============

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Current time in WITA (UTC+8, no DST) as a shifted Date usable for comparisons.
 */
export function getNowWita(now: Date = new Date()): Date {
  return new Date(now.getTime() + WITA_OFFSET_MS);
}

/**
 * Self Drive cut-off: bookable until 2 hours before slot start.
 * PRIVATE_TRANSFER cut-off: 22:00 WITA on D-1 (day before activity).
 * Zone 4 (custom quote) is never instant-bookable.
 */
export function isBookable(
  activityTime: Date,
  fulfillmentMode: FulfillmentMode,
  now: Date = new Date(),
  zone?: PickupZone | null
): boolean {
  if (zone?.isCustomQuote) return false;

  const nowWita = getNowWita(now);

  if (fulfillmentMode === 'SELF_DRIVE') {
    const hoursUntil = (activityTime.getTime() - nowWita.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 2;
  }

  // PRIVATE_TRANSFER: deadline = 22:00 WITA on the day before the activity
  const deadline = new Date(activityTime.getTime());
  deadline.setUTCDate(deadline.getUTCDate() - 1); // D-1
  deadline.setUTCHours(22 - 8, 0, 0, 0); // 22:00 WITA expressed in UTC-shifted frame

  // activityTime is expected already shifted to WITA frame by caller
  return nowWita.getTime() <= deadline.getTime();
}