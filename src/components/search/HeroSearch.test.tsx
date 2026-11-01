import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSearch } from './HeroSearch';
import { SearchProvider } from './SearchProvider';

const hubs = ['Ubud', 'Seminyak', 'Canggu'];
const suggestions = [{ title: 'Ayung Rafting', href: '/experiences/1/rafting' }];

function renderSearch() {
  render(<HeroSearch hubs={hubs} suggestions={suggestions} />, { wrapper: SearchProvider });
}

describe('HeroSearch', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders destination, date and guests in the desktop card', () => {
    renderSearch();

    expect(screen.getAllByText('Where').length).toBeGreaterThan(0);
    expect(screen.getAllByText('When').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Guests').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Anywhere in Bali').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Any date').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1 guest').length).toBeGreaterThan(0);
  });

  it('increments guests without leaving the hero', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getAllByRole('button', { name: /more guests/i })[0]);

    expect(screen.getAllByText('2 guests').length).toBeGreaterThan(0);
  });

  it('suggests hubs and adventures in the destination picker', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getAllByText('Anywhere in Bali')[0]);

    expect(screen.getByText('Ubud')).toBeInTheDocument();
    expect(screen.getByText('Canggu')).toBeInTheDocument();
    expect(screen.getByText('Ayung Rafting')).toBeInTheDocument();

    await user.click(screen.getByText('Ubud'));

    expect(screen.getAllByText('Ubud').length).toBeGreaterThan(0);
  });

  it('writes the filters into the URL when searching', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getAllByRole('button', { name: /more guests/i })[0]);
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    expect(window.location.search).toContain('pax=2');
  });
});
