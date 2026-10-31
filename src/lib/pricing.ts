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
 * Get available slot times for a variant on a given date.
 * The real database id is preserved so the booking API can persist it —
 * synthesised ids were previously sent to `/api/booking` and rejected.
 */
export function getAvailableSlots(
  variant: {
    slotTimes?: Array<{
      id?: string;
      time: string;
      maxCapacity: number;
      currentBookings: number;
      isAvailable: boolean;
    }>;
  },
  paxCount: number
): Array<{ id: string; time: string; capacity: number; booked: number; available: number }> {
  if (!variant.slotTimes) return [];

  return variant.slotTimes
    .filter((slot) => slot.isAvailable && slot.maxCapacity - slot.currentBookings >= paxCount)
    .map((slot) => ({
      id: slot.id ?? `slot-${slot.time.replace(/\s|:/g, '')}`,
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

/**
 * Calculate the SHARED_TRANSFER shuttle fee: a flat zone surcharge per guest.
 * No vehicle class is sold, so the fee per vehicle equals the per-pax fee and
 * `vehicleCount` stays 1 (capacity is enforced on the activity slot instead).
 */
export function calculateSharedTransferFee(
  paxCount: number,
  zone: PickupZone | null
): TransferFeeBreakdown {
  if (!zone) {
    return {
      vehicleCount: 0,
      zoneSurchargeIdr: 0,
      vehicleClassDeltaIdr: 0,
      feePerVehicleIdr: 0,
      totalFeeIdr: 0,
    };
  }

  return {
    vehicleCount: 1,
    zoneSurchargeIdr: zone.surchargeIdr,
    vehicleClassDeltaIdr: 0,
    feePerVehicleIdr: zone.surchargeIdr,
    totalFeeIdr: zone.surchargeIdr * paxCount,
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
  return computeQuote({
    priceTiers,
    paxCount,
    fulfillmentMode,
    zone: options.zone ?? null,
    vehicleClass: options.vehicleClass ?? null,
    selectedAddons: options.selectedAddons ?? [],
  });
}

// ============ PROMO & COUPON ENGINE ============

/** Flat evening surcharge (IDR, per guest) for slots starting at/after 19:00 WITA. */
export const NIGHT_SURCHARGE_IDR = 50_000;
export const NIGHT_SURCHARGE_FROM_HOUR = 19;

export type CouponRejectionReason =
  | 'COUPON_INACTIVE'
  | 'COUPON_NOT_STARTED'
  | 'COUPON_EXPIRED'
  | 'COUPON_MIN_PAX'
  | 'COUPON_EXHAUSTED'
  | 'COUPON_NOT_APPLICABLE_ON_PROMO';

/** Customer-facing copy for every rejection, shared by the API and the UI. */
export const COUPON_REJECTION_MESSAGES: Record<CouponRejectionReason, string> = {
  COUPON_INACTIVE: 'This coupon is not active',
  COUPON_NOT_STARTED: 'This coupon is not valid yet',
  COUPON_EXPIRED: 'This coupon has expired',
  COUPON_MIN_PAX: 'This coupon requires more guests',
  COUPON_EXHAUSTED: 'This coupon has reached its usage limit',
  COUPON_NOT_APPLICABLE_ON_PROMO: 'This coupon cannot be combined with an active promo price',
};

export interface CouponRule {
  code: string;
  discountPercent: number;
  minPax?: number;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount?: number;
}

export interface QuoteInput {
  priceTiers: PriceTier[];
  paxCount: number;
  fulfillmentMode: FulfillmentMode;
  /** Active promo price per pax (IDR). Ignored when null/0 or not below the tier price. */
  promoPriceIdr?: number | null;
  /** Coupon to validate. Promo prices and coupons never stack. */
  coupon?: CouponRule | null;
  /** Optional minimum spend for the package (IDR); applied after discounts. */
  minimumSpendIdr?: number | null;
  /** Slot label as stored ("07:00 PM"), used for the night surcharge. */
  slotTimeLabel?: string | null;
  zone?: PickupZone | null;
  vehicleClass?: VehicleClass | null;
  selectedAddons?: Addon[];
  now?: Date;
}

export interface QuoteBreakdown extends TotalPriceBreakdown {
  /** Tier list price (strikethrough anchor). */
  listPricePerPaxIdr: number;
  /** Price actually charged per guest after the promo, before coupon. */
  unitPricePerPaxIdr: number;
  promoActive: boolean;
  listTotalIdr: number;
  subtotalIdr: number;
  /** Promo + coupon discount combined (IDR). */
  discountIdr: number;
  couponCode: string | null;
  couponRejection: CouponRejectionReason | null;
  nightSurchargeIdr: number;
  /** Extra amount added to reach the package minimum spend. */
  minimumTopUpIdr: number;
}

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Why a coupon cannot be applied, or null when it is valid.
 * Server-side booking validation uses exactly the same rules.
 */
export function getCouponRejection(
  coupon: CouponRule,
  paxCount: number,
  promoActive: boolean,
  now: Date = new Date()
): CouponRejectionReason | null {
  if (!coupon.isActive) return 'COUPON_INACTIVE';

  const nowMs = now.getTime();
  const validFrom = toTime(coupon.validFrom);
  const validUntil = toTime(coupon.validUntil);
  if (validFrom !== null && nowMs < validFrom) return 'COUPON_NOT_STARTED';
  if (validUntil !== null && nowMs > validUntil) return 'COUPON_EXPIRED';
  if (paxCount < (coupon.minPax ?? 1)) return 'COUPON_MIN_PAX';

  const limit = coupon.usageLimit ?? null;
  if (limit !== null && (coupon.usedCount ?? 0) >= limit) return 'COUPON_EXHAUSTED';
  if (promoActive) return 'COUPON_NOT_APPLICABLE_ON_PROMO';

  return null;
}

/**
 * Parse a slot label into its 24-hour WITA hour.
 * Accepts "07:00 PM", "7:00PM", "19:00" and "7 PM"; returns null when unparsable.
 */
export function parseSlotHour(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = label.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour > 23) return null;

  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return hour;
}

/**
 * Single source of truth for every price the customer sees and pays.
 * The server recomputes this inside the booking transaction; the client is
 * never trusted with amounts (PRD §6).
 */
export function computeQuote(input: QuoteInput): QuoteBreakdown {
  const { priceTiers, paxCount, fulfillmentMode } = input;
  const tier = getPriceTierForPax(priceTiers, paxCount);

  const listPricePerPaxIdr = tier.pricePerPax;
  const promoPrice = input.promoPriceIdr ?? null;
  const promoActive = promoPrice !== null && promoPrice > 0 && promoPrice < listPricePerPaxIdr;
  const unitPricePerPaxIdr = promoActive ? (promoPrice as number) : listPricePerPaxIdr;

  const listTotalIdr = listPricePerPaxIdr * paxCount;
  const subtotalIdr = unitPricePerPaxIdr * paxCount;
  let discountIdr = listTotalIdr - subtotalIdr;
  let couponDiscountIdr = 0;

  let couponCode: string | null = null;
  let couponRejection: CouponRejectionReason | null = null;
  if (input.coupon) {
    couponRejection = getCouponRejection(
      input.coupon,
      paxCount,
      promoActive,
      input.now ?? new Date()
    );
    if (couponRejection === null) {
      const percent = Math.min(100, Math.max(0, input.coupon.discountPercent));
      couponDiscountIdr = Math.round((subtotalIdr * percent) / 100);
      discountIdr += couponDiscountIdr;
      couponCode = input.coupon.code;
    }
  }

  const hour = parseSlotHour(input.slotTimeLabel);
  const nightSurchargeIdr =
    hour !== null && hour >= NIGHT_SURCHARGE_FROM_HOUR ? NIGHT_SURCHARGE_IDR * paxCount : 0;

  const payableSubtotal = subtotalIdr - couponDiscountIdr;
  const minimumTopUpIdr = Math.max(0, (input.minimumSpendIdr ?? 0) - payableSubtotal);

  const transfer =
    fulfillmentMode === 'PRIVATE_TRANSFER'
      ? calculateTransferFee(paxCount, input.zone ?? null, input.vehicleClass ?? null)
      : fulfillmentMode === 'SHARED_TRANSFER'
        ? calculateSharedTransferFee(paxCount, input.zone ?? null)
        : calculateTransferFee(0, null, null);

  const selectedAddons = input.selectedAddons ?? [];
  const addonsTotalIdr = selectedAddons.reduce((sum, addon) => sum + addon.price, 0) * paxCount;

  const totalPriceIdr =
    payableSubtotal + minimumTopUpIdr + nightSurchargeIdr + transfer.totalFeeIdr + addonsTotalIdr;

  return {
    tier,
    paxCount,
    currency: 'IDR',
    fulfillmentMode,
    pricePerPax: unitPricePerPaxIdr,
    totalPrice: subtotalIdr,
    listPricePerPaxIdr,
    unitPricePerPaxIdr,
    promoActive,
    listTotalIdr,
    subtotalIdr,
    discountIdr,
    couponCode,
    couponRejection,
    nightSurchargeIdr,
    minimumTopUpIdr,
    transfer,
    addonsTotalIdr,
    totalPriceIdr,
  };
}

/**
 * Dependent selection matrix: filter add-ons allowed for a fulfillment mode.
 * Add-ons with requiresTransfer=true are bookable with any transfer mode,
 * never with SELF_DRIVE.
 */
export function filterAddonsForMode(
  addons: Addon[],
  fulfillmentMode: FulfillmentMode
): Array<Addon & { isDisabled: boolean }> {
  return addons.map((addon) => ({
    ...addon,
    isDisabled: addon.requiresTransfer && fulfillmentMode === 'SELF_DRIVE',
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
  if (fulfillmentMode !== 'SELF_DRIVE') return [];
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

/**
 * Slot-level cut-off check used by the UI and the booking service.
 * Unlike `isBookable` (which only sees the activity date) this accounts for
 * the departure hour, so a 08:00 slot today is correctly rejected while a
 * 17:00 slot today may still be bookable for SELF_DRIVE.
 */
export function isSlotBookable(
  bookingDate: string, // YYYY-MM-DD
  slotLabel: string,
  fulfillmentMode: FulfillmentMode,
  now: Date = new Date()
): boolean {
  const hour = parseSlotHour(slotLabel);
  if (hour === null) return true;

  const [year, month, day] = bookingDate.split('-').map(Number);
  if (!year || !month || !day) return true;

  const dayStartWita = Date.UTC(year, month - 1, day);
  const activityWita = dayStartWita + hour * 60 * 60 * 1000;
  const nowWita = getNowWita(now).getTime();

  if (fulfillmentMode === 'SELF_DRIVE') {
    return activityWita - nowWita >= 2 * 60 * 60 * 1000;
  }

  // Transfers: deadline is 22:00 WITA on D-1.
  const deadline = dayStartWita - 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000;
  return nowWita <= deadline;
}