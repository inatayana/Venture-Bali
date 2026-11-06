/**
 * Review publication policy.
 *
 * Owner decision (Nov 2026): every review a guest submits is published
 * immediately. There is no moderation queue and no approval step. The admin
 * panel keeps delete (single and bulk), so a bad row can still be removed
 * after the fact.
 *
 * The function signature is kept so the two submission routes and the tests
 * stay stable if moderation is ever reintroduced.
 */

export interface ReviewModerationInput {
  rating: number;
  comment: string;
  /** True only when the review is attached to a real paid booking. */
  verifiedBooking: boolean;
  photoCount?: number;
}

export interface ReviewModerationDecision {
  autoPublish: boolean;
  reason: 'auto-published';
}

export function assessReviewForPublishing(input: ReviewModerationInput): ReviewModerationDecision {
  // Publication is unconditional; the argument is accepted for API stability.
  void input;
  return { autoPublish: true, reason: 'auto-published' };
}
