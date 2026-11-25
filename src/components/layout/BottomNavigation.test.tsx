import { render, screen } from '@testing-library/react';
import { BottomNavigation } from './BottomNavigation';
import { LocaleProvider } from '@/components/locale/LocaleProvider';

jest.mock('next/navigation', () => ({
  usePathname: () => '/experiences/cmw3lypxy006oq2sj6sue62cn/mount-batur-sunrise-trekking',
}));

describe('BottomNavigation on product detail pages', () => {
  it('renders all four destinations on mobile', () => {
    render(<BottomNavigation />, { wrapper: LocaleProvider });

    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
  });
});
