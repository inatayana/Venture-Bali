import { render, screen, within } from '@testing-library/react';
import { CuratedRows } from './CuratedRows';
import type { VentureItem } from '@/types/venture';

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

describe('CuratedRows', () => {
  beforeEach(() => {
    sequence = 0;
  });

  it('always renders the featured row, badged ventures first', () => {
    const badged = buildVenture({ id: 'badged', title: 'Badged Adventure', badge: 'Trending', rating: 4.0 });
    const highRated = buildVenture({ id: 'rated', title: 'Top Rated Adventure', rating: 5.0 });

    render(<CuratedRows ventures={[highRated, badged]} />);

    const featured = screen.getByRole('region', { name: 'Your next Bali adventure' });
    const links = within(featured).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/experiences/badged/slug-badged');
    expect(within(featured).getByText('Top Rated Adventure')).toBeInTheDocument();
  });

  it('renders the under-1m row only when at least four affordable ventures exist', () => {
    const cheap = Array.from({ length: 4 }, (_, i) =>
      buildVenture({ id: `cheap-${i}`, title: `Budget ${i}`, priceIdr: 500_000 + i })
    );
    const expensive = Array.from({ length: 3 }, (_, i) =>
      buildVenture({ id: `exp-${i}`, title: `Premium ${i}`, priceIdr: 2_000_000 + i })
    );

    const { rerender } = render(<CuratedRows ventures={[...cheap, ...expensive]} />);
    expect(screen.getByRole('region', { name: 'Bali under 1 million IDR' })).toBeInTheDocument();

    rerender(<CuratedRows ventures={[...cheap.slice(0, 3), ...expensive]} />);
    expect(screen.queryByRole('region', { name: 'Bali under 1 million IDR' })).not.toBeInTheDocument();
  });

  it('renders a category row only for categories with at least four ventures', () => {
    const tubing = Array.from({ length: 4 }, (_, i) =>
      buildVenture({ id: `tubing-${i}`, title: `Tubing Trip ${i}`, category: 'Tubing' })
    );
    const trekking = [buildVenture({ id: 'trek-1', title: 'Lone Trek', category: 'Trekking' })];

    render(<CuratedRows ventures={[...tubing, ...trekking]} />);

    expect(screen.getByRole('region', { name: 'Tubing' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Trekking' })).not.toBeInTheDocument();
  });
});
