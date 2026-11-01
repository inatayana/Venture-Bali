'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, MapPin, Search, Users, X } from 'lucide-react';
import { BottomSheet, Calendar as CalendarComponent } from '@/components/ui';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';
import { toDateKey } from '@/lib/dateKey';

export interface HeroSuggestion {
  title: string;
  href: string;
}

interface HeroSearchProps {
  hubs: readonly string[];
  suggestions: readonly HeroSuggestion[];
}

function formatDateLabel(value: string): string {
  if (!value) return 'Any date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Unified hero search: destination, date and guests in one control.
 *
 * Desktop renders a glass card with three segments; mobile collapses to a pill
 * that opens a bottom sheet, so everything stays reachable with one thumb.
 */
export function HeroSearch({ hubs, suggestions }: HeroSearchProps) {
  const { query, date, pax, setQuery, setDate, setPax, submit } = useSearch();
  const [openField, setOpenField] = useState<'where' | 'date' | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openField) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenField(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenField(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openField]);

  const filteredHubs = hubs.filter((hub) =>
    hub.toLowerCase().includes(query.trim().toLowerCase())
  );

  const runSearch = () => {
    setOpenField(null);
    setIsSheetOpen(false);
    submit();
  };

  return (
    <>
      {/* Desktop: vertical glass card */}
      <div
        ref={containerRef}
        className="relative hidden lg:block"
        aria-label="Search adventures"
      >
        <div className="rounded-2xl border border-white/10 bg-[#111111]/65 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-[16px] transition-all duration-300 hover:border-brand/50 hover:shadow-[0_0_0_1px_rgba(255,238,0,0.3),0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          {/* Destination */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenField(openField === 'where' ? null : 'where')}
              aria-expanded={openField === 'where'}
              className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Where
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-white">
                <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {query.trim() || 'Anywhere in Bali'}
              </span>
            </button>

            {openField === 'where' && (
              <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                <div className="border-b border-neutral-100 p-2">
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search destinations or adventures…"
                    className="min-h-[40px] w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 outline-none focus:border-brand-ink"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Nearby & popular
                  </p>
                  {filteredHubs.map((hub) => (
                    <button
                      key={hub}
                      type="button"
                      onClick={() => {
                        setQuery(hub);
                        setOpenField(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                      {hub}
                    </button>
                  ))}
                  {filteredHubs.length === 0 && (
                    <p className="px-3 py-2 text-xs text-neutral-500">
                      No destination matches — try “Ubud” or “Bali”.
                    </p>
                  )}

                  {suggestions.length > 0 && (
                    <>
                      <p className="mt-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Suggested adventures
                      </p>
                      {suggestions.slice(0, 4).map((suggestion) => (
                        <Link
                          key={suggestion.href}
                          href={suggestion.href}
                          className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          {suggestion.title}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="my-1.5 h-px bg-white/10" aria-hidden="true" />

          {/* Date */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenField(openField === 'date' ? null : 'date')}
              aria-expanded={openField === 'date'}
              className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                When
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-white">
                <CalendarIcon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {formatDateLabel(date)}
              </span>
            </button>

            {openField === 'date' && (
              <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
                <CalendarComponent
                  selectedDate={date ? new Date(`${date}T00:00:00`) : null}
                  onDateSelect={(value) => {
                    setDate(toDateKey(value));
                    setOpenField(null);
                  }}
                  minDate={new Date()}
                />
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDate('')}
                    className="text-xs font-semibold text-neutral-600 underline"
                  >
                    Flexible dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenField(null)}
                    className="text-xs font-semibold text-neutral-900"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="my-1.5 h-px bg-white/10" aria-hidden="true" />

          {/* Guests */}
          <div className="flex items-center justify-between rounded-xl px-3 py-3">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Guests
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-white">
                <Users className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {pax} {pax === 1 ? 'guest' : 'guests'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPax(pax - 1)}
                disabled={pax <= 1}
                aria-label="Fewer guests"
                className="h-8 w-8 rounded-full border border-white/20 text-sm leading-none text-white transition-colors hover:border-brand/60 disabled:text-white/30"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setPax(pax + 1)}
                disabled={pax >= 20}
                aria-label="More guests"
                className="h-8 w-8 rounded-full border border-white/20 text-sm leading-none text-white transition-colors hover:border-brand/60 disabled:text-white/30"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={runSearch}
            className="mt-2 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-brand-ink transition-colors hover:bg-brand/90"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </div>
      </div>

      {/* Mobile: compact pill + bottom sheet */}
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-white/15 bg-white/95 px-4 py-3 text-left shadow-xl backdrop-blur lg:hidden"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-ink text-brand">
          <Search className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-900">
            {query.trim() || 'Where to in Bali?'}
          </span>
          <span className="block truncate text-xs text-neutral-500">
            {formatDateLabel(date)} · {pax} {pax === 1 ? 'guest' : 'guests'}
          </span>
        </span>
      </button>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Find your adventure"
        className="sm:max-w-md"
        footer={
          <button
            type="button"
            onClick={runSearch}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-ink text-sm font-semibold text-brand"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search adventures
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="mobile-destination"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500"
            >
              Where
            </label>
            <input
              id="mobile-destination"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ubud, Seminyak, Nusa Dua…"
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-brand-ink"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hubs.slice(0, 6).map((hub) => (
                <button
                  key={hub}
                  type="button"
                  onClick={() => setQuery(hub)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    query === hub
                      ? 'border-brand-ink bg-brand-ink text-brand'
                      : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  )}
                >
                  {hub}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              When
            </span>
            <CalendarComponent
              selectedDate={date ? new Date(`${date}T00:00:00`) : null}
              onDateSelect={(value) => setDate(toDateKey(value))}
              minDate={new Date()}
            />
            {date && (
              <button
                type="button"
                onClick={() => setDate('')}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 underline"
              >
                <X className="h-3 w-3" aria-hidden="true" /> Clear date
              </button>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Guests
            </span>
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
              <span className="text-sm font-medium text-neutral-900">
                {pax} {pax === 1 ? 'guest' : 'guests'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPax(pax - 1)}
                  disabled={pax <= 1}
                  aria-label="Fewer guests"
                  className="h-10 w-10 rounded-full border border-neutral-200 text-lg leading-none text-neutral-700 disabled:text-neutral-300"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setPax(pax + 1)}
                  disabled={pax >= 20}
                  aria-label="More guests"
                  className="h-10 w-10 rounded-full border border-neutral-200 text-lg leading-none text-neutral-700 disabled:text-neutral-300"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
