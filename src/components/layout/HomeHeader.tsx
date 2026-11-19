'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { HeaderSearchPill } from '@/components/layout/HeaderSearchPill';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/utils/cn';
import { Z_INDEX } from '@/lib/zIndex';

/**
 * Home header — desktop chrome only (md+).
 *
 * Hide/show is delegated to the shared useHideOnScroll hook so the desktop
 * header and the mobile ExploreControlBar behave identically: hide while the
 * guest is actively scrolling, reveal again shortly after scrolling stops.
 *
 * Desktop (md+): logo · search pill · theme toggle · avatar · burger.
 * Mobile (<md) uses the unified /explore control bar (capsule + filter
 * slider) rendered inside the catalogue section.
 */
export function HomeHeader() {
  const [mounted, setMounted] = useState(false);
  const hidden = useHideOnScroll(80, 150);
  const { user: customerUser } = useCustomerSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / first paint, render header visible to avoid flash.
  const headerClass = cn(
    'sticky top-0 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
    'dark:bg-neutral-950/95 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
    'transition-[transform,opacity] duration-300 ease-out will-change-transform',
    hidden
      ? 'pointer-events-none -translate-y-full opacity-0'
      : 'translate-y-0 opacity-100',
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
