'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Minus, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';
import { toDateKey } from '@/lib/dateKey';

type Segment = 'where' | 'when' | 'who';

const DESTINATIONS = [
  { label: 'Ubud, Bali', query: 'Ubud', sub: 'Rice terraces & culture' },
  { label: 'Tampaksiring, Gianyar', query: 'Tampaksiring', sub: 'Water palace & holy spring' },
  { label: 'Kuta & Seminyak', query: 'Kuta', sub: 'Beaches & nightlife' },
  { label: 'Canggu', query: 'Canggu', sub: 'Surf & café scene' },
  { label: 'Nusa Dua', query: 'Nusa Dua', sub: 'Resorts & ocean sports' },
  { label: 'All Bali', query: '', sub: 'Everywhere on the island' },
] as const;

function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function nextSaturdayKey(): string {
  const date = new Date();
  const delta = (6 - date.getDay() + 7) % 7 || 7; // upcoming Saturday (never today if today is Saturday → +7)
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const divider = <span aria-hidden="true" className="h-5 w-px bg-neutral-200 dark:bg-white/15" />;

/**
 * Desktop floating search pill (interactive popover, Airbnb-style).
 * Clicking Where / When / Who opens a lightweight popover directly under the
 * segment — no full-screen modal. The trailing button expands into a labelled
 * "Search" pill while a segment is active and submits to /explore.
 * Rendered only on md+; mobile uses the in-page top bar instead.
 */
export function HeaderSearchPill() {
  const router = useRouter();
  const { query, date, pax, setQuery, setDate, setPax } = useSearch();
  const [openSegment, setOpenSegment] = useState<Segment | null>(null);
  const [adults, setAdults] = useState(() => Math.max(pax, 1));
  const [children, setChildren] = useState(0);

  useEffect(() => {
    if (!openSegment) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenSegment(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openSegment]);

  const commitGuests = (nextAdults: number, nextChildren: number) => {
    setAdults(nextAdults);
    setChildren(nextChildren);
    setPax(Math.max(1, nextAdults + nextChildren));
  };

  const close = () => setOpenSegment(null);
  const toggle = (segment: Segment) =>
    setOpenSegment((current) => (current === segment ? null : segment));

  const executeSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (date) params.set('date', date);
    const total = Math.max(1, adults + children);
    if (total > 1) params.set('pax', String(total));
    setPax(total);
    setOpenSegment(null);
    router.push(`/explore?${params.toString()}`);
  };

  const whoLabel = pax > 1 ? `${pax} guests` : 'Add guests';
  const whenLabel = date ? formatShortDate(date) : 'Add dates';
  const whereLabel = query.trim() ? query.trim() : 'Where are you going?';

  const segmentButton = (segment: Segment, caption: string, value: string) => {
    const active = openSegment === segment;
    return (
      <button
        type="button"
        onClick={() => toggle(segment)}
        aria-expanded={active}
        aria-haspopup="dialog"
        className={cn(
          'flex h-10 max-w-[170px] flex-col items-start justify-center rounded-full px-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          active
            ? 'bg-white shadow-md dark:bg-neutral-900'
            : 'hover:bg-white/70 hover:shadow-md dark:hover:bg-white/10'
        )}
      >
        <span className="text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
          {caption}
        </span>
        <span className="mt-1 max-w-full truncate text-xs font-semibold leading-none text-neutral-900 dark:text-white">
          {value}
        </span>
      </button>
    );
  };

  const stepperRow = (
    label: string,
    sub: string,
    count: number,
    min: number,
    onChange: (next: number) => void
  ) => (
    <div className="flex items-center justify-between gap-6 border-t border-neutral-100 py-3 first:border-t-0 dark:border-white/10">
      <div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, count - 1))}
          disabled={count <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 enabled:hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:text-neutral-200"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span aria-live="polite" className="w-5 text-center text-sm font-semibold tabular-nums">
          {count}
        </span>
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:border-neutral-900 dark:border-white/20 dark:text-neutral-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const popoverCard = 'absolute top-full z-50 mt-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-neutral-900';

  return (
    <div className="relative hidden md:block">
      {/* Backdrop — dims everything below the header while a segment is open */}
      {openSegment && (
        <button
          type="button"
          aria-label="Close search"
          onClick={close}
          className="fixed inset-0 z-[35] cursor-default bg-black/25"
        />
      )}

      <div className="relative z-[41] flex h-12 items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 shadow-sm dark:border-white/10 dark:bg-neutral-800">
        {/* Where */}
        <div className="relative">
          {segmentButton('where', 'Where', whereLabel)}
          {openSegment === 'where' && (
            <div role="dialog" aria-label="Where" className={cn(popoverCard, 'left-0 w-[480px]')}>
              <label htmlFor="pill-where" className="sr-only">
                Search destinations or adventures
              </label>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  id="pill-where"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') executeSearch();
                  }}
                  placeholder="Search destinations or adventures…"
                  className="w-full rounded-2xl border border-neutral-200 py-3 pl-12 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
                />
              </div>
              <ul className="mt-2 max-h-72 overflow-y-auto">
                {DESTINATIONS.map((destination) => (
                  <li key={destination.label}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(destination.query);
                        close();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {destination.label}
                        </span>
                        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {destination.sub}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {divider}

        {/* When */}
        <div className="relative">
          {segmentButton('when', 'When', whenLabel)}
          {openSegment === 'when' && (
            <div role="dialog" aria-label="When" className={cn(popoverCard, 'left-0 w-[340px]')}>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {[
                  { label: 'Today', value: toDateKey(new Date()) },
                  {
                    label: 'Tomorrow',
                    value: (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      return toDateKey(d);
                    })(),
                  },
                  { label: 'This Weekend', value: nextSaturdayKey() },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setDate(chip.value)}
                    aria-pressed={date === chip.value}
                    className={cn(
                      'min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors',
                      date === chip.value
                        ? 'border-brand-ink bg-brand-ink text-brand'
                        : 'border-neutral-200 text-neutral-700 hover:border-brand-ink dark:border-white/10 dark:text-neutral-200'
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <Calendar
                selectedDate={parseDate(date)}
                onDateSelect={(selected) => setDate(toDateKey(selected))}
                minDate={new Date()}
                className="w-full"
              />
            </div>
          )}
        </div>

        {divider}

        {/* Who */}
        <div className="relative">
          {segmentButton('who', 'Who', whoLabel)}
          {openSegment === 'who' && (
            <div role="dialog" aria-label="Who" className={cn(popoverCard, 'right-0 w-80')}>
              {stepperRow('Adults', 'Ages 13+', adults, 1, (next) =>
                commitGuests(next, children)
              )}
              {stepperRow('Children', 'Ages 2–12', children, 0, (next) =>
                commitGuests(adults, next)
              )}
              <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                Infants (0–2) join free — tell us at booking.
              </p>
            </div>
          )}
        </div>

        {/* Search CTA — expands with a label while a segment is open */}
        <button
          type="button"
          onClick={executeSearch}
          aria-label="Search adventures"
          className={cn(
            'ml-1 flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-ink text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            openSegment ? 'px-4' : 'w-10'
          )}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {openSegment && <span>Search</span>}
        </button>
      </div>
    </div>
  );
}
