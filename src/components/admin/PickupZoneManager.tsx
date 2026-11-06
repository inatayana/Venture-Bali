'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';
import { PICKUP_ZONE_TYPES } from '@/lib/adminPickupZoneSchema';

interface PickupZone {
  id: string;
  name: string;
  areaType: (typeof PICKUP_ZONE_TYPES)[number];
  surchargeIdr: number;
  surchargePerPaxIdr: number;
  isCustomQuote: boolean;
  vehicleMaxPax: number;
  isActive: boolean;
}

const inputClass =
  'mt-1 min-h-[40px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white';

/**
 * Manage pickup zone pricing. Two numbers per zone:
 * - `surchargeIdr`       — charter price PER VEHICLE (PRIVATE_TRANSFER cars).
 * - `surchargePerPaxIdr` — seat fee PER PERSON (SHARED_TRANSFER shuttles).
 * Both are real prices: the booking engine adds the mode's own number to the
 * order, never mixing them.
 */
export function PickupZoneManager() {
  const router = useRouter();
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [areaType, setAreaType] = useState<(typeof PICKUP_ZONE_TYPES)[number]>('ZONE_1');
  const [surcharge, setSurcharge] = useState('');
  const [surchargePerPax, setSurchargePerPax] = useState('');
  const [isCustomQuote, setIsCustomQuote] = useState(false);
  const [vehicleMaxPax, setVehicleMaxPax] = useState('4');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSurcharge, setEditSurcharge] = useState('');
  const [editSurchargePerPax, setEditSurchargePerPax] = useState('');
  const [editIsCustomQuote, setEditIsCustomQuote] = useState(false);

  const loadZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/pickup-zones', { cache: 'no-store', credentials: 'include' });
      const json = await res.json();
      if (json.success) setZones(json.data);
      else setError(json.error?.message ?? 'Could not load zones');
    } catch {
      setError('Could not load zones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const create = async () => {
    if (!name.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/pickup-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          areaType,
          surchargeIdr: surcharge === '' ? 0 : Number(surcharge),
          surchargePerPaxIdr: surchargePerPax === '' ? 0 : Number(surchargePerPax),
          isCustomQuote,
          vehicleMaxPax: Number(vehicleMaxPax) || 4,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Could not create the zone');
      setName('');
      setSurcharge('');
      setSurchargePerPax('');
      setIsCustomQuote(false);
      await loadZones();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the zone');
    } finally {
      setPending(false);
    }
  };

  const saveEdit = async (id: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pickup-zones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          surchargeIdr: editSurcharge === '' ? 0 : Number(editSurcharge),
          surchargePerPaxIdr: editSurchargePerPax === '' ? 0 : Number(editSurchargePerPax),
          isCustomQuote: editIsCustomQuote,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Could not update the zone');
      setEditingId(null);
      await loadZones();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the zone');
    } finally {
      setPending(false);
    }
  };

  const toggleActive = async (zone: PickupZone) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pickup-zones/${zone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Could not update the zone');
      await loadZones();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the zone');
    } finally {
      setPending(false);
    }
  };

  const remove = async (zone: PickupZone) => {
    if (!window.confirm(`Delete "${zone.name}"? Only unused zones can be deleted.`)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pickup-zones/${zone.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Could not delete the zone');
      await loadZones();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the zone');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Pickup zones</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Two real prices per zone — both are added to the booking order:
          the <strong>per-vehicle charter</strong> pays the driver for PRIVATE transfer, the{' '}
          <strong>per-guest seat fee</strong> covers shared shuttle seats (0 = included).
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Add a zone
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 lg:col-span-2">
            Zone name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="South 3 — Canggu & Berawa"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Area tier
            <select value={areaType} onChange={(event) => setAreaType(event.target.value as typeof areaType)} className={inputClass}>
              {PICKUP_ZONE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Charter per vehicle (IDR)
            <input
              value={surcharge}
              onChange={(event) => setSurcharge(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="500000"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Fee per guest (IDR)
            <input
              value={surchargePerPax}
              onChange={(event) => setSurchargePerPax(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="224000"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Max pax/vehicle
            <input
              value={vehicleMaxPax}
              onChange={(event) => setVehicleMaxPax(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <div className="flex items-end">
            <label className="flex min-h-[40px] items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={isCustomQuote}
                onChange={(event) => setIsCustomQuote(event.target.checked)}
                className="h-4 w-4"
              />
              Custom quote
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={pending || !name.trim()}
          className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add zone
        </button>
      </section>

      <section className="space-y-2">
        {isLoading ? (
          <p className="flex items-center gap-2 p-4 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading zones…
          </p>
        ) : zones.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No pickup zones yet. Add the first zone above.
          </p>
        ) : (
          zones.map((zone) => (
            <article
              key={zone.id}
              className={`rounded-xl border p-4 ${zone.isActive ? 'border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-800' : 'border-neutral-100 dark:border-gray-800 bg-neutral-50 dark:bg-gray-900/50 opacity-75'}`}
            >
              {editingId === zone.id ? (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Charter per vehicle (IDR)
                    <input
                      value={editSurcharge}
                      onChange={(event) => setEditSurcharge(event.target.value.replace(/[^\d]/g, ''))}
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </label>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Fee per guest (IDR)
                    <input
                      value={editSurchargePerPax}
                      onChange={(event) => setEditSurchargePerPax(event.target.value.replace(/[^\d]/g, ''))}
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </label>
                  <label className="flex min-h-[40px] items-center gap-2 pb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={editIsCustomQuote}
                      onChange={(event) => setEditIsCustomQuote(event.target.checked)}
                      className="h-4 w-4"
                    />
                    Custom quote
                  </label>
                  <button
                    type="button"
                    onClick={() => saveEdit(zone.id)}
                    disabled={pending}
                    className="min-h-[40px] rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="min-h-[40px] px-3 text-sm font-semibold text-gray-600 dark:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {zone.name}{' '}
                      <span className="ml-1 rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {zone.areaType}
                      </span>
                      {!zone.isActive && (
                        <span className="ml-1 rounded bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                          hidden
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {zone.isCustomQuote
                        ? 'Custom quote — confirmed via WhatsApp'
                        : `Charter ${formatPrice(zone.surchargeIdr)}/vehicle · fee ${formatPrice(zone.surchargePerPaxIdr)}/guest`}{' '}
                      · max {zone.vehicleMaxPax} guests/vehicle
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(zone.id);
                        setEditSurcharge(String(zone.surchargeIdr));
                        setEditSurchargePerPax(String(zone.surchargePerPaxIdr ?? 0));
                        setEditIsCustomQuote(zone.isCustomQuote);
                      }}
                      className="min-h-[40px] px-2 text-xs font-semibold text-brand-ink hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(zone)}
                      disabled={pending}
                      className="min-h-[40px] px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:underline disabled:opacity-50"
                    >
                      {zone.isActive ? 'Hide from guests' : 'Show to guests'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(zone)}
                      disabled={pending}
                      aria-label={`Delete ${zone.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
