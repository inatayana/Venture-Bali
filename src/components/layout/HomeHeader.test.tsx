import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeHeader } from './HomeHeader';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SearchProvider } from '@/components/search/SearchProvider';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <SearchProvider>{children}</SearchProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    value,
    writable: true,
    configurable: true,
  });
}

/** Dispatches a scroll event and waits for the requestAnimationFrame handler. */
async function scrollTo(value: number) {
  await act(async () => {
    setScrollY(value);
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe('HomeHeader hide-on-scroll', () => {
  beforeEach(() => {
    setScrollY(0);
  });

  it('starts visible', () => {
    render(<HomeHeader />, { wrapper: Providers });
    expect(screen.getByRole('banner')).toHaveClass('translate-y-0');
  });

  it('hides when scrolling down past 80px', async () => {
    render(<HomeHeader />, { wrapper: Providers });
    await scrollTo(140);
    expect(screen.getByRole('banner')).toHaveClass('-translate-y-full');
  });

  it('dispatches baliwild:open-filters when the filter button is tapped', async () => {
    const listener = jest.fn();
    window.addEventListener('baliwild:open-filters', listener);
    const user = userEvent.setup();
    render(<HomeHeader />, { wrapper: Providers });

    await user.click(screen.getByRole('button', { name: /open filters/i }));
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener('baliwild:open-filters', listener);
  });

  it('reveals again when scrolling back up', async () => {
    render(<HomeHeader />, { wrapper: Providers });
    await scrollTo(200);
    expect(screen.getByRole('banner')).toHaveClass('-translate-y-full');

    await scrollTo(100);
    expect(screen.getByRole('banner')).toHaveClass('translate-y-0');
  });

  it('reveals when back at the top', async () => {
    render(<HomeHeader />, { wrapper: Providers });
    await scrollTo(200);
    expect(screen.getByRole('banner')).toHaveClass('-translate-y-full');

    await scrollTo(10);
    expect(screen.getByRole('banner')).toHaveClass('translate-y-0');
  });
});
