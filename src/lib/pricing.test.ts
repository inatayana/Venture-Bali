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
    zone1: { id: 'zone-1', name: 'Core Area', areaType: 'ZONE_1', surchargeIdr: 0, isCustomQuote: false, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    zone2: { id: 'zone-2', name: 'South 1', areaType: 'ZONE_2', surchargeIdr: 224000, isCustomQuote: false, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    zone4: { id: 'zone-4', name: 'Outer', areaType: 'ZONE_4', surchargeIdr: 0, isCustomQuote: true, vehicleMaxPax: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
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

    it('calculates zone surcharge × vehicle count', () => {
      // 4 pax, SUV (4 pax/vehicle), Zone 2 (224k/vehicle) → 1 vehicle = 224k
      const fee = calculateTransferFee(4, zones.zone2, classes.suv);
      expect(fee.vehicleCount).toBe(1);
      expect(fee.feePerVehicleIdr).toBe(224000);
      expect(fee.totalFeeIdr).toBe(224000);
    });

    it('adds vehicle class delta on top of zone surcharge', () => {
      // 8 pax, Minivan (12 pax/vehicle, +250k), Zone 2 (224k) → 1 vehicle × 474k
      const fee = calculateTransferFee(8, zones.zone2, classes.van);
      expect(fee.vehicleCount).toBe(1);
      expect(fee.feePerVehicleIdr).toBe(474000);
      expect(fee.totalFeeIdr).toBe(474000);
    });

    it('splits into multiple vehicles when pax exceeds capacity', () => {
      // 9 pax, SUV (4 pax/vehicle) → ceil(9/4) = 3 vehicles
      const fee = calculateTransferFee(9, zones.zone2, classes.suv);
      expect(fee.vehicleCount).toBe(3);
      expect(fee.totalFeeIdr).toBe(672000);
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
      expect(total.totalPriceIdr).toBe(1300000 + 224000);
    });

    it('multiplies combo addon price by pax', () => {
      const total = calculateTotalPrice(tiers, 2, 'PRIVATE_TRANSFER', {
        zone: zones.zone1,
        vehicleClass: classes.suv,
        selectedAddons: [addons[1]],
      });
      // base 1.3M + zone1 0 + rafting 350k × 2 pax
      expect(total.totalPriceIdr).toBe(1300000 + 0 + 700000);
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

  describe('cut-off rules (WITA UTC+8)', () => {
    // WITA-shifted frame: nowWita = now + 8h. Use activity times already in WITA frame.
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
