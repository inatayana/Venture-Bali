'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { HeaderSearchPill } from '@/components/layout/HeaderSearchPill';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { Z_INDEX } from '@/lib/zIndex';

/**
 * Global Desktop Header — used on Explore, Wishlists, Trips, Profile (md+).
 * Same chrome as the Homepage header: logo · search pill (WHERE/WHEN/WHO) ·
 * theme toggle · avatar · burger (DesktopNavMenu). No per-page title text.
 */
export function GlobalDesktopHeader() {
  const [mounted, setMounted] = useState(false);
  const { user: customerUser } = useCustomerSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / first paint, render header visible to avoid flash.
  const isMounted = mounted;

  return (
    <header
      className={
        'sticky top-0 z-40 bg-white/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.08)] ' +
        'dark:bg-neutral-950/95 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
      }
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
          {isMounted && customerUser && (
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
  );
}
