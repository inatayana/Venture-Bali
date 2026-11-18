'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { VentureCard } from '@/components/ui';
import { resolveCategory } from '@/lib/taxonomy';
import { isDateAvailable, isSlotBookable } from '@/lib/pricing';
import { SortMenu } from '@/components/features/SortMenu';
import { ExploreFilterPills } from '@/components/features/ExploreFilterPills';
import { CuratedRows } from '@/components/features/CuratedRows';
import { ExploreTopBar } from '@/components/features/ExploreTopBar';
import { ExploreSearchOverlay } from '@/components/features/ExploreSearchOverlay';
import { ExploreFilterModal } from '@/components/features/ExploreFilterModal';
import { VentureListCard } from '@/components/features/VentureListCard';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';
import type { VentureItem } from '@/types/venture';

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
  const [transferIncluded, setTransferIncluded] = useState(false);
  const [selfDriveOnly, setSelfDriveOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

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
              isSlotBookable(dateFilter, slot.time, variant.fulfillmentMode, new Date(), slot.cutoffHours)
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
  }, [ventures, search, selectedCategory, sortBy, dateFilter, paxFilter, transferIncluded, selfDriveOnly, bestSellerOnly]);

  // A new filter or sort starts a fresh, compact mobile list.
  useEffect(() => {
    setExpanded(false);
  }, [search, selectedCategory, sortBy, dateFilter, paxFilter, transferIncluded, selfDriveOnly, bestSellerOnly]);

  const resetAllFilters = () => {
    setSearch('');
    setDateFilter('');
    setPaxFilter(1);
    setSelectedCategory(null);
    setSortBy('recommended');
    setTransferIncluded(false);
    setSelfDriveOnly(false);
    setBestSellerOnly(false);
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
    sortBy === 'recommended';

  // Unified sticky header (mobile): hide on scroll down, reveal on scroll up.
  const [controlsHidden, setControlsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (mode !== 'explore') return;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (Math.abs(delta) <= 10) return; // 10px threshold against jitter
      if (delta > 0 && y > 80) {
        setControlsHidden(true); // scrolling down past the header height
      } else if (delta < 0 || y <= 16) {
        setControlsHidden(false); // scrolling up, or back at the top
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode]);

  const dateLabel = dateFilter
    ? new Date(`${dateFilter}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : 'Anytime';
  const guestsLabel = paxFilter > 1 ? `${paxFilter} guests` : 'Add guests';
  const activeFilterCount = [
    transferIncluded,
    selfDriveOnly,
    bestSellerOnly,
    selectedCategory !== null,
  ].filter(Boolean).length;

  return (
    <section
      id="results"
      className={cn(
        'container scroll-mt-24 mx-auto px-4',
        mode === 'explore' ? 'pb-4 pt-0 md:py-8' : 'py-8'
      )}
    >
      {/* Unified control bar: sticky + hide-on-scroll on mobile, static on md+.
          Renders the pills exactly once. */}
      {mode === 'explore' && (
        <div
          className={cn(
            'sticky top-0 z-30 -mx-4 border-b border-neutral-200/80 bg-white/95 px-4 backdrop-blur-md transition-transform duration-300 ease-out',
            'dark:border-white/10 dark:bg-neutral-950/95',
            'md:static md:z-auto md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:backdrop-blur-none md:transition-none dark:md:bg-transparent'
          )}
        >
          <div className={cn('transition-transform duration-300 ease-out md:transform-none', controlsHidden ? '-translate-y-full md:translate-y-0' : '')}>
            <ExploreTopBar
              title={search.trim() || 'Adventures in Bali'}
              subtitle={`${dateLabel} · ${guestsLabel}`}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenFilters={() => setFilterModalOpen(true)}
              activeFilterCount={activeFilterCount}
            />
            <ExploreFilterPills
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
          </div>
        </div>
      )}

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

        {mode === 'default' && (
          <div className="flex items-center gap-2">
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
        )}
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
      <ExploreFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        transferIncluded={transferIncluded}
        onTransferIncludedChange={setTransferIncluded}
        selfDriveOnly={selfDriveOnly}
        onSelfDriveChange={setSelfDriveOnly}
        bestSeller={bestSellerOnly}
        onBestSellerChange={setBestSellerOnly}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        resultCount={filteredVentures.length}
        onClearAll={() => {
          setTransferIncluded(false);
          setSelfDriveOnly(false);
          setBestSellerOnly(false);
          setSelectedCategory(null);
        }}
      />
    </section>
  );
}
