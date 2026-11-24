import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNavMenu } from './MobileNavMenu';
import { LocaleProvider } from '@/components/locale/LocaleProvider';

describe('MobileNavMenu', () => {
  it('opens a structured menu with primary links and the nine categories', async () => {
    const user = userEvent.setup();
    render(<MobileNavMenu />, { wrapper: LocaleProvider });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const dialog = screen.getByRole('dialog', { name: /menu/i });
    expect(within(dialog).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(dialog).getByRole('link', { name: 'Adventures' })).toHaveAttribute(
      'href',
      '/experiences'
    );
    expect(within(dialog).getByRole('link', { name: 'My Bookings' })).toHaveAttribute(
      'href',
      '/my/bookings'
    );
    expect(within(dialog).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:')
    );

    const categoryLinks = within(dialog)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/?category='));
    expect(categoryLinks).toHaveLength(9);
  });

  it('shows translated labels when the locale is Indonesian', async () => {
    const user = userEvent.setup();
    // LocaleProvider hydrates from localStorage on mount (same as production).
    window.localStorage.setItem('baliwild_locale', 'id');
    render(<MobileNavMenu />, { wrapper: LocaleProvider });

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('link', { name: 'Beranda' })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Pemesanan Saya' })).toBeInTheDocument();
    expect(within(dialog).getByText('Kategori')).toBeInTheDocument();
    window.localStorage.removeItem('baliwild_locale');
  });

  it('closes the menu with the Escape key and the close button', async () => {
    const user = userEvent.setup();
    render(<MobileNavMenu />, { wrapper: LocaleProvider });

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
