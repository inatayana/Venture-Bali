'use client';

import { useEffect, useState } from 'react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { HeaderSearchPill } from '@/components/layout/HeaderSearchPill';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { useLocale } from '@/components/locale/LocaleProvider';
import { cn } from '@/utils/cn';
import { Z_INDEX } from '@/lib/zIndex';

/**
 * Home header - minimal design with only logo and burger menu.
 * All settings (language, currency, theme, email) are in the dropdown.
 * Hides while the page is scrolling (any direction), reveals again once
 * scrolling pauses — both animated via transform + opacity transitions.
 */
export function HomeHeader() {
  const { t } = useLocale();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { user: customerUser } = useCustomerSession();

  useEffect(() => {
    setMounted(true);

    let raf = 0;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;

    /**
     * Hide while the page is actively scrolling (any direction) past the
     * hero threshold, then reveal again once scrolling settles. The reveal
     * timer restarts on every scroll event, so the header only comes back
     * after the guest pauses; CSS transitions keep both motions smooth.
     */
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        if (window.scrollY > 80) {
          setIsVisible(false);
          window.clearTimeout(revealTimer);
          revealTimer = setTimeout(() => setIsVisible(true), 150);
        } else {
          window.clearTimeout(revealTimer);
          setIsVisible(true);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(revealTimer);
    };
  }, []);

  // During SSR / first paint, render header visible to avoid flash.
  // NOTE: z-index is applied via inline style — a class merged from a template
  // literal like `z-[${Z_INDEX.header}]` is invisible to Tailwind's static
  // extraction and would silently never be generated.
  const headerClass = cn(
    'sticky top-0 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
    'dark:bg-neutral-950/95 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
    'transition-[transform,opacity] duration-300 ease-out will-change-transform',
    isVisible
      ? 'translate-y-0 opacity-100'
      : 'pointer-events-none -translate-y-full opacity-0',
    mounted ? '' : 'translate-y-0 opacity-100' // SSR: always visible first paint
  );

  return (
    <>
      <header className={headerClass} role="banner" style={{ zIndex: Z_INDEX.header }}>
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-2 sm:py-3">
          {/* Left: Logo + tagline (desktop only) */}
          <div className="flex min-w-0 items-center gap-3">
            <p className="shrink-0 text-brand-ink dark:text-white">
              <BrandWordmark className="text-2xl" />
            </p>
            <p className="hidden truncate text-xs text-gray-500 dark:text-gray-400 lg:block">
              {t('headerTagline')}
            </p>
          </div>

          {/* Center: Interactive Search Pill (desktop only) */}
          <HeaderSearchPill />

          {/* Right: theme toggle + avatar (logged-in only) + burger */}
          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden md:block">
              <ThemeSwitcher />
            </span>
            {customerUser && (
              <span
                className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-brand md:flex"
                title={customerUser.name}
                aria-label={`Account: ${customerUser.name}`}
              >
                {(customerUser.name || customerUser.email).charAt(0).toUpperCase()}
              </span>
            )}

            {/* Desktop: Burger menu */}
            <div className="hidden md:block">
              <DesktopNavMenu />
            </div>

            {/* Mobile: Burger menu */}
            <div className="md:hidden">
              <MobileNavDropdown />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}