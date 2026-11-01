import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewForm } from './ReviewForm';

function jsonResponse(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => payload,
  } as Response);
}

describe('ReviewForm', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('prefills the guest profile and submits it with the review', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
      <ReviewForm
        bookingId="booking-1"
        token="cl1.payload.signature"
        ventureTitle="Ubud River Tubing"
        defaultName="Made Wijaya"
        defaultLocation="Indonesia"
      />
    );

    expect(screen.getByLabelText('Your name')).toHaveValue('Made Wijaya');
    expect(screen.getByLabelText('Where are you from?')).toHaveValue('Indonesia');

    await user.clear(screen.getByLabelText('Your name'));
    await user.type(screen.getByLabelText('Your name'), 'Nicholas');
    await user.clear(screen.getByLabelText('Where are you from?'));
    await user.type(screen.getByLabelText('Where are you from?'), 'Woodbridge Township, NJ');
    await user.click(screen.getByRole('button', { name: '5 stars' }));
    await user.type(
      screen.getByLabelText('Your review'),
      'So amazing! Would definitely recommend this trip to anyone visiting Bali.'
    );
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByText('Thank you!')).toBeInTheDocument();

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.guestName).toBe('Nicholas');
    expect(body.guestLocation).toBe('Woodbridge Township, NJ');
    expect(body.rating).toBe(5);
  });

  it('requires a display name', async () => {
    const user = userEvent.setup();
    render(
      <ReviewForm
        bookingId="booking-1"
        token="cl1.payload.signature"
        ventureTitle="Ubud River Tubing"
        defaultName=""
      />
    );

    await user.click(screen.getByRole('button', { name: '5 stars' }));
    await user.type(
      screen.getByLabelText('Your review'),
      'So amazing! Would definitely recommend this trip to anyone visiting Bali.'
    );
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    expect(
      screen.getByText('Enter the name you want shown with your review.')
    ).toBeInTheDocument();
  });
});
