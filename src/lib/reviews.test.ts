import { applyReviewFilters, formatRelativeDate, ratingHistogram } from './reviews';
import type { ReviewSummary } from '@/types/venture';

const NOW = new Date('2026-11-10T12:00:00');

function review(overrides: Partial<ReviewSummary> = {}): ReviewSummary {
  return {
    id: 'rev-1',
    rating: 5,
    comment: 'The guide was brilliant and the river was perfect.',
    author: 'Made',
    country: 'Indonesia',
    isVerified: true,
    createdAt: new Date('2026-11-09T09:00:00'),
    ...overrides,
  };
}

describe('formatRelativeDate', () => {
  it('labels today and yesterday', () => {
    expect(formatRelativeDate(new Date('2026-11-10T09:00:00'), NOW)).toBe('Today');
    expect(formatRelativeDate(new Date('2026-11-09T09:00:00'), NOW)).toBe('Yesterday');
  });

  it('counts days, weeks, months and years', () => {
    expect(formatRelativeDate(new Date('2026-11-07T09:00:00'), NOW)).toBe('3 days ago');
    expect(formatRelativeDate(new Date('2026-10-28T09:00:00'), NOW)).toBe('1 week ago');
    expect(formatRelativeDate(new Date('2026-09-10T09:00:00'), NOW)).toBe('2 months ago');
    expect(formatRelativeDate(new Date('2025-10-10T09:00:00'), NOW)).toBe('1 year ago');
  });
});

describe('applyReviewFilters', () => {
  const reviews = [
    review({ id: 'a', rating: 5, comment: 'Rafting was wild', createdAt: new Date('2026-11-09T09:00:00') }),
    review({ id: 'b', rating: 3, comment: 'Nice but crowded', author: 'Anna', country: 'Germany', createdAt: new Date('2026-11-05T09:00:00') }),
    review({ id: 'c', rating: 4, comment: 'Great guides', createdAt: new Date('2026-11-07T09:00:00') }),
  ];

  it('sorts newest first by default', () => {
    expect(applyReviewFilters(reviews, {}).map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by highest and lowest rating', () => {
    expect(applyReviewFilters(reviews, { sort: 'highest' }).map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(applyReviewFilters(reviews, { sort: 'lowest' }).map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });

  it('searches comment, author and country', () => {
    expect(applyReviewFilters(reviews, { query: 'crowded' }).map((item) => item.id)).toEqual(['b']);
    expect(applyReviewFilters(reviews, { query: 'anna' }).map((item) => item.id)).toEqual(['b']);
    expect(applyReviewFilters(reviews, { query: 'germany' }).map((item) => item.id)).toEqual(['b']);
  });
});

describe('ratingHistogram', () => {
  it('computes counts and percentages per star', () => {
    const histogram = ratingHistogram([review({ rating: 5 }), review({ id: '2', rating: 4 }), review({ id: '3', rating: 4 })]);

    expect(histogram[0]).toEqual({ stars: 5, count: 1, percent: 33 });
    expect(histogram[1]).toEqual({ stars: 4, count: 2, percent: 67 });
    expect(histogram[4]).toEqual({ stars: 1, count: 0, percent: 0 });
  });
});
