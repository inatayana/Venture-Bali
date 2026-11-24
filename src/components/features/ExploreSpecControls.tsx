'use client';

import { useState } from 'react';
import { Car, KeyRound } from 'lucide-react';
import { CatalogueFilterSheet } from '@/components/features/CatalogueFilterSheet';
import {
  countActiveFilters,
  FilterTogglePill,
  FiltersTriggerButton,
} from '@/components/features/ExploreFilterPills';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';
import { SortMenu } from '@/components/features/SortMenu';
import { EXPLORE_SORT_OPTIONS } from '@/lib/exploreFiltersUrl';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { cn } from '@/utils/cn';

/** The single sticky control row directly below the desktop header on /explore. */
const CATEGORY_TABS = [
  { label: 'All', value: null },
  ...CATEGORY_REGISTRY.map((category) => ({ label: category.short, value: category.short })),
];

const SORT_OPTIONS = EXPLORE_SORT_OPTIONS.filter((option) => option.value !== 'rating').map(
  (option) => (option.value === 'duration' ? { ...option, label: 'Duration: Shortest' } : option)
);

export function ExploreSpecControls() {
  const {
    transferIncluded,
    setTransferIncluded,
    selfDriveOnly,
    setSelfDriveOnly,
    bestSellerOnly,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
  } = useExploreFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = countActiveFilters({
    transferIncluded,
    selfDriveOnly,
    bestSeller: bestSellerOnly,
    selectedCategory,
  });

  return (
    <>
      <div className="hidden md:block sticky top-20 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center gap-4">
          <div
            className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-5"
            role="group"
            aria-label="Categories"
          >
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                aria-pressed={selectedCategory === tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  selectedCategory === tab.value
                    ? 'border-brand-ink text-brand-ink dark:border-brand dark:text-brand'
                    : 'border-transparent text-neutral-600 hover:text-brand-ink dark:text-neutral-400 dark:hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0" aria-hidden="true" />

          <div className="shrink-0 flex items-center gap-2">
            <FilterTogglePill
              active={transferIncluded}
              onClick={() => setTransferIncluded(!transferIncluded)}
              icon={Car}
              label="Transfer Included"
            />
            <FilterTogglePill
              active={selfDriveOnly}
              onClick={() => setSelfDriveOnly(!selfDriveOnly)}
              icon={KeyRound}
              label="Self-Drive"
            />
            <FiltersTriggerButton
              activeCount={activeCount}
              open={filtersOpen}
              onClick={() => setFiltersOpen(true)}
            />
            <SortMenu value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
          </div>
        </div>
      </div>

      <CatalogueFilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  );
}
