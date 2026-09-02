import {
  getPriceTierForPax,
  calculatePriceBreakdown,
  getAllTiersWithPricing,
  isDateAvailable,
  getAvailableSlots,
} from './pricing';

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