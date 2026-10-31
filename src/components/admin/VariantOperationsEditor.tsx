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
    blackoutDates: string[];
    slotTimes: Slot[];
  };
}

const TIME_OPTIONS = Array.from({ length: 29 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
});

export function VariantOperationsEditor({ variant }: VariantOperationsEditorProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newCapacity, setNewCapacity] = useState('10');
  const [blackoutDate, setBlackoutDate] = useState('');

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

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-gray-900">{variant.title}</h2>
          <p className="text-xs text-gray-500">
            {variant.fulfillmentMode.replace('_', ' ').toLowerCase()} · {variant.slotTimes.length} departures
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-400">
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
                <td colSpan={5} className="px-2 py-4 text-sm text-gray-500">
                  No departures yet — add the first one below.
                </td>
              </tr>
            )}
            {variant.slotTimes.map((slot) => (
              <tr key={slot.id} className="border-b border-gray-50 last:border-0">
                <td className="px-2 py-2 font-medium text-gray-900">{slot.time}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={slot.maxCapacity}
                    onBlur={(event) => saveCapacity(slot, event.target.value)}
                    className="min-h-[44px] w-20 rounded-lg border border-gray-200 px-2 text-sm tabular-nums"
                    aria-label={`Capacity for ${slot.time}`}
                  />
                </td>
                <td className="px-2 py-2 tabular-nums text-gray-600">{slot.currentBookings}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    disabled={pending === `toggle-${slot.id}`}
                    className={`min-h-[44px] rounded-full px-3 text-xs font-semibold ${
                      slot.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
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
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
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

      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
        <label className="text-xs font-medium text-gray-500">
          New departure
          <select
            value={newTime}
            onChange={(event) => setNewTime(event.target.value)}
            className="mt-1 block min-h-[44px] rounded-lg border border-gray-200 px-2 text-sm text-gray-900"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">
          Capacity
          <input
            type="number"
            min={1}
            max={100}
            value={newCapacity}
            onChange={(event) => setNewCapacity(event.target.value)}
            className="mt-1 block min-h-[44px] w-24 rounded-lg border border-gray-200 px-2 text-sm tabular-nums text-gray-900"
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

      <div className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <CalendarOff className="h-4 w-4 text-gray-400" /> Blackout dates
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Public holidays, seasonal closures or weather blockouts. Guests cannot book these dates.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {variant.blackoutDates.length === 0 && (
            <span className="text-xs text-gray-400">No blackout dates.</span>
          )}
          {variant.blackoutDates.map((date) => (
            <span
              key={date}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {date}
              <button
                type="button"
                onClick={() => removeBlackout(date)}
                disabled={pending === `blackout-${date}`}
                className="text-gray-400 hover:text-red-600"
                aria-label={`Remove blackout ${date}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-end gap-2">
          <label className="text-xs font-medium text-gray-500">
            Add date
            <input
              type="date"
              value={blackoutDate}
              onChange={(event) => setBlackoutDate(event.target.value)}
              className="mt-1 block min-h-[44px] rounded-lg border border-gray-200 px-2 text-sm text-gray-900"
            />
          </label>
          <button
            type="button"
            onClick={addBlackout}
            disabled={pending === 'blackout-add'}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
