'use client';

import { Fragment, useState, useEffect } from 'react';
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
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type NavGroup = 'Daily operations' | 'Customer & revenue' | 'Setup' | 'Marketing & reporting';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: NavGroup;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'Daily operations' },
  { href: '/admin/ventures', label: 'Products', icon: Package, group: 'Daily operations' },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, group: 'Daily operations' },
  { href: '/admin/operations', label: 'Operations', icon: ClipboardList, group: 'Daily operations' },

  { href: '/admin/refunds', label: 'Refunds', icon: RotateCcw, group: 'Customer & revenue' },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote, group: 'Customer & revenue' },

  { href: '/admin/vendors', label: 'Vendors', icon: Building2, group: 'Setup' },
  { href: '/admin/zones', label: 'Pickup Zones', icon: MapPin, group: 'Setup' },

  { href: '/admin/reports', label: 'Revenue', icon: BarChart3, group: 'Marketing & reporting' },
  { href: '/admin/growth', label: 'Growth', icon: TrendingUp, group: 'Marketing & reporting' },
  { href: '/admin/content', label: 'AI Content', icon: Sparkles, group: 'Marketing & reporting' },
  { href: '/admin/seo', label: 'Expert SEO', icon: Globe, group: 'Marketing & reporting' },
  { href: '/admin/reviews/invites', label: 'Invites', icon: Ticket, group: 'Marketing & reporting' },
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

/** Shared nav list so mobile drawer and desktop sidebar can never drift apart. */
function AdminNavItems({
  pathname,
  onNavigate,
  showGroups = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  showGroups?: boolean;
}) {
  let previousGroup: NavGroup | null = null;

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigation">
      {NAV_ITEMS.map(({ href, label, icon: Icon, group }) => {
        const startsGroup = showGroups && group !== previousGroup;
        previousGroup = group;
        const active = isActive(href, pathname);

        return (
          <Fragment key={href}>
            {startsGroup ? (
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group}
              </p>
            ) : null}
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'min-h-[44px]',
                active
                  ? 'bg-brand text-brand-ink'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}

/** Footer actions shared by both variants. */
function AdminNavFooter({
  onNavigate,
  onSignOut,
  isSigningOut,
}: {
  onNavigate?: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <div className="space-y-1 border-t border-gray-200 p-3 dark:border-gray-800">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <ExternalLink className="h-4 w-4" />
        View public site
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-800 min-h-[44px]"
      >
        <LogOut className="h-4 w-4" />
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
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
      {/* Mobile: full-screen drawer with the complete menu. */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900 lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="h-screen w-screen max-w-none overflow-hidden p-0 sm:w-80 sm:max-w-[320px]"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-800 bg-brand-ink p-5 text-white">
              <BrandWordmark className="text-xl" />
              <p className="mt-1 text-xs text-white/50">Operator Panel</p>
            </div>

            {/* Kept here: when the drawer is open this is the only visible control. */}
            <div className="border-b border-gray-200 p-3 dark:border-gray-800">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            <AdminNavItems
              pathname={pathname}
              showGroups
              onNavigate={() => setIsMobileOpen(false)}
            />
            <AdminNavFooter
              onNavigate={() => setIsMobileOpen(false)}
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: no theme toggle here — the dashboard already has one. */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex lg:min-h-screen">
        <div className="border-b border-gray-200 bg-brand-ink p-5 text-white dark:border-gray-800">
          <BrandWordmark className="text-xl" />
          <p className="mt-1 text-xs text-white/50">Operator Panel</p>
        </div>

        <AdminNavItems pathname={pathname} />

        <AdminNavFooter onSignOut={handleSignOut} isSigningOut={isSigningOut} />
      </aside>
    </>
  );
}
