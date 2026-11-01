import { render, screen } from '@testing-library/react';
import { VentureExplorer } from './VentureExplorer';
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
      <VentureExplorer ventures={[withAvailability, blackedOut, fullyBooked, smallGroup]} />
    );

    expect(screen.getByText(withAvailability.title)).toBeInTheDocument();
    expect(screen.queryByText(blackedOut.title)).not.toBeInTheDocument();
    expect(screen.queryByText(fullyBooked.title)).not.toBeInTheDocument();
  });

  it('hides ventures that cannot host the group size', () => {
    window.history.pushState({}, '', '/?pax=4');

    render(<VentureExplorer ventures={[withAvailability, smallGroup]} />);

    expect(screen.getByText(withAvailability.title)).toBeInTheDocument();
    expect(screen.queryByText(smallGroup.title)).not.toBeInTheDocument();
  });

  it('summarises the active filters', () => {
    window.history.pushState({}, '', `/?date=${FUTURE_DATE}&pax=2`);

    render(<VentureExplorer ventures={[withAvailability, smallGroup]} />);

    expect(screen.getByText(/adventure on 15 Jun for 2 guests/)).toBeInTheDocument();
  });
});

describe('VentureExplorer category deep link', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('filters the catalogue from the ?category= query string', () => {
    window.history.pushState({}, '', '/?category=tubing');

    render(<VentureExplorer ventures={[rafting, tubing]} />);

    expect(screen.getByText(tubing.title)).toBeInTheDocument();
    expect(screen.queryByText(rafting.title)).not.toBeInTheDocument();
  });

  it('shows the full catalogue for an unknown category slug', () => {
    window.history.pushState({}, '', '/?category=hotels');

    render(<VentureExplorer ventures={[rafting, tubing]} />);

    expect(screen.getByText(tubing.title)).toBeInTheDocument();
    expect(screen.getByText(rafting.title)).toBeInTheDocument();
  });
});
