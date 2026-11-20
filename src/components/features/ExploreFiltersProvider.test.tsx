import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreFiltersProvider, useExploreFilters } from './ExploreFiltersProvider';

function Harness() {
  const {
    selectedCategory,
    setSelectedCategory,
    transferIncluded,
    setTransferIncluded,
    sortBy,
    setSortBy,
    bestSellerOnly,
    setBestSellerOnly,
  } = useExploreFilters();

  return (
    <div>
      <span data-testid="category">{selectedCategory ?? 'all'}</span>
      <span data-testid="sort">{sortBy}</span>
      <span data-testid="transfer">{String(transferIncluded)}</span>
      <span data-testid="bestSeller">{String(bestSellerOnly)}</span>
      <button type="button" onClick={() => setSelectedCategory('ATV')}>
        pick ATV
      </button>
      <button type="button" onClick={() => setSelectedCategory(null)}>
        clear category
      </button>
      <button type="button" onClick={() => setTransferIncluded(!transferIncluded)}>
        toggle transfer
      </button>
      <button type="button" onClick={() => setBestSellerOnly(!bestSellerOnly)}>
        toggle best seller
      </button>
      <button type="button" onClick={() => setSortBy('rating')}>
        sort by rating
      </button>
    </div>
  );
}

function renderProvider(syncUrl: boolean) {
  return render(
    <ExploreFiltersProvider syncUrl={syncUrl}>
      <Harness />
    </ExploreFiltersProvider>
  );
}

describe('ExploreFiltersProvider URL sync', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('restores every filter from a shared /explore link', async () => {
    window.history.pushState(
      {},
      '',
      '/explore?category=rafting&sort=rating&transferIncluded=1&bestSeller=1'
    );

    renderProvider(true);

    await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('Rafting'));
    expect(screen.getByTestId('sort')).toHaveTextContent('rating');
    expect(screen.getByTestId('transfer')).toHaveTextContent('true');
    expect(screen.getByTestId('bestSeller')).toHaveTextContent('true');
  });

  it('writes filter changes to the URL without adding history entries', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/explore');
    const historyLength = window.history.length;

    renderProvider(true);
    await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('all'));

    await user.click(screen.getByRole('button', { name: 'pick ATV' }));
    expect(window.location.search).toBe('?category=atv');

    await user.click(screen.getByRole('button', { name: 'toggle transfer' }));
    expect(window.location.search).toContain('category=atv');
    expect(window.location.search).toContain('transferIncluded=1');

    await user.click(screen.getByRole('button', { name: 'sort by rating' }));
    expect(window.location.search).toContain('sort=rating');

    await user.click(screen.getByRole('button', { name: 'clear category' }));
    expect(window.location.search).not.toContain('category=');

    expect(window.history.length).toBe(historyLength);
  });

  it('keeps the search query and other params when filters change', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/explore?q=ATV&date=2027-06-15&pax=2&utm_source=newsletter');

    renderProvider(true);
    await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('all'));

    await user.click(screen.getByRole('button', { name: 'pick ATV' }));

    const params = new URLSearchParams(window.location.search);
    expect(params.get('category')).toBe('atv');
    expect(params.get('q')).toBe('ATV');
    expect(params.get('date')).toBe('2027-06-15');
    expect(params.get('pax')).toBe('2');
    expect(params.get('utm_source')).toBe('newsletter');
  });

  it('does not touch the URL when syncUrl is off (homepage)', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/');

    renderProvider(false);
    await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('all'));

    await user.click(screen.getByRole('button', { name: 'pick ATV' }));

    expect(screen.getByTestId('category')).toHaveTextContent('ATV');
    expect(window.location.search).toBe('');
  });

  it('restores filters when the browser navigates Back or Forward', async () => {
    window.history.pushState({}, '', '/explore?category=atv');

    renderProvider(true);
    await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('ATV'));

    await act(async () => {
      window.history.pushState({}, '', '/explore?category=rafting&selfDrive=1');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('Rafting'));
    expect(window.location.search).toContain('selfDrive=1');
  });
});
