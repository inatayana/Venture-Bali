import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantPackageEditor, type AdminVariantDraft } from './VariantPackageEditor';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const zones = [
  {
    id: 'zone-1',
    name: 'Core Area — Ubud & Gianyar',
    surchargeIdr: 0,
    isCustomQuote: false,
  },
  {
    id: 'zone-2',
    name: 'South 1 — Kuta, Seminyak, Canggu, Sanur',
    surchargeIdr: 224000,
    isCustomQuote: false,
  },
];

const existing: AdminVariantDraft = {
  id: 'var-1',
  title: 'South Bali: Shared Pickup',
  shortDescription: 'Shared hotel shuttle from Kuta, Seminyak, Canggu or Sanur',
  fulfillmentMode: 'SHARED_TRANSFER',
  pickupZoneId: 'zone-2',
  duration: '3 hours',
  badge: null,
  transportBadge: '🚐 Shared Transfer',
  minimumSpendIdr: null,
  sortOrder: 3,
  priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 450000 }],
  bookingCount: 0,
};

const originalFetch = globalThis.fetch;

function mockFetch(body: unknown, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: jest.fn().mockResolvedValue(body),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  refresh.mockReset();
});

describe('VariantPackageEditor', () => {
  it('creates a package with the locked pickup zone', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ success: true, data: { id: 'var-2' } });

    render(<VariantPackageEditor ventureId="vtr-1" zones={zones} />);

    await user.click(screen.getByRole('button', { name: /add package/i }));

    await user.type(screen.getByLabelText(/title/i), 'Ubud: Private Transfer');
    await user.type(
      screen.getByLabelText(/short description/i),
      'Private car and driver for your group in Ubud'
    );
    await user.selectOptions(screen.getByLabelText(/fulfilment mode/i), 'PRIVATE_TRANSFER');
    await user.selectOptions(screen.getByLabelText(/locked pickup zone/i), 'zone-1');
    await user.clear(screen.getByLabelText(/minimum spend/i));

    await user.click(screen.getByRole('button', { name: /create package/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/ventures/vtr-1/variants');
    expect(init.method).toBe('POST');

    const payload = JSON.parse(String(init.body));
    expect(payload).toMatchObject({
      title: 'Ubud: Private Transfer',
      fulfillmentMode: 'PRIVATE_TRANSFER',
      pickupZoneId: 'zone-1',
      priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 500000 }],
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  }, 20000);

  it('saves edits with PATCH', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ success: true, data: { id: 'var-1' } });

    render(<VariantPackageEditor ventureId="vtr-1" zones={zones} variant={existing} />);

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByLabelText(/title/i)).toHaveValue('South Bali: Shared Pickup');

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), 'South Bali: Shared Shuttle');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/variants/var-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body)).title).toBe('South Bali: Shared Shuttle');
  }, 20000);

  it('clears the pickup zone when switching to self drive', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ success: true, data: { id: 'var-1' } });

    render(<VariantPackageEditor ventureId="vtr-1" zones={zones} variant={existing} />);

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    await user.selectOptions(screen.getByLabelText(/fulfilment mode/i), 'SELF_DRIVE');
    expect(screen.getByLabelText(/locked pickup zone/i)).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(payload.fulfillmentMode).toBe('SELF_DRIVE');
    expect(payload.pickupZoneId).toBeNull();
  });

  it('blocks deleting a package that already has bookings', () => {
    render(
      <VariantPackageEditor
        ventureId="vtr-1"
        zones={zones}
        variant={{ ...existing, bookingCount: 2 }}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('shows the API error message', async () => {
    const user = userEvent.setup();
    mockFetch(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'priceTiers: Price tiers must not overlap' },
      },
      false
    );

    render(<VariantPackageEditor ventureId="vtr-1" zones={zones} />);
    await user.click(screen.getByRole('button', { name: /add package/i }));
    await user.click(screen.getByRole('button', { name: /create package/i }));

    expect(
      await screen.findByText(/priceTiers: Price tiers must not overlap/)
    ).toBeInTheDocument();
  });
});
