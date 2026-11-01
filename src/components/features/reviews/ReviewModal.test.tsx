import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewsSection } from './ReviewsSection';
import type { ReviewSummary } from '@/types/venture';

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));

function review(overrides: Partial<ReviewSummary> = {}): ReviewSummary {
  return {
    id: 'rev-1',
    rating: 5,
    comment: 'So amazing! Would definitely recommend.',
    author: 'Nicholas',
    location: 'Woodbridge Township, NJ',
    isVerified: true,
    createdAt: new Date('2026-11-08T09:00:00.000Z'),
    ...overrides,
  };
}

const INITIAL: ReviewSummary[] = [
  review({ id: 'r1', author: 'Nicholas' }),
  review({ id: 'r2', author: 'Anna', rating: 4, comment: 'Great guides and a smooth pickup.' }),
];

function feedPayload(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      reviews: [review({ id: 'r2', author: 'Anna' })],
      page: 1,
      pageSize: 8,
      total: 3,
      overallTotal: 3,
      totalPages: 1,
      hasMore: true,
      average: 4.7,
      histogram: [
        { stars: 5, count: 2, percent: 67 },
        { stars: 4, count: 1, percent: 33 },
        { stars: 3, count: 0, percent: 0 },
        { stars: 2, count: 0, percent: 0 },
        { stars: 1, count: 0, percent: 0 },
      ],
      ...overrides,
    },
  };
}

function jsonResponse(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => payload,
  } as Response);
}

describe('ReviewModal review feed', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('pages through the live review feed', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(feedPayload({ reviews: [review({ id: 'r1', author: 'Nicholas' })] }))
      )
      .mockResolvedValueOnce(
        jsonResponse(
          feedPayload({
            reviews: [review({ id: 'r3', author: 'Liam', comment: 'Loved the canyon section.' })],
            page: 2,
            hasMore: false,
          })
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
      <ReviewsSection reviews={INITIAL} average={4.7} count={3} ventureId="venture-1" />
    );

    await user.click(screen.getByRole('button', { name: /read all/i }));

    const dialog = screen.getByRole('dialog');
    await waitFor(() =>
      expect(within(dialog).getByText(/show more reviews/i)).toBeInTheDocument()
    );

    await user.click(within(dialog).getByRole('button', { name: /show more reviews/i }));

    expect(await within(dialog).findByText('Liam')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('page=2');
  });

  it('asks the feed for a search query', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(feedPayload()));
    global.fetch = fetchMock as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
      <ReviewsSection reviews={INITIAL} average={4.7} count={3} ventureId="venture-1" />
    );

    await user.click(screen.getByRole('button', { name: /read all/i }));
    await user.type(screen.getByLabelText('Search all reviews'), 'shuttle');

    await waitFor(() => {
      const lastUrl = String(fetchMock.mock.calls.at(-1)?.[0] ?? '');
      expect(lastUrl).toContain('q=shuttle');
    });
  });
});
