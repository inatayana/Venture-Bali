'use client';

interface Vendor {
  id: string;
  name: string;
  totalRevenue: number;
  totalCommission: number;
  pendingPayout: number;
  lastPayoutAmount: number | null;
  lastPayoutDate: string | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color?: 'green' | 'blue' | 'amber' | 'red' }) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color ? colorClasses[color] : 'bg-brand/10 text-brand'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function PayoutsTab({ vendors }: { vendors: Vendor[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(vendors.reduce((sum, v) => sum + v.totalRevenue, 0))} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="12"/></svg>} color="blue" />
        <StatCard title="Total Commission" value={formatCurrency(vendors.reduce((sum, v) => sum + v.totalCommission, 0))} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="12"/></svg>} color="green" />
        <StatCard title="Pending Payout" value={formatCurrency(vendors.reduce((sum, v) => sum + (v.pendingPayout || 0), 0))} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>} color="amber" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-3 font-semibold">Vendor</th>
              <th className="px-6 py-3 font-semibold">Total Revenue</th>
              <th className="px-6 py-3 font-semibold">Total Commission</th>
              <th className="px-6 py-3 font-semibold">Pending Payout</th>
              <th className="px-6 py-3 font-semibold">Last Payout</th>
              <th className="px-6 py-3 font-semibold">Last Payout Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium">{v.name}</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">{formatCurrency(v.totalRevenue)}</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">{formatCurrency(v.totalCommission)}</td>
                <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(v.pendingPayout)}</td>
                <td className="px-6 py-4">{v.lastPayoutAmount ? formatCurrency(v.lastPayoutAmount) : '—'}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(v.lastPayoutDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}