/**
 * Bottom Navigation Configuration
 * Single source of truth for nav structure, labels, icons, and routing.
 * Labels use i18n keys — actual translation happens in component via useLocale().
 */

import type { LucideIcon } from 'lucide-react';

export interface BottomNavItemConfig {
  key: string;
  href: string;
  labelKey: string;           // e.g., 'nav.explore' -> t('nav', 'explore')
  ariaLabelKey: string;       // e.g., 'nav.exploreAria'
  icon: LucideIcon | null;
  activeIcon: LucideIcon | null;
  badge?: {
    count: number;
    labelKey: string;         // e.g., 'nav.tripsActionRequired'
  } | null;
  hideOnMatch?: (pathname: string) => boolean;
}

export const BOTTOM_NAV_ITEMS = [
  {
    key: 'explore',
    href: '/explore',
    labelKey: 'nav.explore',
    ariaLabelKey: 'nav.exploreAria',
    icon: null,
    activeIcon: null,
    badge: null,
    hideOnMatch: (pathname: string) => pathname.startsWith('/checkout') || pathname.startsWith('/booking') || pathname.startsWith('/experiences/'),
  },
  {
    key: 'wishlists',
    href: '/wishlists',
    labelKey: 'nav.wishlist',
    ariaLabelKey: 'nav.wishlistAria',
    icon: null,
    activeIcon: null,
    badge: null,
    hideOnMatch: (pathname: string) => pathname.startsWith('/checkout') || pathname.startsWith('/booking') || pathname.startsWith('/experiences/'),
  },
  {
    key: 'trips',
    href: '/trips',
    labelKey: 'nav.trips',
    ariaLabelKey: 'nav.tripsAria',
    icon: null,
    activeIcon: null,
    badge: null,
    hideOnMatch: (pathname: string) => pathname.startsWith('/checkout') || pathname.startsWith('/booking') || pathname.startsWith('/experiences/'),
  },
  {
    key: 'profile',
    href: '/profile',
    labelKey: 'nav.profile',
    ariaLabelKey: 'nav.profileAria',
    icon: null,
    activeIcon: null,
    badge: null,
    hideOnMatch: (pathname: string) => pathname.startsWith('/checkout') || pathname.startsWith('/booking') || pathname.startsWith('/experiences/'),
  },
] as const;

export type BottomNavItemConfigType = typeof BOTTOM_NAV_ITEMS[number];
export type BottomNavKey = typeof BOTTOM_NAV_ITEMS[number]['key'];

export const DEFAULT_BOTTOM_NAV_KEY: BottomNavKey = 'explore';