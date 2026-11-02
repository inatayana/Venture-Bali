import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';
import { LIFECYCLE_LABELS } from '@/lib/bookingLifecycle';

export const dynamic = 'force-dynamic';

interface AdminBookingsPageProps {
  searchParams: { date?: string };
}

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-800',
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
          <h1 className="font-heading text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {bookings.length} {dateFilter ? `bookings on ${dateFilter}` : 'bookings in total'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/bookings"
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 ${
              dateFilter ? 'border-gray-200 text-gray-600' : 'border-brand bg-brand/20 text-neutral-900'
            }`}
          >
            All
          </Link>
          <Link
            href={`/admin/bookings?date=${witaDateKey()}`}
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 ${
              dateFilter === witaDateKey()
                ? 'border-brand bg-brand/20 text-neutral-900'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            Today
          </Link>
          <Link
            href={`/admin/bookings?date=${witaDateKey(1)}`}
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 ${
              dateFilter === witaDateKey(1)
                ? 'border-brand bg-brand/20 text-neutral-900'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            Tomorrow
          </Link>
        </div>
      </header>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
          <p className="text-gray-500">No bookings for this filter yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
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
                    <tr key={booking.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {booking.bookingCode}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {booking.variant?.venture?.title ?? '—'}
                        <p className="text-xs text-gray-600">{booking.variant?.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {booking.bookingDate}
                        <p className="text-xs text-gray-600">{booking.slotTime?.time ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {MODE_LABELS[booking.fulfillmentMode] ?? booking.fulfillmentMode}
                        {booking.vehicleClass && (
                          <p className="text-xs text-gray-600">{booking.vehicleClass.label}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pickup}
                        <p className="text-xs text-gray-600">{booking.pickupZone?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {booking.customer?.name ?? '—'}
                        <p className="text-xs text-gray-600">{booking.customer?.whatsapp}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">{booking.paxCount}</td>
                      <td className="px-4 py-3 tabular-nums text-gray-800">
                        {formatPrice(booking.totalPrice)}
                        {booking.discountIdr > 0 && (
                          <p className="text-xs text-green-600">−{formatPrice(booking.discountIdr)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[booking.paymentStatus] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                        <p className="mt-1 text-xs text-gray-600">
                          {LIFECYCLE_LABELS[booking.lifecycleStatus]}
                        </p>
                        {booking.paymentStatus === 'PENDING' && booking.expiresAt && (
                          <p className="text-xs text-amber-600">
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
