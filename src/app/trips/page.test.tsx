import { render, screen } from '@testing-library/react';
import TripsPage from './page';

// The shared desktop header owns router/search contexts; these tests assert
// the trip guide / invalid-link content only.
jest.mock('@/components/layout/GlobalDesktopHeader', () => ({
  GlobalDesktopHeader: () => <div />,
}));

describe('TripsPage', () => {
  it('shows the link guide when opened without a token', async () => {
    render(await TripsPage({ searchParams: {} }));
    expect(screen.getByText('Open your private trips link')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /plan your next adventure/i })).toBeInTheDocument();
    expect(screen.queryByText('This link is invalid or expired')).not.toBeInTheDocument();
  });

  it('shows the invalid-link notice when the token is invalid or expired', async () => {
    render(await TripsPage({ searchParams: { token: 'cl1.bad.token' } }));
    expect(screen.getByText('This link is invalid or expired')).toBeInTheDocument();
    expect(screen.queryByText('Open your private trips link')).not.toBeInTheDocument();
  });
});
