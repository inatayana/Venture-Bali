import { render, screen } from '@testing-library/react';
import { DesktopBreadcrumb } from './DesktopBreadcrumb';

describe('DesktopBreadcrumb', () => {
  it('offers Back + Home and the current page name', () => {
    render(<DesktopBreadcrumb label="Wishlists" />);

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toHaveClass('hidden', 'md:flex');
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
    expect(screen.getByText('Wishlists')).toHaveAttribute('aria-current', 'page');
  });
});
