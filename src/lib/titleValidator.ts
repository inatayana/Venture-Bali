/**
 * Venture Bali — Product Title Validator
 * ---------------------------------------
 * Enforces the Product Title Constitution V1.
 *
 * ⚠️  GUARDRAIL (AGENTS.md §9): every product title MUST pass this validator.
 *     Intended usage: admin panel save flow, seed script, catalog ingestion.
 *
 * Docs: docs/PRODUCT_TITLE_CONSTITUTION.md
 */

export const TITLE_MIN_LENGTH = 45;
export const TITLE_MAX_LENGTH = 60;
export const FIRST_KEYWORD_WINDOW = 25;

/**
 * Forbidden words — rule 8 of the constitution.
 * Matching is case-insensitive and word-boundary aware.
 */
export const FORBIDDEN_TITLE_WORDS: readonly string[] = [
  'best',
  'no.1',
  'no1',
  'number one',
  'top',
  'cheapest',
  'cheap',
  'discount',
  'discounted',
  'free',
  'gratis',
  'venture bali',
  'baligo',
];

/**
 * Benefit phrases — rule 7: a title may carry at most ONE benefit.
 * Source: docs/PRODUCT_TITLE_CONSTITUTION.md §2 rule 7.
 */
export const BENEFIT_PHRASES: readonly string[] = [
  'private transfer',
  'hotel pickup',
  'hotel pick-up',
  'pickup included',
  'pick-up included',
  'pickup available',
  'pick-up available',
  'lunch included',
  'lunch upgrade',
  'with lunch',
  'with breakfast',
  'breakfast included',
  'small group',
  'free cancellation',
];

/**
 * Minor words that stay lowercase in Title Case unless they are the first or
 * last word of the title.
 */
const MINOR_WORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'nor',
  'for',
  'yet',
  'so',
  'at',
  'by',
  'in',
  'of',
  'on',
  'per',
  'to',
  'up',
  'via',
  'from',
  'into',
  'over',
  'with',
  'through',
  'between',
  'across',
  'against',
  'about',
  'after',
  'before',
  'under',
  'near',
  'toward',
  'towards',
]);

/**
 * Characters allowed as separators — rule 6: at most ONE symbol, and only
 * a colon or a dash (en dash or hyphen).
 */
const ALLOWED_SEPARATOR_PATTERN = /[:–-]/g;

export interface TitleValidationInput {
  title: string;
  /** Primary keyword that must appear within the first 25 characters. */
  primaryKeyword?: string;
  /** Destination that must be mentioned explicitly in the title. */
  destination?: string;
}

export interface TitleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** Measured title length. */
  length: number;
}

function isMinorWord(word: string): boolean {
  return MINOR_WORDS.has(word.toLowerCase());
}

function isTitleCased(title: string): boolean {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const isFirst = index === 0;
    const isLast = index === words.length - 1;

    if (isMinorWord(word) && !isFirst && !isLast) {
      // Minor word must be fully lowercase.
      if (word !== word.toLowerCase()) return false;
      continue;
    }

    // Every other word must start with an uppercase letter.
    // Allow tokens that begin with a digit (e.g. "4WD") or an acronym.
    const firstChar = word.charAt(0);
    if (!/[A-Z]/.test(firstChar) && !/[0-9]/.test(firstChar)) return false;
  }

  return true;
}

function findForbiddenWords(title: string): string[] {
  const lower = title.toLowerCase();
  return FORBIDDEN_TITLE_WORDS.filter((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(lower);
  });
}

function countBenefits(title: string): number {
  const lower = title.toLowerCase();
  return BENEFIT_PHRASES.filter((phrase) => lower.includes(phrase)).length;
}

function countSeparators(title: string): number {
  return (title.match(ALLOWED_SEPARATOR_PATTERN) ?? []).length;
}

function hasEmoji(title: string): boolean {
  // Emoji / pictograph ranges. Also catches the variation selector and
  // regional-indicator pairs (flag emojis).
  return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u.test(
    title
  );
}

/**
 * Validate a product title against the Product Title Constitution V1.
 *
 * Rules enforced:
 *  1. Length 45–60 characters
 *  2. Primary keyword inside the first 25 characters
 *  3. Destination mentioned explicitly
 *  4. Title Case
 *  5. At most one separator symbol, and only `:` or `-`
 *  6. At most one benefit phrase
 *  7. No forbidden words, no emoji, no brand name
 */
export function validateVentureTitle(input: TitleValidationInput): TitleValidationResult {
  const { title, primaryKeyword, destination } = input;
  const errors: string[] = [];
  const warnings: string[] = [];

  const trimmed = title.trim();
  const length = trimmed.length;

  // Rule 1 — length
  if (length < TITLE_MIN_LENGTH) {
    errors.push(
      `Title is too short: ${length} characters (minimum ${TITLE_MIN_LENGTH}).`
    );
  }
  if (length > TITLE_MAX_LENGTH) {
    errors.push(
      `Title is too long: ${length} characters (maximum ${TITLE_MAX_LENGTH}).`
    );
  }

  // Rule 2 — primary keyword in the first 25 characters
  if (primaryKeyword && primaryKeyword.trim() !== '') {
    const keyword = primaryKeyword.trim().toLowerCase();
    const window = trimmed.slice(0, FIRST_KEYWORD_WINDOW).toLowerCase();
    if (!window.includes(keyword)) {
      errors.push(
        `Primary keyword "${primaryKeyword}" must appear within the first ${FIRST_KEYWORD_WINDOW} characters.`
      );
    }
  }

  // Rule 3 — destination must be mentioned
  if (destination && destination.trim() !== '') {
    if (!trimmed.toLowerCase().includes(destination.trim().toLowerCase())) {
      errors.push(`Destination "${destination}" must be mentioned explicitly in the title.`);
    }
  }

  // Rule 4 — Title Case
  if (!isTitleCased(trimmed)) {
    errors.push('Title must be written in Title Case.');
  }

  // Rule 5 — separators
  const separatorCount = countSeparators(trimmed);
  if (separatorCount > 1) {
    errors.push(
      `Title contains ${separatorCount} separator symbols; at most 1 is allowed (":" or "-").`
    );
  }

  // Rule 6 — benefits
  const benefitCount = countBenefits(trimmed);
  if (benefitCount > 1) {
    errors.push(`Title contains ${benefitCount} benefit phrases; at most 1 is allowed.`);
  }

  // Rule 7 — forbidden words
  const forbidden = findForbiddenWords(trimmed);
  if (forbidden.length > 0) {
    errors.push(`Title contains forbidden word(s): ${forbidden.join(', ')}.`);
  }

  // Rule 8 — emoji
  if (hasEmoji(trimmed)) {
    errors.push('Title must not contain emoji.');
  }

  // Soft checks
  if (length > 0 && length < TITLE_MIN_LENGTH) {
    warnings.push('Short titles perform poorly on mobile SERP and OTA cards.');
  }
  if (/\s{2,}/.test(trimmed)) {
    warnings.push('Title contains consecutive spaces.');
  }
  if (trimmed !== title) {
    warnings.push('Title has leading/trailing whitespace that will be trimmed.');
  }

  return { valid: errors.length === 0, errors, warnings, length };
}

/**
 * Convenience wrapper — returns true when the title passes every rule.
 */
export function isVentureTitleValid(input: TitleValidationInput): boolean {
  return validateVentureTitle(input).valid;
}

/**
 * Validate a slug against constitution §5.
 * Lowercase, hyphen only, no underscore, no brand name, no leading/trailing hyphen.
 */
export function isVentureSlugValid(slug: string): boolean {
  if (slug.trim() === '') return false;
  if (slug !== slug.toLowerCase()) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  if (slug.includes('venture-bali')) return false;
  return true;
}
