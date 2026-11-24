import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreSearchOverlay } from './ExploreSearchOverlay';
import { SearchProvider } from '@/components/search/SearchProvider';

describe('ExploreSearchOverlay', () => {
  it('renders the three accordion cards with Where? open by default', () => {
    render(<ExploreSearchOverlay open={true} onClose={jest.fn()} />, { wrapper: SearchProvider });

    expect(screen.getByRole('dialog', { name: 'Search adventures' })).toBeInTheDocument();
    expect(screen.getByText('Where?')).toBeInTheDocument();
    expect(screen.getByText('When')).toBeInTheDocument();
    expect(screen.getByText('Who')).toBeInTheDocument();
    expect(screen.getByLabelText(/search destinations or adventures/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ubud/i })).toBeInTheDocument();
  });

  it('does not render Airbnb homes/hotels tabs', () => {
    render(<ExploreSearchOverlay open={true} onClose={jest.fn()} />, { wrapper: SearchProvider });

    expect(screen.queryByText(/homes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hotels/i)).not.toBeInTheDocument();
  });

  it('expands the When card on tap and collapses others', async () => {
    const user = userEvent.setup();
    render(<ExploreSearchOverlay open={true} onClose={jest.fn()} />, { wrapper: SearchProvider });

    await user.click(screen.getByRole('button', { name: /^when/i }));
    expect(screen.getByLabelText(/or pick a date/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/search destinations or adventures/i)).not.toBeInTheDocument();
  });

  it('expands the Who card and adjusts the adult counter', async () => {
    const user = userEvent.setup();
    render(<ExploreSearchOverlay open={true} onClose={jest.fn()} />, { wrapper: SearchProvider });

    await user.click(screen.getByRole('button', { name: /^who/i }));
    const increase = screen.getByRole('button', { name: /increase adults/i });
    await user.click(increase);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onClose when the Search CTA is pressed', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<ExploreSearchOverlay open={true} onClose={onClose} />, { wrapper: SearchProvider });

    await user.click(screen.getByRole('button', { name: /^search$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<ExploreSearchOverlay open={true} onClose={onClose} />, { wrapper: SearchProvider });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('Clear all resets the query and date', async () => {
    const user = userEvent.setup();
    render(<ExploreSearchOverlay open={true} onClose={jest.fn()} />, { wrapper: SearchProvider });

    const input = screen.getByLabelText(/search destinations or adventures/i);
    await user.type(input, 'Ubud');
    expect(input).toHaveValue('Ubud');

    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(input).toHaveValue('');
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ExploreSearchOverlay open={false} onClose={jest.fn()} />, {
      wrapper: SearchProvider,
    });
    expect(container).toBeEmptyDOMElement();
  });
});
