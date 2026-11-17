'use client';

import { Car, KeyRound, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CategoryChips } from '@/components/features/CategoryChips';
import { CATEGORY_REGISTRY, type MegaCategorySlug } from '@/lib/taxonomy';
import { cn } from '@/utils/cn';

export interface ExploreFilterPillsProps {
  /** Selected category as its short label (e.g. 'Rafting'), or null for all. */
  selectedCategory: string | null;
  onCategorySelect: (categoryShort: string | null) => void;
  transferIncluded: boolean;
  onTransferIncludedChange: (value: boolean) => void;
  selfDriveOnly: boolean;
  onSelfDriveChange: (value: boolean) => void;
  /** Whether the full filter/sort panel (CategoryTiles) is expanded. */
  filtersOpen: boolean;
  onFiltersToggle: () => void;
  className?: string;
}

const scrollbarHidden =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

function TogglePill({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Car;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        active
          ? 'border-brand-ink bg-brand-ink text-brand shadow-sm'
          : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-ink/50 hover:bg-brand/5 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5'
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

/**
 * Horizontal filter pill strip for the Explore catalogue.
 * Airbnb-style capsule row: [Filters] [Transfer Included] [Self-Drive] | category pills.
 * Categories reuse the shared CategoryChips component (single-select).
 */
export function ExploreFilterPills({
  selectedCategory,
  onCategorySelect,
  transferIncluded,
  onTransferIncludedChange,
  selfDriveOnly,
  onSelfDriveChange,
  filtersOpen,
  onFiltersToggle,
  className,
}: ExploreFilterPillsProps) {
  const selectedSlug: MegaCategorySlug | null =
    CATEGORY_REGISTRY.find((category) => category.short === selectedCategory)?.slug ?? null;

  const advancedActive = (transferIncluded ? 1 : 0) + (selfDriveOnly ? 1 : 0);

  return (
    <div
      className={cn('flex items-center gap-2 overflow-x-auto pb-2', scrollbarHidden, className)}
      role="group"
      aria-label="Filter adventures"
    >
      <button
        type="button"
        onClick={onFiltersToggle}
        aria-expanded={filtersOpen}
        className={cn(
          'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          filtersOpen
            ? 'border-brand-ink bg-brand-ink text-brand shadow-sm'
            : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-ink/50 hover:bg-brand/5 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300'
        )}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        {advancedActive > 0 && (
          <span className="ml-0.5 rounded-full bg-brand px-1.5 text-[11px] font-bold text-brand-ink">
            {advancedActive}
          </span>
        )}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <TogglePill
        active={transferIncluded}
        onClick={() => onTransferIncludedChange(!transferIncluded)}
        icon={Car}
        label="Transfer Included"
      />
      <TogglePill
        active={selfDriveOnly}
        onClick={() => onSelfDriveChange(!selfDriveOnly)}
        icon={KeyRound}
        label="Self-Drive"
      />

      <div className="mx-1 h-6 w-px shrink-0 bg-neutral-200 dark:bg-white/10" aria-hidden="true" />

      <CategoryChips
        selected={selectedSlug ? [selectedSlug] : []}
        onChange={(slugs) => {
          const slug = slugs[slugs.length - 1] ?? null;
          const short = CATEGORY_REGISTRY.find((category) => category.slug === slug)?.short ?? null;
          onCategorySelect(short);
        }}
        multiSelect={false}
        variant="chips"
        className="shrink-0"
      />
    </div>
  );
}
