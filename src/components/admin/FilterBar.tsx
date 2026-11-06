'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/utils/cn';
import { Search, Filter, Calendar, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';



interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  filterOptions?: Record<string, { value: string; label: string }[]>;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = {},
  onFiltersChange,
  filterOptions = {},
  dateRange,
  onDateRangeChange,
  className,
}: FilterBarProps) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>(filters);
  const [internalSearchValue, setInternalSearchValue] = useState(searchValue);
  const [dateRangeState, setDateRangeState] = useState<{ from?: Date; to?: Date }>(dateRange || {});

  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFiltersChange?.({ ...filters, [key]: value });
  }, [filterValues, filters, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setInternalSearchValue(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleDateRangeChange = useCallback((range: { from?: Date; to?: Date }) => {
    setDateRangeState(range);
    onDateRangeChange?.(range);
  }, [onDateRangeChange]);

  const clearFilter = useCallback((key: string) => {
    const newFilters = { ...filterValues };
    delete newFilters[key];
    setFilterValues(newFilters);
    onFiltersChange?.(newFilters);
  }, [filterValues, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setFilterValues({});
    setInternalSearchValue('');
    setDateRangeState({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const hasActiveFilters = Object.keys(filterValues).some((k) => filterValues[k]) || internalSearchValue || dateRangeState.from || dateRangeState.to;

  return (
    <div className={cn('flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border', 'mb-4', className)}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <label htmlFor="search" className="sr-only">Search</label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={internalSearchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(filters).map(([key, value]) => {
          const options = filterOptions[key];
          if (!options) return null;

          return (
            <Popover key={key}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Filter className="w-4 h-4" />
                  <span>{key}</span>
                  <span className="text-xs text-muted-foreground">▼</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" side="bottom" align="start">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={!filters[key]}
                      onChange={(e) => handleFilterChange(key, e.target.checked ? '' : value)}
                      className="rounded border-input"
                    />
                    <span>All</span>
                  </label>
                  {options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded">
                      <input
                        type="checkbox"
                        checked={filters[key] === opt.value}
                        onChange={(e) => handleFilterChange(key, e.target.checked ? opt.value : '')}
                        className="rounded border-input"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                  : dateRange?.from
                  ? `From ${format(dateRange.from, 'MMM d')}`
                  : dateRange?.to
                  ? `Until ${format(dateRange.to, 'MMM d')}`
                  : 'Date range'}
              </span>
              <span className="text-xs text-muted-foreground">▼</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="bottom" align="start">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleDateRangeChange({ ...dateRangeState, from: val ? new Date(val) : undefined });
                  }}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleDateRangeChange({ ...dateRangeState, to: val ? new Date(val) : undefined });
                  }}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => handleDateRangeChange({})}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded"
                  onClick={() => handleDateRangeChange(dateRangeState)}
                >
                  Apply
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Tags */}
      <div className="flex items-center gap-1 flex-wrap">
        {Object.entries(filters).map(([key, value]) => value && (
          <span key={key} className="inline-flex items-center gap-1 rounded-full border bg-primary/10 text-primary text-xs px-2 py-1">
            <span className="font-medium">{key}:</span>
            <span>{value}</span>
            <button
              type="button"
              onClick={() => clearFilter(key)}
              className="ml-1 p-0.5 rounded hover:bg-primary/20"
              aria-label={`Remove ${key} filter`}
            >
              <XCircle className="w-3 h-3" />
            </button>
          </span>
        ))}
        {(dateRange?.from || dateRange?.to) && (
          <span className="inline-flex items-center gap-1 rounded-full border bg-primary/10 text-primary text-xs px-2 py-1">
            <Calendar className="w-3 h-3" />
            <span>
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                : dateRange?.from
                ? `From ${format(dateRange.from, 'MMM d')}`
                : dateRange?.to
                ? `Until ${format(dateRange.to, 'MMM d')}`
                : ''}
            </span>
            <button
              type="button"
              onClick={() => handleDateRangeChange({})}
              className="ml-1 p-0.5 rounded hover:bg-primary/20"
              aria-label="Remove date range filter"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </span>
        )}
        {internalSearchValue && (
          <span className="inline-flex items-center gap-1 rounded-full border bg-primary/10 text-primary text-xs px-2 py-1">
            <Search className="w-3 h-3" />
            <span>{internalSearchValue}</span>
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="ml-1 p-0.5 rounded hover:bg-primary/20"
              aria-label="Remove search"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </span>
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}