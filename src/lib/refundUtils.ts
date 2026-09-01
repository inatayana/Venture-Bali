import type { RefundCalculationResult, RefundPolicy } from '@/types/refund';

/**
 * Venture Bali Refund Utilities
 * Implements the refund policy from docs/REFUND_POLICY.md
 * 
 * Policy:
 * - Full refund: ≥72 hours before activity (100%)
 * - Partial refund: 48-72 hours (70%), 24-48 hours (30%)
 * - No refund: <24 hours or no-show (0%)
 * 
 * Time is calculated using Bali Time (WITA, UTC+8)
 */

// Default refund policy based on documentation
export const DEFAULT_REFUND_POLICY: RefundPolicy = {
  fullRefundHours: 72, // 3 days = 3 x 24 hours
  partialRefundHours: [48, 72], // Window: 48-72 hours
  partialRefundPercentages: [70, 30], // 70% first window, 30% second
  noRefundHours: 24,
  processingTimeDays: 3,
};

/**
 * Get current time in Bali (WITA - UTC+8)
 */
export function getBaliTime(): Date {
  const now = new Date();
  // Bali is WITA (UTC+8)
  const offset = now.getTime() + (8 * 60 * 60 * 1000);
  return new Date(offset);
}

/**
 * Calculate hours difference between two dates
 * Uses Bali time as reference
 */
export function getHoursDifference(
  activityTime: Date,
  currentTime: Date = getBaliTime()
): number {
  const diffMs = activityTime.getTime() - currentTime.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Calculate refund amount based on cancellation timing
 * @param activityTime - When the activity starts
 * @param cancellationTime - When the customer cancels
 * @param totalPrice - Original booking price
 * @param policy - Refund policy to apply (uses default if not provided)
 * @returns Refund calculation result
 */
export function calculateRefund(
  activityTime: Date,
  cancellationTime: Date,
  totalPrice: number,
  policy: RefundPolicy = DEFAULT_REFUND_POLICY
): RefundCalculationResult {
  const hoursBefore = getHoursDifference(activityTime, cancellationTime);

  // Full refund window
  if (hoursBefore >= policy.fullRefundHours) {
    return {
      refundAmount: totalPrice,
      refundStatus: 'FULL',
      daysBefore: hoursBefore / 24,
      eligibleForRefund: true,
      policyApplied: `FULL - ${policy.fullRefundHours}h before activity`,
    };
  }

  // Partial refund windows (48-72h = 70%, 24-48h = 30%)
  if (hoursBefore >= policy.partialRefundHours[0] && hoursBefore < policy.partialRefundHours[1]) {
    const refundPercent = policy.partialRefundPercentages[0];
    return {
      refundAmount: Math.round(totalPrice * (refundPercent / 100)),
      refundStatus: 'PARTIAL',
      daysBefore: hoursBefore / 24,
      eligibleForRefund: true,
      policyApplied: `PARTIAL - ${refundPercent}% (${policy.partialRefundHours[0]}h-${policy.partialRefundHours[1]}h before)`,
    };
  }

  if (hoursBefore >= policy.noRefundHours && hoursBefore < policy.partialRefundHours[0]) {
    const refundPercent = policy.partialRefundPercentages[1];
    return {
      refundAmount: Math.round(totalPrice * (refundPercent / 100)),
      refundStatus: 'PARTIAL',
      daysBefore: hoursBefore / 24,
      eligibleForRefund: true,
      policyApplied: `PARTIAL - ${refundPercent}% (${policy.noRefundHours}h-${policy.partialRefundHours[0]}h before)`,
    };
  }

  // No refund window
  return {
    refundAmount: 0,
    refundStatus: 'NONE',
    daysBefore: hoursBefore / 24,
    eligibleForRefund: false,
    policyApplied: `NO REFUND - Less than ${policy.noRefundHours}h before activity`,
  };
}

/**
 * Check if a booking is eligible for any refund
 * @param activityTime - When the activity starts
 * @param cancellationTime - When the customer cancels
 * @returns Whether the cancellation is eligible for refund
 */
export function isEligibleForRefund(
  activityTime: Date,
  cancellationTime: Date
): boolean {
  const hoursBefore = getHoursDifference(activityTime, cancellationTime);
  const policy = DEFAULT_REFUND_POLICY;
  
  return hoursBefore >= policy.noRefundHours;
}

/**
 * Get refund policy text to display to customer
 */
export function getRefundPolicyText(): string {
  const policy = DEFAULT_REFUND_POLICY;
  return `
**Refund Policy:**
• Full refund: Cancel ${policy.fullRefundHours}h (3 days) or more before activity ✅ 100% refund
• Partial refund: Cancel ${policy.partialRefundHours[0]}h-${policy.partialRefundHours[1]}h before ✅ 70% refund
• Partial refund: Cancel ${policy.noRefundHours}h-${policy.partialRefundHours[0]}h before ✅ 30% refund
• No refund: Cancel less than ${policy.noRefundHours}h before activity ❌ 0% refund

Refunds processed within ${policy.processingTimeDays} business days.
`.trim();
}

/**
 * Format refund amount for display (IDR currency)
 */
export function formatRefundAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}