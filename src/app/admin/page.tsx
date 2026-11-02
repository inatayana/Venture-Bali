import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

interface DashboardStats {
  ventureCount: number;
  variantCount: number;
  bookingCount: number;
  paidCount: number;
  pendingCount: number;
  cancelledCount: number;
  revenueIdr: number;
  articleCount: number;
}

async function loadStats(): Promise<DashboardStats> {
  const [ventureCount, variantCount, bookingCount, paidCount, pendingCount, cancelledCount, articleCount] =
    await Promise.all([
      prisma.venture.count(),
      prisma.variant.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { paymentStatus: 'PAID' } }),
      prisma.booking.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.booking.count({ where: { paymentStatus: 'CANCELLED' } }),
      prisma.article.count(),
    ]);

  const paidBookings = await prisma.booking.findMany({
    where: { paymentStatus: 'PAID' },
    select: { totalPrice: true },
  });

  const revenueIdr = paidBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

  return {
    ventureCount,
    variantCount,
    bookingCount,
    paidCount,
    pendingCount,
    cancelledCount,
    revenueIdr,
    articleCount,
  };
}

export default async function AdminDashboardPage() {
  const stats = await loadStats();

  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      customer: { select: { name: true, email: true } },
      variant: { select: { title: true, venture: { select: { title: true } } } },
    },
  });

  const tiles = [
    { label: 'Ventures', value: stats.ventureCount, href: '/admin/ventures' },
    { label: 'Variants', value: stats.variantCount, href: '/admin/ventures' },
    { label: 'Bookings', value: stats.bookingCount, href: '/admin/bookings' },
    { label: 'Articles', value: stats.articleCount, href: '/admin/content' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Live figures from the database.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Key figures">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="bg-surface rounded-xl shadow-sm border border-line p-5 hover:border-brand transition-colors"
          >
            <p className="text-xs uppercase tracking-wider text-foreground-muted">{tile.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground mt-1 tabular-nums">
              {tile.value}
            </p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl shadow-sm border border-line p-5 lg:col-span-1">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Paid revenue</p>
          <p className="font-heading text-2xl font-bold text-foreground mt-1 tabular-nums">
            {formatPrice(stats.revenueIdr)}
          </p>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Paid</dt>
              <dd className="font-medium text-foreground">{stats.paidCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Pending</dt>
              <dd className="font-medium text-foreground">{stats.pendingCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Cancelled</dt>
              <dd className="font-medium text-foreground">{stats.cancelledCount}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-line p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-foreground hover:underline">
              View all
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-sm text-foreground-secondary py-6 text-center">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-foreground-secondary border-b border-line">
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 pr-3 font-medium">Product</th>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs text-foreground-secondary">
                        {booking.bookingCode}
                      </td>
                      <td className="py-2 pr-3 text-foreground">
                        {booking.variant?.venture?.title ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-foreground-secondary">{booking.customer?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-foreground tabular-nums">
                        {formatPrice(booking.totalPrice)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            booking.paymentStatus === 'PAID'
                              ? 'bg-green-100 text-success'
                              : booking.paymentStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-inset text-foreground-secondary'
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
