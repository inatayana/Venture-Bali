/**
 * Refund Policy Types for Venture Bali
 * Based on REFUND_POLICY.md
 */

export type RefundStatus = 'FULL' | 'PARTIAL' | 'NONE';

export interface RefundPolicy {
  /** Full refund window in hours */
  fullRefundHours: number;
  /** Partial refund window in hours */
  partialRefundHours: number[];
  /** Partial refund percentages */
  partialRefundPercentages: number[];
  /** No refund window in hours */
  noRefundHours: number;
  /** Processing time in business days */
  processingTimeDays: number;
}

export interface RefundCalculationResult {
  refundAmount: number;
  refundStatus: RefundStatus;
  daysBefore: number;
  eligibleForRefund: boolean;
  policyApplied: string;
}

export interface RefundPolicyDetails {
  policy: RefundPolicy;
  description: string;
  appliesTo: string[];
}