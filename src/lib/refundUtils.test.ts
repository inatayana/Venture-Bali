import { calculateRefund, getHoursDifference, isEligibleForRefund, getRefundPolicyText } from '@/lib/refundUtils';
import type { RefundCalculationResult } from '@/types/refund';

describe('Refund Utilities', () => {
  const FIXED_BALI_TIME = new Date('2026-08-31T10:00:00Z'); // 2026-08-31 18:00 WITA
  
  // Mock getBaliTime for consistent tests
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => FIXED_BALI_TIME.getTime());
  });
  
  afterEach(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  describe('getHoursDifference', () => {
    it('should calculate hours correctly', () => {
      const activityTime = new Date('2026-09-01T10:00:00Z'); // Next day, 18:00 WITA
      const hours = getHoursDifference(activityTime, FIXED_BALI_TIME);
      expect(hours).toBe(24);
    });
  });

  describe('isEligibleForRefund', () => {
    it('should return true for cancellation >24h before', () => {
      const activityTime = new Date('2026-09-02T10:00:00Z'); // 2 days later
      expect(isEligibleForRefund(activityTime, FIXED_BALI_TIME)).toBe(true);
    });

    it('should return false for cancellation <24h before', () => {
      const activityTime = new Date('2026-08-31T11:00:00Z'); // 1 hour later
      expect(isEligibleForRefund(activityTime, FIXED_BALI_TIME)).toBe(false);
    });

    it('should return false for past activity', () => {
      const activityTime = new Date('2026-08-30T10:00:00Z'); // Yesterday
      expect(isEligibleForRefund(activityTime, FIXED_BALI_TIME)).toBe(false);
    });
  });

  describe('calculateRefund', () => {
    // Test cases: [activity_time, cancellation_time, expected_hours_before, expected_refund_percent]
    const testCases: [string, string, number, number][] = [
      // Full refund cases (>=72h)
      ['2026-09-03T10:00:00Z', '2026-08-31T10:00:00Z', 72, 100],
      ['2026-09-04T10:00:00Z', '2026-08-31T10:00:00Z', 96, 100],
      
      // Partial refund 70% cases (48-72h)
      ['2026-09-03T10:00:00Z', '2026-09-01T10:00:00Z', 48, 70],
      ['2026-09-03T10:00:00Z', '2026-09-01T04:00:00Z', 54, 70],
      
      // Partial refund 30% cases (24-48h)
      ['2026-09-02T10:00:00Z', '2026-09-01T10:00:00Z', 24, 30],
      ['2026-09-02T10:00:00Z', '2026-08-31T10:00:00Z', 48, 70], // Actually 70% range
      
      // No refund cases (<24h)
      ['2026-09-01T10:00:00Z', '2026-08-31T13:00:00Z', 21, 0],
      ['2026-09-01T10:00:00Z', '2026-08-31T23:00:00Z', 11, 0],
      ['2026-09-01T10:00:00Z', '2026-09-01T09:00:00Z', 1, 0],
      
      // Edge cases
      ['2026-09-01T10:00:00Z', '2026-08-31T10:00:00Z', 24, 30], // Exactly 24h
      ['2026-09-03T10:00:00Z', '2026-08-31T10:00:00Z', 72, 100], // Exactly 72h
    ];

    testCases.forEach(([activityStr, cancelStr, expectedHours, expectedPercent]) => {
      it(`should calculate ${expectedPercent}% refund for ${expectedHours}h before`, () => {
        const activityTime = new Date(activityStr);
        const cancellationTime = new Date(cancelStr);
        const totalPrice = 1000000; // 1,000,000 IDR
        
        const result: RefundCalculationResult = calculateRefund(
          activityTime,
          cancellationTime,
          totalPrice
        );
        
        const expectedAmount = Math.round(totalPrice * (expectedPercent / 100));
        
        expect(result.refundAmount).toBe(expectedAmount);
        expect(result.refundStatus).toBe(
          expectedPercent === 100 ? 'FULL' :
          expectedPercent > 0 ? 'PARTIAL' : 'NONE'
        );
        expect(result.daysBefore).toBeCloseTo(expectedHours / 24, 1);
        expect(result.eligibleForRefund).toBe(expectedPercent > 0);
      });
    });
  });

  describe('getRefundPolicyText', () => {
    it('should return formatted policy text', () => {
      const text = getRefundPolicyText();
      expect(text).toContain('Full refund: Cancel 72h (3 days)');
      expect(text).toContain('Partial refund: Cancel 48h-72h');
      expect(text).toContain('Partial refund: Cancel 24h-48h');
      expect(text).toContain('No refund: Cancel less than 24h');
      expect(text).toContain('Refunds processed within 3 business days');
    });
  });
});