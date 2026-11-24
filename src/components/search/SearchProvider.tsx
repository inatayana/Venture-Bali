'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface SearchState {
  query: string;
  /** YYYY-MM-DD, empty when flexible. */
  date: string;
  pax: number;
}

interface SearchContextValue extends SearchState {
  setQuery: (value: string) => void;
  setDate: (value: string) => void;
  setPax: (value: number) => void;
  /** Persist the filters in the URL and jump to the results grid. */
  submit: () => void;
  isReady: boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

function readInitialState(): SearchState {
  if (typeof window === 'undefined') return { query: '', date: '', pax: 1 };

  const params = new URLSearchParams(window.location.search);
  const date = params.get('date') ?? '';
  const pax = Number(params.get('pax'));

  return {
    query: params.get('q') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    pax: Number.isInteger(pax) && pax > 1 && pax <= 20 ? pax : 1,
  };
}

/**
 * Shared search state for the home page: the hero search writes into it and the
 * catalogue grid reads from it. Filters are mirrored into the URL so a result
 * page can be shared.
 */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SearchState>({ query: '', date: '', pax: 1 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setState(readInitialState());
    setIsReady(true);
  }, []);

  // Back/Forward and a restored tab must not leave the previous query on
  // screen while the URL says something else.
  useEffect(() => {
    const onPopState = () => setState(readInitialState());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // `submit()` writes non-default values. When everything is back to defaults
  // (Reset, the date/guest clear chip, clearing the search box) drop the
  // params so a copied URL always matches the visible results.
  useEffect(() => {
    if (!isReady) return;
    if (state.query.trim() || state.date || state.pax > 1) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has('q') && !params.has('date') && !params.has('pax')) return;

    params.delete('q');
    params.delete('date');
    params.delete('pax');
    const search = params.toString();
    window.history.replaceState(
      null,
      '',
      search ? `${window.location.pathname}?${search}` : window.location.pathname
    );
  }, [isReady, state.query, state.date, state.pax]);

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const setDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, date }));
  }, []);

  const setPax = useCallback((pax: number) => {
    setState((prev) => ({ ...prev, pax: Math.min(20, Math.max(1, pax)) }));
  }, []);

  const submit = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (state.query.trim()) params.set('q', state.query.trim());
    else params.delete('q');
    if (state.date) params.set('date', state.date);
    else params.delete('date');
    if (state.pax > 1) params.set('pax', String(state.pax));
    else params.delete('pax');

    const search = params.toString();
    // Keep the current route: submitting from /explore must not rewrite the URL
    // into the homepage path (that made a reload land somewhere else).
    const { pathname } = window.location;
    window.history.replaceState(null, '', search ? `${pathname}?${search}` : pathname);

    document
      .getElementById('results')
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [state]);

  const value = useMemo<SearchContextValue>(
    () => ({ ...state, setQuery, setDate, setPax, submit, isReady }),
    [state, setQuery, setDate, setPax, submit, isReady]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used inside SearchProvider');
  return context;
}
