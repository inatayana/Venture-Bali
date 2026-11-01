import {
  histogramFromCounts,
  parseReviewFeedParams,
  reviewFeedOrderBy,
  reviewFeedWhere,
  toReviewSummary,
} from './reviewFeed';

describe('parseReviewFeedParams', () => {
  it('uses safe defaults', () => {
    expect(parseReviewFeedParams(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 8,
      query: '',
      sort: 'newest',
    });
  });

  it('clamps paging and ignores unknown sorts', () => {
    expect(
      parseReviewFeedParams(new URLSearchParams({ page: '-4', limit: '500', sort: 'hacked' }))
    ).toEqual({ page: 1, pageSize: 20, query: '', sort: 'newest' });

    expect(parseReviewFeedParams(new URLSearchParams({ page: '3', limit: '5' }))).toMatchObject({
      page: 3,
      pageSize: 5,
    });
  });

  it('keeps valid sorts and trims the query', () => {
    expect(
      parseReviewFeedParams(new URLSearchParams({ sort: 'lowest', q: '  ubud  ' }))
    ).toMatchObject({ sort: 'lowest', query: 'ubud' });
  });
});

describe('reviewFeedWhere', () => {
  it('only exposes approved reviews of the venture', () => {
    expect(reviewFeedWhere('v1', '')).toEqual({ ventureId: 'v1', isApproved: true });
  });

  it('searches comments, guest profile and booking customer', () => {
    const where = reviewFeedWhere('v1', 'woodbridge');
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { comment: { contains: 'woodbridge', mode: 'insensitive' } },
        { guestName: { contains: 'woodbridge', mode: 'insensitive' } },
        { guestLocation: { contains: 'woodbridge', mode: 'insensitive' } },
        { customer: { name: { contains: 'woodbridge', mode: 'insensitive' } } },
      ])
    );
  });
});

describe('reviewFeedOrderBy', () => {
  it('maps the three public sorts', () => {
    expect(reviewFeedOrderBy('newest')[0]).toEqual({ createdAt: 'desc' });
    expect(reviewFeedOrderBy('highest')[0]).toEqual({ rating: 'desc' });
    expect(reviewFeedOrderBy('lowest')[0]).toEqual({ rating: 'asc' });
  });
});

describe('toReviewSummary', () => {
  it('prefers the guest display name and location', () => {
    const summary = toReviewSummary({
      id: 'r1',
      rating: 5,
      comment: 'Amazing trip',
      guestName: 'Nicholas',
      guestLocation: 'Woodbridge Township, NJ',
      bookingId: 'bk-1',
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      customer: { name: 'Made Wijaya', countryCode: 'ID' },
    });

    expect(summary).toMatchObject({
      author: 'Nicholas',
      location: 'Woodbridge Township, NJ',
      country: 'Indonesia',
      isVerified: true,
    });
  });

  it('falls back to the customer first name and country', () => {
    const summary = toReviewSummary({
      id: 'r2',
      rating: 4,
      comment: 'Great guides',
      bookingId: null,
      createdAt: new Date('2026-11-02T00:00:00.000Z'),
      customer: { name: 'Anna Weber', countryCode: 'DE' },
    });

    expect(summary.author).toBe('Anna');
    expect(summary.location).toBe('Germany');
    expect(summary.isVerified).toBe(false);
  });
});

describe('histogramFromCounts', () => {
  it('computes 5-to-1 percentages from grouped counts', () => {
    const histogram = histogramFromCounts([
      { rating: 5, count: 2 },
      { rating: 4, count: 2 },
    ]);

    expect(histogram[0]).toEqual({ stars: 5, count: 2, percent: 50 });
    expect(histogram[1]).toEqual({ stars: 4, count: 2, percent: 50 });
    expect(histogram[4]).toEqual({ stars: 1, count: 0, percent: 0 });
  });
});
