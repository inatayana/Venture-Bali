import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantDetailModal } from './VariantDetailModal';
import type { Variant } from '@/types/venture';

const listPriceVariant: Variant = {
  id: 'var-002',
  ventureId: 'vtr-001',
  title: 'River Tubing with Shared Transfer',
  shortDescription: 'Hotel shuttle pick-up and drop-off shared with other guests.',
  transportBadge: '🚐 Shared Transfer',
  imageUrl: '/images/tubing-2.svg',
  duration: '4 hrs',
  fulfillmentMode: 'SHARED_TRANSFER',
  operationNotes: 'Shuttle fee is charged per guest; departure times are fixed',
  inclusions: ['Tube, paddle and life jacket', 'Certified river guide', 'Lunch'],
  exclusions: ['Personal expenses', 'Photos (available as add-on)'],
  sortOrder: 2,
  priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 650000 }],
  blackoutDates: [],
  addons: [],
  createdAt: new Date('2026-01-15T08:00:00Z'),
  updatedAt: new Date('2026-08-01T10:30:00Z'),
};

const promoVariant: Variant = {
  ...listPriceVariant,
  id: 'var-003',
  title: 'River Tubing with Private Transfer',
  badge: 'Most Popular',
  promoPriceIdr: 600000,
  minimumSpendIdr: 1200000,
  priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: 850000 }],
};

const promo = { code: 'TRYBALI2026', percent: 40 };

function renderModal(overrides: Partial<React.ComponentProps<typeof VariantDetailModal>> = {}) {
  const props = {
    variant: listPriceVariant,
    isSelected: false,
    promo,
    onClose: jest.fn(),
    onShowDates: jest.fn(),
    ...overrides,
  };
  render(<VariantDetailModal {...props} />);
  return props;
}

describe('VariantDetailModal', () => {
  it('renders nothing while closed', () => {
    renderModal({ variant: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the full package details in a dialog', () => {
    renderModal();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: listPriceVariant.title })).toBeInTheDocument();
    expect(screen.getByText(listPriceVariant.shortDescription)).toBeInTheDocument();
    expect(screen.getByText('Tube, paddle and life jacket')).toBeInTheDocument();
    expect(screen.getByText('Photos (available as add-on)')).toBeInTheDocument();
    expect(screen.getByText(listPriceVariant.operationNotes!)).toBeInTheDocument();
    expect(screen.getByText('4 hrs')).toBeInTheDocument();
  });

  it('advertises the launch coupon for packages sold at list price', () => {
    renderModal();

    expect(screen.getByText(/Get 40% OFF with code/)).toBeInTheDocument();
    expect(screen.getByText('TRYBALI2026')).toBeInTheDocument();
    expect(screen.queryByText(/Promo price applied/i)).not.toBeInTheDocument();
  });

  it('shows the promo price and hides the coupon for discounted packages', () => {
    renderModal({ variant: promoVariant });

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText(/Promo price applied/i)).toBeInTheDocument();
    expect(screen.queryByText(/Get 40% OFF with code/)).not.toBeInTheDocument();
    expect(screen.getByText(/Rp\s?1\.200\.000 to book/)).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s?600\.000/).length).toBeGreaterThan(1);
  });

  it('opens the booking sheet from the pinned action', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /show dates/i }));

    expect(props.onShowDates).toHaveBeenCalledTimes(1);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('closes from the X button', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /close package details/i }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.keyboard('{Escape}');

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to the product photo when the package has none', () => {
    renderModal({
      variant: { ...listPriceVariant, imageUrl: undefined },
      fallbackImageUrl: '/images/rafting.svg',
    });

    expect(screen.getByAltText(listPriceVariant.title)).toBeInTheDocument();
  });
});
