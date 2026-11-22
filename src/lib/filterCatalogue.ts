import type { VentureItem } from '@/types/venture';
import { isDateAvailable, isSlotBookable } from '@/lib/pricing';

/**
 * Single source of catalogue filtering — shared by VentureExplorer and the
 * homepage catalogue so every surface shows identical results for the same
 * inputs. Keep pure; no React, no context.
 */

export type DurationBucket = 'any' | 'short' | 'half' | 'full';

export interface CatalogueFilters {
  search: string;
  date: string;
  pax: number;
  transferIncluded: boolean;
  selfDriveOnly: boolean;
  bestSellerOnly: boolean;
  freeCancellationOnly: boolean;
  instantConfirmationOnly: boolean;
  durationBucket: DurationBucket;
  maxPriceIdr: number | null;
  minRating: number | null;
  selectedCategory: string | null;
  sortBy: string;
}

export const DEFAULT_CATALOGUE_FILTERS: CatalogueFilters = {
  search: '',
  date: '',
  pax: 1,
  transferIncluded: false,
  selfDriveOnly: false,
  bestSellerOnly: false,
  freeCancellationOnly: false,
  instantConfirmationOnly: false,
  durationBucket: 'any',
  maxPriceIdr: null,
  minRating: null,
  selectedCategory: null,
  sortBy: 'recommended',
};

export function filterCatalogue(ventures: VentureItem[], filters: CatalogueFilters): VentureItem[] {
  const {
    search,
    date,
    pax,
    transferIncluded,
    selfDriveOnly,
    bestSellerOnly,
    freeCancellationOnly,
    instantConfirmationOnly,
    durationBucket,
    maxPriceIdr,
    minRating,
    selectedCategory,
    sortBy,
  } = filters;

  let result = [...ventures];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
    );
  }

  if (selectedCategory) {
    result = result.filter(
      (v) =>
        v.category.toLowerCase() === selectedCategory.toLowerCase() ||
        v.title.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }

  if (bestSellerOnly) {
    result = result.filter((venture) => venture.badge === 'Best Seller');
  }

  if (freeCancellationOnly) {
    result = result.filter((venture) => venture.badge === 'Free Cancellation');
  }

  if (instantConfirmationOnly) {
    result = result.filter((venture) => venture.badge === 'Instant Confirmation');
  }

  if (durationBucket === 'short') result = result.filter((v) => v.durationHours <= 2);
  if (durationBucket === 'half') result = result.filter((v) => v.durationHours <= 5);
  if (durationBucket === 'full') result = result.filter((v) => v.durationHours > 5);

  if (maxPriceIdr !== null) {
    result = result.filter((v) => v.priceIdr <= maxPriceIdr);
  }

  if (minRating !== null) {
    result = result.filter((v) => v.rating >= minRating);
  }

  if (transferIncluded) {
    result = result.filter((venture) =>
      (venture.variants ?? []).some((variant) => variant.fulfillmentMode !== 'SELF_DRIVE')
    );
  }

  if (selfDriveOnly) {
    result = result.filter((venture) =>
      (venture.variants ?? []).some((variant) => variant.fulfillmentMode === 'SELF_DRIVE')
    );
  }

  if (date || pax > 1) {
    result = result.filter((venture) => {
      if (pax > venture.maxParticipants) return false;
      if (!date) return true;
      return (venture.variants ?? []).some((variant) => {
        if (!isDateAvailable(variant, date)) return false;
        const slots = variant.slotTimes ?? [];
        if (slots.length === 0) return true;
        return slots.some(
          (slot) =>
            slot.isAvailable &&
            slot.maxCapacity - slot.currentBookings >= pax &&
            isSlotBookable(
              date,
              slot.time,
              variant.fulfillmentMode,
              new Date(),
              slot.cutoffHours
            )
        );
      });
    });
  }

  switch (sortBy) {
    case 'popular':
      result.sort(
        (a, b) =>
          (b.bookedThisMonth ?? 0) - (a.bookedThisMonth ?? 0) || b.rating - a.rating
      );
      break;
    case 'price-low':
      result.sort((a, b) => a.priceIdr - b.priceIdr);
      break;
    case 'price-high':
      result.sort((a, b) => b.priceIdr - a.priceIdr);
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'duration':
      result.sort((a, b) => a.durationHours - b.durationHours);
      break;
  }

  return result;
}
