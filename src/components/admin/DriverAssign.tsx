'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, MessageCircle, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

export interface DriverInfoShape {
  name: string;
  phone: string;
  vehicle_model: string | null;
  plate_number: string | null;
  assigned_at: string | null;
}

/** Defensive parse of the JSON column — the DB can hold anything. */
export function parseDriverInfo(value: unknown): DriverInfoShape | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name : '';
  const phone = typeof record.phone === 'string' ? record.phone : '';
  if (!name || !phone) return null;
  return {
    name,
    phone,
    vehicle_model: typeof record.vehicle_model === 'string' ? record.vehicle_model : null,
    plate_number: typeof record.plate_number === 'string' ? record.plate_number : null,
    assigned_at: typeof record.assigned_at === 'string' ? record.assigned_at : null,
  };
}

interface DriverAssignProps {
  bookingId: string;
  fulfillmentMode: string;
  lifecycleStatus: string;
  driverInfo?: unknown;
}

const CLOSED_STATUSES = new Set(['COMPLETED', 'NO_SHOW', 'CANCELLED']);

function toWaLink(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

/**
 * Inline driver assignment for transfer bookings. Renders either the
 * assignment form (no driver yet) or the assigned driver card with a
 * WhatsApp shortcut, plus an option to reassign.
 */
export function DriverAssign({ bookingId, fulfillmentMode, lifecycleStatus, driverInfo }: DriverAssignProps) {
  const parsedDriver = parseDriverInfo(driverInfo);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(parsedDriver?.name ?? '');
  const [phone, setPhone] = useState(parsedDriver?.phone ?? '');
  const [vehicleModel, setVehicleModel] = useState(parsedDriver?.vehicle_model ?? '');
  const [plateNumber, setPlateNumber] = useState(parsedDriver?.plate_number ?? '');

  const isClosingDone = CLOSED_STATUSES.has(lifecycleStatus);
  if (fulfillmentMode === 'SELF_DRIVE') return null;
  if (isClosingDone) return null;

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          vehicleModel: vehicleModel.trim(),
          plateNumber: plateNumber.trim(),
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Could not assign the driver');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign the driver');
    } finally {
      setPending(false);
    }
  };

  if (parsedDriver && !editing) {
    return (
      <div className="w-full max-w-[220px] rounded-xl border border-blue-100 bg-blue-50 p-3 text-right dark:border-blue-900/40 dark:bg-blue-950/30">
        <p className="flex items-center justify-end gap-1 text-xs font-semibold text-blue-900 dark:text-blue-300">
          <CheckCircle className="h-4 w-4" /> Driver assigned
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{parsedDriver.name}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {parsedDriver.vehicle_model ? `${parsedDriver.vehicle_model} · ` : ''}
          <span className="font-mono">{parsedDriver.plate_number}</span>
        </p>
        <div className="mt-2 flex items-center justify-end gap-2">
          <a
            href={toWaLink(parsedDriver.phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${parsedDriver.name}`}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-blue-200 px-2 text-xs font-semibold text-blue-900 dark:text-blue-300"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WA
          </a>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Reassign
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-neutral-800 dark:text-white';

  return (
    <form
      className="w-full max-w-[220px] rounded-xl border border-gray-200 bg-white p-3 text-left dark:border-white/10 dark:bg-neutral-900"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-300">
        <UserRound className="h-3.5 w-3.5" /> Assign driver
      </p>
      <div className="mt-2 space-y-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} placeholder="Driver name" aria-label="Driver name" className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={8} maxLength={25} placeholder="Phone (62…)" aria-label="Driver phone" inputMode="tel" className={inputClass} />
        <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} required minLength={2} maxLength={60} placeholder="Vehicle model" aria-label="Vehicle model" className={inputClass} />
        <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required minLength={2} maxLength={20} placeholder="Plate number (DK 1234 AB)" aria-label="Plate number" className={inputClass} />
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg bg-brand-ink px-3 text-xs font-bold text-white disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Assign'}
        {!pending && <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </form>
  );
}
