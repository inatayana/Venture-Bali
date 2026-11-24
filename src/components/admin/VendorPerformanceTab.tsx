'use client';

interface Vendor {
  id: string;
  name: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  avgRating: number | null;
  totalRatingCount: number;
  onTimeRate: number | null;
  cancellationRate: number | null;
}

export function PerformanceTab({ vendors }: { vendors: Vendor[] }) {
  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceCard title="Total Bookings" value={vendors.reduce((sum, v) => sum + v.totalBookings, 0)} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
        <PerformanceCard title="Completed" value={vendors.reduce((sum, v) => sum + (v.completedBookings || 0), 0)} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>} />
        <PerformanceCard title="Cancellation Rate" value={vendors.length ? (vendors.reduce((sum, v) => sum + (v.cancellationRate || 0), 0) / vendors.length).toFixed(1) + '%' : '—'} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 21 12 17 20"/><polyline points="1 20 5 20 9 20"/></svg>} />
        <PerformanceCard title="Avg Rating" value={vendors.filter(v => v.avgRating).length ? (vendors.reduce((sum, v) => sum + (v.avgRating || 0), 0) / vendors.filter(v => v.avgRating).length).toFixed(1) : '—'} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l1.18-6.88L0 9.27l7.91-.73L12 2z"/></svg>} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-3 font-semibold">Vendor</th>
              <th className="px-6 py-3 font-semibold">Bookings</th>
              <th className="px-6 py-3 font-semibold">Completed</th>
              <th className="px-6 py-3 font-semibold">Cancelled</th>
              <th className="px-6 py-3 font-semibold">No-Show</th>
              <th className="px-6 py-3 font-semibold">Avg Rating</th>
              <th className="px-6 py-3 font-semibold">On-Time %</th>
              <th className="px-6 py-3 font-semibold">Cancellation %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium">{v.name}</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">{v.totalBookings}</td>
                <td className="px-6 py-4 text-green-600 dark:text-green-400">{v.completedBookings}</td>
                <td className="px-6 py-4 text-red-600 dark:text-red-400">{v.cancelledBookings}</td>
                <td className="px-6 py-4 text-amber-600 dark:text-amber-400">{v.noShowBookings}</td>
                <td className="px-6 py-4">
                  {v.avgRating ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l1.18-6.88L0 9.27l7.91-.73L12 2z"/></svg> {v.avgRating.toFixed(1)}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4">{formatPercent(v.onTimeRate)}</td>
                <td className="px-6 py-4">{formatPercent(v.cancellationRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PerformanceCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
      </div>
    </div>
  );
}