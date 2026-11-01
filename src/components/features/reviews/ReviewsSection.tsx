'use client';

import { useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import type { ReviewSummary } from '@/types/venture';
import { ReviewCard } from './ReviewCard';
import { ReviewModal } from './ReviewModal';

interface ReviewsSectionProps {
  reviews: readonly ReviewSummary[];
  average: number;
  count: number;
}

/**
 * Product-page review block: a clickable summary bar, a short preview of the
 * latest reviews and the full list in a modal (search + sort).
 */
export function ReviewsSection({ reviews, average, count }: ReviewsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center">
        <Star className="mx-auto h-6 w-6 text-neutral-300" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-neutral-700">No verified reviews yet</p>
        <p className="mt-1 text-xs text-neutral-500">
          Guests can review after their trip — yours would be the first.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-neutral-50 p-4 text-left transition-colors hover:bg-neutral-100"
        aria-haspopup="dialog"
      >
        <span className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tabular-nums text-neutral-900">
            {average.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={
                  index < Math.round(average)
                    ? 'h-3.5 w-3.5 fill-yellow-400 text-yellow-400'
                    : 'h-3.5 w-3.5 text-neutral-300'
                }
              />
            ))}
          </span>
        </span>

        <span className="text-sm font-medium text-neutral-700">
          {count.toLocaleString('en-US')} review{count === 1 ? '' : 's'}
        </span>

        <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-neutral-900">
          Read all
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      <div className="mt-5 space-y-5">
        {reviews.slice(0, 4).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {count > 4 && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
        >
          Show all {count.toLocaleString('en-US')} reviews
        </button>
      )}

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reviews={reviews}
        average={average}
        count={count}
      />
    </>
  );
}
