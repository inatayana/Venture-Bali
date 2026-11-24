import { render, screen } from '@testing-library/react';
import { CuratedRows } from './CuratedRows';
import type { VentureItem, Variant } from '@/types/venture';

let sequence = 0;
function buildVenture(overrides: Partial<VentureItem>): VentureItem {
  sequence += 1;
  const id = overrides.id ?? `vtr-${sequence}`;
  return {
    id,
    slug: `slug-${id}`,
    tenantId: 'tenant-001',
    title: overrides.title ?? `Adventure ${id}`,
    hook3Sec: 'hook',
    duration: '3 hours',
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    essentialInfo: { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] },
    languages: ['en'],
    description: 'Description',
    category: 'Rafting',
    difficulty: 'EASY',
    location: 'Ubud, Gianyar',
    listPriceIdr: 450000,
    promoPriceIdr: null,
    priceIdr: 450000,
    durationHours: 3,
    minParticipants: 1,
    maxParticipants: 8,
    rating: 4.8,
    reviewCount: 10,
    imageUrl: '/images/rafting.svg',
    gallery: [],
    isAvailable: true,
    variants: [],
    createdAt: new Date('2026-01-15T08:00:00Z'),
    updatedAt: new Date('2026-08-01T10:30:00Z'),
    ...overrides,
  };
}

function buildBookableVariant(): Variant {
  return {
    id: `var-${sequence}`,
    ventureId: 'unused',
    title: 'Self Drive',
    shortDescription: 'Meet at the base camp',
    fulfillmentMode: 'SELF_DRIVE',
    sortOrder: 1,
    blackoutDates: [],
    priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 450000 }],
    slotTimes: [
      {
        id: `slot-${sequence}`,
        variantId: 'var-1',
        time: '23:59',
        maxCapacity: 10,
        currentBookings: 0,
        isAvailable: true,
        cutoffHours: 0,
        createdAt: new Date('2026-01-15T08:00:00Z'),
        updatedAt: new Date('2026-01-15T08:00:00Z'),
      },
    ],
    createdAt: new Date('2026-01-15T08:00:00Z'),
    updatedAt: new Date('2026-08-01T10:30:00Z'),
  };
}

const fourBookToday = () =>
  Array.from({ length: 4 }, (_, i) =>
    buildVenture({
      id: `today-${i}`,
      title: `Bookable Today ${i}`,
      variants: [buildBookableVariant()],
    })
  );

const fourHalfDays = () =>
  Array.from({ length: 4 }, (_, i) =>
    buildVenture({
      id: `halfday-${i}`,
      title: `Easy Escape ${i}`,
      durationHours: 3,
      variants: [buildBookableVariant()],
    })
  );

describe('CuratedRows', () => {
  beforeEach(() => {
    sequence = 0;
  });

  it('renders Book Today, Go Today when enough ventures have a bookable slot today', () => {
    render(<CuratedRows ventures={fourBookToday()} />);
    expect(screen.getByRole('region', { name: 'Book Today, Go Today' })).toBeInTheDocument();
  });

  it('hides Book Today, Go Today when too few ventures qualify', () => {
    render(<CuratedRows ventures={fourBookToday().slice(0, 3)} />);
    expect(screen.queryByRole('region', { name: 'Book Today, Go Today' })).not.toBeInTheDocument();
  });

  it('renders Easy Half-Day Escapes for duration ≤ 4h with a self-drive variant', () => {
    render(<CuratedRows ventures={fourHalfDays()} />);
    expect(
      screen.getByRole('region', { name: 'Easy Half-Day Escapes · Under 4 Hours' })
    ).toBeInTheDocument();
  });

  it('hides Easy Half-Day Escapes when too few ventures qualify', () => {
    render(<CuratedRows ventures={fourHalfDays().slice(0, 3)} />);
    expect(
      screen.queryByRole('region', { name: 'Easy Half-Day Escapes · Under 4 Hours' })
    ).not.toBeInTheDocument();
  });

  it('hides both rows when data is sparse', () => {
    render(
      <CuratedRows
        ventures={[
          buildVenture({ id: 'a', title: 'Quiet A', durationHours: 6 }),
          buildVenture({ id: 'b', title: 'Quiet B', durationHours: 6 }),
        ]}
      />
    );
    expect(screen.queryByRole('region', { name: 'Book Today, Go Today' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Easy Half-Day Escapes · Under 4 Hours' })
    ).not.toBeInTheDocument();
  });
});
