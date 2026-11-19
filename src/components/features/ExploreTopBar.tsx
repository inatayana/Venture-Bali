'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';

export interface ExploreTopBarProps {
  /** Line 1 of the capsule — query when set, otherwise the Bali default. */
  title: string;
  /** Line 2 of the capsule, e.g. "Anytime · Add guests". */
  subtitle: string;
  /** Opens the full-screen search overlay (State 2). */
  onOpenSearch: () => void;
  /** Opens the full-screen filter modal (State 3). */
  onOpenFilters: () => void;
  /** Number of active non-category filters — shown as a badge on the filter button. */
  activeFilterCount: number;
  /** Hide the back button (homepage is a root destination). */
  showBack?: boolean;
}

/**
 * Mobile top bar for /explore (State 1).
 * Back arrow on the left, floating search capsule in the middle,
 * filter icon button on the right — Airbnb-style chrome for Android/iOS.
 * Hidden on md+ where the desktop header carries the search pill instead.
 */
export function ExploreTopBar({
  title,
  subtitle,
  onOpenSearch,
  onOpenFilters,
  activeFilterCount,
  showBack = true,
}: ExploreTopBarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 py-2 md:hidden">
      {showBack ? (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onOpenSearch}
        aria-label={`Open search. ${title}, ${subtitle}`}
        className="flex h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-full border border-neutral-200 bg-white px-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-neutral-900"
      >
        <span className="max-w-full truncate text-[12px] font-semibold leading-tight text-neutral-900 dark:text-white">
          {title}
        </span>
        <span className="max-w-full truncate text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenFilters}
        aria-label={
          activeFilterCount > 0 ? `Open filters, ${activeFilterCount} active` : 'Open filters'
        }
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        {activeFilterCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-ink text-[10px] font-bold text-brand"
          >
            {activeFilterCount > 9 ? '9+' : activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
