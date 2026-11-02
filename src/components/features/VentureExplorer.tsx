'use client';

import { useEffect, useMemo, useState } from 'react';
import { VentureCard } from '@/components/ui';
import { CATEGORY_FILTERS, resolveCategory } from '@/lib/taxonomy';
import { isDateAvailable, isSlotBookable } from '@/lib/pricing';
import { CategoryTiles } from '@/components/features/CategoryTiles';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';
import type { VentureItem } from '@/types/venture';

const CATEGORIES = CATEGORY_FILTERS;

/** First screenful on phones; desktop always shows the full catalogue. */
const MOBILE_INITIAL_CARDS = 6;

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Best Sellers' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
] as const;

export interface VentureExplorerProps {
  ventures: VentureItem[];
}

/**
 * Catalogue browser — search, category filter and sorting.
 * Receives already-loaded ventures so the page itself stays a server component.
 */
export function VentureExplorer({ ventures }: VentureExplorerProps) {
  // Search filters are shared with the hero search via context.
  const {
    query: search,
    date: dateFilter,
    pax: paxFilter,
    setQuery: setSearch,
    setDate: setDateFilter,
    setPax: setPaxFilter,
  } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [expanded, setExpanded] = useState(false);

  // Deep link support: the PDP breadcrumb links to /?category=<slug>. Reading it
  // after hydration keeps the homepage statically rendered. Date, guests and the
  // query are restored by SearchProvider.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('category');
    if (slug) {
      const category = resolveCategory(slug);
      if (category) setSelectedCategory(category.short);
    }
    const sort = params.get('sort');
    if (sort && SORT_OPTIONS.some((option) => option.value === sort)) {
      setSortBy(sort);
    }
  }, []);

  const filteredVentures = useMemo(() => {
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

    if (dateFilter || paxFilter > 1) {
      result = result.filter((venture) => {
        if (paxFilter > venture.maxParticipants) return false;
        if (!dateFilter) return true;

        // At least one package must have a free departure for that date and pax.
        return (venture.variants ?? []).some((variant) => {
          if (!isDateAvailable(variant, dateFilter)) return false;
          const slots = variant.slotTimes ?? [];
          if (slots.length === 0) return true;
          return slots.some(
            (slot) =>
              slot.isAvailable &&
              slot.maxCapacity - slot.currentBookings >= paxFilter &&
              isSlotBookable(dateFilter, slot.time, variant.fulfillmentMode)
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
  }, [ventures, search, selectedCategory, sortBy, dateFilter, paxFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const venture of ventures) {
      const key = resolveCategory(venture.category)?.short ?? venture.category;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [ventures]);

  // A new filter or sort starts a fresh, compact mobile list.
  useEffect(() => {
    setExpanded(false);
  }, [search, selectedCategory, sortBy, dateFilter, paxFilter]);

  const hasMoreOnMobile = filteredVentures.length > MOBILE_INITIAL_CARDS;

  return (
    <section id="results" className="container scroll-mt-24 mx-auto px-4 py-8">
      {/* Filters only: the search itself lives in the hero */}
      <div className="mb-6 space-y-4">
        {(dateFilter || paxFilter > 1) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {dateFilter && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1">
                Date:{' '}
                <strong className="font-semibold text-gray-900">
                  {new Date(`${dateFilter}T00:00:00`).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </strong>
              </span>
            )}
            {paxFilter > 1 && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1">
                <strong className="font-semibold text-gray-900">{paxFilter}</strong> guests
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setDateFilter('');
                setPaxFilter(1);
              }}
              className="min-h-[44px] font-semibold text-gray-600 underline hover:text-gray-900"
            >
              Clear
            </button>
            <span className="text-gray-500">
              · {filteredVentures.length}{' '}
              {filteredVentures.length === 1 ? 'adventure' : 'adventures'}
            </span>
          </div>
        )}

        <CategoryTiles
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          counts={categoryCounts}
          sortOptions={SORT_OPTIONS}
          sortValue={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVentures.map((venture, index) => (
          <VentureCard
            key={venture.id}
            venture={venture}
            href={`/experiences/${venture.id}/${venture.slug}`}
            className={cn(!expanded && index >= MOBILE_INITIAL_CARDS && 'hidden md:block')}
          />
        ))}
      </div>

      {hasMoreOnMobile && !expanded && (
        <div className="mt-6 flex justify-center md:hidden">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex min-h-[44px] items-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
          >
            Load more adventures ({filteredVentures.length - MOBILE_INITIAL_CARDS})
          </button>
        </div>
      )}

      {filteredVentures.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">
            No adventures found
          </h3>
          <p className="text-gray-500 mb-4">Try another filter or search term</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory(null);
              setSortBy('recommended');
            }}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-brand-ink hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
