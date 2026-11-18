'use client';

interface Vendor {
  id: string;
  name: string;
  totalIncidents: number;
  safetyIncidents: number;
}

export function IncidentsTab({ vendors }: { vendors: Vendor[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Incidents" value={vendors.reduce((sum, v) => sum + v.totalIncidents, 0)} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} color="red" />
        <StatCard title="Safety Incidents" value={vendors.reduce((sum, v) => sum + v.safetyIncidents, 0)} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3 7 2 8-5 8 5"/></svg>} color="red" />
        <StatCard title="Vendors with Incidents" value={vendors.filter(v => v.totalIncidents > 0).length} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} color="amber" />
        <StatCard title="Open Incidents" value={0} icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} color="blue" />
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Incident tracking requires detailed incident data. This tab would show a table of all incidents with severity, status, and resolution details.
        </p>
      </div>
    </div>
  );
}

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

export { StatCard };