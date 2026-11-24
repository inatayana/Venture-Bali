'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { ExploreFilterPills, countActiveFilters } from '@/components/features/ExploreFilterPills';
import { CategoryChips } from '@/components/features/CategoryChips';
import { CATEGORY_REGISTRY, type MegaCategorySlug } from '@/lib/taxonomy';
import { ExploreSearchOverlay } from '@/components/features/ExploreSearchOverlay';
import { CatalogueFilterSheet } from '@/components/features/CatalogueFilterSheet';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';

export function ExploreControlBar({ showBack = true }: { showBack?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { selectedCategory, setSelectedCategory, transferIncluded, setTransferIncluded, selfDriveOnly, setSelfDriveOnly, bestSellerOnly } = useExploreFilters();
  const activeFilterCount = countActiveFilters({ transferIncluded, selfDriveOnly, bestSeller: bestSellerOnly, selectedCategory });
  const selectedSlug: MegaCategorySlug | null =
    CATEGORY_REGISTRY.find((c) => c.short === selectedCategory)?.slug ?? null;

  return (
    <>
      {/* Mobile sticky bar — full width, sits at top, no dark wrapper */}
      <div className="sticky top-0 z-30 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-out md:hidden dark:border-white/10 dark:bg-neutral-950/95">
        <div className="w-full transition-transform duration-300 ease-out">
          {/* Baris 1 */}
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
            {showBack ? (
              <Link href="/" aria-label="Go back" className="shrink-0">
                <ChevronLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search. Adventures in Bali"
              className="flex-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md py-2 px-4 text-center"
            >
              <span className="block text-sm font-semibold text-neutral-900 dark:text-white">Adventures in Bali</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">Anytime · Add guests</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              aria-label="Open filters"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            >
              <SlidersHorizontal className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-ink text-[10px] font-bold text-brand">
                  {activeFilterCount > 9 ? '9+' : activeFilterCount}
                </span>
              )}
            </button>
          </div>
          {/* Baris 2 — compact category pill strip */}
          <CategoryChips
            selected={selectedSlug ? [selectedSlug] : []}
            onChange={(slugs) => {
              const slug = slugs[slugs.length - 1] ?? null;
              const short = CATEGORY_REGISTRY.find((c) => c.slug === slug)?.short ?? null;
              setSelectedCategory(short);
            }}
            multiSelect={false}
            variant="chips"
            maxVisible={5}
            ariaLabel="Filter adventures"
            className="gap-2 pb-2 -mb-2 pr-2 scrollbar-hide"
          />
          {/* Desktop pills (hidden on mobile, use the baris 2 strip above) */}
          <div className="hidden md:flex px-4 pb-2">
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
      </div>

      <ExploreSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CatalogueFilterSheet open={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </>
  );
}
