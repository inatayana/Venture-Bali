'use client';

import { useEffect, useMemo, useState } from 'react';
import { VentureCard, SearchBar } from '@/components/ui';
import { CATEGORY_FILTERS, resolveCategory } from '@/lib/taxonomy';
import { isDateAvailable, isSlotBookable } from '@/lib/pricing';
import { SortMenu } from '@/components/features/SortMenu';
import { CategoryTiles } from '@/components/features/CategoryTiles';
import type { VentureItem } from '@/types/venture';

const CATEGORIES = CATEGORY_FILTERS;

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
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
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [dateFilter, setDateFilter] = useState('');
  const [paxFilter, setPaxFilter] = useState(1);
  const [todayKey, setTodayKey] = useState('');

  // Deep link support: the PDP breadcrumb links to /?category=<slug>. Reading it
  // after hydration keeps the homepage statically rendered.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('category');
    if (slug) {
      const category = resolveCategory(slug);
      if (category) setSelectedCategory(category.short);
    }

    const date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setDateFilter(date);

    const pax = Number(params.get('pax'));
    if (Number.isInteger(pax) && pax > 1 && pax <= 20) setPaxFilter(pax);

    const now = new Date();
    const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    setTodayKey(local);
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

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <SearchBar value={search} onChange={setSearch} />

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-gray-600">
            <span className="mb-1 block">Date</span>
            <input
              type="date"
              value={dateFilter}
              min={todayKey || undefined}
              onChange={(event) => setDateFilter(event.target.value)}
              className="min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-ink"
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">Guests</span>
            <div className="flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-200 bg-white px-1">
              <button
                type="button"
                onClick={() => setPaxFilter((value) => Math.max(1, value - 1))}
                disabled={paxFilter <= 1}
                aria-label="Fewer guests"
                className="h-9 w-9 rounded-md text-lg leading-none text-gray-600 transition-colors hover:bg-gray-100 disabled:text-gray-300"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums text-gray-900">
                {paxFilter}
              </span>
              <button
                type="button"
                onClick={() => setPaxFilter((value) => Math.min(20, value + 1))}
                disabled={paxFilter >= 20}
                aria-label="More guests"
                className="h-9 w-9 rounded-md text-lg leading-none text-gray-600 transition-colors hover:bg-gray-100 disabled:text-gray-300"
              >
                +
              </button>
            </div>
          </div>

          {(dateFilter || paxFilter > 1) && (
            <button
              type="button"
              onClick={() => {
                setDateFilter('');
                setPaxFilter(1);
              }}
              className="min-h-[44px] text-xs font-semibold text-gray-600 underline hover:text-gray-900"
            >
              Clear
            </button>
          )}

          {(dateFilter || paxFilter > 1) && (
            <p className="w-full text-xs text-gray-500">
              {filteredVentures.length}{' '}
              {filteredVentures.length === 1 ? 'adventure' : 'adventures'}
              {dateFilter
                ? ` on ${new Date(`${dateFilter}T00:00:00`).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}`
                : ''}
              {paxFilter > 1 ? ` for ${paxFilter} guests` : ''}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Browse by category
            </h2>
            <SortMenu value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
          </div>
          <CategoryTiles
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            counts={categoryCounts}
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVentures.map((venture) => (
          <VentureCard
            key={venture.id}
            venture={venture}
            href={`/experiences/${venture.id}/${venture.slug}`}
          />
        ))}
      </div>

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
            className="px-4 py-2 text-sm font-medium text-brand-ink hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
