'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';

interface AvailabilityDay {
  date: string;
  isFullyBooked: boolean;
  fromPriceIdr?: number | null;
}

interface QuickDateCheckProps {
  variantId: string;
  ventureHref: string;
  label: string;
}

/**
 * Guest-initiated availability preview from a catalogue card. Uses the same
 * availability range endpoint and Calendar as the PDP, so prices and sold-out
 * days cannot disagree. The modal is portalled so the card's overflow/transform
 * never clips it.
 */
export function QuickDateCheck({ variantId, ventureHref, label }: QuickDateCheckProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soldOutDates, setSoldOutDates] = useState<string[]>([]);
  const [dayPrices, setDayPrices] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !variantId) return;
    let cancelled = false;
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(addDays(new Date(), 60), 'yyyy-MM-dd');
    setLoading(true);

    fetch(`/api/availability?variantId=${variantId}&from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.success || !Array.isArray(data.data?.days)) return;
        const days = data.data.days as AvailabilityDay[];
        setSoldOutDates(days.filter((day) => day.isFullyBooked).map((day) => day.date));
        const prices: Record<string, number> = {};
        for (const day of days) {
          if (typeof day.fromPriceIdr === 'number') prices[day.date] = day.fromPriceIdr;
        }
        setDayPrices(prices);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, variantId]);

  const modal =
    open && mounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Check dates for ${label}`}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-neutral-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-neutral-900 dark:text-white">
                    Check dates
                  </h2>
                  <p className="text-xs text-neutral-500">{label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close date check"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {loading ? (
                <p className="py-10 text-center text-sm text-neutral-500">Checking availability…</p>
              ) : (
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  unavailableDates={soldOutDates}
                  dayPrices={dayPrices}
                  minDate={new Date()}
                />
              )}

              <p className="mt-3 text-xs text-neutral-500">
                Prices are the lowest for one guest. Pick a date to see live slots and book.
              </p>
              <Link
                href={ventureHref}
                className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-ink px-4 text-sm font-bold text-white dark:bg-brand dark:text-brand-ink"
              >
                {selectedDate
                  ? `Continue with ${format(selectedDate, 'd MMM yyyy')}`
                  : 'See all dates & book'}
              </Link>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          setOpen(true);
        }}
        className="relative z-20 flex min-h-[44px] w-full items-center justify-center gap-1.5 border-t border-neutral-200 text-xs font-bold text-brand-ink transition-colors hover:bg-brand/30 dark:border-white/10 dark:text-brand dark:hover:bg-white/5"
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        Cek tanggal
      </button>
      {modal}
    </>
  );
}
