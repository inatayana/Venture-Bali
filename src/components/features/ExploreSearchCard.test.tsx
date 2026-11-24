import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreSearchCard } from './ExploreSearchCard';
import { SearchProvider } from '@/components/search/SearchProvider';

function renderCard() {
  render(<ExploreSearchCard />, { wrapper: SearchProvider });
}

describe('ExploreSearchCard search field', () => {
  it('renders one real search input that can be typed in immediately', async () => {
    const user = userEvent.setup();
    renderCard();

    const input = screen.getByRole('searchbox', { name: /search destinations or adventures/i });
    await user.type(input, 'ATV');

    expect(input).toHaveValue('ATV');
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);
  });

  it('shows Bali suggestions under the same field instead of a second input', async () => {
    const user = userEvent.setup();
    renderCard();

    const input = screen.getByRole('searchbox', { name: /search destinations or adventures/i });
    await user.click(input);

    expect(screen.getByText(/popular in bali/i)).toBeInTheDocument();
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Ubud' }));

    expect(input).toHaveValue('Ubud');
    expect(screen.queryByText(/popular in bali/i)).not.toBeInTheDocument();
  });

  it('clears the query from the inline clear button', async () => {
    const user = userEvent.setup();
    renderCard();

    const input = screen.getByRole('searchbox', { name: /search destinations or adventures/i });
    await user.type(input, 'Ubud');

    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(input).toHaveValue('');
  });
});
