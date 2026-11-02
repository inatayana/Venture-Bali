/**
 * Review moderation policy.
 *
 * Verified trips with a 4–5 star rating and a clean comment are published
 * immediately; everything else goes to the admin queue. This keeps the PDP
 * useful without ever inventing a review, while low ratings still get a human
 * read before they go public.
 */

const AUTO_PUBLISH_MIN_RATING = 4;

/** Links, email addresses and long digit strings are not allowed in reviews. */
const CONTACT_PATTERNS: ReadonlyArray<RegExp> = [
  /https?:\/\//i,
  /\bwww\./i,
  /\bwa\.me\b/i,
  /\bt\.me\b/i,
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /\b\d{9,}\b/,
];

/** Severe profanity only; this list should stay short and well understood. */
const PROFANITY_PATTERNS: ReadonlyArray<RegExp> = [
  /\bfuck(?:er|ing)?\b/i,
  /\bshit(?:ty)?\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bcunt\b/i,
  /\bnigg(?:er|a)\b/i,
  /\bfaggot\b/i,
  /\bkontol\b/i,
  /\bmemek\b/i,
  /\bngentot\b/i,
  /\banjing\b/i,
  /\bbangsat\b/i,
];

export interface ReviewModerationInput {
  rating: number;
  comment: string;
  /** True only when the review is attached to a real paid booking. */
  verifiedBooking: boolean;
}

export interface ReviewModerationDecision {
  autoPublish: boolean;
  /** Short machine-readable reason, useful in tests and admin tooling. */
  reason: 'clean-verified-review' | 'not-verified' | 'low-rating' | 'contact-details' | 'profanity' | 'too-short';
}

function hasContactDetails(comment: string): boolean {
  return CONTACT_PATTERNS.some((pattern) => pattern.test(comment));
}

function hasProfanity(comment: string): boolean {
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(comment));
}

export function assessReviewForPublishing(
  input: ReviewModerationInput,
): ReviewModerationDecision {
  const comment = input.comment.trim();

  if (!input.verifiedBooking) {
    return { autoPublish: false, reason: 'not-verified' };
  }
  if (input.rating < AUTO_PUBLISH_MIN_RATING) {
    return { autoPublish: false, reason: 'low-rating' };
  }
  if (comment.length < 20) {
    return { autoPublish: false, reason: 'too-short' };
  }
  if (hasContactDetails(comment)) {
    return { autoPublish: false, reason: 'contact-details' };
  }
  if (hasProfanity(comment)) {
    return { autoPublish: false, reason: 'profanity' };
  }
  return { autoPublish: true, reason: 'clean-verified-review' };
}
