'use client';

interface VendorFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingVendor: {
    id: string;
    code: string;
    name: string;
    activityType: string;
    meetingPoint: string | null;
    mapsUrl: string | null;
    contractType: string | null;
    fixedFeePerPax: number | null;
    revenueSharePct: number | null;
    paymentTerms: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
    commissionType: string | null;
    commissionValue: number | null;
    status: string;
  } | null;
  form: {
    code: string;
    name: string;
    activityType: string;
    meetingPoint: string;
    mapsUrl: string;
    contractType: string;
    fixedFeePerPax: string;
    revenueSharePct: string;
    paymentTerms: string;
    contractStartDate: string;
    contractEndDate: string;
    commissionType: string;
    commissionValue: string;
    status: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    code: string;
    name: string;
    activityType: string;
    meetingPoint: string;
    mapsUrl: string;
    contractType: string;
    fixedFeePerPax: string;
    revenueSharePct: string;
    paymentTerms: string;
    contractStartDate: string;
    contractEndDate: string;
    commissionType: string;
    commissionValue: string;
    status: string;
  }>>;
  saving: boolean;
}

export function VendorFormModal({
  show,
  onClose,
  onSubmit,
  editingVendor,
  form,
  setForm,
  saving,
}: VendorFormModalProps) {
  if (!show && !editingVendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
            {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(e); }} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Code (unique)</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="VND-ATV-001"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                disabled={editingVendor !== null}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ubud ATV Adventure Co."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activity Type</label>
              <input
                required
                value={form.activityType}
                onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                placeholder="ATV"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Point</label>
              <input
                value={form.meetingPoint}
                onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                placeholder="Ubud ATV Base Camp"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maps URL</label>
              <input
                type="url"
                value={form.mapsUrl}
                onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING_ONBOARDING">Pending Onboarding</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contract & Commercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contract Type</label>
                <select
                  value={form.contractType}
                  onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                >
                  <option value="FIXED_FEE">Fixed Fee per Pax</option>
                  <option value="REVENUE_SHARE">Revenue Share %</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                >
                  <option value="NET_7">Net 7 Days</option>
                  <option value="NET_14">Net 14 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_60">Net 60 Days</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.contractType === 'REVENUE_SHARE' ? 'Revenue Share %' : 'Fixed Fee per Pax (IDR)'}
                </label>
                <input
                  type="number"
                  value={form.contractType === 'REVENUE_SHARE' ? form.revenueSharePct : form.fixedFeePerPax}
                  onChange={(e) => setForm({ ...form, [form.contractType === 'REVENUE_SHARE' ? 'revenueSharePct' : 'fixedFeePerPax']: e.target.value })}
                  placeholder={form.contractType === 'REVENUE_SHARE' ? 'e.g. 30' : 'e.g. 50000'}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Type</label>
                <select
                  value={form.commissionType}
                  onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.commissionValue}
                  onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                  placeholder={form.commissionType === 'PERCENTAGE' ? 'e.g. 25' : 'e.g. 100000'}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contract Start</label>
                <input
                  type="date"
                  value={form.contractStartDate}
                  onChange={(e) => setForm({ ...form, contractStartDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contract End</label>
                <input
                  type="date"
                  value={form.contractEndDate}
                  onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-sm outline-none focus:border-brand-ink"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50 px-6"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" strokeLinecap="round" />
                  </svg>
                  Saving...
                </span>
              ) : (editingVendor ? 'Update Vendor' : 'Save Vendor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}