'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'amber' | 'red';
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
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