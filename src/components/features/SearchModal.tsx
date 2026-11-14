'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  MapPin,
  Calendar,
  Users,
  Clock,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Check,
  MapPin as MapPinIcon,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { useSearch } from '@/components/search/SearchProvider';
// import { formatDateLabel } from '@/components/search/HeroSearch'; // Not exported

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Initial search query */
  initialQuery?: string;
  /** Callback when search is submitted */
  onSearch?: (params: SearchParams) => void;
  /** Popular hubs for nearby suggestions */
  hubs?: readonly string[];
  /** Suggested experiences */
  suggestions?: readonly { title: string; href: string }[];
}

interface SearchParams {
  query: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  categories: string[];
}

interface RecentSearch {
  id: string;
  query: string;
  location: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'baliwild_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(search: Omit<RecentSearch, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches();
    const newSearch: RecentSearch = {
      ...search,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const filtered = recent.filter(
      (s) => s.query !== search.query || s.location !== search.location
    );
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateLabel(value: string, anyDate = 'Any date'): string {
  if (!value) return anyDate;
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function SearchModal({
  isOpen,
  onClose,
  initialQuery = '',
  onSearch,
  hubs = [],
  // suggestions is reserved for future use
}: SearchModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'filters'>('search');

  const searchContext = useSearch();
  const useLocalState = !searchContext;

  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState('');
  const [checkIn] = useState(() => formatDate(addDays(new Date(), 1)));
  const [checkOut] = useState(() => formatDate(addDays(new Date(), 2)));
  const [guests, setGuests] = useState(2);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [, setShowDatePicker] = useState<'checkin' | 'checkout' | null>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    previousFocus.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    function trapTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', trapTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', trapTab);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const queryValue = useLocalState ? query : searchContext.query;
  const checkInValue = useLocalState ? checkIn : searchContext.date;
  const checkOutValue = useLocalState ? checkOut : searchContext.date;
  const guestsValue = useLocalState ? guests : searchContext.pax;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!useLocalState) {
      searchContext.submit();
    } else {
      const params: SearchParams = {
        query: queryValue,
        location,
        checkIn: checkInValue,
        checkOut: checkOutValue,
        guests: guestsValue,
        categories: selectedCategories,
      };

      if (queryValue || location) {
        const newSearch = { query: queryValue, location };
        saveRecentSearch(newSearch);
        setRecentSearches(getRecentSearches());
      }

      onSearch?.(params);
      onClose();
    }
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    if (useLocalState) {
      setQuery(search.query);
      setLocation(search.location);
    } else {
      searchContext.setQuery(search.query);
    }
    setTimeout(() => {
      const form = document.querySelector('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 100);
  };

  const clearRecentSearches = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
    setRecentSearches([]);
  };

  const guestOptions = Array.from({ length: 16 }, (_, i) => i + 1);

  const selectedCategoryLabels = CATEGORY_REGISTRY.filter((c) =>
    selectedCategories.includes(c.slug)
  ).map((c) => c.short);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-lg max-h-[95vh] overflow-hidden bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <h2 id="search-modal-title" className="text-lg font-bold text-neutral-900">
            Search adventures
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="flex border-b border-neutral-100 px-4 sticky top-[56px] bg-white z-10" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'search'}
            aria-controls="search-panel"
            id="search-tab"
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              activeTab === 'search'
                ? 'text-brand-ink border-brand-ink'
                : 'text-neutral-500 hover:text-neutral-700 border-transparent'
            )}
          >
            <Search className="w-5 h-5 mr-2 inline-block" aria-hidden="true" />
            Search
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'filters'}
            aria-controls="filters-panel"
            id="filters-tab"
            onClick={() => setActiveTab('filters')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              activeTab === 'filters'
                ? 'text-brand-ink border-brand-ink'
                : 'text-neutral-500 hover:text-neutral-700 border-transparent'
            )}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2 inline-block" aria-hidden="true" />
            Filters
            {selectedCategories.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-brand text-brand-ink rounded-full">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4">
          {activeTab === 'search' ? (
            <div id="search-panel" role="tabpanel" aria-labelledby="search-tab">
              <div className="mb-6">
                <label htmlFor="search-query" className="sr-only">
                  What are you looking for?
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" aria-hidden="true" />
                  <input
                    id="search-query"
                    type="search"
                    name="query"
                    value={queryValue}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Start your search…"
                    className="w-full px-4 py-4 pl-12 text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none bg-white"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="search-location" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Where
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" aria-hidden="true" />
                  <input
                    id="search-location"
                    type="text"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bali, Indonesia"
                    className="w-full px-4 py-3 pl-12 text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                    Where
                  </h3>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Nearby
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hubs.slice(0, 6).map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setQuery(hub)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          queryValue === hub
                            ? 'border-brand-ink bg-brand-ink text-brand'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-white/10 dark:text-neutral-300 dark:hover:border-neutral-400'
                        )}
                      >
                        {hub}
                      </button>
                    ))}
                    {hubs.length === 0 && (
                      <p className="text-xs text-neutral-500">No nearby destinations</p>
                    )}
                  </div>
                </div>

                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Recent searches
                      </h3>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-xs text-brand-ink hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recentSearches.map((search) => (
                        <button
                          key={search.id}
                          type="button"
                          onClick={() => handleRecentSearchClick(search)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors text-left"
                        >
                          <Search className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {search.query || 'All adventures'}
                            </p>
                            {search.location && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                {search.location}
                              </p>
                            )}
                          </div>
                          <Clock className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="check-in" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
                    Check-in
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker('checkin')}
                    className="w-full px-4 py-3 text-left text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none hover:border-brand-ink/50 transition-colors"
                  >
                    {formatDateLabel(checkInValue, 'Any date')}
                  </button>
                </div>

                <div>
                  <label htmlFor="check-out" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" aria-hidden="true" />
                    Check-out
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker('checkout')}
                    className="w-full px-4 py-3 text-left text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none hover:border-brand-ink/50 transition-colors"
                  >
                    {formatDateLabel(checkOutValue, 'Any date')}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="guests" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <Users className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Guests
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={guestsValue}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-4 py-3 text-base border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none appearance-none bg-white cursor-pointer"
                >
                  {guestOptions.map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'guest' : 'guests'}
                    </option>
                  ))}
                </select>
              </div>

              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                      Recent searches
                    </h3>
                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-brand-ink hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        type="button"
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors text-left"
                      >
                        <Search className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {search.query || 'All adventures'}
                          </p>
                          {search.location && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {search.location}
                            </p>
                          )}
                        </div>
                        <Clock className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[52px] bg-brand-ink text-white font-semibold text-base rounded-xl hover:bg-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <Search className="w-5 h-5 mr-2 inline-block" aria-hidden="true" />
                Search
              </button>
            </div>
          ) : (
            <div id="filters-panel" role="tabpanel" aria-labelledby="filters-tab">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                      Activity types
                    </h3>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-xs text-brand-ink hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {CATEGORY_REGISTRY.map((category) => {
                      const isSelected = selectedCategories.includes(category.slug);
                      return (
                        <label
                          key={category.slug}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-brand/10 border-brand-ink'
                              : 'border-neutral-200 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const newSelection = selectedCategories.includes(category.slug)
                                ? selectedCategories.filter((c) => c !== category.slug)
                                : [...selectedCategories, category.slug];
                              setSelectedCategories(newSelection);
                            }}
                            className="w-5 h-5 text-brand-ink border-brand-ink rounded focus:ring-2 focus:ring-brand/20"
                          />
                          <span className="text-lg leading-none" aria-hidden="true">
                            {category.emoji}
                          </span>
                          <span className="flex-1 font-medium text-neutral-900 dark:text-white">
                            {category.short}
                          </span>
                          {isSelected && (
                            <Check className="w-5 h-5 text-brand-ink shrink-0" aria-hidden="true" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedCategories.length > 0 && (
                  <div className="p-4 bg-brand/5 rounded-xl border border-brand/20">
                    <p className="text-sm font-medium text-brand-ink mb-2">
                      {selectedCategories.length} activit{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategoryLabels.map((label) => (
                        <span
                          key={label}
                          className="px-2.5 py-1 text-xs font-medium bg-brand text-brand-ink rounded-full"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('search');
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { bubbles: true }));
                  }}
                  className="w-full min-h-[52px] bg-brand-ink text-white font-semibold text-base rounded-xl hover:bg-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Filter className="w-5 h-5 mr-2 inline-block" aria-hidden="true" />
                  Apply filters & search
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  , document.body);
}

export function DatePickerModal({
  selectedDate,
  minDate,
  maxDate,
  onSelect,
  onClose,
  title,
}: {
  selectedDate: string;
  minDate: string;
  maxDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  title: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(selectedDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = currentMonth.getDay();

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(firstDayOfWeek).fill(null);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    week.push(date);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  }

  const isDateDisabled = (date: Date) => {
    const dateStr = formatDate(date);
    return dateStr < minDate || dateStr > maxDate;
  };

  const isDateSelected = (date: Date) => formatDate(date) === selectedDate;

  const formatMonthYear = (date: Date) => 
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 rounded-full hover:bg-neutral-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-neutral-900">{formatMonthYear(currentMonth)}</span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 rounded-full hover:bg-neutral-100"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-xs font-medium text-neutral-500 py-2">{day}</div>
            ))}
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="grid grid-cols-7 gap-1">
                {week.map((date, dIndex) => (
                  <button
                    key={`${wIndex}-${dIndex}`}
                    type="button"
                    onClick={() => date && onSelect(formatDate(date))}
                    disabled={!date || isDateDisabled(date)}
                    className={cn(
                      'w-full aspect-square rounded-lg text-sm font-medium transition-colors',
                      !date
                        ? 'invisible'
                        : isDateDisabled(date)
                        ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                        : isDateSelected(date)
                        ? 'bg-brand-ink text-white'
                        : 'text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10'
                    )}
                  >
                    {date?.getDate()}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  , document.body);
}