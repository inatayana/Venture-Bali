import {
  getPriceTierForPax,
  calculatePriceBreakdown,
  getAllTiersWithPricing,
  isDateAvailable,
  getAvailableSlots,
  calculateTransferFee,
  calculateTotalPrice,
  filterAddonsForMode,
  validateAddonModeCombinations,
  isBookable,
  getNowWita,
  computeQuote,
  getCouponRejection,
  parseSlotHour,
  calculateSharedTransferFee,
  isSlotBookable,
  NIGHT_SURCHARGE_IDR,
  type CouponRule,
} from './pricing';
import type { Addon, PickupZone, VehicleClass } from '@/types/venture';

describe('Pricing Utilities', () => {
  const mockPriceTiers = [
    { minPax: 1, maxPax: 1, pricePerPax: 550000 },
    { minPax: 2, maxPax: 2, pricePerPax: 450000 },
    { minPax: 3, maxPax: 4, pricePerPax: 420000 },
    { minPax: 5, maxPax: 10, pricePerPax: 380000 },
  ];

  describe('getPriceTierForPax', () => {
    it('returns correct tier for 1 pax', () => {
      const tier = getPriceTierForPax(mockPriceTiers, 1);
      expect(tier.minPax).toBe(1);
      expect(tier.maxPax).toBe(1);
      expect(tier.pricePerPax).toBe(550000);
    });

    it('returns correct tier for 2 pax', () => {
      const tier = getPriceTierForPax(mockPriceTiers, 2);
      expect(tier.minPax).toBe(2);
      expect(tier.maxPax).toBe(2);
      expect(tier.pricePerPax).toBe(450000);
    });

    it('returns correct tier for 3 pax (3-4 range)', () => {
      const tier = getPriceTierForPax(mockPriceTiers, 3);
      expect(tier.minPax).toBe(3);
      expect(tier.maxPax).toBe(4);
      expect(tier.pricePerPax).toBe(420000);
    });

    it('returns correct tier for 4 pax (3-4 range)', () => {
      const tier = getPriceTierForPax(mockPriceTiers, 4);
      expect(tier.minPax).toBe(3);
      expect(tier.maxPax).toBe(4);
    });

    it('returns highest tier for pax exceeding all tiers', () => {
      const tier = getPriceTierForPax(mockPriceTiers, 15);
      expect(tier.minPax).toBe(5);
      expect(tier.maxPax).toBe(10);
      expect(tier.pricePerPax).toBe(380000);
    });

    it('returns lowest tier for pax below all tiers', () => {
      const tier = getPriceTierForPax(mockPriceTiers, 0);
      expect(tier.minPax).toBe(1);
      expect(tier.maxPax).toBe(1);
    });

    it('throws error for empty price tiers', () => {
      expect(() => getPriceTierForPax([], 1)).toThrow('No price tiers available');
    });
  });

  describe('AGE_TIERED pricing', () => {
    // Transfer-style variant: adults tiered by total pax, kids/youth flat.
    const ageTieredTiers = [
      { minPax: 1, maxPax: 1, pricePerPax: 650000, pricingModel: 'AGE_TIERED' as const, kidsPricePerPax: 450000, youthPricePerPax: 550000 },
      { minPax: 2, maxPax: 2, pricePerPax: 600000, pricingModel: 'AGE_TIERED' as const, kidsPricePerPax: 450000, youthPricePerPax: 550000 },
      { minPax: 3, maxPax: 10, pricePerPax: 550000, pricingModel: 'AGE_TIERED' as const, kidsPricePerPax: 400000, youthPricePerPax: 500000 },
    ];

    it('prices adults by tier and kids/youth at their admin-set flat prices', () => {
      // 2 adults + 1 kid + 1 youth = 4 pax -> tier 3-4 (adult 550k)
      const quote = computeQuote({
        priceTiers: ageTieredTiers,
        paxCount: 4,
        fulfillmentMode: 'SELF_DRIVE',
        adultsCount: 2,
        kidsCount: 1,
        youthCount: 1,
      });
      expect(quote.subtotalIdr).toBe(2 * 550000 + 400000 + 500000);
      expect(quote.totalPriceIdr).toBe(2000000);
      expect(quote.ageBreakdown?.adults.subtotal).toBe(1100000);
      expect(quote.ageBreakdown?.kids.pricePerPax).toBe(400000);
      expect(quote.ageBreakdown?.youth.pricePerPax).toBe(500000);
      expect(quote.discountIdr).toBe(0);
    });

    it('charges the adult price when the admin leaves kids/youth blank', () => {
      const tiers = [
        { minPax: 1, maxPax: 10, pricePerPax: 500000, pricingModel: 'AGE_TIERED' as const },
      ];
      const quote = computeQuote({
        priceTiers: tiers,
        paxCount: 3,
        fulfillmentMode: 'SELF_DRIVE',
        adultsCount: 1,
        kidsCount: 1,
        youthCount: 1,
      });
      expect(quote.totalPriceIdr).toBe(1500000);
      expect(quote.ageBreakdown?.kids.pricePerPax).toBe(500000);
      expect(quote.ageBreakdown?.youth.pricePerPax).toBe(500000);
    });

    it('scales kids/youth by the same promo ratio as the adult price', () => {
      const tiers = [
        {
          minPax: 1,
          maxPax: 10,
          pricePerPax: 450000,
          pricingModel: 'AGE_TIERED' as const,
          kidsPricePerPax: 300000,
          youthPricePerPax: 400000,
        },
      ];
      // Promo 382.500 = 15% off the 450.000 adult price -> kids 255.000.
      const quote = computeQuote({
        priceTiers: tiers,
        paxCount: 2,
        fulfillmentMode: 'SELF_DRIVE',
        adultsCount: 1,
        kidsCount: 1,
        youthCount: 0,
        promoPriceIdr: 382500,
      });
      expect(quote.promoActive).toBe(true);
      expect(quote.ageBreakdown?.adults.pricePerPax).toBe(382500);
      expect(quote.ageBreakdown?.kids.pricePerPax).toBe(255000);
      expect(quote.subtotalIdr).toBe(637500);
      expect(quote.listTotalIdr).toBe(750000);
      expect(quote.discountIdr).toBe(112500);
    });

    it('applies a coupon percentage to the age-tiered subtotal', () => {
      const coupon: CouponRule = { code: 'BALICERIA2026', discountPercent: 10, isActive: true };
      const quote = computeQuote({
        priceTiers: ageTieredTiers,
        paxCount: 3,
        fulfillmentMode: 'SELF_DRIVE',
        adultsCount: 2,
        kidsCount: 1,
        youthCount: 0,
        coupon,
      });
      // tier 3-4: 2×550k + 400k = 1.5jt, coupon 10% -> 1.35jt
      expect(quote.subtotalIdr).toBe(1500000);
      expect(quote.discountIdr).toBe(150000);
      expect(quote.couponCode).toBe('BALICERIA2026');
      expect(quote.totalPriceIdr).toBe(1350000);
    });

    it('rejects an age breakdown that does not add up to paxCount', () => {
      expect(() =>
        computeQuote({
          priceTiers: ageTieredTiers,
          paxCount: 4,
          fulfillmentMode: 'SELF_DRIVE',
          adultsCount: 2,
          kidsCount: 1,
          youthCount: 0,
        })
      ).toThrow('Age breakdown total does not match paxCount');
    });

    it('keeps transfer fees per total pax, not per age group', () => {
      const zone = {
        name: 'South 1',
        areaType: 'ZONE_2',
        surchargeIdr: 700000,
        surchargePerPaxIdr: 224000,
        isCustomQuote: false,
        vehicleMaxPax: 4,
        isActive: true,
      } as unknown as PickupZone;
      const quote = computeQuote({
        priceTiers: ageTieredTiers,
        paxCount: 4,
        fulfillmentMode: 'SHARED_TRANSFER',
        adultsCount: 2,
        kidsCount: 1,
        youthCount: 1,
        zone,
      });
      // shared shuttle seat fee: 224.000 × 4 pax — not the 700.000 per-vehicle charter
      expect(quote.transfer.totalFeeIdr).toBe(896000);
      expect(quote.totalPriceIdr).toBe(2000000 + 896000);
    });

    it('never charges shared guests the per-vehicle charter', () => {
      const zone = {
        name: 'Core Area — Ubud & Gianyar',
        areaType: 'ZONE_1',
        surchargeIdr: 500000,
        surchargePerPaxIdr: 0,
        isCustomQuote: false,
        vehicleMaxPax: 6,
        isActive: true,
      } as unknown as PickupZone;
      const quote = computeQuote({
        priceTiers: ageTieredTiers,
        paxCount: 1,
        adultsCount: 1,
        fulfillmentMode: 'SHARED_TRANSFER',
        zone,
      });
      // Ubud shared pickup is included for one guest — the 500K Ubud charter
      // pays for private cars only.
      expect(quote.transfer.totalFeeIdr).toBe(0);
      expect(quote.totalPriceIdr).toBe(quote.subtotalIdr);
    });
  });

  describe('calculatePriceBreakdown', () => {
    it('calculates correct total for 1 pax', () => {
      const breakdown = calculatePriceBreakdown(mockPriceTiers, 1);
      expect(breakdown.pricePerPax).toBe(550000);
      expect(breakdown.totalPrice).toBe(550000);
      expect(breakdown.paxCount).toBe(1);
      expect(breakdown.currency).toBe('IDR');
    });

    it('calculates correct total for 2 pax', () => {
      const breakdown = calculatePriceBreakdown(mockPriceTiers, 2);
      expect(breakdown.pricePerPax).toBe(450000);
      expect(breakdown.totalPrice).toBe(900000);
    });

    it('calculates correct total for 4 pax', () => {
      const breakdown = calculatePriceBreakdown(mockPriceTiers, 4);
      expect(breakdown.pricePerPax).toBe(420000);
      expect(breakdown.totalPrice).toBe(1680000);
    });
  });

  describe('getAllTiersWithPricing', () => {
    it('returns all tiers with isActive flag', () => {
      const tiers = getAllTiersWithPricing(mockPriceTiers, 2);
      expect(tiers).toHaveLength(4);
      expect(tiers[0].isActive).toBe(false); // 1 pax tier
      expect(tiers[1].isActive).toBe(true);  // 2 pax tier
      expect(tiers[2].isActive).toBe(false); // 3-4 pax tier
      expect(tiers[3].isActive).toBe(false); // 5-10 pax tier
    });

    it('calculates total price per tier for given pax count', () => {
      const tiers = getAllTiersWithPricing(mockPriceTiers, 3);
      // For 3 pax, each tier's total = tier.pricePerPax * 3
      expect(tiers[0].totalPrice).toBe(550000 * 3);
      expect(tiers[1].totalPrice).toBe(450000 * 3);
      expect(tiers[2].totalPrice).toBe(420000 * 3);
      expect(tiers[3].totalPrice).toBe(380000 * 3);
    });
  });

  describe('isDateAvailable', () => {
    it('returns true for available date', () => {
      const variant = { blackoutDates: ['2026-12-25'] };
      expect(isDateAvailable(variant, '2026-12-24')).toBe(true);
    });

    it('returns false for blackout date', () => {
      const variant = { blackoutDates: ['2026-12-25'] };
      expect(isDateAvailable(variant, '2026-12-25')).toBe(false);
    });
  });

  describe('getAvailableSlots', () => {
    it('returns slots with enough capacity for pax count', () => {
      const variant = {
        slotTimes: [
          { time: '08:00', maxCapacity: 12, currentBookings: 4, isAvailable: true },
          { time: '10:00', maxCapacity: 12, currentBookings: 10, isAvailable: true },
          { time: '14:00', maxCapacity: 12, currentBookings: 12, isAvailable: true },
        ],
      };

      const slots = getAvailableSlots(variant, 5);
      expect(slots).toHaveLength(1);
      expect(slots[0].time).toBe('08:00');
      expect(slots[0].available).toBe(8);
    });

    it('excludes slots that are not available', () => {
      const variant = {
        slotTimes: [
          { time: '08:00', maxCapacity: 12, currentBookings: 4, isAvailable: true },
          { time: '10:00', maxCapacity: 12, currentBookings: 2, isAvailable: false },
        ],
      };

      const slots = getAvailableSlots(variant, 2);
      expect(slots).toHaveLength(1);
      expect(slots[0].time).toBe('08:00');
    });

    it('returns empty array when no slotTimes', () => {
      const variant = { slotTimes: undefined };
      expect(getAvailableSlots(variant, 2)).toEqual([]);
    });
  });
});
describe('Transfer & Combo Engine (Klook-style)', () => {
  const zones: Record<string, PickupZone> = {
    zone1: { id: 'zone-1', name: 'Core Area', areaType: 'ZONE_1', surchargeIdr: 500000, surchargePerPaxIdr: 0, isCustomQuote: false, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    zone2: { id: 'zone-2', name: 'South 1', areaType: 'ZONE_2', surchargeIdr: 700000, surchargePerPaxIdr: 224000, isCustomQuote: false, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    zone4: { id: 'zone-4', name: 'Outer', areaType: 'ZONE_4', surchargeIdr: 0, surchargePerPaxIdr: 0, isCustomQuote: true, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  };

  const classes: Record<string, VehicleClass> = {
    suv: { id: 'vc-suv', name: 'STANDARD_SUV', label: 'Standard SUV', vehicleMaxPax: 4, deltaIdr: 0, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    van: { id: 'vc-van', name: 'MINIVAN', label: 'Minivan', vehicleMaxPax: 12, deltaIdr: 250000, sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  };

  const addons: Addon[] = [
    { id: 'addon-001', variantId: 'var-001', name: 'Photographer', price: 150000, requiresTransfer: false, isCombo: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 'combo-001', variantId: 'var-001', name: 'Rafting Combo', price: 350000, requiresTransfer: true, isCombo: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  describe('calculateTransferFee', () => {
    it('returns zero for SELF_DRIVE (no zone/class)', () => {
      const fee = calculateTransferFee(4, null, null);
      expect(fee.totalFeeIdr).toBe(0);
      expect(fee.vehicleCount).toBe(0);
    });

    it('calculates the per-vehicle charter × vehicle count', () => {
      // 4 pax, SUV (4 pax/vehicle), Zone 2 (700.000 charter/vehicle) → 1 vehicle = 700k
      const fee = calculateTransferFee(4, zones.zone2, classes.suv);
      expect(fee.vehicleCount).toBe(1);
      expect(fee.feePerVehicleIdr).toBe(700000);
      expect(fee.totalFeeIdr).toBe(700000);
    });

    it('adds the vehicle class delta (charter difference) on top of the zone charter', () => {
      // 8 pax, Minivan (12 pax/vehicle, +250k), Zone 2 (700k) → 1 vehicle × 950k
      const fee = calculateTransferFee(8, zones.zone2, classes.van);
      expect(fee.vehicleCount).toBe(1);
      expect(fee.feePerVehicleIdr).toBe(950000);
      expect(fee.totalFeeIdr).toBe(950000);
    });

    it('splits into multiple vehicles when pax exceeds capacity', () => {
      // 9 pax, SUV (4 pax/vehicle) → ceil(9/4) = 3 vehicles × 700k
      const fee = calculateTransferFee(9, zones.zone2, classes.suv);
      expect(fee.vehicleCount).toBe(3);
      expect(fee.totalFeeIdr).toBe(2100000);
    });
  });

  describe('calculateTotalPrice', () => {
    const tiers = [{ minPax: 1, maxPax: 1, pricePerPax: 750000 }, { minPax: 2, maxPax: 10, pricePerPax: 650000 }];

    it('base only for SELF_DRIVE without addons', () => {
      const total = calculateTotalPrice(tiers, 2, 'SELF_DRIVE');
      expect(total.totalPriceIdr).toBe(1300000);
      expect(total.transfer.totalFeeIdr).toBe(0);
      expect(total.addonsTotalIdr).toBe(0);
    });

    it('adds transfer fee for PRIVATE_TRANSFER', () => {
      const total = calculateTotalPrice(tiers, 2, 'PRIVATE_TRANSFER', { zone: zones.zone2, vehicleClass: classes.suv });
      expect(total.totalPriceIdr).toBe(1300000 + 700000);
    });

    it('multiplies combo addon price by pax', () => {
      const total = calculateTotalPrice(tiers, 2, 'PRIVATE_TRANSFER', {
        zone: zones.zone1,
        vehicleClass: classes.suv,
        selectedAddons: [addons[1]],
      });
      // base 1.3M + zone1 charter 500k (1 vehicle) + rafting 350k × 2 pax
      expect(total.totalPriceIdr).toBe(1300000 + 500000 + 700000);
    });
  });

  describe('filterAddonsForMode (dependent matrix)', () => {
    it('disables requiresTransfer addons on SELF_DRIVE', () => {
      const filtered = filterAddonsForMode(addons, 'SELF_DRIVE');
      expect(filtered[0].isDisabled).toBe(false); // Photographer
      expect(filtered[1].isDisabled).toBe(true);   // Rafting combo
    });

    it('enables everything on PRIVATE_TRANSFER', () => {
      const filtered = filterAddonsForMode(addons, 'PRIVATE_TRANSFER');
      expect(filtered[0].isDisabled).toBe(false);
      expect(filtered[1].isDisabled).toBe(false);
    });
  });

  describe('validateAddonModeCombinations (server-side guard)', () => {
    it('accepts transfer-requiring addons with PRIVATE_TRANSFER', () => {
      const violations = validateAddonModeCombinations(addons, ['combo-001'], 'PRIVATE_TRANSFER');
      expect(violations).toEqual([]);
    });

    it('rejects transfer-requiring addons on SELF_DRIVE', () => {
      const violations = validateAddonModeCombinations(addons, ['combo-001'], 'SELF_DRIVE');
      expect(violations).toEqual(['combo-001']);
    });

    it('allows non-transfer addons on SELF_DRIVE', () => {
      const violations = validateAddonModeCombinations(addons, ['addon-001'], 'SELF_DRIVE');
      expect(violations).toEqual([]);
    });
  });

  describe('cut-off rules (WITA UTC+8)', () => {    // WITA-shifted frame: nowWita = now + 8h. Use activity times already in WITA frame.
    const activity = new Date('2026-09-05T08:00:00.000Z'); // slot 08:00 WITA-frame

    it('SELF_DRIVE bookable ≥2h before', () => {
      const now = new Date('2026-09-05T08:00:00.000Z'); // nowWita = 16:00 D-0? shifted
      // nowWita = 08:00 + 8h = 16:00 on Sep 5 frame; activity 08:00 Sep 5 → hoursUntil = -8 → NOT bookable
      expect(isBookable(activity, 'SELF_DRIVE', now)).toBe(false);
    });

    it('SELF_DRIVE bookable ≥2h before (3h window)', () => {
      // nowWita = activity - 3h → now = activity - 11h
      const now = new Date(activity.getTime() - 11 * 3600000);
      expect(isBookable(activity, 'SELF_DRIVE', now)).toBe(true);
    });

    it('Zone 4 custom quote is never instant-bookable', () => {
      const now = new Date(activity.getTime() - 9 * 3600000);
      expect(isBookable(activity, 'PRIVATE_TRANSFER', now, zones.zone4)).toBe(false);
    });

    it('getNowWita shifts by 8h', () => {
      const now = new Date('2026-09-05T00:00:00.000Z');
      expect(getNowWita(now).toISOString()).toBe('2026-09-05T08:00:00.000Z');
    });
  });
});

describe('Promo, coupon & night surcharge engine', () => {
  const zone: PickupZone = {
    id: 'zone-2', name: 'South 1', areaType: 'ZONE_2', surchargeIdr: 700000, surchargePerPaxIdr: 224000,
    isCustomQuote: false, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const suv: VehicleClass = {
    id: 'vc-suv', name: 'STANDARD_SUV', label: 'Standard SUV', vehicleMaxPax: 4,
    deltaIdr: 0, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const tiers = [{ minPax: 1, maxPax: 10, pricePerPax: 470000 }];
  const coupon: CouponRule = {
    code: 'TRYBALI2026', discountPercent: 40, minPax: 1, isActive: true, usedCount: 0,
  };

  it('renders the list price as the strikethrough anchor when a promo is active', () => {
    const quote = computeQuote({ priceTiers: tiers, paxCount: 1, fulfillmentMode: 'SELF_DRIVE', promoPriceIdr: 376000 });
    expect(quote.listPricePerPaxIdr).toBe(470000);
    expect(quote.unitPricePerPaxIdr).toBe(376000);
    expect(quote.promoActive).toBe(true);
    expect(quote.discountIdr).toBe(94000);
    expect(quote.totalPriceIdr).toBe(376000);
  });

  it('ignores a promo that is not below the list price', () => {
    const quote = computeQuote({ priceTiers: tiers, paxCount: 1, fulfillmentMode: 'SELF_DRIVE', promoPriceIdr: 500000 });
    expect(quote.promoActive).toBe(false);
    expect(quote.totalPriceIdr).toBe(470000);
  });

  it('applies a valid coupon to list-price bookings', () => {
    const quote = computeQuote({ priceTiers: tiers, paxCount: 2, fulfillmentMode: 'SELF_DRIVE', coupon });
    expect(quote.couponCode).toBe('TRYBALI2026');
    expect(quote.discountIdr).toBe(376000); // 40% of 940.000
    expect(quote.totalPriceIdr).toBe(564000);
  });

  it('never stacks a coupon on top of an active promo', () => {
    const quote = computeQuote({
      priceTiers: tiers, paxCount: 1, fulfillmentMode: 'SELF_DRIVE',
      promoPriceIdr: 376000, coupon,
    });
    expect(quote.couponRejection).toBe('COUPON_NOT_APPLICABLE_ON_PROMO');
    expect(quote.couponCode).toBeNull();
    expect(quote.totalPriceIdr).toBe(376000);
  });

  it('rejects inactive, expired, min-pax and exhausted coupons', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(getCouponRejection({ ...coupon, isActive: false }, 1, false, now)).toBe('COUPON_INACTIVE');
    expect(getCouponRejection({ ...coupon, validUntil: '2026-05-01' }, 1, false, now)).toBe('COUPON_EXPIRED');
    expect(getCouponRejection({ ...coupon, validFrom: '2026-07-01' }, 1, false, now)).toBe('COUPON_NOT_STARTED');
    expect(getCouponRejection({ ...coupon, minPax: 4 }, 2, false, now)).toBe('COUPON_MIN_PAX');
    expect(getCouponRejection({ ...coupon, usageLimit: 5, usedCount: 5 }, 1, false, now)).toBe('COUPON_EXHAUSTED');
    expect(getCouponRejection(coupon, 1, false, now)).toBeNull();
  });

  it('adds the night surcharge per guest from 19:00', () => {
    expect(parseSlotHour('07:00 PM')).toBe(19);
    expect(parseSlotHour('06:00 PM')).toBe(18);
    expect(parseSlotHour('19:30')).toBe(19);
    expect(parseSlotHour('06:00 AM')).toBe(6);

    const night = computeQuote({ priceTiers: tiers, paxCount: 2, fulfillmentMode: 'SELF_DRIVE', slotTimeLabel: '07:00 PM' });
    expect(night.nightSurchargeIdr).toBe(NIGHT_SURCHARGE_IDR * 2);

    const day = computeQuote({ priceTiers: tiers, paxCount: 2, fulfillmentMode: 'SELF_DRIVE', slotTimeLabel: '03:00 PM' });
    expect(day.nightSurchargeIdr).toBe(0);
  });

  it('charges shared transfer the per-guest seat fee, not the vehicle charter', () => {
    const fee = calculateSharedTransferFee(3, zone);
    expect(fee.vehicleCount).toBe(1);
    expect(fee.vehicleClassDeltaIdr).toBe(0);
    // seat fee 224.000 × 3 guests — never the 700.000 charter × 3
    expect(fee.totalFeeIdr).toBe(224000 * 3);
  });

  it('keeps private transfer priced per vehicle', () => {
    const quote = computeQuote({ priceTiers: tiers, paxCount: 5, fulfillmentMode: 'PRIVATE_TRANSFER', zone, vehicleClass: suv });
    expect(quote.transfer.vehicleCount).toBe(2);
    expect(quote.transfer.totalFeeIdr).toBe(700000 * 2);
  });

  it('tops up to the package minimum spend after discounts', () => {
    const quote = computeQuote({
      priceTiers: tiers,
      paxCount: 1,
      fulfillmentMode: 'SELF_DRIVE',
      promoPriceIdr: 376000,
      minimumSpendIdr: 1200000,
    });
    expect(quote.minimumTopUpIdr).toBe(824000);
    expect(quote.totalPriceIdr).toBe(1200000);
  });

  it('does not top up when the payable subtotal already meets the minimum', () => {
    const quote = computeQuote({
      priceTiers: tiers,
      paxCount: 3,
      fulfillmentMode: 'SELF_DRIVE',
      minimumSpendIdr: 1200000,
    });
    expect(quote.minimumTopUpIdr).toBe(0);
    expect(quote.totalPriceIdr).toBe(1410000);
  });

  it('keeps the database slot id so the booking API can persist it', () => {    const slots = getAvailableSlots(
      { slotTimes: [{ id: 'clx123', time: '08:00 AM', maxCapacity: 10, currentBookings: 0, isAvailable: true }] },
      2,
    );
    expect(slots[0].id).toBe('clx123');
  });

  it('applies the cut-off at the departure hour, not at midnight', () => {
    // now = 18:00 WITA on 2026-10-31
    const now = new Date('2026-10-31T10:00:00.000Z');

    expect(isSlotBookable('2026-10-31', '08:00 AM', 'SELF_DRIVE', now)).toBe(false);
    expect(isSlotBookable('2026-10-31', '08:00 PM', 'SELF_DRIVE', now)).toBe(true);

    // Transfers for tomorrow are still inside the 22:00 D-1 deadline…
    expect(isSlotBookable('2026-11-01', '08:00 AM', 'SHARED_TRANSFER', now)).toBe(true);
    // …but a transfer for today is already closed.
    expect(isSlotBookable('2026-10-31', '08:00 AM', 'PRIVATE_TRANSFER', now)).toBe(false);
  });

  it('honours an explicit per-slot cut-off over the mode default', () => {
    // now = 22:00 WITA on 2026-10-31 (example: Tubing 09:00 AM with 5h cut-off)
    const now = new Date('2026-10-31T14:00:00.000Z'); // = 22:00 WITA

    // 09:00 AM tomorrow minus 5h = 03:00 WITA tomorrow; at 22:00 WITA today the
    // booking is still open (10h away) — but one hour closer and the 5h rule closes it.
    expect(isSlotBookable('2026-11-01', '08:00 AM', 'SELF_DRIVE', now, 5)).toBe(true);
    // 17:00 slot today (already started) is closed regardless of cut-off
    expect(isSlotBookable('2026-10-31', '05:00 PM', 'SELF_DRIVE', now, 5)).toBe(false);
    // 02:00 AM tomorrow is only 4h away — a 5h cut-off already closes it at 22:00 WITA today
    expect(isSlotBookable('2026-11-01', '02:00 AM', 'SELF_DRIVE', now, 5)).toBe(false);
    // Explicit 0-hour cut-off: always bookable until departure time
    expect(isSlotBookable('2026-10-31', '11:00 PM', 'SELF_DRIVE', now, 0)).toBe(true);
    // null = mode default (SELF_DRIVE 2h)…
    expect(isSlotBookable('2026-10-31', '06:00 AM', 'SELF_DRIVE', now, null)).toBe(false);
    // …and transfers remain H-1 22:00 when nothing is set
    expect(isSlotBookable('2026-10-31', '08:00 AM', 'PRIVATE_TRANSFER', now, null)).toBe(false);
  });
});
