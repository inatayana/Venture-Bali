import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VentureCard } from './VentureCard';
import { useWishlist } from '@/store/wishlistStore';
import type { VentureItem } from '@/types/venture';

const mockVenture: VentureItem = {
  id: 'vtr-001',
  slug: 'ubud-rice-terrace-sunrise-tour',
  tenantId: 'tenant-001',
  title: 'Ubud Rice Terrace Sunrise Tour',
  hook3Sec: 'Sunrise over the Tegallalang rice terraces',
  duration: '5 hours',
  highlights: ['Rice terrace walk', 'Local breakfast'],
  inclusions: ['Guide', 'Breakfast', 'Insurance'],
  exclusions: ['Personal expenses'],
  itinerary: [
    { time: '06:00 AM', activity: 'Sunrise walk begins' },
    { time: '09:00 AM', activity: 'Breakfast' },
  ],
  essentialInfo: {
    perfectFor: ['Photographers'],
    whatToBring: ['Camera', 'Water'],
    knowBeforeYouGo: ['Early start'],
  },
  languages: ['en', 'id'],
  description: 'A beautiful tour of the rice terraces at sunrise.',
  category: 'culture',
  difficulty: 'EASY',
  location: 'Ubud, Gianyar',
  listPriceIdr: 450000,
  promoPriceIdr: null,
  priceIdr: 450000,
  durationHours: 5,
  minParticipants: 1,
  maxParticipants: 8,
  rating: 4.9,
  reviewCount: 1284,
  imageUrl: '/images/ventures/ubud-rice-terrace.jpg',
  gallery: ['/images/ventures/ubud-rice-terrace-1.jpg'],
  isAvailable: true,
  variants: [],
  createdAt: new Date('2026-01-15T08:00:00Z'),
  updatedAt: new Date('2026-08-01T10:30:00Z'),
};

describe('VentureCard Component', () => {
  beforeEach(() => {
    useWishlist.setState({ items: [] });
  });

  it('renders venture title and trust badge', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(mockVenture.title)).toBeInTheDocument();
    expect(screen.getByText('Instant Confirmation')).toBeInTheDocument();
  });

  it('formats IDR price correctly', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(/Rp 450\.000|IDR 450\.000/)).toBeInTheDocument();
  });

  it('displays category and duration on line 2', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(/culture · 5h/)).toBeInTheDocument();
  });

  it('displays duration and max participants', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(/5h/)).toBeInTheDocument();
    expect(screen.getByText(/up to 8/)).toBeInTheDocument();
  });

  it('displays rating with review count', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(1284)')).toBeInTheDocument();
  });

  it('renders the category on line 2, not as an image badge', () => {
    render(<VentureCard venture={mockVenture} />);
    const line = screen.getByText(/culture · 5h/);
    expect(line).toBeInTheDocument();
    expect(line).not.toHaveClass('uppercase');
  });

  it('shows Sold Out badge when isAvailable is false', () => {
    const unavailableVenture = { ...mockVenture, isAvailable: false };
    render(<VentureCard venture={unavailableVenture} />);
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  it('renders the venture badge as a top-left pill when set', () => {
    const badged = { ...mockVenture, badge: 'Trending' };
    render(<VentureCard venture={badged} />);
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('maps aggressive badges to warmer labels', () => {
    render(<VentureCard venture={{ ...mockVenture, badge: 'ADRENALINE' }} />);
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.queryByText('ADRENALINE')).not.toBeInTheDocument();
  });

  it('maps EXTREME badges to Guided Adventure', () => {
    render(<VentureCard venture={{ ...mockVenture, badge: 'EXTREME' }} />);
    expect(screen.getByText('Guided Adventure')).toBeInTheDocument();
  });

  it('shows Beginner Friendly in the value tags', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText('Beginner Friendly')).toBeInTheDocument();
  });

  it('shows Sold Out instead of the badge when isAvailable is false', () => {
    const unavailable = { ...mockVenture, badge: 'Trending', isAvailable: false };
    render(<VentureCard venture={unavailable} />);
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.queryByText('Trending')).not.toBeInTheDocument();
  });

  it('does not show Sold Out badge when isAvailable is true', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.queryByText('Sold Out')).not.toBeInTheDocument();
  });

  it('calls onSelect with venture id when clicked', async () => {
    const handleSelect = jest.fn();
    const user = userEvent.setup();
    render(<VentureCard venture={mockVenture} onSelect={handleSelect} />);

    const card = screen.getByTestId('venture-card-vtr-001');
    await user.click(card);

    expect(handleSelect).toHaveBeenCalledWith('vtr-001');
  });

  it('calls onSelect when Enter key is pressed', async () => {
    const handleSelect = jest.fn();
    const user = userEvent.setup();
    render(<VentureCard venture={mockVenture} onSelect={handleSelect} />);

    const card = screen.getByTestId('venture-card-vtr-001');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleSelect).toHaveBeenCalledWith('vtr-001');
  });

  it('does not set role="button" when onSelect is not provided', () => {
    render(<VentureCard venture={mockVenture} />);
    const card = screen.getByTestId('venture-card-vtr-001');
    expect(card).not.toHaveAttribute('role', 'button');
    expect(card).not.toHaveAttribute('tabindex');
  });

  it('sets role="button" and tabindex when onSelect is provided', () => {
    render(<VentureCard venture={mockVenture} onSelect={jest.fn()} />);
    const card = screen.getByTestId('venture-card-vtr-001');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('applies custom className', () => {
    render(<VentureCard venture={mockVenture} className="custom-class" />);
    const card = screen.getByTestId('venture-card-vtr-001');
    expect(card).toHaveClass('custom-class');
  });

  it('renders alt text for image', () => {
    render(<VentureCard venture={mockVenture} />);
    const image = screen.getByAltText(mockVenture.title);
    expect(image).toBeInTheDocument();
  });

  it('offers an optional date check outside the card link', () => {
    const withVariant = {
      ...mockVenture,
      variants: [
        {
          id: 'variant-1',
          ventureId: mockVenture.id,
          title: 'Morning trip',
          shortDescription: 'Morning departure',
          fulfillmentMode: 'SELF_DRIVE',
        },
      ],
    } as VentureItem;
    render(<VentureCard venture={withVariant} href="/experiences/vtr-001/slug" showDateCheck />);

    const button = screen.getByRole('button', { name: /cek tanggal/i });
    const card = screen.getByTestId('venture-card-vtr-001');
    // It must not be nested in the stretched link, or it would be unclickable.
    expect(card.contains(button)).toBe(false);
  });

  // Regression: nesting <a>/<button> inside an outer <a> is invalid HTML and
  // caused the browser to restructure the DOM, producing a React hydration
  // mismatch ("Expected server HTML to contain a matching <div> in <a>").
  it.each(['vertical', 'horizontal'] as const)(
    'renders exactly one link with no nested interactive elements when href is set (%s variant)',
    (variant) => {
      render(
        <VentureCard
          venture={mockVenture}
          href="/experiences/vtr-001/ubud-rice-terrace-sunrise-tour"
          variant={variant}
        />
      );

      const card = screen.getByTestId('venture-card-vtr-001');
      const links = card.querySelectorAll('a');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute(
        'href',
        '/experiences/vtr-001/ubud-rice-terrace-sunrise-tour'
      );
      // The stretched link must not wrap any other <a> or <button>.
      expect(links[0].querySelector('a, button')).toBeNull();
    }
  );

  it('keeps the wishlist button interactive outside the link when href is set', async () => {
    const user = userEvent.setup();
    render(
      <VentureCard
        venture={mockVenture}
        href="/experiences/vtr-001/ubud-rice-terrace-sunrise-tour"
      />
    );

    const card = screen.getByTestId('venture-card-vtr-001');
    const link = card.querySelector('a') as HTMLAnchorElement;
    const wishlist = screen.getByRole('button', {
      name: /save ubud rice terrace sunrise tour to wishlists/i,
    });

    // The wishlist button is a sibling of the link, not a descendant.
    expect(link.contains(wishlist)).toBe(false);

    await user.click(wishlist);
    expect(useWishlist.getState().items.some((item) => item.id === 'vtr-001')).toBe(true);
  });
});
