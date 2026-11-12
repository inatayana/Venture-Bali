'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { MobileActionMenu } from '@/components/layout/MobileActionMenu';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useLocale } from '@/components/locale/LocaleProvider';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { cn } from '@/utils/cn';
import { Z_INDEX } from '@/lib/zIndex';

/**
 * Home header with:
 * - Desktop: logo, tagline, Email, Language, Currency, Theme, burger menu
 * - Mobile: logo, settings popover (Language, Currency, Theme, Email)
 * - Hides while the page is scrolling (any direction), reveals again once
 *   scrolling pauses — both animated via transform + opacity transitions
 */
export function HomeHeader() {
  const { t } = useLocale();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

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

  // During SSR / first paint, render header visible to avoid flash
  const headerClass = cn(
    `sticky top-0 z-[${Z_INDEX.header}] bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.08)]`,
    'dark:bg-neutral-950/95 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
    'transition-[transform,opacity] duration-300 ease-out will-change-transform',
    isVisible
      ? 'translate-y-0 opacity-100'
      : 'pointer-events-none -translate-y-full opacity-0',
    mounted ? '' : 'translate-y-0 opacity-100' // SSR: always visible first paint
  );

  return (
    <header className={headerClass} role="banner">
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

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Desktop: Email with label (xl only), before the control cluster */}
          <a
            href={`mailto:${BRAND_EMAIL_HELLO}`}
            className="mr-1 hidden items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-brand-ink dark:text-neutral-400 dark:hover:text-brand xl:inline-flex"
            aria-label={`Email ${BRAND_EMAIL_HELLO}`}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">{BRAND_EMAIL_HELLO}</span>
          </a>

          {/* Desktop: Language, Currency, Theme with labels + burger menu */}
          <div className="hidden items-center gap-1 md:flex">
            <LanguageSwitcher />
            <CurrencySelector />
            <ThemeSwitcher />
            <DesktopNavMenu />
          </div>

          {/* Mobile: Single settings trigger opening popover with Language, Currency, Theme, Email */}
          <div className="md:hidden">
            <MobileActionMenu />
          </div>
        </div>
      </div>
    </header>
  );
}