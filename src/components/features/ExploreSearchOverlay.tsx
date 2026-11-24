'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Search,
  Calendar,
  Users,
  Minus,
  Plus,
  ChevronDown,
  Navigation,
  Leaf,
  Landmark,
  Building2,
  Map,
} from 'lucide-react';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';

export interface ExploreSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type AccordionCard = 'where' | 'when' | 'who';

const DESTINATIONS = [
  { name: 'Nearby', query: '', sub: 'Based on your location', icon: Navigation },
  { name: 'Ubud', query: 'Ubud', sub: 'Culture & rice terraces', icon: Leaf },
  { name: 'Tampaksiring', query: 'Tampaksiring', sub: 'Water palace & holy spring', icon: Landmark },
  { name: 'Denpasar', query: 'Denpasar', sub: 'The capital city', icon: Building2 },
  { name: 'All Bali', query: '', sub: 'Everywhere on the island', icon: Map },
] as const;

function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDaysKey(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function formatShortDate(value: string, fallback: string): string {
  if (!value) return fallback;
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * State 2 — full-screen search overlay (Airbnb-style accordion).
 * Where? (default open) / When / Who, one card open at a time.
 * Guardrail: BaliWild does not list homes/hotels — adventures only.
 */
export function ExploreSearchOverlay({ open, onClose }: ExploreSearchOverlayProps) {
  const { query, date, pax, setQuery, setDate, setPax } = useSearch();
  const [openCard, setOpenCard] = useState<AccordionCard>('where');
  const [adults, setAdults] = useState(() => Math.max(pax, 1));
  const [children, setChildren] = useState(0);

  // Lock body scroll and wire Escape while the overlay is mounted.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Exactly one card stays open at a time — tapping another card switches to it.
  const toggleCard = (card: AccordionCard) => setOpenCard(card);

  const handleClearAll = () => {
    setQuery('');
    setDate('');
    setPax(1);
    setAdults(1);
    setChildren(0);
    setOpenCard('where');
  };

  const handleSearch = () => {
    setPax(Math.max(1, adults + children));
    onClose();
  };

  const whoLabel = pax > 1 ? `${pax} guests` : 'Add guests';
  const whenLabel = date ? formatShortDate(date, 'Add dates') : 'Add dates';
  const whereLabel = query.trim() ? `“${query.trim()}”` : 'Search destinations';

  const counterRow = (
    label: string,
    sub: string,
    count: number,
    min: number,
    onChange: (next: number) => void
  ) => (
    <div className="flex items-center justify-between gap-4 border-t border-neutral-100 py-3 first:border-t-0 dark:border-white/10">
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
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors enabled:hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:text-neutral-200"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span aria-live="polite" className="w-6 text-center text-base font-semibold tabular-nums">
          {count}
        </span>
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          aria-label={`Increase ${label}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 dark:border-white/20 dark:text-neutral-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const collapsedHeader = (
    card: AccordionCard,
    title: string,
    summary: string,
    icon: typeof Search
  ) => {
    const Icon = icon;
    const expanded = openCard === card;
    return (
      <button
        type="button"
        onClick={() => toggleCard(card)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <span className="text-lg font-bold text-neutral-900 dark:text-white">{title}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          <span className="max-w-[45vw] truncate">{summary}</span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
            aria-hidden="true"
          />
        </span>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search adventures"
      className="fixed inset-0 z-50 flex flex-col bg-neutral-50/95 p-4 backdrop-blur-md md:items-center md:justify-center md:bg-black/40 md:p-6 dark:bg-neutral-950/95"
    >
      <div className="flex w-full max-w-2xl flex-1 flex-col md:flex-none">
        {/* Close */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Accordion cards */}
        <div className="mt-2 flex-1 space-y-3 overflow-y-auto md:max-h-[70vh]">
          {/* Card 1 — Where? */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            {collapsedHeader('where', 'Where?', whereLabel, Search)}
            {openCard === 'where' && (
              <div className="mt-3">
                <label htmlFor="explore-where" className="sr-only">
                  Search destinations or adventures
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <input
                    id="explore-where"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search destinations or adventures…"
                    autoComplete="off"
                    autoFocus
                    className="w-full rounded-2xl border border-neutral-200 py-3 pl-12 pr-4 text-base text-neutral-900 placeholder-neutral-400 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <ul className="mt-3 divide-y divide-neutral-100 dark:divide-white/10">
                  {DESTINATIONS.map((destination) => {
                    const Icon = destination.icon;
                    const active = query === destination.query;
                    return (
                      <li key={destination.name}>
                        <button
                          type="button"
                          onClick={() => setQuery(destination.query)}
                          aria-pressed={active}
                          className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none dark:hover:bg-white/5"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                              {destination.name}
                            </span>
                            <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                              {destination.sub}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Card 2 — When */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            {collapsedHeader('when', 'When', whenLabel, Calendar)}
            {openCard === 'when' && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Today', value: addDaysKey(0) },
                    { label: 'Tomorrow', value: addDaysKey(1) },
                    { label: 'Next week', value: addDaysKey(7) },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setDate(chip.value)}
                      aria-pressed={date === chip.value}
                      className={cn(
                        'min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors',
                        date === chip.value
                          ? 'border-brand-ink bg-brand-ink text-brand'
                          : 'border-neutral-200 text-neutral-700 hover:border-brand-ink dark:border-white/10 dark:text-neutral-200'
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <label
                  htmlFor="explore-when"
                  className="mt-3 block text-xs font-bold uppercase tracking-wider text-neutral-500"
                >
                  Or pick a date
                </label>
                <input
                  id="explore-when"
                  type="date"
                  value={date}
                  min={addDaysKey(0)}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-neutral-900 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Card 3 — Who */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            {collapsedHeader('who', 'Who', whoLabel, Users)}
            {openCard === 'who' && (
              <div className="mt-3">
                {counterRow('Adults', 'Ages 13+', adults, 1, setAdults)}
                {counterRow('Children', 'Ages 2–12', children, 0, setChildren)}
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Infants (0–2) join free — tell us at booking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="border-t border-neutral-200 pt-3 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleClearAll}
            className="min-h-[44px] text-sm font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-600 dark:text-white"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
