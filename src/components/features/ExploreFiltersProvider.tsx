'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface ExploreFiltersValue {
  transferIncluded: boolean;
  setTransferIncluded: (value: boolean) => void;
  selfDriveOnly: boolean;
  setSelfDriveOnly: (value: boolean) => void;
  bestSellerOnly: boolean;
  setBestSellerOnly: (value: boolean) => void;
  selectedCategory: string | null;
  setSelectedCategory: (value: string | null) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  location: string | null;
  setLocation: (value: string | null) => void;
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
  selectedCategory: null,
  setSelectedCategory: noop,
  sortBy: 'recommended',
  setSortBy: noop,
  location: null,
  setLocation: noop,
  resultCount: 0,
  setResultCount: noop,
};

const ExploreFiltersContext = createContext<ExploreFiltersValue>(defaultValue);

/**
 * Shared catalogue filter state for the Explore experience.
 * Wrapping HomeHeader + the catalogue lets the mobile chrome filter the
 * grid live, exactly like /explore — without duplicating state.
 */
export function ExploreFiltersProvider({ children }: { children: ReactNode }) {
  const [transferIncluded, setTransferIncluded] = useState(false);
  const [selfDriveOnly, setSelfDriveOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('recommended');
  const [location, setLocation] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);

  const value = useMemo<ExploreFiltersValue>(
    () => ({
      transferIncluded,
      setTransferIncluded,
      selfDriveOnly,
      setSelfDriveOnly,
      bestSellerOnly,
      setBestSellerOnly,
      selectedCategory,
      setSelectedCategory,
      sortBy,
      setSortBy,
      location,
      setLocation,
      resultCount,
      setResultCount,
    }),
    [transferIncluded, selfDriveOnly, bestSellerOnly, selectedCategory, sortBy, location, resultCount]
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
