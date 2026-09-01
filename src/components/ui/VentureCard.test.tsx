import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VentureCard } from './VentureCard';
import type { VentureItem } from '@/types/venture';

const mockVenture: VentureItem = {
  id: 'vtr-001',
  slug: 'ubud-rice-terrace-sunrise-tour',
  title: 'Ubud Rice Terrace Sunrise Tour',
  description: 'A beautiful tour of the rice terraces at sunrise.',
  category: 'culture',
  location: 'Ubud, Gianyar',
  priceIdr: 450000,
  durationHours: 5,
  minParticipants: 1,
  maxParticipants: 8,
  rating: 4.9,
  reviewCount: 1284,
  imageUrl: '/images/ventures/ubud-rice-terrace.jpg',
  isAvailable: true,
  createdAt: '2026-01-15T08:00:00Z',
  updatedAt: '2026-08-01T10:30:00Z',
};

describe('VentureCard Component', () => {
  it('renders venture title and description', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(mockVenture.title)).toBeInTheDocument();
    expect(screen.getByText(mockVenture.description)).toBeInTheDocument();
  });

  it('formats IDR price correctly', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(/Rp 450\.000|IDR 450\.000/)).toBeInTheDocument();
  });

  it('displays location with map pin icon', () => {
    render(<VentureCard venture={mockVenture} />);
    expect(screen.getByText(mockVenture.location)).toBeInTheDocument();
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

  it('renders the category badge', () => {
    render(<VentureCard venture={mockVenture} />);
    const badge = screen.getByText('culture');
    expect(badge).toBeInTheDocument();
  });

  it('shows Sold Out badge when isAvailable is false', () => {
    const unavailableVenture = { ...mockVenture, isAvailable: false };
    render(<VentureCard venture={unavailableVenture} />);
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
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
});
