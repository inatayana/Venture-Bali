'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  applyExploreFilters,
  parseExploreFilters,
  type ExploreUrlFilterState,
} from '@/lib/exploreFiltersUrl';

export interface ExploreFiltersValue {
  transferIncluded: boolean;
  setTransferIncluded: (value: boolean) => void;
  selfDriveOnly: boolean;
  setSelfDriveOnly: (value: boolean) => void;
  bestSellerOnly: boolean;
  setBestSellerOnly: (value: boolean) => void;
  freeCancellationOnly: boolean;
  setFreeCancellationOnly: (value: boolean) => void;
  instantConfirmationOnly: boolean;
  setInstantConfirmationOnly: (value: boolean) => void;
  durationBucket: 'any' | 'short' | 'half' | 'full';
  setDurationBucket: (value: 'any' | 'short' | 'half' | 'full') => void;
  maxPriceIdr: number | null;
  setMaxPriceIdr: (value: number | null) => void;
  minRating: number | null;
  setMinRating: (value: number | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (value: string | null) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  /** Live count of filtered results — published by VentureExplorer. */
  resultCount: number;
  setResultCount: (value: number) => void;
}

const noop = () => undefined;
const defaultValue: ExploreFiltersValue = {
  transferIncluded: false,
  setTransferIncluded: noop,
  selfDriveOnly: false,
  setSelfDriveOnly: noop,
  bestSellerOnly: false,
  setBestSellerOnly: noop,
  freeCancellationOnly: false,
  setFreeCancellationOnly: noop,
  instantConfirmationOnly: false,
  setInstantConfirmationOnly: noop,
  durationBucket: 'any',
  setDurationBucket: noop,
  maxPriceIdr: null,
  setMaxPriceIdr: noop,
  minRating: null,
  setMinRating: noop,
  selectedCategory: null,
  setSelectedCategory: noop,
  sortBy: 'recommended',
  setSortBy: noop,
  resultCount: 0,
  setResultCount: noop,
};

const ExploreFiltersContext = createContext<ExploreFiltersValue>(defaultValue);

export interface ExploreFiltersProviderProps {
  children: ReactNode;
  /**
   * Mirror the filters into the URL so /explore links are shareable, survive a
   * refresh and come back with Back/Forward. Off on the homepage, where the
   * hero owns the URL and `?category=` is only an inbound deep link.
   */
  syncUrl?: boolean;
}

/**
 * Shared catalogue filter state for the Explore experience.
 * Wrapping HomeHeader + the catalogue lets the mobile chrome filter the
 * grid live, exactly like /explore — without duplicating state.
 *
 * The URL is read once after hydration (SSR stays deterministic) and, when
 * `syncUrl` is on, written back with `replaceState` so filtering never stacks
 * browser history entries.
 */
export function ExploreFiltersProvider({ children, syncUrl = false }: ExploreFiltersProviderProps) {
  const [transferIncluded, setTransferIncluded] = useState(false);
  const [selfDriveOnly, setSelfDriveOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [instantConfirmationOnly, setInstantConfirmationOnly] = useState(false);
  const [durationBucket, setDurationBucket] = useState<'any' | 'short' | 'half' | 'full'>('any');
  const [maxPriceIdr, setMaxPriceIdr] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('recommended');
  const [resultCount, setResultCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const applyState = (state: ExploreUrlFilterState) => {
    setSelectedCategory(state.selectedCategory);
    setSortBy(state.sortBy);
    setTransferIncluded(state.transferIncluded);
    setSelfDriveOnly(state.selfDriveOnly);
    setBestSellerOnly(state.bestSellerOnly);
    setFreeCancellationOnly(state.freeCancellationOnly);
    setInstantConfirmationOnly(state.instantConfirmationOnly);
    setDurationBucket(state.durationBucket);
    setMaxPriceIdr(state.maxPriceIdr);
    setMinRating(state.minRating);
  };

  // Restore the shared link after hydration: PDP breadcrumbs and the footer
  // already link to /?category=<slug>, and /explore links can carry every
  // filter. Reading in an effect keeps the server HTML filter-free.
  useEffect(() => {
    applyState(parseExploreFilters(window.location.search));
    setHydrated(true);
    // Setters from useState are stable; this must run exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/Forward and a restored tab must not leave stale filters on screen.
  useEffect(() => {
    const onPopState = () => applyState(parseExploreFilters(window.location.search));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror state into the URL. replaceState (not router.replace) keeps the
  // catalogue client-side: no server round-trip, no history entry per toggle.
  useEffect(() => {
    if (!syncUrl || !hydrated) return;

    const params = applyExploreFilters(window.location.search, {
      selectedCategory,
      sortBy,
      transferIncluded,
      selfDriveOnly,
      bestSellerOnly,
      freeCancellationOnly,
      instantConfirmationOnly,
      durationBucket,
      maxPriceIdr,
      minRating,
    });
    const query = params.toString();
    const pathname = window.location.pathname;
    const nextUrl = `${pathname}${query ? `?${query}` : ''}`;
    const currentUrl = `${pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [
    syncUrl,
    hydrated,
    transferIncluded,
    selfDriveOnly,
    bestSellerOnly,
    freeCancellationOnly,
    instantConfirmationOnly,
    durationBucket,
    maxPriceIdr,
    minRating,
    selectedCategory,
    sortBy,
  ]);

  const value = useMemo<ExploreFiltersValue>(
    () => ({
      transferIncluded,
      setTransferIncluded,
      selfDriveOnly,
      setSelfDriveOnly,
      bestSellerOnly,
      setBestSellerOnly,
      freeCancellationOnly,
      setFreeCancellationOnly,
      instantConfirmationOnly,
      setInstantConfirmationOnly,
      durationBucket,
      setDurationBucket,
      maxPriceIdr,
      setMaxPriceIdr,
      minRating,
      setMinRating,
      selectedCategory,
      setSelectedCategory,
      sortBy,
      setSortBy,
      resultCount,
      setResultCount,
    }),
    [
      transferIncluded,
      selfDriveOnly,
      bestSellerOnly,
      freeCancellationOnly,
      instantConfirmationOnly,
      durationBucket,
      maxPriceIdr,
      minRating,
      selectedCategory,
      sortBy,
      resultCount,
    ]
  );

  return (
    <ExploreFiltersContext.Provider value={value}>
      {children}
    </ExploreFiltersContext.Provider>
  );
}

export function useExploreFilters(): ExploreFiltersValue {
  return useContext(ExploreFiltersContext);
}
