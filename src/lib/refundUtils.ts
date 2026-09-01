import type { RefundCalculationResult, RefundPolicy } from '@/types/refund';

/**
 * Venture Bali Refund Utilities
 * Implements the refund policy from docs/REFUND_POLICY.md
 * 
 * Policy (v2):
 * - ≥24 hours before activity: 20% cancel fee → 80% refund
 * - <24 hours before activity: No cancellation allowed (0%)
 * - No-show (no confirmation ≥1 day): 100% fee (0%)
 * 
 * Time is calculated using Bali Time (WITA, UTC+8)
 */

export const DEFAULT_REFUND_POLICY: RefundPolicy = {
  fullRefundHours: 72,
  partialRefundHours: [48, 72],
  partialRefundPercentages: [70, 30],
  noRefundHours: 24,
  processingTimeDays: 3,
};

export function getBaliTime(): Date {
  const now = new Date();
  const offset = now.getTime() + (8 * 60 * 60 * 1000);
  return new Date(offset);
}

export function getHoursDifference(
  activityTime: Date,
  currentTime: Date = getBaliTime()
): number {
  const diffMs = activityTime.getTime() - currentTime.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Calculate refund amount based on new policy:
 * - ≥24h: cancel fee 20% → refund 80%
 * - <24h: no cancellation → refund 0%
 */
export function calculateRefund(
  activityTime: Date,
  cancellationTime: Date,
  totalPrice: number
): RefundCalculationResult {
  const hoursBefore = getHoursDifference(activityTime, cancellationTime);

  // ≥24 hours: 20% fee, 80% refund
  if (hoursBefore >= 24) {
    return {
      refundAmount: Math.round(totalPrice * 0.8),
      refundStatus: 'PARTIAL',
      daysBefore: hoursBefore / 24,
      eligibleForRefund: true,
      policyApplied: `PARTIAL - 20% cancel fee (${hoursBefore}h ≥ 24h before activity)`,
    };
  }

  // <24 hours: no cancellation
  return {
    refundAmount: 0,
    refundStatus: 'NONE',
    daysBefore: hoursBefore / 24,
    eligibleForRefund: false,
    policyApplied: `NO CANCELLATION - Less than 24h before activity`,
  };
}

export function isEligibleForRefund(
  activityTime: Date,
  cancellationTime: Date
): boolean {
  const hoursBefore = getHoursDifference(activityTime, cancellationTime);
  return hoursBefore >= 24;
}

/**
 * Check if booking is eligible for reschedule (≥1 day before activity)
 */
export function isEligibleForReschedule(
  activityTime: Date,
  currentTime: Date = getBaliTime()
): boolean {
  return getHoursDifference(activityTime, currentTime) >= 24;
}

/**
 * Check if customer is considered no-show
 * (no confirmation ≥1 day before activity)
 */
export function isNoShow(
  activityTime: Date,
  confirmationTime: Date | null,
  currentTime: Date = getBaliTime()
): boolean {
  if (confirmationTime === null) return true;
  const hoursUntilActivity = getHoursDifference(activityTime, currentTime);
  if (hoursUntilActivity < 0) return true;
  const hoursOfConfirmation = getHoursDifference(activityTime, confirmationTime);
  return hoursOfConfirmation < 24;
}

export function getRefundPolicyText(): string {
  return `
**Refund Policy:**
• Cancel ≥24h before activity ✅ Cancel fee 20% → 80% refund
• Cancel <24h before activity ❌ Cannot cancel (0% refund)
• No-show (no confirmation) ❌ 100% fee (0% refund)

Refunds processed within 3 business days.
Reschedule available ≥24h before activity (free).
`.trim();
}

export function formatRefundAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
