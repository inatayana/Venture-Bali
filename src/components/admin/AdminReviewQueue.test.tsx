import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminReviewQueue, type AdminReviewItem } from './AdminReviewQueue';

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function buildReview(overrides: Partial<AdminReviewItem> = {}): AdminReviewItem {
  return {
    id: 'rev-1',
    ventureId: 'ven-1',
    ventureTitle: 'Ubud River Tubing',
    rating: 5,
    comment: 'Brilliant day on the river with a very patient guide.',
    guestName: 'Justin',
    guestLocation: 'Australia',
    bookingCode: null,
    bookingDate: null,
    source: 'FOUNDING_GUEST',
    isApproved: true,
    photos: [],
    createdAt: '2026-11-04T15:39:45.000Z',
    ...overrides,
  };
}

describe('AdminReviewQueue', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    mockRefresh.mockReset();
  });

  it('labels every source as Verified and offers no approve action', () => {
    render(
      <AdminReviewQueue
        reviews={[
          buildReview(),
          buildReview({ id: 'rev-2', source: 'IMPORTED', guestName: 'Marta' }),
          buildReview({ id: 'rev-3', source: 'VERIFIED_BOOKING', guestName: 'Made' }),
        ]}
      />
    );

    expect(screen.getAllByText('Verified')).toHaveLength(3);
    expect(screen.queryByText('Founding guest')).not.toBeInTheDocument();
    expect(screen.queryByText('Imported review')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^delete$/i })).toHaveLength(3);
  });

  it('deletes the selected reviews in one request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    render(<AdminReviewQueue reviews={[buildReview()]} />);

    await user.click(screen.getByLabelText('Select review by Justin'));
    await user.click(screen.getByRole('button', { name: /delete selected/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/reviews/bulk');
    expect(JSON.parse(String(init.body))).toEqual({ ids: ['rev-1'], action: 'delete' });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
