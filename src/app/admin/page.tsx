import Link from 'next/link';
import { Map, CalendarCheck, Banknote, Hourglass } from 'lucide-react';
import { mockVentures } from '@/data/mockVentures';
import { mockBookings, resolveVariant } from '@/data/mockBookings';
import { formatPrice } from '@/lib/i18n';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-50 text-red-700',
};

export default function AdminDashboardPage() {
  const activeVentures = mockVentures.filter((v) => v.isAvailable).length;
  const paidBookings = mockBookings.filter((b) => b.paymentStatus === 'PAID');
  const revenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingCount = mockBookings.filter((b) => b.paymentStatus === 'PENDING').length;
  const recentBookings = [...mockBookings]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const stats = [
    { label: 'Total Ventures', value: String(mockVentures.length), sub: `${activeVentures} active`, icon: Map },
    { label: 'Total Bookings', value: String(mockBookings.length), sub: `${pendingCount} pending payment`, icon: CalendarCheck },
    { label: 'Revenue (Paid)', value: formatPrice(revenue), sub: `${paidBookings.length} settled bookings`, icon: Banknote },
    { label: 'Awaiting Payment', value: String(pendingCount), sub: 'follow up via WhatsApp', icon: Hourglass },
  ];

  return (
    <div>
      <h1 className="heading-caps text-2xl text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Operational overview — mock data preview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="heading-caps text-lg text-gray-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => {
                const variant = resolveVariant(booking.variantId);
                return (
                  <tr key={booking.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{booking.bookingCode}</td>
                    <td className="px-5 py-3.5 text-gray-600">{booking.customer?.name ?? booking.customerId}</td>
                    <td className="px-5 py-3.5 text-gray-600">{variant?.ventureTitle ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 tabular-nums">{booking.bookingDate}</td>
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
