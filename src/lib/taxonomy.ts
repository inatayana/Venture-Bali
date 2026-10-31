/**
 * Venture Bali — Taxonomy
 * ------------------------
 * Single source of truth for the 9 adventure mega categories.
 *
 * ⚠️  GUARDRAIL (AGENTS.md §9): Venture Bali ONLY sells these 9 adventure
 *     categories. Hotels, flights, pure transport (rent car / scooter) and
 *     restaurants are OUT OF SCOPE and must never appear as a category.
 *
 * Docs: docs/SEO_TAXONOMY.md, docs/PRODUCT_TITLE_CONSTITUTION.md
 */

export const MEGA_CATEGORIES = [
  'ATV & Off-Road',
  'Rafting',
  'River Tubing',
  'Cycling',
  'Trekking & Hiking',
  'Water Sports',
  'Snorkeling & Diving',
  'Extreme Adventures',
  'Adventure Combo Packages',
] as const;

export type MegaCategory = (typeof MEGA_CATEGORIES)[number];

/**
 * Short labels used in the UI (filter chips, badges, breadcrumbs).
 * Index-aligned with MEGA_CATEGORIES.
 */
export const MEGA_CATEGORY_SHORT_LABELS = [
  'ATV',
  'Rafting',
  'Tubing',
  'Cycling',
  'Trekking',
  'Water Sports',
  'Snorkeling',
  'Extreme',
  'Combo',
] as const;

export type MegaCategoryShortLabel = (typeof MEGA_CATEGORY_SHORT_LABELS)[number];

/**
 * Lowercase slug per category — used for URLs, filters and analytics.
 */
export const MEGA_CATEGORY_SLUGS = [
  'atv',
  'rafting',
  'tubing',
  'cycling',
  'trekking',
  'water-sports',
  'snorkeling',
  'extreme',
  'combo',
] as const;

export type MegaCategorySlug = (typeof MEGA_CATEGORY_SLUGS)[number];

interface CategoryDescriptor {
  /** Canonical name, as written in docs/SEO_TAXONOMY.md */
  readonly canonical: MegaCategory;
  /** Short UI label */
  readonly short: MegaCategoryShortLabel;
  /** Short emoji used by the category quick menu (breadcrumb dropdown). */
  readonly emoji: string;
  /** URL / filter slug */
  readonly slug: MegaCategorySlug;
  /** Extra search terms that map to this category */
  readonly aliases: readonly string[];
}

export const CATEGORY_REGISTRY: readonly CategoryDescriptor[] = [
  {
    canonical: 'ATV & Off-Road',
    short: 'ATV',
    emoji: '🏍️',
    slug: 'atv',
    aliases: ['atv', 'quad bike', 'buggy', 'off-road', 'offroad', 'utv'],
  },
  {
    canonical: 'Rafting',
    short: 'Rafting',
    emoji: '🛶',
    slug: 'rafting',
    aliases: ['rafting', 'white water', 'whitewater', 'river rafting'],
  },
  {
    canonical: 'River Tubing',
    short: 'Tubing',
    emoji: '🛝',
    slug: 'tubing',
    aliases: ['tubing', 'water tubing', 'river tubing', 'cave tubing'],
  },
  {
    canonical: 'Cycling',
    short: 'Cycling',
    emoji: '🚴',
    slug: 'cycling',
    aliases: ['cycling', 'bike', 'biking', 'downhill cycling', 'mountain bike'],
  },
  {
    canonical: 'Trekking & Hiking',
    short: 'Trekking',
    emoji: '🥾',
    slug: 'trekking',
    aliases: ['trekking', 'hiking', 'trek', 'sunrise trek', 'volcano hike'],
  },
  {
    canonical: 'Water Sports',
    short: 'Water Sports',
    emoji: '🏄',
    slug: 'water-sports',
    aliases: ['water sports', 'watersports', 'jet ski', 'jetski', 'banana boat', 'parasailing'],
  },
  {
    canonical: 'Snorkeling & Diving',
    short: 'Snorkeling',
    emoji: '🤿',
    slug: 'snorkeling',
    aliases: ['snorkeling', 'snorkel', 'diving', 'scuba', 'freediving', 'manta'],
  },
  {
    canonical: 'Extreme Adventures',
    short: 'Extreme',
    emoji: '⚡',
    slug: 'extreme',
    aliases: ['extreme', 'canyoning', 'zipline', 'paragliding', 'cliff jumping'],
  },
  {
    canonical: 'Adventure Combo Packages',
    short: 'Combo',
    emoji: '🎯',
    slug: 'combo',
    aliases: ['combo', 'package', 'combo package', 'multi activity', 'full day'],
  },
] as const;

/** Flat list of short labels — used by the homepage filter chips. */
export const CATEGORY_FILTERS: readonly MegaCategoryShortLabel[] =
  MEGA_CATEGORY_SHORT_LABELS;

/** Every accepted category token (canonical names, short labels, slugs, aliases) — lowercased. */
export const ALL_CATEGORY_TOKENS: readonly string[] = CATEGORY_REGISTRY.flatMap((c) =>
  [c.canonical, c.short, c.slug, ...c.aliases].map((token) => token.toLowerCase())
);

/**
 * Categories that are explicitly OUT OF SCOPE (AGENTS.md §9).
 * Kept as a blocklist so ingestion/validation can reject them loudly.
 */
export const FORBIDDEN_CATEGORY_TOKENS: readonly string[] = [
  'hotel',
  'hotels',
  'accommodation',
  'villa',
  'resort',
  'hostel',
  'flight',
  'flights',
  'airplane',
  'airport transfer',
  'car rental',
  'rent car',
  'rent car only',
  'scooter rental',
  'motorbike rental',
  'restaurant',
  'restaurants',
  'dining',
  'spa',
  'massage',
  'tour guide only',
];

/**
 * Emoji icon per short category label — used by the filter chips and badges.
 * ⚠️  Icons are UI-only. They must NEVER appear in product titles
 *     (see src/lib/titleValidator.ts, rule 8).
 */
export const CATEGORY_ICONS: Readonly<Record<string, string>> = {
  ATV: '🏍️',
  Rafting: '🛶',
  Tubing: '🛝',
  Cycling: '🚴',
  Trekking: '🥾',
  'Water Sports': '🏄',
  Snorkeling: '🤿',
  Extreme: '⚡',
  Combo: '🎯',
};

/**
 * Check whether a category string maps to one of the 9 allowed mega categories.
 * Matching is case-insensitive and tolerates surrounding whitespace.
 */
export function isAllowedCategory(category: string): boolean {
  const normalized = category.trim().toLowerCase();
  if (normalized === '') return false;
  return ALL_CATEGORY_TOKENS.includes(normalized);
}

/**
 * Resolve any accepted category token to its canonical descriptor.
 * Returns null when the category is not allowed.
 */
export function resolveCategory(category: string): CategoryDescriptor | null {
  const normalized = category.trim().toLowerCase();
  return (
    CATEGORY_REGISTRY.find(
      (c) =>
        c.canonical.toLowerCase() === normalized ||
        c.short.toLowerCase() === normalized ||
        c.slug.toLowerCase() === normalized ||
        c.aliases.includes(normalized)
    ) ?? null
  );
}

/**
 * Detect categories that violate the product guardrail.
 * Used by the admin/ingestion validation layer.
 */
export function findForbiddenCategories(category: string): string[] {
  const normalized = category.trim().toLowerCase();
  return FORBIDDEN_CATEGORY_TOKENS.filter(
    (token) => normalized === token || normalized.includes(token)
  );
}
