import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortMenu } from './SortMenu';

const options = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
];

function renderMenu(overrides: Partial<React.ComponentProps<typeof SortMenu>> = {}) {
  const props = {
    value: 'recommended',
    options,
    onChange: jest.fn(),
    ...overrides,
  };
  render(<SortMenu {...props} />);
  return props;
}

describe('SortMenu', () => {
  it('shows the current order on the trigger and keeps the popup closed', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: /sort adventures/i })).toHaveTextContent(
      'Recommended'
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens a popup with every sort option', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /sort adventures/i }));

    expect(screen.getByRole('listbox', { name: /sort adventures/i })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(options.length);
    expect(screen.getByRole('option', { name: 'Price: Low to High' })).toBeInTheDocument();
  });

  it('marks the active option', async () => {
    const user = userEvent.setup();
    renderMenu({ value: 'rating' });

    await user.click(screen.getByRole('button', { name: /sort adventures/i }));

    expect(screen.getByRole('option', { name: 'Rating' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Duration' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('applies the picked option and closes', async () => {
    const user = userEvent.setup();
    const props = renderMenu();

    await user.click(screen.getByRole('button', { name: /sort adventures/i }));
    await user.click(screen.getByRole('option', { name: 'Price: High to Low' }));

    expect(props.onChange).toHaveBeenCalledWith('price-high');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /sort adventures/i }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
