'use client';

import { useEffect } from 'react';
import { X, Car, KeyRound, Award, Check } from 'lucide-react';
import { FilterTogglePill } from '@/components/features/ExploreFilterPills';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { cn } from '@/utils/cn';

export interface ExploreFilterModalProps {
  open: boolean;
  onClose: () => void;
  transferIncluded: boolean;
  onTransferIncludedChange: (value: boolean) => void;
  selfDriveOnly: boolean;
  onSelfDriveChange: (value: boolean) => void;
  bestSeller: boolean;
  onBestSellerChange: (value: boolean) => void;
  /** Selected category short label (e.g. 'Rafting'), or null for all. */
  selectedCategory: string | null;
  onCategorySelect: (categoryShort: string | null) => void;
  /** Selected location filter (e.g. 'Ubud'), or null for all. */
  location: string | null;
  onLocationChange: (value: string | null) => void;
  /** Live count shown on the primary CTA. */
  resultCount: number;
  /** Reset every filter (does not close the modal). */
  onClearAll: () => void;
}

/**
 * State 3 — full-screen filter sheet for Explore.
 * Section 1: logistics & featured pills. Section 2: adventure type grid
 * rendered from CATEGORY_REGISTRY. Sticky footer with Clear all and a
 * live "Show N results" CTA.
 */
export function ExploreFilterModal({
  open,
  onClose,
  transferIncluded,
  onTransferIncludedChange,
  selfDriveOnly,
  onSelfDriveChange,
  bestSeller,
  onBestSellerChange,
  selectedCategory,
  onCategorySelect,
  location,
  onLocationChange,
  resultCount,
  onClearAll,
}: ExploreFilterModalProps) {
  // Lock body scroll and wire Escape while mounted.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      className="fixed inset-0 z-50 flex flex-col bg-white md:items-center md:justify-center md:bg-black/40 dark:bg-neutral-950"
    >
      <div className="flex w-full max-w-2xl flex-1 flex-col bg-white md:my-auto md:max-h-[85vh] md:flex-none md:overflow-hidden md:rounded-3xl md:shadow-2xl dark:bg-neutral-950">
        {/* Header */}
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-neutral-200 dark:border-white/10">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:text-neutral-200 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {/* Section 1 — Logistics & Featured */}
            <section aria-labelledby="filter-logistics">
              <h3
                id="filter-logistics"
                className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Logistics &amp; Featured
              </h3>
              <div className="flex flex-wrap gap-2">
                <FilterTogglePill
                  active={transferIncluded}
                  onClick={() => onTransferIncludedChange(!transferIncluded)}
                  icon={Car}
                  label="Transfer Included"
                />
                <FilterTogglePill
                  active={selfDriveOnly}
                  onClick={() => onSelfDriveChange(!selfDriveOnly)}
                  icon={KeyRound}
                  label="Self-Drive"
                />
                <FilterTogglePill
                  active={bestSeller}
                  onClick={() => onBestSellerChange(!bestSeller)}
                  icon={Award}
                  label="Best Seller"
                />
              </div>
            </section>

            {/* Section 2 — Adventure Type */}
            <section aria-labelledby="filter-adventure-type">
              <h3
                id="filter-adventure-type"
                className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Adventure Type
              </h3>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Adventure type">
                {CATEGORY_REGISTRY.map((category) => {
                  const selected = selectedCategory === category.short;
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onCategorySelect(selected ? null : category.short)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-2xl border px-3 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                        selected
                          ? 'border-brand-ink bg-brand/10'
                          : 'border-neutral-200 hover:border-brand-ink/50 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="text-xl leading-none" aria-hidden="true">
                        {category.emoji}
                      </span>
                      <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">
                        {category.short}
                      </span>
                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-brand-ink dark:text-brand" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Section 3 — Location */}
            <section aria-labelledby="filter-location">
              <h3
                id="filter-location"
                className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Location
              </h3>
              <input
                type="text"
                value={location ?? ''}
                onChange={(event) => onLocationChange(event.target.value.trim() ? event.target.value.trim() : null)}
                placeholder="Cari lokasi, mis. Ubud"
                aria-label="Location"
                className="min-h-[44px] w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500"
              />
            </section>
          </div>
        </div>

        {/* Sticky footer */}
        <footer className="shrink-0 border-t border-neutral-200 p-4 dark:border-white/10">
          <div className="mx-auto flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-[44px] text-sm font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-600 dark:text-white"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:flex-none sm:px-10"
            >
              Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
