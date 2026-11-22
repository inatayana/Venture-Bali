import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantCompare } from './VariantCompare';
import type { Variant } from '@/types/venture';

function variant(id: string, title: string, price: number): Variant {
  return {
    id,
    ventureId: 'vtr-1',
    title,
    shortDescription: 'A short description',
    fulfillmentMode: 'SELF_DRIVE',
    duration: '3 hours',
    inclusions: ['Guide', 'Insurance'],
    priceTiers: [{ minPax: 1, maxPax: 10, pricePerPax: price }],
  } as Variant;
}

const TWO = [variant('v1', 'Morning Trip', 200_000), variant('v2', 'Sunset Trip', 250_000)];

describe('VariantCompare', () => {
  it('renders a side-by-side table with real prices from the display helper', () => {
    render(<VariantCompare variants={TWO} onRemove={jest.fn()} onClear={jest.fn()} onSelect={jest.fn()} />);

    expect(screen.getByRole('region', { name: /compare packages/i })).toBeInTheDocument();
    expect(screen.getByText('Morning Trip')).toBeInTheDocument();
    expect(screen.getByText('Sunset Trip')).toBeInTheDocument();
    expect(screen.getAllByText(/200\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/free reschedule/i).length).toBeGreaterThan(0);
  });

  it('removes one package and clears all through their handlers', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    const onClear = jest.fn();
    render(
      <VariantCompare variants={TWO} onRemove={onRemove} onClear={onClear} onSelect={jest.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /remove morning trip from comparison/i }));
    expect(onRemove).toHaveBeenCalledWith('v1');

    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('selecting a package reports its id', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <VariantCompare variants={TWO} onRemove={jest.fn()} onClear={jest.fn()} onSelect={onSelect} />
    );

    await user.click(screen.getAllByRole('button', { name: /select this package/i })[1]);
    expect(onSelect).toHaveBeenCalledWith('v2');
  });

  it('renders nothing when nothing is selected', () => {
    const { container } = render(
      <VariantCompare variants={[]} onRemove={jest.fn()} onClear={jest.fn()} onSelect={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
