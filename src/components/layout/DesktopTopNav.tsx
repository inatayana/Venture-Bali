'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Heart, LogOut, Menu, User } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { getNamespace } from '@/lib/i18n-unified';
import { useWishlist } from '@/store/wishlistStore';
import { BrandWordmark } from './BrandWordmark';
import { HeaderSettings } from './HeaderSettings';
import { cn } from '@/utils/cn';

/**
 * Desktop menu entries behind the header burger. Trips is desktop-only —
 * the mobile bottom navigation keeps its three tabs (Explore, Wishlists,
 * Profile) and stays the single source of truth in navigationConfig.
 */
const DESKTOP_MENU_ITEMS = [
  { href: '/wishlists', labelKey: 'wishlist', ariaLabelKey: 'wishlistAria', icon: Heart },
  { href: '/trips', labelKey: 'trips', ariaLabelKey: 'tripsAria', icon: CalendarDays },
  { href: '/profile', labelKey: 'profile', ariaLabelKey: 'profileAria', icon: User },
] as const;

/**
 * Desktop App Shell — the burger lives on the existing header instead of a
 * second navigation bar. Mobile keeps the bottom bar (`md:hidden` on
 * BottomNavigation); desktop gets this header (`hidden md:block`) so every
 * device sees the primary nav.
 */
export function DesktopTopNav() {
  const pathname = usePathname() ?? '/';
  const { locale } = useLocale();
  const labels = getNamespace(locale, 'nav');
  const clearWishlist = useWishlist((state) => state.clear);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape, like the other header sheets.
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

  const activeHref = DESKTOP_MENU_ITEMS.find((item) => pathname.startsWith(item.href))?.href ?? null;

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
    <div className="hidden md:block border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="BaliWild home" className="inline-flex">
          <BrandWordmark className="text-xl text-brand-ink" />
        </Link>

        <div className="flex items-center gap-2">
          <HeaderSettings />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-controls="desktop-nav-menu"
              aria-label="Open navigation menu"
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/15 dark:text-white dark:hover:bg-white/10',
                open && 'bg-neutral-100 dark:bg-white/10'
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
                {DESKTOP_MENU_ITEMS.map((item) => {
                  const label = labels[item.labelKey as keyof typeof labels] ?? item.labelKey;
                  const ariaLabel = labels[item.ariaLabelKey as keyof typeof labels] ?? label;
                  const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={ariaLabel}
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
        </div>
      </div>
    </div>
  );
}
