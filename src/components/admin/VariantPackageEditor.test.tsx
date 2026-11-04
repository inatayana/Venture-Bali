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
  imageUrl: null,
  promoPriceIdr: null,
  promoLabel: null,
  promoStartsAt: null,
  promoEndsAt: null,
  infantEnabled: false,
  inclusions: ['ATV rental', 'Safety gear', 'Hotel shuttle'],
  exclusions: ['Personal expenses'],
};

const photos = [
  '/images/tubing-hero.webp',
  '/images/tubing-river.webp',
  '/images/tubing-guide.webp',
];

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
      imageUrl: null,
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

  it('reuses one of the product photos as the package cover', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ success: true, data: { id: 'var-3' } });

    render(<VariantPackageEditor ventureId="vtr-1" zones={zones} photos={photos} />);

    await user.click(screen.getByRole('button', { name: /add package/i }));

    const cover = screen.getByLabelText(/cover photo/i);
    expect(cover).toHaveValue('');
    expect(screen.getByRole('option', { name: /use the product hero/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/title/i), 'Ubud: Private Transfer');
    await user.type(
      screen.getByLabelText(/short description/i),
      'Private car and driver for your group in Ubud'
    );
    await user.selectOptions(cover, photos[1]);
    await user.click(screen.getByRole('button', { name: /create package/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(payload.imageUrl).toBe('/images/tubing-river.webp');
  }, 20000);

  it('sends a null cover when the package keeps the product hero', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ success: true, data: { id: 'var-1' } });

    render(
      <VariantPackageEditor
        ventureId="vtr-1"
        zones={zones}
        photos={photos}
        variant={existing}
      />
    );

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    await user.selectOptions(screen.getByLabelText(/cover photo/i), photos[0]);
    await user.selectOptions(screen.getByLabelText(/cover photo/i), '');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    // "" clears the variant cover so the product hero is used again.
    expect(payload.imageUrl).toBeNull();
  }, 20000);

  it('renders safely without the product photos prop', async () => {
    const user = userEvent.setup();
    render(<VariantPackageEditor ventureId="vtr-1" zones={zones} />);

    await user.click(screen.getByRole('button', { name: /add package/i }));

    expect(screen.getByLabelText(/cover photo/i)).toHaveValue('');
    expect(screen.getAllByRole('option', { name: /use the product hero/i })).toHaveLength(1);
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
