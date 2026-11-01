import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryTiles } from './CategoryTiles';
import { CATEGORY_FILTERS } from '@/lib/taxonomy';

const counts = Object.fromEntries(CATEGORY_FILTERS.map((label, index) => [label, index + 1]));

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'rating', label: 'Rating' },
];

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

function renderWithSort(overrides: Partial<React.ComponentProps<typeof CategoryTiles>> = {}) {
  const props = {
    categories: CATEGORY_FILTERS,
    selectedCategory: null,
    onSelect: jest.fn(),
    counts,
    sortOptions: SORT_OPTIONS,
    sortValue: 'recommended',
    onSortChange: jest.fn(),
    ...overrides,
  };
  render(<CategoryTiles {...props} />);
  return props;
}

describe('CategoryTiles', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders All plus the nine adventure categories', () => {
    renderTiles();

    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Tubing/ })).toBeInTheDocument();
  });

  it('selects a category when its tile is tapped', async () => {
    const user = userEvent.setup();
    const props = renderTiles();

    await user.click(screen.getByRole('button', { name: /Tubing/ }));

    expect(props.onSelect).toHaveBeenCalledWith('Tubing');
  });

  it('clears the filter when the active tile is tapped again', async () => {
    const user = userEvent.setup();
    const props = renderTiles({ selectedCategory: 'Tubing' });

    await user.click(screen.getByRole('button', { name: /Tubing/ }));

    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('clears the filter from the All tile when no sort options are given', async () => {
    const user = userEvent.setup();
    const props = renderTiles({ selectedCategory: 'Tubing' });

    await user.click(screen.getByRole('button', { name: /^All/ }));

    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('opens the sort menu from the All tile', async () => {
    const user = userEvent.setup();
    renderWithSort();

    await user.click(screen.getByRole('button', { name: /^All/ }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Recommended' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('applies a sort choice from the menu', async () => {
    const user = userEvent.setup();
    const props = renderWithSort();

    await user.click(screen.getByRole('button', { name: /^All/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Rating' }));

    expect(props.onSortChange).toHaveBeenCalledWith('rating');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('offers All categories in the menu when a category is active', async () => {
    const user = userEvent.setup();
    const props = renderWithSort({ selectedCategory: 'Tubing' });

    await user.click(screen.getByRole('button', { name: /^All/ }));
    await user.click(screen.getByRole('menuitem', { name: 'All categories' }));

    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('closes the menu on Escape', async () => {
    const user = userEvent.setup();
    renderWithSort();

    await user.click(screen.getByRole('button', { name: /^All/ }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
