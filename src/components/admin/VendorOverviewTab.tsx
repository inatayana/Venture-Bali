'use client';

import { cn } from '@/utils/cn';

interface Vendor {
  id: string;
  code: string;
  name: string;
  activityType: string;
  meetingPoint: string | null;
  mapsUrl: string | null;
  isActive: boolean;
  contractType: string | null;
  fixedFeePerPax: number | null;
  revenueSharePct: number | null;
  paymentTerms: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  commissionType: string | null;
  commissionValue: number | null;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  avgRating: number | null;
  totalRatingCount: number;
  onTimeRate: number | null;
  cancellationRate: number | null;
  totalIncidents: number;
  safetyIncidents: number;
  lastIncidentDate: string | null;
  totalRevenue: number;
  totalCommission: number;
  pendingPayout: number;
  lastPayoutDate: string | null;
  lastPayoutAmount: number | null;
  status: string;
  notes: string | null;
  tags: string[];
  _count?: {
    variants: number;
    contracts: number;
    incidents: number;
    payouts: number;
  };
}

export function OverviewTab({ vendors, onEdit, onDelete, onSelect }: {
  vendors: Vendor[];
  onEdit: (v: Vendor) => void;
  onDelete: (id: string) => void;
  onSelect: (v: Vendor) => void;
}) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
      INACTIVE: { label: 'Inactive', className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
      SUSPENDED: { label: 'Suspended', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' },
      PENDING_ONBOARDING: { label: 'Onboarding', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' },
      TERMINATED: { label: 'Terminated', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' },
    };
    return configs[status] || { label: status, className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' };
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-3 font-semibold">Code</th>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Activity</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Bookings</th>
              <th className="px-6 py-3 font-semibold">Revenue</th>
              <th className="px-6 py-3 font-semibold">Rating</th>
              <th className="px-6 py-3 font-semibold">Incidents</th>
              <th className="px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => onSelect?.(v)}>
                <td className="px-6 py-4 font-mono text-xs">{v.code}</td>
                <td className="px-6 py-4 font-medium">{v.name}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{v.activityType}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                    getStatusConfig(v.status).className
                  )}>
                    {getStatusConfig(v.status).label}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">{v.totalBookings}</td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v.totalRevenue)}</td>
                <td className="px-6 py-4">
                  {v.avgRating ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l1.18-6.88L0 9.27l7.91-.73L12 2z"/></svg> {v.avgRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                    v.totalIncidents > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  )}>
                    {v.totalIncidents}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(v); }}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Edit"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(v.id); }}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Delete"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}