'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { VentureCard } from '@/components/ui';
import { filterCatalogue } from '@/lib/filterCatalogue';
import { EXPLORE_SORT_OPTIONS } from '@/lib/exploreFiltersUrl';
import { SortMenu } from '@/components/features/SortMenu';
import { ExploreControlBar } from '@/components/features/ExploreControlBar';
import { ExploreFilterPills } from '@/components/features/ExploreFilterPills';
import { CuratedRows } from '@/components/features/CuratedRows';
import { ExploreSearchOverlay } from '@/components/features/ExploreSearchOverlay';
import { CatalogueFilterSheet } from '@/components/features/CatalogueFilterSheet';
import { VentureListCard } from '@/components/features/VentureListCard';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';
import type { VentureItem } from '@/types/venture';

/** First screenful on phones; desktop always shows the full catalogue. */
const MOBILE_INITIAL_CARDS = 6;

const SORT_OPTIONS = EXPLORE_SORT_OPTIONS;

export interface VentureExplorerProps {
  ventures: VentureItem[];
  /**
   * 'default' renders the same capsule pill strip as Explore plus an inline
   * sort control (homepage). 'explore' renders the unified sticky control bar:
   * top search row + pill strip with hide-on-scroll, and swaps the filtered
   * results to a mobile split-card list (State 4).
   */
  mode?: 'default' | 'explore';
}

/**
 * Catalogue browser â€” search, category filter and sorting.
 * Receives already-loaded ventures so the page itself stays a server component.
 */
export function VentureExplorer({ ventures, mode = 'default' }: VentureExplorerProps) {
  // Search filters are shared with the hero search via context; the curated
  // catalogue filters (category, sort, logistics toggles) are shared with the
  // mobile header chrome via ExploreFiltersContext.
  const {
    query: search,
    date: dateFilter,
    pax: paxFilter,
    setQuery: setSearch,
    setDate: setDateFilter,
    setPax: setPaxFilter,
  } = useSearch();
  const {
    transferIncluded,
    setTransferIncluded,
    selfDriveOnly,
    setSelfDriveOnly,
    bestSellerOnly,
    setBestSellerOnly,
    freeCancellationOnly,
    setFreeCancellationOnly,
    instantConfirmationOnly,
    setInstantConfirmationOnly,
    durationBucket,
    setDurationBucket,
    maxPriceIdr,
    setMaxPriceIdr,
    minRating,
    setMinRating,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    setResultCount,
  } = useExploreFilters();
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Deep links (?category=, ?sort=, ?transferIncluded=, ?selfDrive=) are read
  // by ExploreFiltersProvider after hydration, so this component only consumes
  // the resulting shared state. SearchProvider restores q/date/pax the same way.
  const filteredVentures = useMemo(
    () =>
      filterCatalogue(ventures, {
        search,
        date: dateFilter,
        pax: paxFilter,
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
      search,
      selectedCategory,
      sortBy,
      dateFilter,
      paxFilter,
      transferIncluded,
      selfDriveOnly,
      bestSellerOnly,
      freeCancellationOnly,
      instantConfirmationOnly,
      durationBucket,
      maxPriceIdr,
      minRating,
    ]
  );

  // Publish the live filtered count so the mobile header chrome can show
  // "Show N results" with the same truth as the grid below.
  useEffect(() => {
    setResultCount(filteredVentures.length);
  }, [filteredVentures.length, setResultCount]);

  // A new filter or sort starts a fresh, compact mobile list.
  useEffect(() => {
    setExpanded(false);
  }, [
    search,
    selectedCategory,
    sortBy,
    dateFilter,
    paxFilter,
    transferIncluded,
    selfDriveOnly,
    bestSellerOnly,
    freeCancellationOnly,
    instantConfirmationOnly,
    durationBucket,
    maxPriceIdr,
    minRating,
  ]);

  const resetAllFilters = () => {
    setSearch('');
    setDateFilter('');
    setPaxFilter(1);
    setSelectedCategory(null);
    setSortBy('recommended');
    setTransferIncluded(false);
    setSelfDriveOnly(false);
    setBestSellerOnly(false);
    setFreeCancellationOnly(false);
    setInstantConfirmationOnly(false);
    setDurationBucket('any');
    setMaxPriceIdr(null);
    setMinRating(null);
  };

  const hasMoreOnMobile = filteredVentures.length > MOBILE_INITIAL_CARDS;

  // Default view (no search/filter/sort): curated rows. Used by both the
  // homepage (default mode, adds the guarantee banner + full grid below)
  // and the Explore page (explore mode, rows only).
  const isDefaultExploreView =
    !search &&
    !selectedCategory &&
    !dateFilter &&
    paxFilter === 1 &&
    !transferIncluded &&
    !selfDriveOnly &&
    !bestSellerOnly &&
    !freeCancellationOnly &&
    !instantConfirmationOnly &&
    durationBucket === 'any' &&
    maxPriceIdr === null &&
    minRating === null &&
    sortBy === 'recommended';

  return (
    <section
      id="results"
      className={cn(
        'container scroll-mt-24 mx-auto px-4',
        mode === 'explore' ? 'pb-4 pt-0 md:py-8' : 'py-8'
      )}
    >
      {/* Unified control bar (shared with the homepage mobile chrome) */}
      <ExploreControlBar showBack={mode === 'explore'} />

      {/* Homepage curated catalogue: rows → guarantee banner → section 5 heading */}
      {mode === 'default' && isDefaultExploreView && (
        <>
          <CuratedRows ventures={ventures} />

          <div className="mt-2 flex items-center justify-center gap-3 rounded-2xl bg-brand-ink px-6 py-4 text-center text-white dark:bg-neutral-900">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-sm font-semibold sm:text-base">
              100% Operated by BaliWild
              <span className="text-white/60">
                {' '}— Certified Local Guides · Safety-Checked Equipment · 24/7 Personal Concierge
              </span>
            </p>
          </div>

          <h2 className="mt-6 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            All Bali Adventures
          </h2>
        </>
      )}

      {/* Filters only: the search itself lives in the hero */}
      <div className="mb-4 space-y-3 pt-2 md:mb-6 md:space-y-4 md:pt-0">
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
              Â· {filteredVentures.length}{' '}
              {filteredVentures.length === 1 ? 'adventure' : 'adventures'}
            </span>
          </div>
        )}

        {/* Desktop pill strip: homepage heading row owns its own Filters entry,
            /explore uses the strip's Filters button. Hidden on mobile, where
            the sticky control bar above provides the same controls. */}
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
          />
          <SortMenu className="ml-3 shrink-0" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
        </div>
      </div>

      {/* Results */}
      {mode === 'explore' && isDefaultExploreView ? (
        <>
          {/* Mobile: vertical list of split cards (default browse) */}
          <div className="flex flex-col gap-4 pb-2 pt-1 md:hidden">
            {filteredVentures.map((venture, index) => (
              <div
                key={venture.id}
                className={cn(!expanded && index >= MOBILE_INITIAL_CARDS && 'hidden')}
              >
                <VentureListCard venture={venture} />
              </div>
            ))}
          </div>
          {hasMoreOnMobile && !expanded && (
            <div className="mt-4 flex justify-center md:hidden">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex min-h-[44px] items-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
              >
                Load more adventures ({filteredVentures.length - MOBILE_INITIAL_CARDS})
              </button>
            </div>
          )}
          {/* md+: curated horizontal rows */}
          <div className="hidden md:block">
            <CuratedRows ventures={ventures} />
          </div>
        </>
      ) : mode === 'explore' ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
              {search.trim() ? (
                <>
                  Explore {filteredVentures.length}{' '}
                  {filteredVentures.length === 1 ? 'adventure' : 'adventures'} near{' '}
                  <span className="text-brand-ink dark:text-brand">“{search.trim()}”</span>
                </>
              ) : (
                <>
                  Explore {filteredVentures.length}{' '}
                  {filteredVentures.length === 1 ? 'adventure' : 'adventures'} in Bali
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:text-brand"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>
          <ul className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-5 min-w-0">
            {filteredVentures.map((venture, index) => (
              <li
                key={venture.id}
                className={cn(!expanded && index >= MOBILE_INITIAL_CARDS && 'hidden md:block', 'min-w-0')}
              >
                <VentureListCard venture={venture} className="md:hidden" />
                <VentureCard
                  venture={venture}
                  href={`/experiences/${venture.id}/${venture.slug}`}
                  className="hidden md:block"
                />
              </li>
            ))}
          </ul>

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
        </>
      ) : (
      <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 min-w-0">
        {filteredVentures.map((venture, index) => (
          <div key={venture.id} className={cn(!expanded && index >= MOBILE_INITIAL_CARDS && 'hidden md:block', 'min-w-0')}>
            <VentureCard
              venture={venture}
              href={`/experiences/${venture.id}/${venture.slug}`}
            />
          </div>
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
      </>
      )}

      {filteredVentures.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">ðŸ”</div>
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">
            No adventures found
          </h3>
          <p className="text-gray-500 mb-4">Try another filter or search term</p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-brand-ink hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* State 2 — search overlay (explore only) & State 3 — filter modal */}
      {mode === 'explore' && (
        <ExploreSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
      <CatalogueFilterSheet
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        resultCount={filteredVentures.length}
      />
    </section>
  );
}
