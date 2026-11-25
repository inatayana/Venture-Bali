import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopNavMenu } from './DesktopNavMenu';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { CurrencyProvider } from '@/components/currency/CurrencyProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const mockUseCustomerSession = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/explore',
}));

jest.mock('@/hooks/useCustomerSession', () => ({
  useCustomerSession: () => mockUseCustomerSession(),
}));

const signedInUser = {
  accountId: 'acc-1',
  customerId: 'customer-1',
  name: 'Guest',
  email: 'guest@example.com',
  tenantId: 'tenant-001',
  status: 'ACTIVE' as const,
  joinedAt: '2026-11-01T00:00:00.000Z',
};

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
  beforeEach(() => {
    mockUseCustomerSession.mockReturnValue({ user: signedInUser, loading: false });
  });

  it('opens exactly one primary navigation menu', async () => {
    render(<DesktopNavMenu />, { wrapper: Providers });

    await userEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: /wishlist/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();
  });

  it('offers sign in instead of log out to guests', async () => {
    mockUseCustomerSession.mockReturnValue({ user: null, loading: false });
    render(<DesktopNavMenu />, { wrapper: Providers });

    await userEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    const signIn = screen.getByRole('menuitem', { name: /sign in/i });
    expect(signIn).toHaveAttribute('href', '/login?next=%2Fexplore');
    expect(screen.queryByRole('menuitem', { name: /log out/i })).not.toBeInTheDocument();
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
