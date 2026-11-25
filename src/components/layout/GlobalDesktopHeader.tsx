'use client';

import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { HeaderSearchPill } from '@/components/layout/HeaderSearchPill';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/utils/cn';

/**
 * The ONE desktop (md+) header shared by every public page.
 *
 * DOM, classes, height and content are intentionally identical everywhere:
 * logo · 3-segment search pill · theme toggle · burger menu. Page titles and
 * back/home navigation live in <main> (DesktopBreadcrumb), never in this
 * header. Mobile (<md) chrome stays owned by each page.
 */
export function GlobalDesktopHeader() {
  const hidden = useHideOnScroll(80, 150);

  return (
    <header
      role="banner"
      className={cn(
        'hidden md:block sticky top-0 z-40',
        'bg-white/95 dark:bg-neutral-950/95 backdrop-blur',
        'border-b border-neutral-200 dark:border-neutral-800',
        'transition-[transform,opacity] duration-300 ease-out will-change-transform',
        hidden ? 'pointer-events-none -translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
        <Link href="/" aria-label="BaliWild home" className="shrink-0">
          <BrandWordmark className="text-2xl" />
        </Link>

        <HeaderSearchPill />

        <div className="shrink-0 flex items-center gap-2">
          <ThemeSwitcher />
          <DesktopNavMenu />
        </div>
      </div>
    </header>
  );
}
