import type { VentureItem } from '@/types/venture';
import { isDateAvailable, isSlotBookable } from '@/lib/pricing';

/**
 * Single source of catalogue filtering — shared by VentureExplorer and the
 * homepage catalogue so every surface shows identical results for the same
 * inputs. Keep pure; no React, no context.
 */

export interface CatalogueFilters {
  search: string;
  date: string;
  pax: number;
  transferIncluded: boolean;
  selfDriveOnly: boolean;
  bestSellerOnly: boolean;
  selectedCategory: string | null;
  sortBy: string;
  location: string | null;
}

export const DEFAULT_CATALOGUE_FILTERS: CatalogueFilters = {
  search: '',
  date: '',
  pax: 1,
  transferIncluded: false,
  selfDriveOnly: false,
  bestSellerOnly: false,
  selectedCategory: null,
  sortBy: 'recommended',
  location: null,
};

export function filterCatalogue(ventures: VentureItem[], filters: CatalogueFilters): VentureItem[] {
  const {
    search,
    date,
    pax,
    transferIncluded,
    selfDriveOnly,
    bestSellerOnly,
    selectedCategory,
    sortBy,
    location,
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

  if (location) {
    const loc = location.trim().toLowerCase();
    result = result.filter((v) => v.location.toLowerCase().includes(loc));
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
