'use client';

import { useState } from 'react';
import { ExploreTopBar } from '@/components/features/ExploreTopBar';
import { ExploreFilterPills } from '@/components/features/ExploreFilterPills';
import { ExploreSearchOverlay } from '@/components/features/ExploreSearchOverlay';
import { ExploreFilterModal } from '@/components/features/ExploreFilterModal';
import { useSearch } from '@/components/search/SearchProvider';
import { useExploreFilters } from '@/components/features/ExploreFiltersProvider';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/utils/cn';

/**
 * The /explore control bar, shared by the catalogue page and the homepage.
 * Mobile: sticky, hide-on-scroll capsule + slider filter + pills.
 * Desktop: static pills (back arrow omitted — home & explore differ).
 * Owns its search overlay and filter modal, reading all catalogue state
 * from ExploreFiltersContext + SearchContext.
 */
export function ExploreControlBar({ showBack = true }: { showBack?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { query, date, pax } = useSearch();
  const {
    transferIncluded,
    setTransferIncluded,
    selfDriveOnly,
    setSelfDriveOnly,
    bestSellerOnly,
    setBestSellerOnly,
    selectedCategory,
    setSelectedCategory,
    setSortBy,
    resultCount,
  } = useExploreFilters();

  const controlsHidden = useHideOnScroll(80, 150);

  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : 'Anytime';
  const guestsLabel = pax > 1 ? `${pax} guests` : 'Add guests';
  const activeFilterCount = [
    transferIncluded,
    selfDriveOnly,
    bestSellerOnly,
    selectedCategory !== null,
  ].filter(Boolean).length;

  return (
    <>
      {/* Sticky, hide-on-scroll on mobile only — desktop uses inline pills in the heading row */}
      <div
        className={cn(
          'sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-out md:hidden',
          'dark:border-white/10 dark:bg-neutral-950/95'
        )}
      >
        <div
          className={cn(
            'px-4 transition-transform duration-300 ease-out',
            controlsHidden ? '-translate-y-full' : ''
          )}
        >
          <ExploreTopBar
            title={query.trim() || 'Adventures in Bali'}
            subtitle={`${dateLabel} · ${guestsLabel}`}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenFilters={() => setFilterModalOpen(true)}
            activeFilterCount={activeFilterCount}
            showBack={showBack}
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

      <ExploreSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
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
        resultCount={resultCount}
        onClearAll={() => {
          setTransferIncluded(false);
          setSelfDriveOnly(false);
          setBestSellerOnly(false);
          setSelectedCategory(null);
          setSortBy('recommended');
        }}
      />
    </>
  );
}
