'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  ClipboardList,
  RotateCcw,
  Sparkles,
  BarChart3,
  MessageSquareQuote,
  Ticket,
  Globe,
  ExternalLink,
  LogOut,
  Building2,
  Package,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_ITEMS = [
  // === TIER 1: DAILY OPERATIONS (Critical, High Frequency) ===
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/ventures', label: 'Products', icon: Package },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/operations', label: 'Operations', icon: ClipboardList },

  // === TIER 2: CUSTOMER & REVENUE IMPACT ===
  { href: '/admin/refunds', label: 'Refunds', icon: RotateCcw },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },

  // === TIER 3: SETUP & CONFIGURATION ===
  { href: '/admin/vendors', label: 'Vendors', icon: Building2 },
  { href: '/admin/zones', label: 'Pickup Zones', icon: MapPin },

  // === TIER 4: MARKETING & REPORTING ===
  { href: '/admin/reports', label: 'Revenue', icon: BarChart3 },
  { href: '/admin/content', label: 'AI Content', icon: Sparkles },
  { href: '/admin/seo', label: 'Expert SEO', icon: Globe },
  { href: '/admin/reviews/invites', label: 'Invites', icon: Ticket },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Close mobile drawer on route change
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 dark:border-gray-800 bg-brand-ink p-5 text-white">
              <BrandWordmark className="text-xl" />
              <p className="mt-1 text-xs text-white/50">Operator Panel</p>
            </div>

            {/* Theme Toggle in Mobile */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-current transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            <nav className="p-3 space-y-1 flex-1" aria-label="Admin navigation">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active =
                  href === '/admin'
                    ? pathname === '/admin'
                    : href === '/admin/reviews'
                      ? pathname === '/admin/reviews'
                      : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                      active
                        ? 'bg-brand text-brand-ink'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ExternalLink className="w-4 h-4" />
                View public site
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-screen hidden lg:flex lg:flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-brand-ink p-5 text-white">
          <BrandWordmark className="text-xl" />
          <p className="mt-1 text-xs text-white/50">Operator Panel</p>
        </div>

        {/* Theme toggle at top of sidebar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-current transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/admin'
                ? pathname === '/admin'
                : href === '/admin/reviews'
                  ? pathname === '/admin/reviews'
                  : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                  active
                    ? 'bg-brand text-brand-ink'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4" />
            View public site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  );
}