'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, SearchX } from 'lucide-react';
import { useSearch } from '@/components/search/SearchProvider';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';
import { SortMenu } from '@/components/features/SortMenu';
import { ExploreFilterPills, FiltersTriggerButton, countActiveFilters } from '@/components/features/ExploreFilterPills';
import { CatalogueFilterSheet } from '@/components/features/CatalogueFilterSheet';
import { VentureCard } from '@/components/ui';
import { filterCatalogue } from '@/lib/filterCatalogue';
import type { VentureItem } from '@/types/venture';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Best Sellers' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
] as const;

/**
 * Homepage catalogue: the /explore chrome (capsule + filter slider + pills)
 * with the same live filtering, guarantee strip and All Bali Adventures grid.
 * Reads catalogue search (SearchProvider) and curated filters
 * (ExploreFiltersProvider); publishes its live result count back so the
 * control bar can show it.
 */
export function HomeCatalogue({
  ventures,
}: {
  ventures: VentureItem[];
}) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { query, date, pax, setQuery, setDate, setPax } = useSearch();
  const {
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
    setSortBy,
    setResultCount,
    setSelectedCategory,
    setTransferIncluded,
    setSelfDriveOnly,
    setBestSellerOnly,
  } = useExploreFilters();

  const filtered = useMemo(
    () =>
      filterCatalogue(ventures, {
        search: query,
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
      }),
    [
      ventures,
      query,
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
    ]
  );

  useEffect(() => {
    setResultCount(filtered.length);
  }, [filtered.length, setResultCount]);

  const hasActiveFilters =
    query !== '' ||
    date !== '' ||
    pax > 1 ||
    transferIncluded ||
    selfDriveOnly ||
    bestSellerOnly ||
    freeCancellationOnly ||
    instantConfirmationOnly ||
    durationBucket !== 'any' ||
    maxPriceIdr !== null ||
    minRating !== null ||
    selectedCategory !== null ||
    sortBy !== 'recommended';

  const activeAdvancedFilters = countActiveFilters({
    transferIncluded,
    selfDriveOnly,
    bestSeller: bestSellerOnly,
    freeCancellationOnly,
    instantConfirmationOnly,
    durationBucket,
    maxPriceIdr,
    minRating,
    selectedCategory,
  });

  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '';

  return (
    // Anchor target for the hero CTA and SearchProvider.submit(). Keep in sync
    // with VentureExplorer's `id="results"` on /explore and /experiences.
    <section
      id="results"
      className="px-6 lg:px-10 pb-16 pt-5 md:pb-20 md:pt-7"
    >
      <div className="mx-auto max-w-[1440px] space-y-5 md:space-y-7">
        {(date || pax > 1) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {date && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1">
                Date:{' '}
                <strong className="font-semibold text-gray-900">{dateLabel}</strong>
              </span>
            )}
            {pax > 1 && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1">
                <strong className="font-semibold text-gray-900">{pax}</strong> guests
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setDate('');
                setPax(1);
              }}
              className="min-h-[44px] font-semibold text-gray-600 underline hover:text-gray-900"
            >
              Clear
            </button>
            <span className="text-gray-500">· {filtered.length} adventures</span>
          </div>
        )}

        {/* Guarantee strip */}
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-brand-ink px-6 py-4 text-center text-white dark:bg-neutral-900">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-sm font-semibold sm:text-base">
            100% Locally Owned &amp; Operated in Bali
            <span className="text-white/60">
              {' '}— Empowering Local Guides · Safety-Checked Equipment · 24/7 Personal Concierge
            </span>
            {' '}
            <Link
              href="/about"
              className="text-brand-ink/95 font-semibold underline underline-offset-2 transition-colors hover:text-brand-ink"
            >
              Learn about our local impact →
            </Link>
          </p>
        </div>

        {/* Section title + filter / sort / view all */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
              Explore All Guided Adventures
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Guided local trips · Safety-checked gear · Transparent pricing
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <FiltersTriggerButton
              activeCount={activeAdvancedFilters}
              open={filterModalOpen}
              onClick={() => setFilterModalOpen(true)}
            />
            <SortMenu value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
            <Link
              href="/explore"
              className="ml-auto inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 sm:ml-0 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
            >
              View all
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Desktop-only quick pills — directly below the section heading.
            The Filters modal entry lives in the heading row, so it is omitted here. */}
        <div className="hidden items-center gap-2 md:flex">
          <ExploreFilterPills
            className="min-w-0 flex-1"
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            transferIncluded={transferIncluded}
            onTransferIncludedChange={setTransferIncluded}
            selfDriveOnly={selfDriveOnly}
            onSelfDriveChange={setSelfDriveOnly}
            filtersOpen={filterModalOpen}
            onFiltersToggle={() => setFilterModalOpen(true)}
            bestSeller={bestSellerOnly}
            showFiltersTrigger={false}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setDate('');
              setPax(1);
              setTransferIncluded(false);
              setSelfDriveOnly(false);
              setBestSellerOnly(false);
              setSelectedCategory(null);
              setSortBy('recommended');
            }}
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-ink underline underline-offset-2 dark:text-brand"
          >
            Clear all filters
          </button>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <SearchX className="mx-auto mb-4 h-10 w-10 text-neutral-300" aria-hidden="true" />
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">No adventures found</h3>
            <p className="text-gray-500">Try clearing a filter or search term.</p>
          </div>
        ) : (
          <>
            {/* Desktop: vertical 5-col grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-5">
              {filtered.map((venture) => (
                <VentureCard
                  key={venture.id}
                  venture={venture}
                  href={`/experiences/${venture.id}/${venture.slug}`}
                  variant="vertical"
                  showDateCheck
                />
              ))}
            </div>

            {/* Mobile: horizontal split cards */}
            <div className="flex flex-col gap-4 md:hidden">
              {filtered.map((venture) => (
                <VentureCard
                  key={venture.id}
                  venture={venture}
                  href={`/experiences/${venture.id}/${venture.slug}`}
                  variant="horizontal"
                  showDateCheck
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Filter sheet opened from the heading row (desktop + mobile). */}
      <CatalogueFilterSheet
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        resultCount={filtered.length}
      />
    </section>
  );
}
