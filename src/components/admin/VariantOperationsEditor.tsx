'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, CalendarOff } from 'lucide-react';

interface Slot {
  id: string;
  time: string;
  maxCapacity: number;
  currentBookings: number;
  isAvailable: boolean;
}

interface VariantOperationsEditorProps {
  variant: {
    id: string;
    title: string;
    fulfillmentMode: string;
    pickupZoneName?: string | null;
    blackoutDates: string[];
    slotTimes: Slot[];
    addons: Addon[];
  };
  /** Rendered on the right of the header — used for the package editor. */
  headerAction?: React.ReactNode;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  requiresTransfer: boolean;
  isCombo: boolean;
}

const TIME_OPTIONS = Array.from({ length: 29 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
});

export function VariantOperationsEditor({ variant, headerAction }: VariantOperationsEditorProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newCapacity, setNewCapacity] = useState('10');
  const [blackoutDate, setBlackoutDate] = useState('');
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');
  const [addonRequiresTransfer, setAddonRequiresTransfer] = useState(false);

  const run = async (key: string, url: string, init: RequestInit): Promise<boolean> => {
    setPending(key);
    setError(null);
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Action failed');
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setPending(null);
    }
  };

  const addSlot = async () => {
    const capacity = Number(newCapacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('Capacity must be a whole number of at least 1');
      return;
    }
    const ok = await run('add', `/api/admin/variants/${variant.id}/slots`, {
      method: 'POST',
      body: JSON.stringify({ time: newTime, maxCapacity: capacity }),
    });
    if (ok) setNewCapacity('10');
  };

  const toggleSlot = (slot: Slot) =>
    run(`toggle-${slot.id}`, `/api/admin/slots/${slot.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable: !slot.isAvailable }),
    });

  const saveCapacity = (slot: Slot, value: string) => {
    const capacity = Number(value);
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('Capacity must be a whole number of at least 1');
      return;
    }
    if (capacity === slot.maxCapacity) return;
    run(`capacity-${slot.id}`, `/api/admin/slots/${slot.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ maxCapacity: capacity }),
    });
  };

  const deleteSlot = (slot: Slot) => {
    if (!window.confirm(`Delete the ${slot.time} departure?`)) return;
    run(`delete-${slot.id}`, `/api/admin/slots/${slot.id}`, { method: 'DELETE' });
  };

  const addBlackout = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blackoutDate)) {
      setError('Pick a valid blackout date');
      return;
    }
    const ok = await run('blackout-add', `/api/admin/variants/${variant.id}/blackouts`, {
      method: 'POST',
      body: JSON.stringify({ date: blackoutDate }),
    });
    if (ok) setBlackoutDate('');
  };

  const removeBlackout = (date: string) =>
    run(`blackout-${date}`, `/api/admin/variants/${variant.id}/blackouts?date=${date}`, {
      method: 'DELETE',
    });

  const addAddon = async () => {
    const price = Number(addonPrice);
    if (addonName.trim().length < 3) {
      setError('Add-on name must be at least 3 characters');
      return;
    }
    if (!Number.isInteger(price) || price < 0) {
      setError('Add-on price must be a whole number of at least 0');
      return;
    }
    const ok = await run('addon-add', `/api/admin/variants/${variant.id}/addons`, {
      method: 'POST',
      body: JSON.stringify({
        name: addonName,
        price,
        requiresTransfer: addonRequiresTransfer,
      }),
    });
    if (ok) {
      setAddonName('');
      setAddonPrice('');
      setAddonRequiresTransfer(false);
    }
  };

  const deleteAddon = (addon: Addon) => {
    if (!window.confirm(`Delete the add-on "${addon.name}"?`)) return;
    run(`addon-${addon.id}`, `/api/admin/addons/${addon.id}`, { method: 'DELETE' });
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{variant.title}</h2>
          <p className="text-xs text-foreground-muted">
            {variant.fulfillmentMode.replace('_', ' ').toLowerCase()} · {variant.slotTimes.length} departures
            {variant.pickupZoneName ? ` · pickup: ${variant.pickupZoneName}` : ''}
          </p>
        </div>
        {headerAction}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-foreground-secondary">
              <th className="px-2 py-2 font-medium">Departure</th>
              <th className="px-2 py-2 font-medium">Capacity</th>
              <th className="px-2 py-2 font-medium">Booked</th>
              <th className="px-2 py-2 font-medium">Available</th>
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {variant.slotTimes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-sm text-foreground-muted">
                  No departures yet — add the first one below.
                </td>
              </tr>
            )}
            {variant.slotTimes.map((slot) => (
              <tr key={slot.id} className="border-b border-line last:border-0">
                <td className="px-2 py-2 font-medium text-foreground">{slot.time}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={slot.maxCapacity}
                    onBlur={(event) => saveCapacity(slot, event.target.value)}
                    className="min-h-[44px] w-20 rounded-lg border border-line px-2 text-sm tabular-nums"
                    aria-label={`Capacity for ${slot.time}`}
                  />
                </td>
                <td className="px-2 py-2 tabular-nums text-foreground-secondary">{slot.currentBookings}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    disabled={pending === `toggle-${slot.id}`}
                    className={`min-h-[44px] rounded-full px-3 text-xs font-semibold ${
                      slot.isAvailable
                        ? 'bg-green-100 text-success'
                        : 'bg-inset text-foreground-secondary'
                    }`}
                  >
                    {slot.isAvailable ? 'Bookable' : 'Disabled'}
                  </button>
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => deleteSlot(slot)}
                    disabled={pending === `delete-${slot.id}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground-secondary hover:bg-danger/10 hover:text-danger"
                    aria-label={`Delete ${slot.time}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
        <label className="text-xs font-medium text-foreground-muted">
          New departure
          <select
            value={newTime}
            onChange={(event) => setNewTime(event.target.value)}
            className="mt-1 block min-h-[44px] rounded-lg border border-line px-2 text-sm text-foreground"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-foreground-muted">
          Capacity
          <input
            type="number"
            min={1}
            max={100}
            value={newCapacity}
            onChange={(event) => setNewCapacity(event.target.value)}
            className="mt-1 block min-h-[44px] w-24 rounded-lg border border-line px-2 text-sm tabular-nums text-foreground"
          />
        </label>
        <button
          type="button"
          onClick={addSlot}
          disabled={pending === 'add'}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <CalendarOff className="h-4 w-4 text-foreground-secondary" /> Blackout dates
        </h3>
        <p className="mt-1 text-xs text-foreground-muted">
          Public holidays, seasonal closures or weather blockouts. Guests cannot book these dates.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {variant.blackoutDates.length === 0 && (
            <span className="text-xs text-foreground-secondary">No blackout dates.</span>
          )}
          {variant.blackoutDates.map((date) => (
            <span
              key={date}
              className="inline-flex items-center gap-1 rounded-full bg-inset px-3 py-1 text-xs font-medium text-foreground-secondary"
            >
              {date}
              <button
                type="button"
                onClick={() => removeBlackout(date)}
                disabled={pending === `blackout-${date}`}
                className="text-foreground-secondary hover:text-danger"
                aria-label={`Remove blackout ${date}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-end gap-2">
          <label className="text-xs font-medium text-foreground-muted">
            Add date
            <input
              type="date"
              value={blackoutDate}
              onChange={(event) => setBlackoutDate(event.target.value)}
              className="mt-1 block min-h-[44px] rounded-lg border border-line px-2 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            onClick={addBlackout}
            disabled={pending === 'blackout-add'}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-line-strong px-4 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-foreground">Optional add-ons</h3>
        <p className="mt-1 text-xs text-foreground-muted">
          Photography, drone, gear rental or extra meals. Guests pick these in the booking sheet.
        </p>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {variant.addons.length === 0 && (
                <tr>
                  <td className="py-2 text-xs text-foreground-secondary">No add-ons for this package.</td>
                </tr>
              )}
              {variant.addons.map((addon) => (
                <tr key={addon.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-2 text-foreground">{addon.name}</td>
                  <td className="py-2 pr-2 text-right tabular-nums text-foreground-secondary">
                    Rp {addon.price.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 pr-2 text-xs text-foreground-muted">
                    {addon.requiresTransfer ? 'Transfer only' : 'Any package'}
                    {addon.isCombo ? ' · Combo' : ''}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteAddon(addon)}
                      disabled={pending === `addon-${addon.id}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground-secondary hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete add-on ${addon.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-foreground-muted">
            Name
            <input
              type="text"
              value={addonName}
              onChange={(event) => setAddonName(event.target.value)}
              placeholder="Drone footage"
              className="mt-1 block min-h-[44px] w-44 rounded-lg border border-line px-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-medium text-foreground-muted">
            Price (IDR)
            <input
              type="number"
              min={0}
              value={addonPrice}
              onChange={(event) => setAddonPrice(event.target.value)}
              placeholder="250000"
              className="mt-1 block min-h-[44px] w-32 rounded-lg border border-line px-2 text-sm tabular-nums text-foreground"
            />
          </label>
          <label className="flex min-h-[44px] items-center gap-1.5 text-xs text-foreground-secondary">
            <input
              type="checkbox"
              checked={addonRequiresTransfer}
              onChange={(event) => setAddonRequiresTransfer(event.target.checked)}
              className="h-4 w-4 rounded border-line-strong"
            />
            Transfer only
          </label>
          <button
            type="button"
            onClick={addAddon}
            disabled={pending === 'addon-add'}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
