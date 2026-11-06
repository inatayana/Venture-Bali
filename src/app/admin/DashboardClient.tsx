'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/i18n';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface DashboardStats {
  ventureCount: number;
  variantCount: number;
  bookingCount: number;
  paidCount: number;
  pendingCount: number;
  cancelledCount: number;
  revenueIdr: number;
  articleCount: number;
  vendorCount: number;
  zoneCount: number;
}

interface RecentBooking {
  id: string;
  bookingCode: string;
  totalPrice: number;
  paymentStatus: string;
  customer?: { name: string; email: string } | null;
  variant?: { title: string; venture?: { title: string } | null } | null;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentBookings: RecentBooking[];
}

export function DashboardClient({ stats, recentBookings }: DashboardClientProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const tiles = [
    { label: 'Products', value: stats.ventureCount, href: '/admin/ventures' },
    { label: 'Variants', value: stats.variantCount, href: '/admin/ventures' },
    { label: 'Bookings', value: stats.bookingCount, href: '/admin/bookings' },
    { label: 'Articles', value: stats.articleCount, href: '/admin/content' },
    { label: 'Vendors', value: stats.vendorCount, href: '/admin/vendors' },
    { label: 'Pickup Zones', value: stats.zoneCount, href: '/admin/zones' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Live figures from the database.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-current transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" aria-label="Key figures">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:border-brand transition-colors"
          >
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{tile.label}</p>
            <p className="font-heading text-3xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
              {tile.value}
            </p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 lg:col-span-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Paid revenue</p>
          <p className="font-heading text-2xl font-bold text-brand-ink dark:text-brand mt-1 tabular-nums">
            {formatPrice(stats.revenueIdr)}
          </p>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Paid</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{stats.paidCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Pending</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{stats.pendingCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Cancelled</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{stats.cancelledCount}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-brand-ink hover:underline">
              View all
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 py-6 text-center">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 pr-3 font-medium">Product</th>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {booking.bookingCode}
                      </td>
                      <td className="py-2 pr-3 text-gray-800 dark:text-gray-200">
                        {booking.variant?.venture?.title ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{booking.customer?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-gray-800 dark:text-gray-200 tabular-nums">
                        {formatPrice(booking.totalPrice)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            booking.paymentStatus === 'PAID'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : booking.paymentStatus === 'PENDING'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}