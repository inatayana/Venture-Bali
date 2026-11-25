import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopNavMenu } from './DesktopNavMenu';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { CurrencyProvider } from '@/components/currency/CurrencyProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

jest.mock('next/navigation', () => ({
  usePathname: () => '/explore',
}));

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

describe('DesktopNavMenu dropdown', () => {
  it('opens exactly one primary navigation menu', async () => {
    render(<DesktopNavMenu />, { wrapper: Providers });

    await userEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: /wishlist/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();
  });

  it('closes the menu on Escape', async () => {
    render(<DesktopNavMenu />, { wrapper: Providers });
    const toggle = screen.getByRole('button', { name: /open navigation menu/i });

    fireEvent.click(toggle);
    expect(screen.getAllByRole('menu')).toHaveLength(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
