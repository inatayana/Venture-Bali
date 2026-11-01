'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { applyReviewFilters, ratingHistogram, REVIEW_SORTS, type ReviewSort } from '@/lib/reviews';
import type { ReviewSummary } from '@/types/venture';
import { ReviewCard } from './ReviewCard';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: readonly ReviewSummary[];
  average: number;
  count: number;
}

/**
 * Airbnb-style review dialog: score summary, histogram, search and sort.
 * Body scroll is locked and Escape closes it.
 */
export function ReviewModal({ isOpen, onClose, reviews, average, count }: ReviewModalProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ReviewSort>('newest');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filtered = useMemo(
    () => applyReviewFilters(reviews, { query, sort }),
    [reviews, query, sort]
  );
  const histogram = useMemo(() => ratingHistogram(reviews), [reviews]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-neutral-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-modal-title"
        className="relative flex max-h-[92vh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:animate-fade-in sm:rounded-3xl"
      >
        <div className="flex items-start gap-4 border-b border-neutral-100 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                id="reviews-modal-title"
                className="font-heading text-3xl font-bold tabular-nums text-neutral-900"
              >
                {average.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-500">
                · {count} review{count === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    'h-4 w-4',
                    index < Math.round(average)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-neutral-200'
                  )}
                />
              ))}
            </div>

            <div className="mt-3 space-y-1">
              {histogram.map(({ stars, percent }) => (
                <div key={stars} className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span className="w-5 tabular-nums">{stars}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close reviews"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b border-neutral-100 p-4 sm:px-6">
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search all reviews"
              aria-label="Search all reviews"
              className="min-h-[44px] w-full bg-transparent text-sm outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sort reviews">
            {REVIEW_SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                aria-pressed={sort === option.value}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  sort === option.value
                    ? 'border-brand-ink bg-brand-ink text-brand'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">
              No reviews match “{query}”.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filtered.map((review) => (
                <ReviewCard key={review.id} review={review} className="py-4 first:pt-0 last:pb-0" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
