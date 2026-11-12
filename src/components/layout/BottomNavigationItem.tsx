'use client';

import Link from 'next/link';
import { Search, Heart, User, CalendarDays } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';

interface BottomNavigationItemProps {
  config: {
    key: string;
    href: string;
    labelKey: string;
    ariaLabelKey: string;
    badge?: {
      count: number;
      labelKey: string;
    } | null;
    hideOnMatch?: (pathname: string) => boolean;
  };
  isActive: boolean;
  pathname: string;
}

const ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; active: React.ComponentType<{ className?: string }> }> = {
  explore: { icon: Search, active: Search },
  wishlists: { icon: Heart, active: Heart },
  trips: { icon: CalendarDays, active: CalendarDays },
  profile: { icon: User, active: User },
};

/**
 * Individual bottom navigation item.
 * Accessible: proper role, aria-current, focus-visible, touch target ≥44×44px.
 */
export function BottomNavigationItem({ config, isActive, pathname }: BottomNavigationItemProps) {
  const { t } = useLocale();
  const { icon: Icon, active: ActiveIcon } = ICON_MAP[config.key];
  const IconComponent = isActive ? ActiveIcon : Icon;

  const label = t('nav', config.labelKey.replace('nav.', '')) || config.key;
  const ariaLabel = t('nav', config.ariaLabelKey.replace('nav.', '')) || label;

  const isHidden = config.hideOnMatch?.(pathname) ?? false;

  if (isHidden) return null;

  const baseClasses = "flex flex-col items-center justify-center gap-1 px-3 py-2 min-h-[48px] min-w-[64px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950 active:opacity-70";
  const activeClasses = isActive
    ? 'text-brand'
    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200';

  return (
    <Link
      href={config.href}
      role="menuitem"
      aria-current={isActive ? 'page' : undefined}
      aria-label={ariaLabel}
      className={`${baseClasses} ${activeClasses}`}
    >
      <span aria-hidden="true">
        <IconComponent className="h-6 w-6" />
      </span>
      <span className="text-[10px] font-medium leading-none truncate max-w-[60px]">
        {label}
      </span>
      {config.badge && config.badge.count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-5 rounded-full bg-brand text-brand-ink text-[9px] font-bold flex items-center justify-center"
          aria-label={t('nav', config.badge.labelKey.replace('nav.', ''))}
        >
          {config.badge.count > 99 ? '99+' : config.badge.count}
        </span>
      )}
    </Link>
  );
}