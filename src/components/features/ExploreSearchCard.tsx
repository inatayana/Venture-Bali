'use client';

import { useEffect, useState } from 'react';
import { Search, Calendar, Users, ChevronRight, X } from 'lucide-react';
import { useSearch } from '@/components/search/SearchProvider';
import { cn } from '@/utils/cn';

interface ExploreSearchCardProps {
  hubs?: readonly string[];
  onSearch?: (params: { query: string }) => void;
}

const HUBS = ['Ubud', 'Seminyak', 'Canggu', 'Nusa Dua', 'Sanur', 'Denpasar', 'Kuta', 'Uluwatu'];

export function ExploreSearchCard({ hubs = HUBS, onSearch }: ExploreSearchCardProps) {
  const { query, date, pax, setQuery, setDate, setPax, submit } = useSearch();
  const [openField, setOpenField] = useState<'where' | 'date' | 'guests' | null>(null);
  const [checkOut, setCheckOut] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!openField) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const container = document.getElementById('explore-search-card');
      if (container && !container.contains(target)) {
        setOpenField(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenField(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openField]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({ query: query.trim() });
    submit();
    setOpenField(null);
  };

  const formatDateLabel = (value: string, fallback = 'Any date') => {
    if (!value) return fallback;
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <section id="explore-search-card" className="relative z-20 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-white/10">
      <form onSubmit={handleSubmit} className="container mx-auto px-4 py-4">
        {/* Mobile: Stacked layout | Desktop: Horizontal layout */}
        <div className={cn(
          'space-y-4',
          isMobile ? '' : 'md:grid md:grid-cols-[1fr_auto_auto_auto] md:items-end md:gap-4 md:space-y-0'
        )}>
          
          {/* Main search — a real input, so the first click lets you type */}
          <div className={cn('w-full', isMobile ? '' : 'md:col-span-1')}>
            <div
              className={cn(
                'flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-4 transition-colors',
                'border-neutral-200 bg-white hover:border-brand-ink/50 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-brand-ink/50',
                'focus-within:border-brand-ink focus-within:ring-2 focus-within:ring-brand/20',
                openField === 'where' && 'border-brand-ink ring-2 ring-brand/20'
              )}
            >
              <Search className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setOpenField('where')}
                placeholder="Search destinations or adventures…"
                aria-label="Search destinations or adventures"
                autoComplete="off"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-base font-medium text-neutral-900 placeholder:text-neutral-500 focus:outline-none dark:text-white"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <ChevronRight
                  className={cn(
                    'h-5 w-5 shrink-0 text-neutral-400 transition-transform',
                    openField === 'where' && 'rotate-90'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Suggestions — opened by focusing the input, never a second field */}
            {openField === 'where' && (
              <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-white/10 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Popular in Bali</p>
                  <div className="flex flex-wrap gap-2">
                    {hubs.slice(0, 8).map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => {
                          setQuery(hub);
                          setOpenField(null);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          query === hub
                            ? 'border-brand-ink bg-brand-ink text-brand'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-white/10 dark:text-neutral-300 dark:hover:border-neutral-400'
                        )}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className={cn('w-full', isMobile ? '' : 'md:w-auto md:flex-initial')}>
            <button
              type="button"
              onClick={() => setOpenField(openField === 'date' ? null : 'date')}
              className={cn(
                'flex min-h-[48px] items-center gap-2 px-4 py-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand w-full md:w-auto',
                'border-neutral-200 bg-white hover:border-brand-ink/50 hover:bg-brand/5 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5',
                date && 'border-brand-ink bg-brand/10',
                openField === 'date' && 'border-brand-ink ring-2 ring-brand/20'
              )}
              aria-label="Select dates"
              aria-expanded={openField === 'date'}
            >
              <Calendar className={cn('w-5 h-5 shrink-0', date ? 'text-brand-ink' : 'text-neutral-400')} aria-hidden="true" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden sm:inline">
                {date ? formatDateLabel(date) : 'Any date'}
              </span>
              <ChevronRight className={cn('w-5 h-5 text-neutral-400 shrink-0 hidden sm:inline transition-transform', openField === 'date' && 'rotate-90')} aria-hidden="true" />
            </button>

            {/* Expanded Date Picker */}
            {openField === 'date' && (
              <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-white/10 animate-in slide-in-from-top-2 duration-200 md:absolute md:left-0 md:right-0 md:z-50 md:bg-white md:dark:bg-neutral-950 md:shadow-lg md:rounded-b-xl md:p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="check-in" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
                      Check-in
                    </label>
                    <input
                      id="check-in"
                      type="date"
                      value={date || ''}
                      onChange={(e) => setDate(e.target.value)}
                      min={minDate}
                      className="w-full px-4 py-3 text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="check-out" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
                      Check-out
                    </label>
                    <input
                      id="check-out"
                      type="date"
                      value={checkOut || ''}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={date || minDate}
                      className="w-full px-4 py-3 text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guests Filter */}
          <div className={cn('w-full', isMobile ? '' : 'md:w-auto md:flex-initial')}>
            <button
              type="button"
              onClick={() => setOpenField(openField === 'guests' ? null : 'guests')}
              className={cn(
                'flex min-h-[48px] items-center gap-2 px-4 py-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand w-full md:w-auto',
                'border-neutral-200 bg-white hover:border-brand-ink/50 hover:bg-brand/5 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5',
                openField === 'guests' && 'border-brand-ink ring-2 ring-brand/20'
              )}
              aria-label="Select guests"
              aria-expanded={openField === 'guests'}
            >
              <Users className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden sm:inline">
                {pax} {pax === 1 ? 'guest' : 'guests'}
              </span>
              <ChevronRight className={cn('w-5 h-5 text-neutral-400 shrink-0 hidden sm:inline transition-transform', openField === 'guests' && 'rotate-90')} aria-hidden="true" />
            </button>

            {/* Expanded Guests Selector */}
            {openField === 'guests' && (
              <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-white/10 animate-in slide-in-from-top-2 duration-200 md:absolute md:left-0 md:right-0 md:z-50 md:bg-white md:dark:bg-neutral-950 md:shadow-lg md:rounded-b-xl md:p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPax(num);
                        setOpenField(null);
                      }}
                      className={cn(
                        'min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                        pax === num
                          ? 'bg-brand-ink text-brand border-brand-ink'
                          : 'border-neutral-200 text-neutral-700 hover:border-brand-ink/50 hover:bg-brand/5 dark:border-white/10 dark:text-neutral-300 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5'
                      )}
                    >
                      {num} {num === 1 ? 'guest' : 'guests'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Button - Mobile full width, Desktop fixed width */}
          <div className={cn('w-full', isMobile ? 'pt-2' : 'md:w-auto md:flex-initial md:pt-0')}>
            <button
              type="submit"
              className="w-full min-h-[52px] bg-brand-ink text-white font-semibold text-base rounded-xl hover:bg-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Search className="w-5 h-5 mr-2 inline-block" aria-hidden="true" />
              Search
            </button>
          </div>

        </div>
      </form>
    </section>
  );
}