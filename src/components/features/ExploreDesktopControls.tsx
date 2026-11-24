'use client';

import { useMemo, useState } from 'react';
import { CatalogueFilterSheet } from '@/components/features/CatalogueFilterSheet';
import { CategoryChip } from '@/components/features/CategoryChips';
import { ExploreFilterPills, FiltersTriggerButton, countActiveFilters } from '@/components/features/ExploreFilterPills';
import { filterCatalogue } from '@/lib/filterCatalogue';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { EXPLORE_SORT_OPTIONS } from '@/lib/exploreFiltersUrl';
import { SortMenu } from '@/components/features/SortMenu';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';
import { useSearch } from '@/components/search/SearchProvider';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/utils/cn';
import type { VentureItem } from '@/types/venture';

/**
 * Desktop control bar for /explore: 1 sticky row with categories, quick
 * filters, Filters trigger and sort, plus the "Showing X" results line.
 * Smart sticky: hides while scrolling, reveals after.
 */
export function ExploreDesktopControls({ ventures }: { ventures: VentureItem[] }) {
  const hidden = useHideOnScroll(80, 150);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { query, date, pax } = useSearch();
  const {
    selectedCategory,
    setSelectedCategory,
    transferIncluded,
    setTransferIncluded,
    selfDriveOnly,
    setSelfDriveOnly,
    bestSellerOnly,
    sortBy,
    setSortBy,
  } = useExploreFilters();

  const activeCount = countActiveFilters({ transferIncluded, selfDriveOnly, bestSeller: bestSellerOnly, selectedCategory });

  const filteredCount = useMemo(
    () =>
      filterCatalogue(ventures, {
        search: query,
        date,
        pax,
        transferIncluded,
        selfDriveOnly,
        bestSellerOnly,
        selectedCategory,
        sortBy,
      }).length,
    [ventures, query, date, pax, transferIncluded, selfDriveOnly, bestSellerOnly, selectedCategory, sortBy]
  );

  const stickyClass = cn(
    'sticky top-20 z-30 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-out md:block',
    'dark:border-white/10 dark:bg-neutral-950/95',
    hidden && '-translate-y-full'
  );

  return (
    <>
      <div className={stickyClass}>
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 lg:px-10">
          {/* Row 1 — categories + quick filters + Filters + Sort */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Categories — All + registry chips */}
            <div className="flex flex-1 min-w-0 items-center gap-5 overflow-x-auto [scrollbar-width:none] pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                aria-pressed={selectedCategory === null}
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-xs font-medium whitespace-nowrap',
                  selectedCategory === null
                    ? 'border-neutral-200 bg-neutral-200 text-neutral-900 dark:border-white/10 dark:bg-white/10 dark:text-white'
                    : 'border-neutral-300 bg-white text-neutral-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-400 hover:border-neutral-900'
                )}
              >
                All
              </button>
              {CATEGORY_REGISTRY.map((category) => (
                <CategoryChip
                  key={category.slug}
                  category={category}
                  selected={selectedCategory === category.short}
                  onClick={() => setSelectedCategory(selectedCategory === category.short ? null : category.short)}
                />
              ))}
            </div>

            <div className="hidden h-6 w-px shrink-0 bg-neutral-200 dark:bg-neutral-800 md:block" aria-hidden="true" />

            {/* Quick Filters + Filters + Sort */}
            <div className="flex shrink-0 items-center gap-2">
              <ExploreFilterPills
                showFiltersTrigger={false}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                transferIncluded={transferIncluded}
                onTransferIncludedChange={setTransferIncluded}
                selfDriveOnly={selfDriveOnly}
                onSelfDriveChange={setSelfDriveOnly}
                filtersOpen={filterModalOpen}
                onFiltersToggle={() => setFilterModalOpen(true)}
                bestSeller={bestSellerOnly}
                className="max-w-[50vw] md:max-w-none"
              />
              <FiltersTriggerButton
                activeCount={activeCount}
                open={filterModalOpen}
                onClick={() => setFilterModalOpen(true)}
              />
              <SortMenu
                value={sortBy}
                options={EXPLORE_SORT_OPTIONS}
                onChange={setSortBy}
                className="text-sm"
              />
            </div>
          </div>

          {/* Row 2 — results count */}
          <p className="mx-auto text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredCount} guided adventures in Bali
          </p>
        </div>
      </div>

      <CatalogueFilterSheet open={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </>
  );
}
