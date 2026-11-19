'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { HeaderSearchPill } from '@/components/layout/HeaderSearchPill';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { cn } from '@/utils/cn';
import { Z_INDEX } from '@/lib/zIndex';

/**
 * Home header — Airbnb-style hide on scroll down (>80px), reveal on scroll up.
 * Desktop (md+): logo · search pill · theme toggle · avatar · burger.
 * Mobile (<md): two-row chrome — floating search pill + filter shortcut,
 * then a scrollable category strip. Every control routes to /explore
 * (the catalogue owns actual filtering), so behaviour is honest and
 * never depends on duplicated filter state living in the header.
 */
export function HomeHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user: customerUser } = useCustomerSession();

  useEffect(() => {
    setMounted(true);

    let raf = 0;

    // Hide while the guest is actively scrolling; reveal once scrolling stops.
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        if (Math.abs(delta) <= 10) return; // ignore micro jitter
        lastScrollY.current = y;

        // Always visible at the very top of the page.
        if (y <= 16) {
          if (revealTimer.current) clearTimeout(revealTimer.current);
          setIsVisible(true);
          return;
        }

        // Actively scrolling -> hide immediately.
        setIsVisible(false);

        // Scrolling paused -> reveal again.
        if (revealTimer.current) clearTimeout(revealTimer.current);
        revealTimer.current = setTimeout(() => setIsVisible(true), 150);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(raf);
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  // During SSR / first paint, render header visible to avoid flash.
  const headerClass = cn(
    'sticky top-0 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
    'dark:bg-neutral-950/95 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
    'transition-[transform,opacity] duration-300 ease-out will-change-transform',
    isVisible
      ? 'translate-y-0 opacity-100'
      : 'pointer-events-none -translate-y-full opacity-0',
    mounted ? '' : 'translate-y-0 opacity-100'
  );

  return (
    <>
      {/* Desktop-only header — mobile uses the unified /explore control bar
          (capsule + filter slider) rendered inside the catalogue section. */}
      <header
        className={cn(headerClass, 'hidden md:block')}
        role="banner"
        style={{ zIndex: Z_INDEX.header }}
      >
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-2 sm:py-3 md:flex">
          <Link href="/" aria-label="BaliWild home" className="shrink-0">
            <p className="text-brand-ink dark:text-white">
              <BrandWordmark className="text-2xl" />
            </p>
          </Link>

          <HeaderSearchPill />

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

            <div className="hidden md:block">
              <DesktopNavMenu />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
