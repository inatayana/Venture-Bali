import { render, screen } from '@testing-library/react';
import TripsPage from './page';
import { requireCustomer } from '@/lib/customerGuard';
import { createCustomerLinkToken } from '@/lib/customerLink';

// The shared desktop header owns router/search contexts; these tests assert
// the trip guide / invalid-link / session content only.
jest.mock('@/components/layout/GlobalDesktopHeader', () => ({
  GlobalDesktopHeader: () => <div />,
}));

jest.mock('@/lib/customerGuard', () => ({ requireCustomer: jest.fn() }));

jest.mock('@/lib/prisma', () => ({
  prisma: { customer: { findUnique: jest.fn().mockResolvedValue({ bookings: [] }) } },
}));

jest.mock('@/lib/customerLink', () => ({
  ...jest.requireActual('@/lib/customerLink'),
  createCustomerLinkToken: jest.fn().mockReturnValue('cl1.generated.token'),
}));

const mockRequire = requireCustomer as jest.Mock;
const mockCreateLink = createCustomerLinkToken as jest.Mock;

const sessionUser = {
  accountId: 'acc-1',
  customerId: 'customer-1',
  name: 'Guest',
  email: 'guest@example.com',
  tenantId: 'tenant-001',
  status: 'ACTIVE' as const,
  joinedAt: '2026-11-01T00:00:00.000Z',
  whatsapp: '6281234567890',
  countryCode: 'ID',
};

describe('TripsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockResolvedValue(null);
  });

  it('shows the link guide when opened without a token or session', async () => {
    render(await TripsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('Open your private trips link')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in to see every trip without a link/i })).toHaveAttribute(
      'href',
      '/login?next=/trips',
    );
    expect(screen.getByRole('link', { name: /plan your next adventure/i })).toBeInTheDocument();
    expect(screen.queryByText('This link is invalid or expired')).not.toBeInTheDocument();
  });

  it('shows the invalid-link notice when the token is invalid or expired', async () => {
    render(await TripsPage({ searchParams: Promise.resolve({ token: 'cl1.bad.token' }) }));
    expect(screen.getByText('This link is invalid or expired')).toBeInTheDocument();
    expect(screen.queryByText('Open your private trips link')).not.toBeInTheDocument();
  });

  it('uses the customer session without a token and keeps guest magic links working', async () => {
    mockRequire.mockResolvedValue(sessionUser);

    render(await TripsPage({ searchParams: Promise.resolve({}) }));

    expect(mockCreateLink).toHaveBeenCalledWith('customer-1');
    expect(screen.getByRole('heading', { name: /no trips yet/i })).toBeInTheDocument();
    expect(screen.getByText(/showing every booking on your account/i)).toBeInTheDocument();
  });

  it('lets the session win over a stale magic link', async () => {
    mockRequire.mockResolvedValue(sessionUser);

    render(await TripsPage({ searchParams: Promise.resolve({ token: 'cl1.bad.token' }) }));

    expect(mockCreateLink).toHaveBeenCalledWith('customer-1');
    expect(screen.getByRole('heading', { name: /no trips yet/i })).toBeInTheDocument();
  });
});
