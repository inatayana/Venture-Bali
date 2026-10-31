import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-800',
};

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, email: true, whatsapp: true } },
      variant: {
        select: {
          title: true,
          venture: { select: { title: true, slug: true } },
        },
      },
      slotTime: { select: { time: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">{bookings.length} bookings in total.</p>
      </header>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-gray-500">No bookings yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Date &amp; slot</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Pax</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {booking.bookingCode}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {booking.variant?.venture?.title ?? '—'}
                      <p className="text-xs text-gray-400">{booking.variant?.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.bookingDate}
                      <p className="text-xs text-gray-400">{booking.slotTime?.time ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.fulfillmentMode === 'PRIVATE_TRANSFER' ? 'Transfer' : 'Self drive'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.customer?.name ?? '—'}
                      <p className="text-xs text-gray-400">{booking.customer?.whatsapp}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{booking.paxCount}</td>
                    <td className="px-4 py-3 text-gray-800 tabular-nums">
                      {formatPrice(booking.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          STATUS_STYLES[booking.paymentStatus] ?? 'bg-gray-100 text-gray-700'
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
        </div>
      )}
    </div>
  );
}
