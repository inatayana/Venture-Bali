import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryTiles } from './CategoryTiles';
import { CATEGORY_FILTERS } from '@/lib/taxonomy';

const counts = Object.fromEntries(CATEGORY_FILTERS.map((label, index) => [label, index + 1]));

function renderTiles(overrides: Partial<React.ComponentProps<typeof CategoryTiles>> = {}) {
  const props = {
    categories: CATEGORY_FILTERS,
    selectedCategory: null,
    onSelect: jest.fn(),
    counts,
    ...overrides,
  };
  render(<CategoryTiles {...props} />);
  return props;
}

describe('CategoryTiles', () => {
  it('renders All plus the nine adventure categories with product counts', () => {
    renderTiles();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(10);
    expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Tubing/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Water Sports/ })).toBeInTheDocument();
  });

  it('selects a category when its tile is tapped', async () => {
    const user = userEvent.setup();
    const props = renderTiles();

    await user.click(screen.getByRole('tab', { name: /Tubing/ }));

    expect(props.onSelect).toHaveBeenCalledWith('Tubing');
  });

  it('clears the filter when the active tile is tapped again', async () => {
    const user = userEvent.setup();
    const props = renderTiles({ selectedCategory: 'Tubing' });

    expect(screen.getByRole('tab', { name: /Tubing/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: /Tubing/ }));

    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('clears the filter from the All tile', async () => {
    const user = userEvent.setup();
    const props = renderTiles({ selectedCategory: 'Tubing' });

    await user.click(screen.getByRole('tab', { name: /All/ }));

    expect(props.onSelect).toHaveBeenCalledWith(null);
  });
});
