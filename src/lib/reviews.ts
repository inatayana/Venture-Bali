import type { ReviewSummary } from '@/types/venture';

export type ReviewSort = 'newest' | 'highest' | 'lowest';

export const REVIEW_SORTS: ReadonlyArray<{ value: ReviewSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest rating' },
  { value: 'lowest', label: 'Lowest rating' },
];

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", "4 months ago", else a date. */
export function formatRelativeDate(createdAt: Date, now: Date = new Date()): string {
  const day = 24 * 60 * 60 * 1000;
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const diffDays = Math.round((startOfDay(now) - startOfDay(createdAt)) / day);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/** Search + sort applied to the review list shown in the modal. */
export function applyReviewFilters(
  reviews: readonly ReviewSummary[],
  options: { query?: string; sort?: ReviewSort }
): ReviewSummary[] {
  const query = (options.query ?? '').trim().toLowerCase();
  const filtered = query
    ? reviews.filter(
        (review) =>
          review.comment.toLowerCase().includes(query) ||
          review.author.toLowerCase().includes(query) ||
          (review.country ?? '').toLowerCase().includes(query) ||
          (review.location ?? '').toLowerCase().includes(query)
      )
    : [...reviews];

  switch (options.sort) {
    case 'highest':
      return filtered.sort((a, b) => b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime());
    case 'lowest':
      return filtered.sort((a, b) => a.rating - b.rating || b.createdAt.getTime() - a.createdAt.getTime());
    default:
      return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

/** Star histogram (5 → 1) for the summary header. */
export function ratingHistogram(reviews: readonly ReviewSummary[]): Array<{
  stars: number;
  count: number;
  percent: number;
}> {
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    return {
      stars,
      count,
      percent: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
    };
  });
}
