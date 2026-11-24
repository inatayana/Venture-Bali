'use client';

interface Vendor {
  id: string;
  code: string;
  name: string;
  activityType: string;
  contractType: string | null;
  fixedFeePerPax: number | null;
  revenueSharePct: number | null;
  paymentTerms: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FIXED_FEE: 'Fixed Fee per Pax',
  REVENUE_SHARE: 'Revenue Share %',
  HYBRID: 'Hybrid',
};

export function ContractsTab({ vendors }: { vendors: Vendor[] }) {
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getContractLabel = (type: string | null): string => {
    if (!type) return '—';
    return CONTRACT_TYPE_LABELS[type] || type;
  };

  const getPriceLabel = (v: Vendor): string => {
    if (!v.contractType) return '—';
    if (v.contractType === 'REVENUE_SHARE') {
      return `${v.revenueSharePct}%`;
    }
    if (v.fixedFeePerPax) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v.fixedFeePerPax) + '/pax';
    }
    return '—';
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Contract management - view contract details, renewal dates, and terms.
      </p>
      <div className="space-y-4">
        {vendors.filter(v => v.contractType).map((v) => (
          <div key={v.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand/10 text-brand-ink dark:bg-brand/20 dark:text-brand">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{v.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{v.code} · {v.activityType}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span>{getContractLabel(v.contractType)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="12"/></svg>
                  <span>{getPriceLabel(v)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(v.contractStartDate)} - {v.contractEndDate ? formatDate(v.contractEndDate) : 'Ongoing'}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}