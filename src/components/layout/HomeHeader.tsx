'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { ExploreSearchOverlay } from '@/components/features/ExploreSearchOverlay';
import { HeaderSearchPill } from '@/components/layout/HeaderSearchPill';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { useLocale } from '@/components/locale/LocaleProvider';
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
  const { t } = useLocale();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastScrollY = useRef(0);
  const { user: customerUser } = useCustomerSession();

  useEffect(() => {
    setMounted(true);

    let raf = 0;

    // Airbnb-style: hide on scroll down past the header height, reveal on any scroll up.
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        if (Math.abs(delta) <= 10) return; // ignore micro jitter
        if (delta > 0 && y > 80) {
          setIsVisible(false);
        } else if (delta < 0 || y <= 16) {
          setIsVisible(true);
        }
        lastScrollY.current = y;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(raf);
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

  const mobileCategoryStrip = [
    { label: 'All', href: '/explore' },
    { label: 'Transfer Included', href: '/explore?transferIncluded=1' },
    { label: 'Self-Drive', href: '/explore?selfDrive=1' },
    ...CATEGORY_REGISTRY.map((category) => ({
      label: category.short,
      href: `/explore?category=${encodeURIComponent(category.short)}`,
    })),
  ];

  return (
    <>
      <header className={headerClass} role="banner" style={{ zIndex: Z_INDEX.header }}>
        {/* Desktop layout — hidden on mobile, where the two-row search chrome below takes over */}
        <div className="container mx-auto hidden items-center justify-between gap-2 px-4 py-2 sm:py-3 md:flex">
          <Link href="/" aria-label="BaliWild home" className="shrink-0">
            <p className="text-brand-ink dark:text-white">
              <BrandWordmark className="text-2xl" />
            </p>
          </Link>

          <p className="hidden max-w-[16rem] truncate text-right text-xs leading-tight text-gray-500 dark:text-gray-400 lg:block">
            {t('headerTagline')}
          </p>

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

            <div className="hidden md:block">
              <DesktopNavMenu />
            </div>
          </div>
        </div>

        {/* Mobile chrome: two rows (search + filter, then category strip) */}
        <div className="border-t border-neutral-200/70 md:hidden dark:border-white/10">
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
              aria-label="Search adventures"
            >
              <span className="text-sm font-semibold leading-tight text-neutral-900 dark:text-white">
                Adventures in Bali
              </span>
              <span className="text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                Anytime · Add guests
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/explore')}
              aria-label="Open filters"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-neutral-900"
            >
              <SlidersHorizontal className="h-5 w-5 text-neutral-800 dark:text-neutral-200" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {mobileCategoryStrip.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-brand-ink hover:text-brand-ink dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {searchOpen && <ExploreSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
