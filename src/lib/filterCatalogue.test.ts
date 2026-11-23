import { DEFAULT_CATALOGUE_FILTERS, filterCatalogue } from './filterCatalogue';
import type { VentureItem } from '@/types/venture';

function venture(overrides: Partial<VentureItem> = {}): VentureItem {
  return {
    id: 'vtr-1',
    slug: 'sample-adventure',
    tenantId: 'tenant-1',
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
    listPriceIdr: 450_000,
    promoPriceIdr: null,
    priceIdr: 450_000,
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

const SHORT_FREE = venture({
  id: 'short-free',
  slug: 'short-free',
  title: 'Quick Tubing',
  durationHours: 2,
  priceIdr: 150_000,
  rating: 4.6,
});

const FULL_INSTANT = venture({
  id: 'full-instant',
  slug: 'full-instant',
  title: 'Full Day ATV',
  badge: 'Instant Confirmation',
  durationHours: 8,
  priceIdr: 600_000,
  rating: 4.9,
});

const ALL = [SHORT_FREE, FULL_INSTANT];

describe('filterCatalogue extended filters', () => {
  it('defaults to no extended filters', () => {
    expect(filterCatalogue(ALL, DEFAULT_CATALOGUE_FILTERS)).toHaveLength(2);
  });

  it('filters by instant confirmation badges', () => {
    // Refund policy v2: every product is refundable at 80% ≥24h, so the
    // retired "Free Cancellation" filter was removed from the catalogue.
    expect(
      filterCatalogue(ALL, { ...DEFAULT_CATALOGUE_FILTERS, instantConfirmationOnly: true }).map((v) => v.id)
    ).toEqual(['full-instant']);
  });

  it('filters by duration bucket', () => {
    expect(
      filterCatalogue(ALL, { ...DEFAULT_CATALOGUE_FILTERS, durationBucket: 'short' }).map((v) => v.id)
    ).toEqual(['short-free']);
    expect(
      filterCatalogue(ALL, { ...DEFAULT_CATALOGUE_FILTERS, durationBucket: 'full' }).map((v) => v.id)
    ).toEqual(['full-instant']);
  });

  it('filters by max price and minimum rating', () => {
    expect(filterCatalogue(ALL, { ...DEFAULT_CATALOGUE_FILTERS, maxPriceIdr: 200_000 })).toHaveLength(1);
    expect(filterCatalogue(ALL, { ...DEFAULT_CATALOGUE_FILTERS, minRating: 4.8 })).toHaveLength(1);
  });

  it('combines filters without mutating the source array', () => {
    const result = filterCatalogue(ALL, {
      ...DEFAULT_CATALOGUE_FILTERS,
      durationBucket: 'short',
      maxPriceIdr: 200_000,
    });
    expect(result.map((v) => v.id)).toEqual(['short-free']);
    expect(ALL).toHaveLength(2);
  });
});
