import { resolveCategory } from '@/lib/taxonomy';

/**
 * Shareable URL state for the Explore catalogue filters.
 *
 * The catalogue is client-filtered, so the URL is the only durable record of
 * what the visitor is looking at. Keeping parse/serialise pure (no React, no
 * window) means the same rules are unit-tested and reused by the provider on
 * both the homepage and /explore.
 *
 * Param names stay backwards compatible with links that already exist in the
 * wild (`?category=<slug>`, `?sort=`, `?transferIncluded=1`, `?selfDrive=1`)
 * and reuse the search params owned by SearchProvider (`q`, `date`, `pax`).
 */

/** Sort values accepted from the URL, in menu order. */
export const EXPLORE_SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Best Sellers' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
] as const;

export type ExploreSortValue = (typeof EXPLORE_SORT_OPTIONS)[number]['value'];

export const EXPLORE_SORT_VALUES: readonly ExploreSortValue[] = EXPLORE_SORT_OPTIONS.map(
  (option) => option.value
);

export interface ExploreUrlFilterState {
  /** Selected category as its short label (e.g. 'ATV'), or null for all. */
  selectedCategory: string | null;
  /** One of EXPLORE_SORT_VALUES; unknown values fall back to 'recommended'. */
  sortBy: string;
  transferIncluded: boolean;
  selfDriveOnly: boolean;
  bestSellerOnly: boolean;
  freeCancellationOnly: boolean;
  instantConfirmationOnly: boolean;
  /** short | half | full (any = omitted). */
  durationBucket: 'any' | 'short' | 'half' | 'full';
  maxPriceIdr: number | null;
  minRating: number | null;
}

export const DEFAULT_EXPLORE_URL_FILTERS: ExploreUrlFilterState = {
  selectedCategory: null,
  sortBy: 'recommended',
  transferIncluded: false,
  selfDriveOnly: false,
  bestSellerOnly: false,
  freeCancellationOnly: false,
  instantConfirmationOnly: false,
  durationBucket: 'any',
  maxPriceIdr: null,
  minRating: null,
};

const FLAG_PARAMS = {
  transferIncluded: 'transferIncluded',
  selfDriveOnly: 'selfDrive',
  bestSellerOnly: 'bestSeller',
  freeCancellationOnly: 'freeCancellation',
  instantConfirmationOnly: 'instant',
} as const;

const DURATION_BUCKETS = ['short', 'half', 'full'] as const;

function isFlagOn(value: string | null): boolean {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true';
}

function toParams(input: string | URLSearchParams): URLSearchParams {
  return typeof input === 'string' ? new URLSearchParams(input) : new URLSearchParams(input);
}

function setFlag(params: URLSearchParams, name: string, on: boolean): void {
  if (on) params.set(name, '1');
  else params.delete(name);
}

/**
 * Read filter state from a query string. Unknown categories and sort values
 * fall back to the default instead of throwing, so a stale shared link still
 * renders the catalogue.
 */
export function parseExploreFilters(input: string | URLSearchParams): ExploreUrlFilterState {
  const params = toParams(input);
  const category = resolveCategory(params.get('category') ?? '');
  const sortParam = params.get('sort');
  const sortBy =
    EXPLORE_SORT_VALUES.find((value) => value === sortParam) ?? DEFAULT_EXPLORE_URL_FILTERS.sortBy;

  return {
    selectedCategory: category ? category.short : null,
    sortBy,
    transferIncluded: isFlagOn(params.get(FLAG_PARAMS.transferIncluded)),
    selfDriveOnly: isFlagOn(params.get(FLAG_PARAMS.selfDriveOnly)),
    bestSellerOnly: isFlagOn(params.get(FLAG_PARAMS.bestSellerOnly)),
    freeCancellationOnly: isFlagOn(params.get(FLAG_PARAMS.freeCancellationOnly)),
    instantConfirmationOnly: isFlagOn(params.get(FLAG_PARAMS.instantConfirmationOnly)),
    durationBucket:
      DURATION_BUCKETS.find((bucket) => bucket === params.get('duration')) ?? 'any',
    maxPriceIdr: parseNonNegativeInt(params.get('maxPrice')),
    minRating: parseRating(params.get('minRating')),
  };
}

function parseNonNegativeInt(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseRating(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 3 && parsed <= 5 ? parsed : null;
}

/**
 * Write filter state into a copy of the query string, preserving search
 * (`q`), date, guests and any unrelated params. Defaults are deleted so the
 * canonical URL stays short: `/explore?category=atv` instead of six params.
 */
export function applyExploreFilters(
  input: string | URLSearchParams,
  filters: ExploreUrlFilterState
): URLSearchParams {
  const params = toParams(input);

  if (filters.selectedCategory) {
    const category = resolveCategory(filters.selectedCategory);
    if (category) params.set('category', category.slug);
    else params.delete('category');
  } else {
    params.delete('category');
  }

  if (filters.sortBy !== DEFAULT_EXPLORE_URL_FILTERS.sortBy) params.set('sort', filters.sortBy);
  else params.delete('sort');

  setFlag(params, FLAG_PARAMS.transferIncluded, filters.transferIncluded);
  setFlag(params, FLAG_PARAMS.selfDriveOnly, filters.selfDriveOnly);
  setFlag(params, FLAG_PARAMS.bestSellerOnly, filters.bestSellerOnly);
  setFlag(params, FLAG_PARAMS.freeCancellationOnly, filters.freeCancellationOnly);
  setFlag(params, FLAG_PARAMS.instantConfirmationOnly, filters.instantConfirmationOnly);

  if (filters.durationBucket !== 'any') params.set('duration', filters.durationBucket);
  else params.delete('duration');

  if (filters.maxPriceIdr !== null) params.set('maxPrice', String(filters.maxPriceIdr));
  else params.delete('maxPrice');

  if (filters.minRating !== null) params.set('minRating', String(filters.minRating));
  else params.delete('minRating');

  return params;
}

/** True when the two states would serialise identically (used by tests/UI). */
export function sameExploreFilters(
  a: ExploreUrlFilterState,
  b: ExploreUrlFilterState
): boolean {
  return (
    a.selectedCategory === b.selectedCategory &&
    a.sortBy === b.sortBy &&
    a.transferIncluded === b.transferIncluded &&
    a.selfDriveOnly === b.selfDriveOnly &&
    a.bestSellerOnly === b.bestSellerOnly &&
    a.freeCancellationOnly === b.freeCancellationOnly &&
    a.instantConfirmationOnly === b.instantConfirmationOnly &&
    a.durationBucket === b.durationBucket &&
    a.maxPriceIdr === b.maxPriceIdr &&
    a.minRating === b.minRating
  );
}
