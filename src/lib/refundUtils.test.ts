import {
  calculateRefund,
  isEligibleForRefund,
  isEligibleForReschedule,
  isNoShow,
  getRefundPolicyText,
  formatRefundAmount,
} from './refundUtils';

// Mock getBaliTime to use test-controlled time
jest.mock('./refundUtils', () => {
  const actual = jest.requireActual('./refundUtils');
  return {
    ...actual,
    getBaliTime: () => new Date('2026-09-01T06:00:00.000Z'),
  };
});

describe('Refund Utilities (v2 — 20% cancel fee)', () => {
  const totalPrice = 1000000;

  describe('calculateRefund', () => {
    it('should apply 20% cancel fee for cancellations ≥24h before activity', () => {
      const activityTime = new Date('2026-09-03T08:00:00.000Z');
      const cancellationTime = new Date('2026-09-01T06:00:00.000Z');

      const result = calculateRefund(activityTime, cancellationTime, totalPrice);

      expect(result.refundAmount).toBe(800000);
      expect(result.refundStatus).toBe('PARTIAL');
      expect(result.eligibleForRefund).toBe(true);
    });

    it('should allow 20% fee for exactly 24h before activity', () => {
      const activityTime = new Date('2026-09-02T06:00:00.000Z');
      const cancellationTime = new Date('2026-09-01T06:00:00.000Z');

      const result = calculateRefund(activityTime, cancellationTime, totalPrice);

      expect(result.refundAmount).toBe(800000);
      expect(result.refundStatus).toBe('PARTIAL');
      expect(result.eligibleForRefund).toBe(true);
    });

    it('should deny cancellation for <24h before activity', () => {
      const activityTime = new Date('2026-09-02T00:00:00.000Z');
      const cancellationTime = new Date('2026-09-01T06:00:00.000Z');

      const result = calculateRefund(activityTime, cancellationTime, totalPrice);

      expect(result.refundAmount).toBe(0);
      expect(result.refundStatus).toBe('NONE');
      expect(result.eligibleForRefund).toBe(false);
    });

    it('should deny cancellation for 1 hour before activity', () => {
      const activityTime = new Date('2026-09-01T07:00:00.000Z');
      const cancellationTime = new Date('2026-09-01T06:00:00.000Z');

      const result = calculateRefund(activityTime, cancellationTime, totalPrice);

      expect(result.refundAmount).toBe(0);
      expect(result.refundStatus).toBe('NONE');
      expect(result.eligibleForRefund).toBe(false);
    });

    it('should deny cancellation for 0 hours before activity', () => {
      const activityTime = new Date('2026-09-01T06:00:00.000Z');
      const cancellationTime = new Date('2026-09-01T06:00:00.000Z');

      const result = calculateRefund(activityTime, cancellationTime, totalPrice);

      expect(result.refundAmount).toBe(0);
      expect(result.refundStatus).toBe('NONE');
      expect(result.eligibleForRefund).toBe(false);
    });
  });

  describe('isEligibleForRefund', () => {
    it('should return true for ≥24h before', () => {
      const activity = new Date('2026-09-02T08:00:00.000Z');
      const now = new Date('2026-09-01T06:00:00.000Z');

      expect(isEligibleForRefund(activity, now)).toBe(true);
    });

    it('should return false for <24h before', () => {
      const activity = new Date('2026-09-01T18:00:00.000Z');
      const now = new Date('2026-09-01T06:00:00.000Z');

      expect(isEligibleForRefund(activity, now)).toBe(false);
    });
  });

  describe('isEligibleForReschedule', () => {
    it('should return true for ≥24h before', () => {
      const activity = new Date('2026-09-02T08:00:00.000Z');
      const now = new Date('2026-09-01T06:00:00.000Z');

      expect(isEligibleForReschedule(activity, now)).toBe(true);
    });

    it('should return false for <24h before', () => {
      const activity = new Date('2026-09-01T18:00:00.000Z');
      const now = new Date('2026-09-01T06:00:00.000Z');

      expect(isEligibleForReschedule(activity, now)).toBe(false);
    });
  });

  describe('isNoShow', () => {
    it('should return true if no confirmation', () => {
      const activity = new Date('2026-09-02T08:00:00.000Z');

      expect(isNoShow(activity, null)).toBe(true);
    });

    it('should return true if confirmation <24h before', () => {
      const activity = new Date('2026-09-02T08:00:00.000Z');
      const confirmation = new Date('2026-09-01T18:00:00.000Z');

      expect(isNoShow(activity, confirmation)).toBe(true);
    });

    it('should return false if confirmation ≥24h before', () => {
      const activity = new Date('2026-09-02T08:00:00.000Z');
      const confirmation = new Date('2026-09-01T06:00:00.000Z');

      expect(isNoShow(activity, confirmation)).toBe(false);
    });
  });

  describe('getRefundPolicyText', () => {
    it('should contain key policy elements', () => {
      const text = getRefundPolicyText();

      expect(text).toContain('Cancel fee 20%');
      expect(text).toContain('80% refund');
      expect(text).toContain('Cannot cancel');
      expect(text).toContain('No-show');
      expect(text).toContain('3 business days');
    });
  });

  describe('formatRefundAmount', () => {
    it('should format IDR currency', () => {
      const formatted = formatRefundAmount(1000000);

      expect(formatted).toContain('Rp');
      expect(formatted).toContain('1.000.000');
    });
  });
});
