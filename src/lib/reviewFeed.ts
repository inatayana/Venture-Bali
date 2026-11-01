import type { Prisma } from '@prisma/client';
import { findCountry } from '@/lib/countries';
import { REVIEW_SORTS, type ReviewSort } from '@/lib/reviews';
import type { ReviewSummary } from '@/types/venture';

/** Reviews per request; the modal asks for the next page on demand. */
export const REVIEW_PAGE_SIZE = 8;
export const REVIEW_MAX_PAGE_SIZE = 20;

export interface ReviewFeedQuery {
  page: number;
  pageSize: number;
  query: string;
  sort: ReviewSort;
}

/** Sanitise public query params so a bad URL can never ask for 10k rows. */
export function parseReviewFeedParams(searchParams: URLSearchParams): ReviewFeedQuery {
  const rawPage = Number(searchParams.get('page') ?? '1');
  const rawSize = Number(searchParams.get('limit') ?? REVIEW_PAGE_SIZE);
  const sortParam = searchParams.get('sort');
  const sort = REVIEW_SORTS.some((option) => option.value === sortParam)
    ? (sortParam as ReviewSort)
    : 'newest';

  return {
    page: Number.isFinite(rawPage) ? Math.min(500, Math.max(1, Math.floor(rawPage))) : 1,
    pageSize: Number.isFinite(rawSize)
      ? Math.min(REVIEW_MAX_PAGE_SIZE, Math.max(1, Math.floor(rawSize)))
      : REVIEW_PAGE_SIZE,
    query: (searchParams.get('q') ?? '').trim().slice(0, 80),
    sort,
  };
}

/** Shared filter: published reviews of one venture, optionally text-searched. */
export function reviewFeedWhere(ventureId: string, query: string): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { ventureId, isApproved: true };
  if (!query) return where;

  const contains = { contains: query, mode: 'insensitive' as const };
  where.OR = [
    { comment: contains },
    { guestName: contains },
    { guestLocation: contains },
    { customer: { name: contains } },
    { customer: { countryCode: { equals: query.toUpperCase() } } },
  ];
  return where;
}

export function reviewFeedOrderBy(sort: ReviewSort): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case 'highest':
      return [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];
    case 'lowest':
      return [{ rating: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }];
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

interface ReviewRecord {
  id: string;
  rating: number;
  comment: string;
  guestName?: string | null;
  guestLocation?: string | null;
  bookingId?: string | null;
  createdAt: Date;
  customer?: { name: string; countryCode: string } | null;
}

/** Single mapping used by both the PDP server render and the review feed API. */
export function toReviewSummary(review: ReviewRecord): ReviewSummary {
  const countryName = review.customer?.countryCode
    ? findCountry(review.customer.countryCode).name
    : undefined;

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    author:
      review.guestName?.trim() ||
      review.customer?.name?.trim().split(' ')[0] ||
      'Verified guest',
    country: countryName,
    location: review.guestLocation?.trim() || countryName,
    isVerified: Boolean(review.bookingId),
    createdAt: review.createdAt,
  };
}

/** Star histogram (5 → 1) for the modal header. */
export function histogramFromCounts(
  counts: ReadonlyArray<{ rating: number; count: number }>
): Array<{ stars: number; count: number; percent: number }> {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = counts.filter((item) => item.rating === stars).reduce((sum, item) => sum + item.count, 0);
    return {
      stars,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}
