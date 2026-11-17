import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreTopBar } from './ExploreTopBar';

const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
}));

describe('ExploreTopBar', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('renders the capsule title and subtitle', () => {
    render(
      <ExploreTopBar
        title="Adventures in Bali"
        subtitle="Anytime · Add guests"
        onOpenSearch={jest.fn()}
        onOpenFilters={jest.fn()}
        activeFilterCount={0}
      />
    );

    expect(screen.getByText('Adventures in Bali')).toBeInTheDocument();
    expect(screen.getByText('Anytime · Add guests')).toBeInTheDocument();
  });

  it('calls the back handler', async () => {
    const user = userEvent.setup();
    render(
      <ExploreTopBar
        title="Adventures in Bali"
        subtitle="Anytime · Add guests"
        onOpenSearch={jest.fn()}
        onOpenFilters={jest.fn()}
        activeFilterCount={0}
      />
    );

    await user.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('opens the search overlay and filter modal from the capsule and slider button', async () => {
    const user = userEvent.setup();
    const onOpenSearch = jest.fn();
    const onOpenFilters = jest.fn();
    render(
      <ExploreTopBar
        title="Adventures in Bali"
        subtitle="Anytime · Add guests"
        onOpenSearch={onOpenSearch}
        onOpenFilters={onOpenFilters}
        activeFilterCount={2}
      />
    );

    await user.click(screen.getByRole('button', { name: /open search/i }));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /open filters, 2 active/i }));
    expect(onOpenFilters).toHaveBeenCalledTimes(1);
  });

  it('hides the filter badge when no filters are active', () => {
    render(
      <ExploreTopBar
        title="Adventures in Bali"
        subtitle="Anytime · Add guests"
        onOpenSearch={jest.fn()}
        onOpenFilters={jest.fn()}
        activeFilterCount={0}
      />
    );

    expect(screen.getByRole('button', { name: /^open filters$/i })).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });
});
