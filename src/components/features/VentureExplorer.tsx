'use client';

import { useEffect, useMemo, useState } from 'react';
import { VentureCard, SearchBar, FilterChips } from '@/components/ui';
import { CATEGORY_FILTERS, resolveCategory } from '@/lib/taxonomy';
import { SortMenu } from '@/components/features/SortMenu';
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

  // Deep link support: the PDP breadcrumb links to /?category=<slug>. Reading it
  // after hydration keeps the homepage statically rendered.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('category');
    if (!slug) return;
    const category = resolveCategory(slug);
    if (category) setSelectedCategory(category.short);
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
  }, [ventures, search, selectedCategory, sortBy]);

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <SearchBar value={search} onChange={setSearch} />

        <div className="flex items-center justify-between gap-4">
          <FilterChips
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <SortMenu value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
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
