'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, Star, X } from 'lucide-react';
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
  /** Enables the paginated review feed. Without it the modal filters locally. */
  ventureId?: string;
}

interface ReviewFeedPayload {
  reviews: Array<Omit<ReviewSummary, 'createdAt'> & { createdAt: string }>;
  page: number;
  total: number;
  hasMore: boolean;
  histogram: Array<{ stars: number; count: number; percent: number }>;
}

const FEED_PAGE_SIZE = 8;

function normalizeFeedReviews(
  reviews: ReviewFeedPayload['reviews']
): ReviewSummary[] {
  return reviews.map((review) => ({ ...review, createdAt: new Date(review.createdAt) }));
}

/**
 * Airbnb-style review dialog: score summary, histogram, search and sort.
 * With a ventureId it loads pages from `/api/ventures/[id]/reviews`, so long
 * review histories stay fast; without one it filters the supplied list.
 */
export function ReviewModal({
  isOpen,
  onClose,
  reviews,
  average,
  count,
  ventureId,
}: ReviewModalProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [items, setItems] = useState<ReviewSummary[]>(() => [...reviews]);
  const [page, setPage] = useState(1);
  const [feedTotal, setFeedTotal] = useState(count);
  const [hasMore, setHasMore] = useState(count > reviews.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [serverHistogram, setServerHistogram] = useState<ReviewFeedPayload['histogram'] | null>(
    null
  );
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

  // Page 1 of the live feed; re-runs when the search or sort changes.
  useEffect(() => {
    if (!isOpen || !ventureId) {
      setItems([...reviews]);
      setPage(1);
      setFeedTotal(count);
      setHasMore(count > reviews.length);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: String(FEED_PAGE_SIZE),
          sort,
        });
        if (query.trim()) params.set('q', query.trim());

        const response = await fetch(
          `/api/ventures/${encodeURIComponent(ventureId)}/reviews?${params.toString()}`,
          { signal: controller.signal }
        );
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error('Review feed unavailable');

        const data = payload.data as ReviewFeedPayload;
        setItems(normalizeFeedReviews(data.reviews));
        setPage(1);
        setFeedTotal(data.total);
        setHasMore(data.hasMore);
        setServerHistogram(data.histogram);
        setFeedError(false);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setFeedError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 300 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, ventureId, query, sort, reviews, count]);

  const filtered = useMemo(
    () => applyReviewFilters(reviews, { query, sort }),
    [reviews, query, sort]
  );

  // The server already filtered/sorted, so only the local fallback needs work.
  const visible = ventureId && !feedError ? items : filtered;
  const histogram = useMemo(
    () => serverHistogram ?? ratingHistogram(reviews),
    [serverHistogram, reviews]
  );

  const loadMore = async () => {
    if (!ventureId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(FEED_PAGE_SIZE),
        sort,
      });
      if (query.trim()) params.set('q', query.trim());

      const response = await fetch(
        `/api/ventures/${encodeURIComponent(ventureId)}/reviews?${params.toString()}`
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error('Review feed unavailable');

      const data = payload.data as ReviewFeedPayload;
      const next = normalizeFeedReviews(data.reviews);
      setItems((current) => {
        const seen = new Set(current.map((review) => review.id));
        return [...current, ...next.filter((review) => !seen.has(review.id))];
      });
      setPage(nextPage);
      setFeedTotal(data.total);
      setHasMore(data.hasMore);
      setFeedError(false);
    } catch {
      setFeedError(true);
    } finally {
      setLoadingMore(false);
    }
  };

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
                    index < Math.round(average) ? 'fill-brand text-brand' : 'text-neutral-200'
                  )}
                />
              ))}
            </div>

            <div className="mt-3 space-y-1">
              {histogram.map(({ stars, percent }) => (
                <div key={stars} className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span className="w-5 tabular-nums">{stars}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full bg-brand" style={{ width: `${percent}%` }} />
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

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6"
          aria-busy={loading}
        >
          {loading && (
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-neutral-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Loading reviews…
            </p>
          )}

          {feedError && ventureId && (
            <p className="mb-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              Live reviews could not load. Showing the reviews already on this page.
            </p>
          )}

          {!loading && visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">
              No reviews match “{query}”.
            </p>
          ) : (
            <div className={cn('divide-y divide-neutral-100', loading && 'opacity-60')}>
              {visible.map((review) => (
                <ReviewCard key={review.id} review={review} className="py-4 first:pt-0 last:pb-0" />
              ))}
            </div>
          )}

          {ventureId && !feedError && hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loadingMore
                ? 'Loading reviews…'
                : `Show more reviews (${visible.length} of ${feedTotal})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
