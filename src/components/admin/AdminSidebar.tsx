'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Sparkles,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/ventures', label: 'Ventures', icon: Map },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/content', label: 'AI Content', icon: Sparkles },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white min-h-screen hidden lg:flex lg:flex-col">
      <div className="p-5 border-b border-gray-200">
        <p className="font-heading text-xl font-bold uppercase tracking-wider text-blue-600">
          Venture Bali
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Operator Panel</p>
      </div>

      <nav className="p-3 space-y-1 flex-1" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          <ExternalLink className="w-4 h-4" />
          View public site
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-60 min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
