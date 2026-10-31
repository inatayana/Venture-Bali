import { render, screen } from '@testing-library/react';
import { VentureExplorer } from './VentureExplorer';
import type { VentureItem } from '@/types/venture';

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
