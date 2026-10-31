'use client';

import { cn } from '@/utils/cn';
import { CATEGORY_ICONS } from '@/lib/taxonomy';

interface CategoryTilesProps {
  categories: readonly string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  /** Product count per short category label. */
  counts?: Record<string, number>;
}

/**
 * Visual category picker (replaces the flat chip row on the home page):
 * a horizontal strip on mobile, a single row of ten tiles on desktop.
 * The active tile uses the brand ink + accent pair.
 */
export function CategoryTiles({
  categories,
  selectedCategory,
  onSelect,
  counts,
}: CategoryTilesProps) {
  const tileBase =
    'group flex min-w-[84px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all duration-200 lg:min-w-0';

  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide lg:grid lg:grid-cols-10 lg:gap-2 lg:overflow-visible"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedCategory === null}
        onClick={() => onSelect(null)}
        className={cn(
          tileBase,
          selectedCategory === null
            ? 'border-brand-ink bg-brand-ink text-brand shadow-md'
            : 'border-gray-200 bg-white text-gray-700 hover:border-brand-ink/40 hover:bg-brand/20'
        )}
      >
        <span className="text-xl leading-none" aria-hidden="true">
          🧭
        </span>
        <span className="text-[11px] font-semibold leading-tight">All</span>
        <span className="text-[10px] tabular-nums opacity-60">
          {counts
            ? Object.values(counts).reduce((sum, value) => sum + value, 0)
            : ''}
        </span>
      </button>

      {categories.map((category) => {
        const isActive = category === selectedCategory;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(isActive ? null : category)}
            className={cn(
              tileBase,
              isActive
                ? 'border-brand-ink bg-brand-ink text-brand shadow-md'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand-ink/40 hover:bg-brand/20'
            )}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {CATEGORY_ICONS[category] ?? '📍'}
            </span>
            <span className="text-[11px] font-semibold leading-tight">{category}</span>
            {counts && (
              <span className="text-[10px] tabular-nums opacity-60">
                {counts[category] ?? 0}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
