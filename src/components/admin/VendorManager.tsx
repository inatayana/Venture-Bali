'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Shield, DollarSign as DollarSignIcon, AlertTriangle as AlertTriangleIcon, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';

import { StatCard } from './VendorStatCard';
import { OverviewTab } from './VendorOverviewTab';
import { ContractsTab } from './VendorContractsTab';
import { PerformanceTab } from './VendorPerformanceTab';
import { PayoutsTab } from './VendorPayoutsTab';
import { IncidentsTab } from './VendorIncidentsTab';
import { VendorFormModal } from './VendorFormModal';

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

type TabType = 'overview' | 'contracts' | 'performance' | 'payouts' | 'incidents';

export function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    activityType: '',
    meetingPoint: '',
    mapsUrl: '',
    contractType: 'FIXED_FEE',
    fixedFeePerPax: '',
    revenueSharePct: '',
    paymentTerms: 'NET_14',
    contractStartDate: '',
    contractEndDate: '',
    commissionType: 'PERCENTAGE',
    commissionValue: '',
    status: 'ACTIVE',
  });

  const [saving, setSaving] = useState(false);

  const loadVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors', { cache: 'no-store', credentials: 'include' });
      const json = await res.json();
      if (json.success) setVendors(json.data);
    } catch {
      console.error('Failed to load vendors');
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
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setForm({
          code: '', name: '', activityType: '', meetingPoint: '', mapsUrl: '',
          contractType: 'FIXED_FEE', fixedFeePerPax: '', revenueSharePct: '',
          paymentTerms: 'NET_14', contractStartDate: '', contractEndDate: '',
          commissionType: 'PERCENTAGE', commissionValue: '',
          status: 'ACTIVE',
        });
        setShowForm(false);
        await loadVendors();
      } else {
        alert(json.error || 'Failed to save vendor');
      }
    } catch {
      console.error('Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingVendor.id, ...form }),
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        setEditingVendor(null);
        await loadVendors();
      } else {
        alert(json.error || 'Failed to save vendor');
      }
    } catch {
      console.error('Failed to update vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({
      code: vendor.code,
      name: vendor.name,
      activityType: vendor.activityType,
      meetingPoint: vendor.meetingPoint || '',
      mapsUrl: vendor.mapsUrl || '',
      contractType: vendor.contractType || 'FIXED_FEE',
      fixedFeePerPax: vendor.fixedFeePerPax?.toString() || '',
      revenueSharePct: vendor.revenueSharePct?.toString() || '',
      paymentTerms: vendor.paymentTerms || 'NET_14',
      contractStartDate: vendor.contractStartDate ? vendor.contractStartDate.split('T')[0] : '',
      contractEndDate: vendor.contractEndDate ? vendor.contractEndDate.split('T')[0] : '',
      commissionType: vendor.commissionType || 'PERCENTAGE',
      commissionValue: vendor.commissionValue?.toString() || '',
      status: vendor.status || 'ACTIVE',
    });
    setShowForm(true);
    setEditingVendor(vendor);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const res = await fetch(`/api/admin/vendors?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        await loadVendors();
      } else {
        alert(json.error || 'Failed to delete vendor');
      }
    } catch {
      console.error('Failed to delete vendor');
    }
  };

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(selectedVendor?.id === vendor.id ? null : vendor);
  };

  // Summary stats
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'ACTIVE').length;
  const totalRevenue = vendors.reduce((sum, v) => sum + v.totalRevenue, 0);
  const totalPendingPayout = vendors.reduce((sum, v) => sum + v.pendingPayout, 0);
  const totalIncidents = vendors.reduce((sum, v) => sum + v.totalIncidents, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Vendors" value={totalVendors} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Active" value={activeVendors} icon={<Shield className="h-5 w-5" />} color="green" />
        <StatCard title="Total Revenue" value={formatPrice(totalRevenue)} icon={<DollarSignIcon className="h-5 w-5" />} color="blue" />
        <StatCard title="Pending Payout" value={formatPrice(totalPendingPayout)} icon={<DollarSignIcon className="h-5 w-5" />} color="amber" />
        <StatCard title="Incidents" value={totalIncidents} icon={<AlertTriangleIcon className="h-5 w-5" />} color={totalIncidents > 0 ? 'red' : 'green'} />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Vendor / Partner Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage activity providers. Vendor info is hidden from customers and only shown on e-vouchers.
          </p>
        </div>
        <button
          onClick={() => { setEditingVendor(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-ink text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 px-1" aria-label="Vendor tabs">
          {([
            { id: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
            { id: 'contracts', label: 'Contracts', icon: <FileText className="h-4 w-4" /> },
            { id: 'performance', label: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
            { id: 'payouts', label: 'Payouts', icon: <DollarSignIcon className="h-4 w-4" /> },
            { id: 'incidents', label: 'Incidents', icon: <AlertTriangleIcon className="h-4 w-4" /> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                activeTab === id
                  ? 'bg-brand-ink text-white border-b-2 border-brand-ink -mb-px'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <span className="flex items-center gap-2">{icon} {label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab vendors={vendors} onEdit={handleEdit} onDelete={handleDelete} onSelect={handleSelectVendor} />}
        {activeTab === 'contracts' && <ContractsTab vendors={vendors} />}
        {activeTab === 'performance' && <PerformanceTab vendors={vendors} />}
        {activeTab === 'payouts' && <PayoutsTab vendors={vendors} />}
        {activeTab === 'incidents' && <IncidentsTab vendors={vendors} />}
      </div>

      {/* Vendor Form Modal */}
      {(showForm || editingVendor) && (
        <VendorFormModal
          show={showForm || !!editingVendor}
          onClose={() => { setShowForm(false); setEditingVendor(null); }}
          onSubmit={editingVendor ? handleUpdate : handleCreate}
          editingVendor={editingVendor}
          form={form}
          setForm={setForm}
          saving={saving}
        />
      )}
    </div>
  );
}