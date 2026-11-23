'use client';

import { useEffect } from 'react';
import { X, Car, KeyRound, Award, Check, ShieldCheck, Zap, Clock, Star } from 'lucide-react';
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
  freeCancellationOnly: boolean;
  onFreeCancellationChange: (value: boolean) => void;
  instantConfirmationOnly: boolean;
  onInstantConfirmationChange: (value: boolean) => void;
  durationBucket: 'any' | 'short' | 'half' | 'full';
  onDurationBucketChange: (value: 'any' | 'short' | 'half' | 'full') => void;
  maxPriceIdr: number | null;
  onMaxPriceChange: (value: number | null) => void;
  minRating: number | null;
  onMinRatingChange: (value: number | null) => void;
  /** Selected category short label (e.g. 'Rafting'), or null for all. */
  selectedCategory: string | null;
  onCategorySelect: (categoryShort: string | null) => void;
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
  freeCancellationOnly,
  onFreeCancellationChange,
  instantConfirmationOnly,
  onInstantConfirmationChange,
  durationBucket,
  onDurationBucketChange,
  maxPriceIdr,
  onMaxPriceChange,
  minRating,
  onMinRatingChange,
  selectedCategory,
  onCategorySelect,
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

  const activeChips: Array<{ key: string; label: string; remove: () => void }> = [];
  if (freeCancellationOnly)
    activeChips.push({ key: 'free', label: '80% Refund ≥24h', remove: () => onFreeCancellationChange(false) });
  if (instantConfirmationOnly)
    activeChips.push({ key: 'instant', label: 'Instant Confirmation', remove: () => onInstantConfirmationChange(false) });
  if (durationBucket !== 'any')
    activeChips.push({ key: 'duration', label: `Duration: ${durationBucket}`, remove: () => onDurationBucketChange('any') });
  if (maxPriceIdr !== null)
    activeChips.push({ key: 'price', label: `≤ Rp ${maxPriceIdr.toLocaleString('id-ID')}`, remove: () => onMaxPriceChange(null) });
  if (minRating !== null)
    activeChips.push({ key: 'rating', label: `${minRating}+ stars`, remove: () => onMinRatingChange(null) });

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

            {/* Section 1b — Reassurance & time */}
            <section aria-labelledby="filter-reassurance">
              <h3
                id="filter-reassurance"
                className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Reassurance &amp; time
              </h3>
              <div className="flex flex-wrap gap-2">
                <FilterTogglePill
                  active={freeCancellationOnly}
                  onClick={() => onFreeCancellationChange(!freeCancellationOnly)}
                  icon={ShieldCheck}
                  label="80% Refund ≥24h"
                />
                <FilterTogglePill
                  active={instantConfirmationOnly}
                  onClick={() => onInstantConfirmationChange(!instantConfirmationOnly)}
                  icon={Zap}
                  label="Instant Confirmation"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Duration">
                {(
                  [
                    { value: 'any', label: 'Any duration' },
                    { value: 'short', label: '≤ 2 hours' },
                    { value: 'half', label: 'Half day (≤ 5h)' },
                    { value: 'full', label: 'Full day (> 5h)' },
                  ] as const
                ).map((bucket) => (
                  <button
                    key={bucket.value}
                    type="button"
                    role="radio"
                    aria-checked={durationBucket === bucket.value}
                    onClick={() => onDurationBucketChange(bucket.value)}
                    className={cn(
                      'inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                      durationBucket === bucket.value
                        ? 'border-brand-ink bg-brand-ink text-white'
                        : 'border-neutral-300 text-neutral-700 hover:border-brand-ink dark:border-white/20 dark:text-neutral-200'
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {bucket.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Section 1c — Price & rating */}
            <section aria-labelledby="filter-price-rating">
              <h3
                id="filter-price-rating"
                className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Price &amp; rating
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  Max price / guest (IDR)
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    inputMode="numeric"
                    value={maxPriceIdr ?? ''}
                    placeholder="Any"
                    onChange={(event) =>
                      onMaxPriceChange(event.target.value === '' ? null : Number(event.target.value))
                    }
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none focus:border-brand-ink dark:border-white/20 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  Minimum rating
                  <span className="mt-1 flex gap-1">
                    {[4, 4.5, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        aria-pressed={minRating === rating}
                        onClick={() => onMinRatingChange(minRating === rating ? null : rating)}
                        className={cn(
                          'inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg border text-xs font-semibold',
                          minRating === rating
                            ? 'border-brand-ink bg-brand-ink text-white'
                            : 'border-neutral-300 text-neutral-700 dark:border-white/20 dark:text-neutral-200'
                        )}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        {rating}+
                      </button>
                    ))}
                  </span>
                </label>
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

            {/* Active filters — every chip removes just that one filter */}
            {activeChips.length > 0 && (
              <section aria-labelledby="filter-active">
                <h3
                  id="filter-active"
                  className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                >
                  Active filters
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.remove}
                      aria-label={`Remove ${chip.label} filter`}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-brand/20 px-3 text-xs font-semibold text-brand-ink dark:text-brand"
                    >
                      {chip.label}
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            )}
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
