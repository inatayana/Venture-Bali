'use client';

import { useState, useMemo } from 'react';
import { VentureCard, SearchBar, FilterChips } from '@/components/ui';
import { mockVentures } from '@/data/mockVentures';

const CATEGORIES = ['ATV', 'Rafting', 'Tubing', 'Cycling', 'Trekking', 'Water Sports', 'Snorkeling', 'Extreme', 'Combo'];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
] as const;

export default function Home() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recommended');

  const filteredVentures = useMemo(() => {
    let result = [...mockVentures];

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
  }, [search, selectedCategory, sortBy]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider text-blue-600">Venture Bali</h1>
          <p className="text-gray-600 mt-1">
            Discover amazing adventures in Bali
          </p>
        </div>
      </header>

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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="shrink-0 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700"
              aria-label="Sort adventures"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVentures.map((venture) => (
            <VentureCard
              key={venture.id}
              venture={venture}
              onSelect={(id) => console.log('Selected venture:', id)}
            />
          ))}
        </div>

        {filteredVentures.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">
              No adventures found
            </h3>
            <p className="text-gray-500 mb-4">
              Try another filter or search term
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory(null);
                setSortBy('recommended');
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
