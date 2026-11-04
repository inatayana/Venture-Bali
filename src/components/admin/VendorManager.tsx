'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';

interface Vendor {
  id: string;
  code: string;
  name: string;
  activityType: string;
  meetingPoint: string | null;
  mapsUrl: string | null;
  isActive: boolean;
}

export function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', activityType: '', meetingPoint: '', mapsUrl: '' });
  const [saving, setSaving] = useState(false);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/vendors');
      const json = await res.json();
      if (json.success) setVendors(json.data);
    } catch {
      console.error('Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadVendors(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setForm({ code: '', name: '', activityType: '', meetingPoint: '', mapsUrl: '' });
        setShowForm(false);
        await loadVendors();
      }
    } catch {
      console.error('Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Vendor / Partner Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage activity providers. Vendor info is hidden from customers and only shown on e-vouchers.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-ink text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code (unique)</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VND-ATV-001"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ubud ATV Adventure Co."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <input
                required
                value={form.activityType}
                onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                placeholder="ATV"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Point</label>
              <input
                value={form.meetingPoint}
                onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                placeholder="Ubud ATV Base Camp"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Maps URL</label>
              <input
                type="url"
                value={form.mapsUrl}
                onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-ink text-white font-medium text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Vendor
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No vendors yet. Add your first vendor above.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-900">Code</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Activity</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Meeting Point</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-6 py-4 font-mono text-xs">{v.code}</td>
                  <td className="px-6 py-4 font-medium">{v.name}</td>
                  <td className="px-6 py-4">{v.activityType}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{v.meetingPoint || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${v.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
