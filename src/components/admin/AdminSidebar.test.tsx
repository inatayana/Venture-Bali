import type { ReactNode } from 'react';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { AdminSidebar } from './AdminSidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/growth',
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/components/theme/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: jest.fn() }),
}));

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="mobile-sheet" className={className}>
      {children}
    </div>
  ),
}));

const mockFetch = jest.fn().mockResolvedValue({ ok: true });

beforeEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockClear();
});

describe('AdminSidebar', () => {
  it('removes the duplicate theme toggle from the desktop sidebar', () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(within(aside as HTMLElement).queryByLabelText('Switch to light mode')).toBeNull();
    // The dashboard owns the toggle; the mobile drawer keeps its own.
    expect(screen.getByLabelText('Switch to light mode')).toBeTruthy();
  });

  it('shows the full set of admin links in both variants', () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector('aside') as HTMLElement;
    const desktopNav = within(aside).getByRole('navigation');
    const mobileSheet = screen.getByTestId('mobile-sheet');
    const mobileNav = within(mobileSheet).getByRole('navigation');

    expect(within(desktopNav).getAllByRole('link')).toHaveLength(13);
    expect(within(mobileNav).getAllByRole('link')).toHaveLength(13);
    expect(within(desktopNav).getByText('Growth')).toBeTruthy();
    expect(within(mobileNav).getByText('Growth')).toBeTruthy();
  });

  it('uses a full-screen drawer on mobile and groups its links', () => {
    render(<AdminSidebar />);
    const sheet = screen.getByTestId('mobile-sheet');
    expect(sheet.className).toContain('w-screen');
    expect(sheet.className).toContain('h-screen');

    const mobileNav = within(sheet).getByRole('navigation');
    expect(within(mobileNav).getByText('Marketing & reporting')).toBeTruthy();
  });

  it('marks the current section as active', () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector('aside') as HTMLElement;
    const growth = within(aside).getByText('Growth').closest('a');
    expect(growth?.getAttribute('aria-current')).toBe('page');
  });

  it('signs out through the admin endpoint', async () => {
    render(<AdminSidebar />);
    const buttons = screen.getAllByRole('button', { name: 'Sign out' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/admin/logout', {
      method: 'POST',
    }));
  });
});
