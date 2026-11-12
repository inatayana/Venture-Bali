'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Heart, LogOut, Menu, User } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { getNamespace } from '@/lib/i18n-unified';
import { useWishlist } from '@/store/wishlistStore';
import { cn } from '@/utils/cn';

/**
 * Desktop menu entries behind the header burger. Trips is desktop-only —
 * the mobile bottom navigation keeps its four tabs (Explore, Wishlists,
 * Trips, Profile) and stays the single source of truth in navigationConfig.
 */
const MENU_ITEMS = [
  { href: '/wishlists', labelKey: 'wishlist', icon: Heart },
  { href: '/trips', labelKey: 'trips', icon: CalendarDays },
  { href: '/profile', labelKey: 'profile', icon: User },
] as const;

interface DesktopNavMenuProps {
  /**
   * light — on white headers (default). dark — on the brand-ink banners of
   * the catalogue pages.
   */
  variant?: 'light' | 'dark';
}

/**
 * The burger button that lives on each page's existing header, next to the
 * theme controls — there is no separate desktop navigation bar. Opens a
 * dropdown with the primary destinations and Log out.
 */
export function DesktopNavMenu({ variant = 'light' }: DesktopNavMenuProps) {
  const pathname = usePathname() ?? '/';
  const { locale } = useLocale();
  const labels = getNamespace(locale, 'nav');
  const clearWishlist = useWishlist((state) => state.clear);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape, like the other header popovers.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const activeHref = MENU_ITEMS.find((item) => pathname.startsWith(item.href))?.href ?? null;

  /**
   * Customers have no server session yet (magic-link only), so signing out
   * clears the guest's local wishlist. When customer accounts arrive this
   * handler also calls the session logout endpoint. The admin logout
   * (/api/admin/logout) is separate and untouched.
   */
  const handleSignOut = () => {
    clearWishlist();
    setOpen(false);
  };

  return (
    <div className="relative hidden md:block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="desktop-nav-menu"
        aria-label="Open navigation menu"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          variant === 'dark'
            ? 'border-white/25 text-white hover:bg-white/10'
            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10',
          open &&
            (variant === 'dark'
              ? 'bg-white/10'
              : 'bg-neutral-100 dark:bg-white/10')
        )}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id="desktop-nav-menu"
          role="menu"
          aria-label="Primary navigation"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-2 shadow-lg dark:border-white/10 dark:bg-neutral-900"
        >
          {MENU_ITEMS.map((item) => {
            const label = labels[item.labelKey as keyof typeof labels] ?? item.labelKey;
            const isActive = item.href === activeHref;

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex min-h-[44px] items-center gap-3 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                  isActive
                    ? 'bg-neutral-100 text-brand-ink dark:bg-white/10 dark:text-white'
                    : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/5'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}

          <div className="my-2 border-t border-neutral-200 dark:border-white/10" />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
