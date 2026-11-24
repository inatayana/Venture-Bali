import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useWishlist, type WishlistItem } from '@/store/wishlistStore';
import { WishlistCard } from './WishlistCard';

const sampleItem: WishlistItem = {
  id: 'vtr-001',
  slug: 'ubud-rice-terrace-sunrise-tour',
  title: 'Ubud Rice Terrace Sunrise Tour',
  imageUrl: 'https://example.com/ubud-rice-terrace.jpg',
  category: 'Cycling',
  duration: '8 hours',
  rating: 4.94,
  priceFromIdr: 250000,
  savedAt: 1000,
  badge: 'Trending',
  reviewCount: 6229,
};

describe('WishlistCard', () => {
  beforeEach(() => {
    useWishlist.setState({ items: [] });
  });

  it('renders title, category, duration, rating, review count, badge and price', () => {
    render(<WishlistCard item={sampleItem} />);
    expect(screen.getByText('Ubud Rice Terrace Sunrise Tour')).toBeInTheDocument();
    expect(screen.getByText(/Cycling/)).toBeInTheDocument();
    expect(screen.getByText(/8 hours/)).toBeInTheDocument();
    expect(screen.getByText('4.94')).toBeInTheDocument();
    expect(screen.getByText('6,229 ratings')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText(/From/)).toBeInTheDocument();
  });

  it('toggles the wishlist and reports removal', async () => {
    const user = userEvent.setup();
    useWishlist.setState({ items: [sampleItem] });
    const onRemoved = jest.fn();
    render(<WishlistCard item={sampleItem} onRemoved={onRemoved} />);
    const heart = screen.getByRole('button', {
      name: /remove ubud rice terrace sunrise tour from wishlist/i,
    });
    await user.click(heart);
    expect(useWishlist.getState().has(sampleItem.id)).toBe(false);
    expect(onRemoved).toHaveBeenCalledWith(sampleItem);
  });
});
