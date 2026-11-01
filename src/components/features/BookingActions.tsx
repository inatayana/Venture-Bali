'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarDays, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';
import { cn } from '@/utils/cn';

interface BookingActionsProps {
  bookingId: string;
  token: string;
  canCancel: boolean;
  canReschedule: boolean;
  refundAmount: number;
  feeAmount: number;
}

interface SlotOption {
  id: string;
  time: string;
  spotsLeft: number;
  enabled: boolean;
}

type Modal = 'cancel' | 'reschedule' | null;

export function BookingActions({
  bookingId,
  token,
  canCancel,
  canReschedule,
  refundAmount,
  feeAmount,
}: BookingActionsProps) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotId, setSlotId] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (modal !== 'reschedule' || !date) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setSlotId('');
    fetch(
      `/api/bookings/${bookingId}/reschedule?token=${encodeURIComponent(token)}&date=${date}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? 'Could not load departures');
        }
        setSlots(payload.data.slots as SlotOption[]);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not load departures');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });
    return () => controller.abort();
  }, [bookingId, date, modal, token]);

  const close = () => {
    if (pending) return;
    setModal(null);
    setError(null);
    setReason('');
    setDate('');
    setSlots([]);
    setSlotId('');
  };

  const cancelBooking = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? 'Could not cancel this booking');
      }
      setSuccess(payload.data.message ?? 'Cancellation confirmed.');
      setModal(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel this booking');
    } finally {
      setPending(false);
    }
  };

  const rescheduleBooking = async () => {
    if (!slotId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, date, slotTimeId: slotId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? 'Could not reschedule this booking');
      }
      setSuccess(`Trip moved to ${payload.data.date} at ${payload.data.slotTime}.`);
      setModal(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reschedule this booking');
    } finally {
      setPending(false);
    }
  };

  if (!canCancel && !canReschedule) {
    return (
      <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500">
        Changes and cancellation close 24 hours before the activity.
      </p>
    );
  }

  return (
    <>
      {success && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
          {success}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
        {canReschedule && (
          <button
            type="button"
            onClick={() => {
              setModal('reschedule');
              setError(null);
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-900 transition-colors hover:border-brand"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Change date
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => {
              setModal('cancel');
              setError(null);
            }}
            className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-xs font-semibold text-neutral-500 transition-colors hover:text-red-600"
          >
            Cancel booking
          </button>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-action-title"
            className="relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>

            {modal === 'cancel' ? (
              <>
                <h2 id="booking-action-title" className="font-heading text-lg font-bold text-neutral-900">
                  Cancel this booking?
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  You are eligible for an {refundAmount > 0 ? '80% refund' : 'no refund'}. The
                  remaining {formatPrice(feeAmount)} is the cancellation fee.
                </p>
                <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Refund</span>
                    <strong className="text-green-700">{formatPrice(refundAmount)}</strong>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Processed within 3 business days to the original payment method.
                  </p>
                </div>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Reason (optional)
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-brand-ink"
                    placeholder="Tell us why you need to cancel"
                  />
                </label>
              </>
            ) : (
              <>
                <h2 id="booking-action-title" className="font-heading text-lg font-bold text-neutral-900">
                  Change your trip date
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Free reschedule, subject to availability. The price stays the same.
                </p>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  New date
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-neutral-300 px-3 text-sm font-normal outline-none focus:border-brand-ink"
                  />
                </label>

                {loadingSlots && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking departures…
                  </p>
                )}
                {!loadingSlots && date && slots.length === 0 && (
                  <p className="mt-3 text-xs text-neutral-500">
                    No departures on this date. Try another day.
                  </p>
                )}
                {slots.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.enabled}
                        onClick={() => setSlotId(slot.id)}
                        className={cn(
                          'min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold',
                          slotId === slot.id
                            ? 'border-brand-ink bg-brand-ink text-brand'
                            : 'border-neutral-200 text-neutral-900',
                          !slot.enabled && 'cursor-not-allowed border-neutral-100 text-neutral-300 line-through'
                        )}
                      >
                        {slot.time}
                        <span className="ml-1 text-[10px] font-normal">{slot.spotsLeft} left</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="min-h-[44px] flex-1 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700"
              >
                Keep booking
              </button>
              <button
                type="button"
                onClick={modal === 'cancel' ? cancelBooking : rescheduleBooking}
                disabled={pending || (modal === 'reschedule' && !slotId)}
                className={cn(
                  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-50',
                  modal === 'cancel'
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-ink text-brand'
                )}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal === 'cancel' ? 'Confirm cancellation' : 'Confirm change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
