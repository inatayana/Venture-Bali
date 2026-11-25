import { render, screen } from '@testing-library/react';
import ProfilePage from './page';
import { requireCustomer } from '@/lib/customerGuard';
import { redirect } from 'next/navigation';

const mockRequire = requireCustomer as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/customerGuard', () => ({
  requireCustomer: jest.fn(),
}));

jest.mock('@/components/layout/GlobalDesktopHeader', () => ({
  GlobalDesktopHeader: () => <div />,
}));

jest.mock('@/components/locale/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div /> }));
jest.mock('@/components/currency/CurrencySelector', () => ({ CurrencySelector: () => <div /> }));
jest.mock('@/components/theme/ThemeSwitcher', () => ({ ThemeSwitcher: () => <div /> }));

const user = {
  accountId: 'acc-1',
  customerId: 'customer-1',
  name: 'I Wayan Guest',
  email: 'guest@example.com',
  tenantId: 'tenant-001',
  status: 'ACTIVE' as const,
  joinedAt: '2026-11-01T00:00:00.000Z',
  whatsapp: '6281234567890',
  countryCode: 'ID',
  hasPassword: false,
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects guests to sign in with a return path', async () => {
    mockRequire.mockResolvedValue(null);

    await ProfilePage();

    expect(mockRedirect).toHaveBeenCalledWith('/login?next=/profile');
  });

  it('shows the signed-in customer account and account links', async () => {
    mockRequire.mockResolvedValue(user);

    render(await ProfilePage());

    expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    expect(screen.getByText('I Wayan Guest')).toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my trips/i })).toHaveAttribute('href', '/trips');
    expect(screen.getByRole('link', { name: /wishlists/i })).toHaveAttribute('href', '/wishlists');
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add password/i })).toBeInTheDocument();
  });
});
