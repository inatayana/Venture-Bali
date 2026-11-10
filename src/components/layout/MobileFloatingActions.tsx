'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { cn } from '@/utils/cn';

/**
 * Floating mobile action bar: shows Language, Currency, Theme, Email as icon-only buttons.
 * Auto-hides on scroll down, shows on scroll up.
 * Only renders on mobile (< md breakpoint).
 */
export function MobileFloatingActions() {
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
          
          // Only hide after scrolling past a small threshold (e.g., 100px)
          // and only if scrolling down
          if (currentScrollY > 100 && direction === 'down') {
            setIsVisible(false);
          } else if (direction === 'up' || currentScrollY <= 100) {
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

  if (!mounted) {
    // Return a placeholder with same height to prevent layout shift
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16" aria-hidden="true" />
    );
  }

  return (
    <div
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-screen-xl',
        'transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      role="navigation"
      aria-label="Quick actions"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <LanguageSwitcher className="flex-1 justify-start" />
        <CurrencySelector className="flex-1 justify-center" />
        <ThemeSwitcher className="flex-1 justify-center" />
        <a
          href={`mailto:${BRAND_EMAIL_HELLO}`}
          className="flex-1 flex items-center justify-end gap-1.5 text-neutral-600 transition-colors hover:text-brand-ink dark:text-neutral-400 dark:hover:text-brand"
          aria-label={`Email ${BRAND_EMAIL_HELLO}`}
        >
          <Mail className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
      {/* Glassmorphism background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-neutral-200/50 dark:bg-neutral-950/80 dark:border-white/10"
        aria-hidden="true"
      />
    </div>
  );
}