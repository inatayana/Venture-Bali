'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useLocale } from '@/components/locale/LocaleProvider';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { cn } from '@/utils/cn';

/**
 * Home header with:
 * - Desktop: logo, tagline, Language, Currency, Theme, Email (with labels)
 * - Mobile: logo, Language, Currency, Theme, Email (icons only)
 * - Auto-hides on scroll down, shows on scroll up (both mobile & desktop)
 */
export function HomeHeader() {
  const { t } = useLocale();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const direction = currentScrollY > lastScrollY ? 'down' : 'up';

          // Hide after scrolling past threshold when scrolling down
          if (currentScrollY > 80 && direction === 'down') {
            setIsVisible(false);
          } else if (direction === 'up' || currentScrollY <= 80) {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // During SSR / first paint, render header visible to avoid flash
  const headerClass = cn(
    'sticky top-0 z-40 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out',
    'dark:bg-neutral-950/95 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
    isVisible ? 'translate-y-0' : '-translate-y-full',
    mounted ? '' : 'translate-y-0' // SSR: always visible first paint
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
          {/* Desktop: Language, Currency, Theme with labels */}
          <div className="hidden items-center gap-1 md:flex">
            <LanguageSwitcher />
            <CurrencySelector />
            <ThemeSwitcher />
          </div>

          {/* Mobile: 4 icon actions - each works directly */}
          <div className="flex items-center gap-0.5 md:hidden" role="navigation" aria-label="Quick actions">
            <LanguageSwitcher className="min-h-[44px] min-w-[44px] justify-center px-1" />
            <CurrencySelector className="min-h-[44px] min-w-[44px] justify-center px-1" />
            <ThemeSwitcher className="min-h-[44px] min-w-[44px]" />
            <a
              href={`mailto:${BRAND_EMAIL_HELLO}`}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-neutral-600 transition-colors hover:text-brand-ink dark:text-neutral-400 dark:hover:text-brand"
              aria-label={`Email ${BRAND_EMAIL_HELLO}`}
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          {/* Desktop: Email with label (xl only) */}
          <a
            href={`mailto:${BRAND_EMAIL_HELLO}`}
            className="hidden items-center gap-1.5 pl-1 text-xs font-semibold text-neutral-600 transition-colors hover:text-brand-ink dark:text-neutral-400 dark:hover:text-brand xl:inline-flex"
            aria-label={`Email ${BRAND_EMAIL_HELLO}`}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">{BRAND_EMAIL_HELLO}</span>
          </a>
        </div>
      </div>
    </header>
  );
}