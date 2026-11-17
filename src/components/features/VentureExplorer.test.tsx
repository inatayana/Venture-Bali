import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VentureExplorer } from './VentureExplorer';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
import { SearchProvider } from '@/components/search/SearchProvider';
import type { VentureItem, Variant } from '@/types/venture';

function buildVenture(overrides: Partial<VentureItem>): VentureItem {
  return {
    id: 'vtr-001',
    slug: 'sample-adventure',
    tenantId: 'tenant-001',
    title: 'Sample Adventure',
    hook3Sec: 'A short hook',
    duration: '3 hours',
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    essentialInfo: { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] },
    languages: ['en'],
    description: 'A sample adventure in Bali.',
    category: 'Rafting',
    difficulty: 'EASY',
    location: 'Ubud, Gianyar',
    listPriceIdr: 450000,
    promoPriceIdr: null,
    priceIdr: 450000,
    durationHours: 3,
    minParticipants: 1,
    maxParticipants: 10,
    rating: 4.8,
    reviewCount: 10,
    imageUrl: '/images/rafting.svg',
    gallery: ['/images/rafting.svg'],
    isAvailable: true,
    variants: [],
    createdAt: new Date('2026-01-15T08:00:00Z'),
    updatedAt: new Date('2026-08-01T10:30:00Z'),
    ...overrides,
  };
}

const rafting = buildVenture({ id: 'vtr-rafting', title: 'Ayung Rafting Adventure' });
const tubing = buildVenture({
  id: 'vtr-tubing',
  title: 'Ubud Tubing: Hidden Canyon Adventure',
  category: 'River Tubing',
});

function buildVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    id: 'var-1',
    ventureId: 'vtr-001',
    title: 'Self Drive',
    shortDescription: 'Meet at the base camp',
    fulfillmentMode: 'SELF_DRIVE',
    sortOrder: 1,
    blackoutDates: [],
    priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 450000 }],
    slotTimes: [
      {
        id: 'slot-1',
        variantId: 'var-1',
        time: '09:00 AM',
        maxCapacity: 10,
        currentBookings: 2,
        isAvailable: true,
        createdAt: new Date('2026-01-15T08:00:00Z'),
        updatedAt: new Date('2026-01-15T08:00:00Z'),
      },
    ],
    createdAt: new Date('2026-01-15T08:00:00Z'),
    updatedAt: new Date('2026-01-15T08:00:00Z'),
    ...overrides,
  };
}

const FUTURE_DATE = '2027-06-15';

const withAvailability = buildVenture({
  id: 'vtr-open',
  title: 'Open Adventure',
  variants: [buildVariant()],
});

const transferOnly = buildVenture({
  id: 'vtr-transfer',
  title: 'Hotel Pickup Combo',
  category: 'Combo',
  variants: [buildVariant({ id: 'var-transfer', fulfillmentMode: 'PRIVATE_TRANSFER' })],
});

const blackedOut = buildVenture({
  id: 'vtr-closed',
  title: 'Closed Adventure',
  variants: [buildVariant({ blackoutDates: [FUTURE_DATE] })],
});

const smallGroup = buildVenture({
  id: 'vtr-small',
  title: 'Small Group Adventure',
  maxParticipants: 1,
  variants: [buildVariant()],
});

const fullyBooked = buildVenture({
  id: 'vtr-booked',
  title: 'Fully Booked Adventure',
  variants: [
    buildVariant({
      slotTimes: [
        {
          id: 'slot-full',
          variantId: 'var-1',
          time: '09:00 AM',
          maxCapacity: 4,
          currentBookings: 4,
          isAvailable: true,
          createdAt: new Date('2026-01-15T08:00:00Z'),
          updatedAt: new Date('2026-01-15T08:00:00Z'),
        },
      ],
    }),
  ],
});

describe('VentureExplorer date and pax filter', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('keeps only ventures with a free departure on the chosen date', () => {
    window.history.pushState({}, '', `/?date=${FUTURE_DATE}&pax=2`);

    render(
      <VentureExplorer ventures={[withAvailability, blackedOut, fullyBooked, smallGroup]} />,
      { wrapper: SearchProvider }
    );

    expect(screen.getByText(withAvailability.title)).toBeInTheDocument();
    expect(screen.queryByText(blackedOut.title)).not.toBeInTheDocument();
    expect(screen.queryByText(fullyBooked.title)).not.toBeInTheDocument();
  });

  it('hides ventures that cannot host the group size', () => {
    window.history.pushState({}, '', '/?pax=4');

    render(<VentureExplorer ventures={[withAvailability, smallGroup]} />, { wrapper: SearchProvider });

    expect(screen.getByText(withAvailability.title)).toBeInTheDocument();
    expect(screen.queryByText(smallGroup.title)).not.toBeInTheDocument();
  });

  it('summarises the active filters', () => {
    window.history.pushState({}, '', `/?date=${FUTURE_DATE}&pax=2`);

    render(<VentureExplorer ventures={[withAvailability, smallGroup]} />, {
      wrapper: SearchProvider,
    });

    expect(screen.getByText('15 Jun')).toBeInTheDocument();
    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });
});

describe('VentureExplorer explore-mode filter pills', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('shows the pill strip and opens the full-screen filter modal from the Filters pill', async () => {
    const user = userEvent.setup();
    render(<VentureExplorer ventures={[rafting]} mode="explore" />, { wrapper: SearchProvider });

    expect(screen.getByRole('button', { name: /transfer included/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /self-drive/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^filters/i }));
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('Self-Drive pill hides transfer-only ventures and vice versa', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <VentureExplorer ventures={[withAvailability, transferOnly]} mode="explore" />,
      { wrapper: SearchProvider }
    );

    await user.click(screen.getByRole('button', { name: /self-drive/i }));
    expect(screen.getAllByText(withAvailability.title).length).toBeGreaterThan(0);
    expect(screen.queryByText(transferOnly.title)).not.toBeInTheDocument();

    unmount();

    render(<VentureExplorer ventures={[withAvailability, transferOnly]} mode="explore" />, {
      wrapper: SearchProvider,
    });
    await user.click(screen.getByRole('button', { name: /transfer included/i }));
    expect(screen.getAllByText(transferOnly.title).length).toBeGreaterThan(0);
    expect(screen.queryByText(withAvailability.title)).not.toBeInTheDocument();
  });

  it('category pill filters the catalogue', async () => {
    const user = userEvent.setup();
    render(<VentureExplorer ventures={[rafting, tubing]} mode="explore" />, {
      wrapper: SearchProvider,
    });

    await user.click(screen.getByRole('radio', { name: /^rafting/i }));
    expect(screen.getAllByText(rafting.title).length).toBeGreaterThan(0);
    expect(screen.queryByText(tubing.title)).not.toBeInTheDocument();
  });

  it('shows the State 4 list header with live count and a reset control', async () => {
    const user = userEvent.setup();
    render(<VentureExplorer ventures={[withAvailability]} mode="explore" />, {
      wrapper: SearchProvider,
    });

    await user.click(screen.getByRole('button', { name: /self-drive/i }));
    expect(screen.getByRole('heading', { name: /explore 1 adventure/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    expect(
      screen.queryByRole('heading', { name: /explore 1 adventure/i })
    ).not.toBeInTheDocument();
  });

  it('Reset Filters restores ventures hidden by the pill filters', async () => {
    const user = userEvent.setup();
    render(<VentureExplorer ventures={[transferOnly]} mode="explore" />, {
      wrapper: SearchProvider,
    });

    await user.click(screen.getByRole('button', { name: /self-drive/i }));
    expect(screen.queryByText(transferOnly.title)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(screen.getByText(transferOnly.title)).toBeInTheDocument();
  });
});

describe('VentureExplorer category deep link', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('filters the catalogue from the ?category= query string', () => {
    window.history.pushState({}, '', '/?category=tubing');

    render(<VentureExplorer ventures={[rafting, tubing]} />, { wrapper: SearchProvider });

    expect(screen.getByText(tubing.title)).toBeInTheDocument();
    expect(screen.queryByText(rafting.title)).not.toBeInTheDocument();
  });

  it('shows the full catalogue for an unknown category slug', () => {
    window.history.pushState({}, '', '/?category=hotels');

    render(<VentureExplorer ventures={[rafting, tubing]} />, { wrapper: SearchProvider });

    expect(screen.getByText(tubing.title)).toBeInTheDocument();
    expect(screen.getByText(rafting.title)).toBeInTheDocument();
  });
});
