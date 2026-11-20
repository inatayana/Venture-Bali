import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import { HomeCatalogue } from './HomeCatalogue';
import { SearchProvider } from '@/components/search/SearchProvider';
import { ExploreFiltersProvider } from '@/components/features/ExploreFiltersProvider';
import type { VentureItem } from '@/types/venture';

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ExploreFiltersProvider>
      <SearchProvider>{children}</SearchProvider>
    </ExploreFiltersProvider>
  );
}

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

const rafting = buildVenture({
  id: 'vtr-rafting',
  slug: 'ayung-rafting-adventure',
  title: 'Ayung Rafting Adventure',
  category: 'Rafting',
});

const atv = buildVenture({
  id: 'vtr-atv',
  slug: 'ubud-atv-quad-adventure',
  title: 'Ubud ATV Quad Adventure',
  category: 'ATV',
  imageUrl: '/images/atv.svg',
  gallery: ['/images/atv.svg'],
});

function renderCatalogue() {
  render(<HomeCatalogue ventures={[rafting, atv]} />, { wrapper: Providers });
  return screen.getByRole('button', { name: /^filters/i });
}

describe('HomeCatalogue filter entry', () => {
  it('places Filters before sort and View all, and keeps View all pointing at /explore', () => {
    const filters = renderCatalogue();
    const sort = screen.getByRole('button', { name: /sort adventures/i });
    const viewAll = screen.getByRole('link', { name: /view all/i });

    expect(filters.compareDocumentPosition(sort) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sort.compareDocumentPosition(viewAll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(viewAll).toHaveAttribute('href', '/explore');
    // Visible on every viewport (no md-only hiding): mobile needs the entry too.
    expect(filters).not.toHaveClass('hidden');
  });

  it('opens the Filters modal in place and filters the grid live', async () => {
    const user = userEvent.setup();
    renderCatalogue();

    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^filters/i }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/logistics & featured/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show 2 results/i })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'ATV' }));

    expect(screen.getByRole('button', { name: /show 1 result$/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { name: 'Ayung Rafting Adventure' })).toHaveLength(0);
    expect(screen.getAllByRole('heading', { name: 'Ubud ATV Quad Adventure' }).length).toBeGreaterThan(0);
  });

  it('keeps the desktop quick pills filtering without a second Filters button in the strip', async () => {
    const user = userEvent.setup();
    renderCatalogue();

    // Exactly one filter entry per viewport: the heading trigger plus the
    // mobile top-bar button (outside this component), never the desktop strip.
    expect(screen.getAllByRole('button', { name: /^filters/i })).toHaveLength(1);

    await user.click(screen.getByRole('radio', { name: /^ATV not selected/i }));

    expect(screen.queryAllByRole('heading', { name: 'Ayung Rafting Adventure' })).toHaveLength(0);
  });
});
