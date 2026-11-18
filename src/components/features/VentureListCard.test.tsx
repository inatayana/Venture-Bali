import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VentureListCard } from './VentureListCard';
import { useWishlist } from '@/store/wishlistStore';
import type { VentureItem } from '@/types/venture';

const mockVenture: VentureItem = {
  id: 'vtr-001',
  slug: 'ubud-rice-terrace-sunrise-tour',
  tenantId: 'tenant-001',
  title: 'Ubud Rice Terrace Sunrise Tour',
  hook3Sec: 'Sunrise over the Tegallalang rice terraces',
  duration: '5 hours',
  highlights: [],
  inclusions: [],
  exclusions: [],
  itinerary: [],
  essentialInfo: { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] },
  languages: ['en', 'id'],
  description: 'A beautiful tour of the rice terraces at sunrise.',
  category: 'Trekking',
  difficulty: 'EASY',
  location: 'Ubud, Gianyar',
  listPriceIdr: 750000,
  promoPriceIdr: 600000,
  priceIdr: 600000,
  durationHours: 5,
  minParticipants: 1,
  maxParticipants: 8,
  rating: 4.91,
  reviewCount: 1284,
  imageUrl: '/images/ventures/ubud-rice-terrace.jpg',
  gallery: [],
  isAvailable: true,
  badge: 'Trending',
  variants: [],
  createdAt: new Date('2026-01-15T08:00:00Z'),
  updatedAt: new Date('2026-08-01T10:30:00Z'),
};

describe('VentureListCard', () => {
  beforeEach(() => {
    useWishlist.setState({ items: [] });
  });

  it('renders the split layout with rating, prices and the value tag', () => {
    render(<VentureListCard venture={mockVenture} />);

    expect(screen.getByText('Ubud Rice Terrace Sunrise Tour')).toBeInTheDocument();
    expect(screen.getByText(/Trekking · 5 hours/)).toBeInTheDocument();
    expect(screen.getByText(/4\.9/)).toBeInTheDocument();
    expect(screen.getByText('1284 reviews')).toBeInTheDocument();
    // Promo anchor price is struck through, net price is shown.
    expect(screen.getByText('Rp 750.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 600.000')).toBeInTheDocument();
    expect(screen.getByText('Promo price')).toBeInTheDocument();
  });

  it('renders the badge and a wishlist toggle', async () => {
    const user = userEvent.setup();
    render(<VentureListCard venture={mockVenture} />);

    expect(screen.getByText('Trending')).toBeInTheDocument();
    const wishlist = screen.getByRole('button', {
      name: /save ubud rice terrace sunrise tour to wishlists/i,
    });
    await user.click(wishlist);
    expect(useWishlist.getState().items.some((item) => item.id === 'vtr-001')).toBe(true);
  });

  it('shows Instant Confirmation when there is no promo', () => {
    render(<VentureListCard venture={{ ...mockVenture, promoPriceIdr: null }} />);
    expect(screen.getByText('Instant Confirmation')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    render(<VentureListCard venture={mockVenture} />);
    const links = screen.getAllByRole('link', { name: /ubud rice terrace sunrise tour/i });
    expect(links[0]).toHaveAttribute('href', '/experiences/vtr-001/ubud-rice-terrace-sunrise-tour');
  });
});
