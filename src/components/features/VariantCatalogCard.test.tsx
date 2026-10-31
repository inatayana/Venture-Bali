import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantCatalogCard } from './VariantCatalogCard';
import type { Variant } from '@/types/venture';

const baseVariant: Variant = {
  id: 'var-001',
  ventureId: 'vtr-001',
  title: 'River Tubing with Private Transfer',
  shortDescription: 'Private car and driver for your group, door to door.',
  badge: 'Most Popular',
  transportBadge: '🚗 Private Transfer',
  imageUrl: '/images/tubing-3.svg',
  duration: '4 hrs',
  fulfillmentMode: 'PRIVATE_TRANSFER',
  promoPriceIdr: 600000,
  operationNotes: 'Private vehicle class is selected at checkout',
  inclusions: ['Guide', 'Lunch', 'Private car & driver'],
  exclusions: ['Personal expenses'],
  minimumSpendIdr: 1200000,
  sortOrder: 3,
  priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 850000 }],
  blackoutDates: [],
  addons: [],
  createdAt: new Date('2026-01-15T08:00:00Z'),
  updatedAt: new Date('2026-08-01T10:30:00Z'),
};

function renderCard(overrides: Partial<React.ComponentProps<typeof VariantCatalogCard>> = {}) {
  const props = {
    variant: baseVariant,
    selected: false,
    onSelect: jest.fn(),
    onShowDates: jest.fn(),
    onOpenDetails: jest.fn(),
    ...overrides,
  };
  render(<VariantCatalogCard {...props} />);
  return props;
}

describe('VariantCatalogCard', () => {
  it('renders the package summary', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: baseVariant.title })).toBeInTheDocument();
    expect(screen.getByText(baseVariant.shortDescription)).toBeInTheDocument();
    expect(screen.getByText('4 hrs')).toBeInTheDocument();
    expect(screen.getByText('🚗 Private Transfer')).toBeInTheDocument();
    expect(screen.getByText(/Minimum Rp\s?1\.200\.000 to book/)).toBeInTheDocument();
  });

  it('shows the promo price with the list price struck through', () => {
    renderCard();

    expect(screen.getByText('Promo')).toBeInTheDocument();
    expect(screen.getByText(/Rp\s?600\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Rp\s?850\.000/)).toBeInTheDocument();
    expect(screen.getByText('/ guest')).toBeInTheDocument();
  });

  it('opens the detail modal when the card is clicked', async () => {
    const user = userEvent.setup();
    const props = renderCard();

    await user.click(screen.getByText(baseVariant.shortDescription));

    expect(props.onOpenDetails).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('keeps the show dates action separate from opening the modal', async () => {
    const user = userEvent.setup();
    const props = renderCard();

    await user.click(screen.getByRole('button', { name: /show dates/i }));

    expect(props.onShowDates).toHaveBeenCalledTimes(1);
    expect(props.onOpenDetails).not.toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('selects the package without opening the modal', async () => {
    const user = userEvent.setup();
    const props = renderCard();

    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onOpenDetails).not.toHaveBeenCalled();
    expect(props.onShowDates).not.toHaveBeenCalled();
  });

  it('marks the selected package', () => {
    renderCard({ selected: true });

    expect(screen.getByRole('button', { name: /selected/i })).toBeInTheDocument();
    expect(screen.getAllByText('Selected').length).toBeGreaterThan(0);
  });

  it('falls back to the product photo when the package has none', () => {
    renderCard({
      variant: { ...baseVariant, imageUrl: undefined },
      fallbackImageUrl: '/images/rafting.svg',
    });

    expect(screen.getByAltText(baseVariant.title)).toBeInTheDocument();
  });
});
