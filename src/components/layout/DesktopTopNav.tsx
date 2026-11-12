'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, User } from 'lucide-react';
import { BOTTOM_NAV_ITEMS } from '@/lib/navigationConfig';
import { getActiveBottomNavKey } from '@/lib/bottomNavRules';
import { useLocale } from '@/components/locale/LocaleProvider';
import { getNamespace } from '@/lib/i18n-unified';
import { BrandWordmark } from './BrandWordmark';
import { HeaderSettings } from './HeaderSettings';
import { cn } from '@/utils/cn';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  explore: Search,
  wishlists: Heart,
  profile: User,
};

/**
 * Desktop App Shell — the same three destinations as the mobile bottom
 * navigation, rendered as a slim top bar. Mobile keeps the bottom bar
 * (`md:hidden` on BottomNavigation); desktop gets this header
 * (`hidden md:block`) so every device sees the primary nav.
 */
export function DesktopTopNav() {
  const pathname = usePathname() ?? '/';
  const { locale } = useLocale();
  const labels = getNamespace(locale, 'nav');
  const activeKey = getActiveBottomNavKey(pathname);

  return (
    <div className="hidden md:block border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="BaliWild home" className="inline-flex">
          <BrandWordmark className="text-xl text-brand-ink" />
        </Link>

        <nav role="navigation" aria-label="Primary navigation" className="flex items-center gap-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.key];
            const label = labels[item.labelKey.replace('nav.', '') as keyof typeof labels] ?? item.key;
            const isActive = item.key === activeKey;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={labels[item.ariaLabelKey.replace('nav.', '') as keyof typeof labels] ?? label}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  isActive
                    ? 'bg-brand text-brand-ink'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <HeaderSettings />
      </div>
    </div>
  );
}
