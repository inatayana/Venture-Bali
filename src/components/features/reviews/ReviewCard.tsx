'use client';

import { useState } from 'react';
import { BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeDate } from '@/lib/reviews';
import type { ReviewSummary } from '@/types/venture';

interface ReviewCardProps {
  review: ReviewSummary;
  className?: string;
}

/** Airbnb-style review row: avatar, name, country, relative date and stars. */
export function ReviewCard({ review, className }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comment.length > 220;
  const initial = review.author.trim().charAt(0).toUpperCase() || 'G';

  return (
    <article className={cn('space-y-2', className)}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/40 text-sm font-bold text-neutral-900"
          aria-hidden="true"
        >
          {initial}
        </span>

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            <span className="truncate">{review.author}</span>
            {review.isVerified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" aria-label="Verified trip" />
            )}
          </p>
          <p className="text-xs text-neutral-500">
            {[review.location ?? review.country, formatRelativeDate(review.createdAt)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div
          className="ml-auto flex shrink-0 items-center gap-0.5"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn(
                'h-3.5 w-3.5',
                index < review.rating
                  ? 'fill-brand text-brand'
                  : 'text-neutral-200'
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <p
        className={cn(
          'text-sm leading-relaxed text-neutral-700',
          !expanded && isLong && 'line-clamp-3'
        )}
      >
        {review.comment}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="text-xs font-semibold text-neutral-900 underline underline-offset-4"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </article>
  );
}
