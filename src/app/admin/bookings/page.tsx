import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';
import { LIFECYCLE_LABELS } from '@/lib/bookingLifecycle';

export const dynamic = 'force-dynamic';

interface AdminBookingsPageProps {
  searchParams: { date?: string };
}

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  CANCELLED: 'bg-inset text-foreground-secondary',
  FAILED: 'bg-danger/10 text-danger',
};

const MODE_LABELS: Record<string, string> = {
  SELF_DRIVE: 'Self drive',
  SHARED_TRANSFER: 'Shared transfer',
  PRIVATE_TRANSFER: 'Private transfer',
};

function isValidDateKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function witaDateKey(daysAhead = 0): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000 + daysAhead * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const dateFilter = isValidDateKey(searchParams.date) ? searchParams.date : null;

  const bookings = await prisma.booking.findMany({
    where: dateFilter ? { bookingDate: dateFilter } : undefined,
    orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      customer: { select: { name: true, email: true, whatsapp: true } },
      variant: {
        select: {
          title: true,
          venture: { select: { title: true, slug: true } },
        },
      },
      slotTime: { select: { time: true } },
      pickupZone: { select: { name: true } },
      vehicleClass: { select: { label: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Bookings</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {bookings.length} {dateFilter ? `bookings on ${dateFilter}` : 'bookings in total'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/bookings"
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 ${
              dateFilter ? 'border-line text-foreground-secondary' : 'border-brand bg-brand/20 text-foreground'
            }`}
          >
            All
          </Link>
          <Link
            href={`/admin/bookings?date=${witaDateKey()}`}
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 ${
              dateFilter === witaDateKey()
                ? 'border-brand bg-brand/20 text-foreground'
                : 'border-line text-foreground-secondary'
            }`}
          >
            Today
          </Link>
          <Link
            href={`/admin/bookings?date=${witaDateKey(1)}`}
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 ${
              dateFilter === witaDateKey(1)
                ? 'border-brand bg-brand/20 text-foreground'
                : 'border-line text-foreground-secondary'
            }`}
          >
            Tomorrow
          </Link>
        </div>
      </header>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="text-foreground-muted">No bookings for this filter yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-base text-left text-xs uppercase tracking-wider text-foreground-secondary">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Date &amp; slot</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Pax</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const pickup =
                    booking.fulfillmentMode === 'SELF_DRIVE'
                      ? 'Meeting point'
                      : booking.isTba
                        ? 'TBA by H-1'
                        : (booking.hotelAddress ?? booking.pickupZone?.name ?? '—');

                  return (
                    <tr key={booking.id} className="border-b border-line last:border-0 hover:bg-base/50">
                      <td className="px-4 py-3 font-mono text-xs text-foreground-secondary">
                        {booking.bookingCode}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {booking.variant?.venture?.title ?? '—'}
                        <p className="text-xs text-foreground-secondary">{booking.variant?.title}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {booking.bookingDate}
                        <p className="text-xs text-foreground-secondary">{booking.slotTime?.time ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {MODE_LABELS[booking.fulfillmentMode] ?? booking.fulfillmentMode}
                        {booking.vehicleClass && (
                          <p className="text-xs text-foreground-secondary">{booking.vehicleClass.label}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {pickup}
                        <p className="text-xs text-foreground-secondary">{booking.pickupZone?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {booking.customer?.name ?? '—'}
                        <p className="text-xs text-foreground-secondary">{booking.customer?.whatsapp}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-foreground-secondary">{booking.paxCount}</td>
                      <td className="px-4 py-3 tabular-nums text-foreground">
                        {formatPrice(booking.totalPrice)}
                        {booking.discountIdr > 0 && (
                          <p className="text-xs text-success">−{formatPrice(booking.discountIdr)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[booking.paymentStatus] ?? 'bg-inset text-foreground-secondary'
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                        <p className="mt-1 text-xs text-foreground-secondary">
                          {LIFECYCLE_LABELS[booking.lifecycleStatus]}
                        </p>
                        {booking.paymentStatus === 'PENDING' && booking.expiresAt && (
                          <p className="text-xs text-warning">
                            hold until {booking.expiresAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
