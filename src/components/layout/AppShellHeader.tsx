'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, House } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';
import { Z_INDEX } from '@/lib/zIndex';
import { cn } from '@/utils/cn';

/**
 * Compact navigation bar for the App Shell pages (Explore, Wishlists, Trips,
 * Profile, Messages). These pages have no marketing header, so desktop users
 * otherwise had no way back to the catalogue or home.
 */
export function AppShellHeader({
  title,
  mobileOnly = false,
}: {
  title?: string;
  /** Hide on md+ where the shared GlobalDesktopHeader takes over. */
  mobileOnly?: boolean;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-900/90',
        mobileOnly && 'md:hidden'
      )}
      style={{ zIndex: Z_INDEX.header }}
    >
      <div className="container mx-auto flex h-14 items-center gap-2 px-4 sm:gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link
          href="/"
          aria-label="Home"
          className="flex h-10 items-center gap-2 rounded-lg px-1 text-neutral-700 transition-colors hover:text-brand-ink dark:text-neutral-300 dark:hover:text-white"
        >
          <House className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="hidden text-sm font-semibold sm:inline">Home</span>
        </Link>

        <span className="mx-1 hidden h-5 w-px bg-neutral-200 dark:bg-white/10 sm:block" aria-hidden="true" />
        <Link href="/" className="hidden sm:inline-flex" aria-label="BaliWild home">
          <BrandWordmark className="text-lg" />
        </Link>

        {title ? (
          <h2 className="ml-1 truncate font-heading text-base font-bold text-neutral-900 dark:text-white sm:text-lg">
            {title}
          </h2>
        ) : null}

        <div className="ml-auto hidden lg:block">
          <DesktopNavMenu variant="light" />
        </div>
      </div>
    </header>
  );
}
