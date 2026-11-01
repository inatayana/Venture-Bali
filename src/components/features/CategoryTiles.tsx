'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { CATEGORY_ICONS } from '@/lib/taxonomy';

interface SortOption {
  value: string;
  label: string;
}

interface CategoryTilesProps {
  categories: readonly string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  /** Product count per short category label. */
  counts?: Record<string, number>;
  /** When provided, the "All" tile doubles as the sort menu trigger. */
  sortOptions?: readonly SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
}

/**
 * Visual category picker: a horizontal strip on mobile, one row on desktop.
 *
 * The "All" tile is the primary trigger: it clears the category filter and, when
 * sort options are supplied, opens the sort menu so the header needs no separate
 * dropdown.
 */
export function CategoryTiles({
  categories,
  selectedCategory,
  onSelect,
  counts,
  sortOptions,
  sortValue,
  onSortChange,
}: CategoryTilesProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSortOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) setIsSortOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSortOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isSortOpen]);

  const tileBase =
    'group flex min-w-[84px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all duration-200 lg:min-w-0';
  const hasSort = Boolean(sortOptions && sortOptions.length > 0 && onSortChange);
  const activeSortLabel = sortOptions?.find((option) => option.value === sortValue)?.label;

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide lg:grid lg:grid-cols-10 lg:gap-2 lg:overflow-visible"
    >
      <div ref={triggerRef} className="relative shrink-0">
        <button
          type="button"
          aria-pressed={selectedCategory === null}
          aria-haspopup={hasSort ? 'menu' : undefined}
          aria-expanded={hasSort ? isSortOpen : undefined}
          onClick={() => {
            if (hasSort) {
              setIsSortOpen((open) => !open);
              return;
            }
            onSelect(null);
          }}
          className={cn(
            tileBase,
            'w-full',
            selectedCategory === null
              ? 'border-brand-ink bg-brand-ink text-brand shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-brand-ink/40 hover:bg-brand/20'
          )}
        >
          <span className="text-xl leading-none" aria-hidden="true">
            🧭
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
            All
            {hasSort && (
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', isSortOpen && 'rotate-180')}
                aria-hidden="true"
              />
            )}
          </span>
          <span className="max-w-[76px] truncate text-[10px] tabular-nums opacity-70">
            {hasSort && activeSortLabel ? activeSortLabel : counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : ''}
          </span>
        </button>

        {hasSort && isSortOpen && (
          <div
            role="menu"
            aria-label="Sort and filter"
            className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl"
          >
            {selectedCategory !== null && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelect(null);
                  setIsSortOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                All categories
              </button>
            )}

            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Sort by
            </p>

            {sortOptions?.map((option) => {
              const isActive = option.value === sortValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    onSortChange?.(option.value);
                    setIsSortOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50',
                    isActive ? 'font-semibold text-neutral-900' : 'text-neutral-700'
                  )}
                >
                  <span className="flex-1">{option.label}</span>
                  {isActive && <Check className="h-4 w-4 text-brand-ink" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {categories.map((category) => {
        const isActive = category === selectedCategory;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
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
