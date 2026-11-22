import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, addDays } from 'date-fns';
import { QuickDateCheck } from './QuickDateCheck';

describe('QuickDateCheck', () => {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          days: [
            { date: tomorrow, isFullyBooked: false, fromPriceIdr: 210_000 },
            { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), isFullyBooked: true, fromPriceIdr: null },
          ],
        },
      }),
    }) as jest.Mock;
  });

  afterEach(() => jest.restoreAllMocks());

  it('opens a portalled availability modal with real prices', async () => {
    const user = userEvent.setup();
    render(
      <QuickDateCheck
        variantId="variant-1"
        ventureHref="/experiences/vtr-1/sample"
        label="Sample Adventure"
      />
    );

    await user.click(screen.getByRole('button', { name: /cek tanggal/i }));

    const dialog = await screen.findByRole('dialog', { name: /check dates for sample adventure/i });
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(await screen.findByRole('button', { name: new RegExp('from Rp') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see all dates & book/i })).toHaveAttribute(
      'href',
      '/experiences/vtr-1/sample'
    );
  });

  it('does not render the modal before the guest asks for it', () => {
    render(
      <QuickDateCheck variantId="variant-1" ventureHref="/experiences/vtr-1/sample" label="Sample" />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
