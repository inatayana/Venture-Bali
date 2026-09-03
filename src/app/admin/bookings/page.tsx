import { mockBookings, resolveVariant } from '@/data/mockBookings';
import { formatPrice } from '@/lib/i18n';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-50 text-red-700',
};

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="heading-caps text-2xl text-gray-900 mb-1">Bookings</h1>
      <p className="text-sm text-gray-500 mb-6">Reservation management — mock data preview</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Fulfillment</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Pax</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockBookings.map((booking) => {
                const variant = resolveVariant(booking.variantId);
                return (
                  <tr key={booking.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{booking.bookingCode}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900">{booking.customer?.name ?? booking.customerId}</p>
                      <p className="text-xs text-gray-400">{booking.customer?.whatsapp}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900">{variant?.ventureTitle ?? '—'}</p>
                      <p className="text-xs text-gray-400">{variant?.variantTitle ?? booking.variantId}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {booking.fulfillmentMode === 'SELF_DRIVE' ? 'Self Drive' : 'Private Transfer'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 tabular-nums">{booking.bookingDate}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600 tabular-nums">{booking.paxCount}</td>
                    <td className="px-5 py-3.5 text-right font-heading font-bold tabular-nums text-gray-900">
                      {formatPrice(booking.totalPrice)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
