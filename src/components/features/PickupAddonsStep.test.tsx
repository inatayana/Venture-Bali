import { render, screen, fireEvent } from '@testing-library/react';
import { PickupAddonsStep } from './PickupAddonsStep';
import type { Addon } from '@/types/venture';

const arrayAddons: Addon[] = [
  {
    id: 'addon-001',
    variantId: 'var-001',
    name: 'Professional Photographer',
    price: 150000,
    requiresTransfer: false,
    isCombo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'combo-001',
    variantId: 'var-001',
    name: 'Ayung River Rafting Combo',
    price: 350000,
    requiresTransfer: true,
    isCombo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('PickupAddonsStep', () => {
  it('renders addons from an array source', () => {
    render(
      <PickupAddonsStep
        addons={arrayAddons}
        variantId="var-001"
        fulfillmentMode="PRIVATE_TRANSFER"
        selectedAddonIds={[]}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('Professional Photographer')).toBeInTheDocument();
    expect(screen.getByText('Ayung River Rafting Combo')).toBeInTheDocument();
  });

  it('normalizes a JSON string source', () => {
    render(
      <PickupAddonsStep
        addons={JSON.stringify(arrayAddons)}
        variantId="var-001"
        fulfillmentMode="SELF_DRIVE"
        selectedAddonIds={[]}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('Professional Photographer')).toBeInTheDocument();
  });

  it('normalizes a wrapped object source', () => {
    render(
      <PickupAddonsStep
        addons={{ addons: arrayAddons }}
        variantId="var-001"
        fulfillmentMode="SELF_DRIVE"
        selectedAddonIds={[]}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('Professional Photographer')).toBeInTheDocument();
  });

  it('shows empty state for null source', () => {
    render(
      <PickupAddonsStep
        addons={null}
        variantId="var-001"
        fulfillmentMode="SELF_DRIVE"
        selectedAddonIds={[]}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByTestId('pickup-addons-empty')).toBeInTheDocument();
  });

  it('toggles an addon on click', () => {
    const onToggle = jest.fn();
    render(
      <PickupAddonsStep
        addons={arrayAddons}
        variantId="var-001"
        fulfillmentMode="PRIVATE_TRANSFER"
        selectedAddonIds={[]}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByTestId('pickup-addon-addon-001'));
    expect(onToggle).toHaveBeenCalledWith('addon-001');
  });

  it('disables transfer-required addons on SELF_DRIVE', () => {
    render(
      <PickupAddonsStep
        addons={arrayAddons}
        variantId="var-001"
        fulfillmentMode="SELF_DRIVE"
        selectedAddonIds={[]}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('Requires hotel transfer')).toBeInTheDocument();
  });
});
