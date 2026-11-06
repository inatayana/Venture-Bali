'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { value: string; label: string }[];
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | ((row: T) => string);
  selection?: {
    enabled: boolean;
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (key: string, order: 'asc' | 'desc') => void;
  };
  filters?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  bulkActions?: {
    label: string;
    onClick: (selectedIds: string[]) => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
  }[];
  rowClassName?: (row: T, index: number) => string;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return format(value, 'PPp');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function FilterMenu({
  column,
  value,
  onChange,
  options,
}: {
  column: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          aria-label={`Filter by ${column}`}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" side="bottom" align="start">
        <div className="space-y-1">
          <label className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={value === ''}
              onChange={() => onChange('')}
              className="rounded border-input"
            />
            <span>All</span>
          </label>
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded">
              <input
                type="checkbox"
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="rounded border-input"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 w-full sm:w-64"
        aria-label="Search"
      />
    </div>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  selection,
  sorting,
  filters,
  onFiltersChange,
  searchable = true,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  pagination,
  loading = false,
  emptyMessage = 'No data available.',
  className,
  rowClassName,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    sorting ? { key: sorting.sortBy, direction: sorting.sortOrder } : null
  );
  const [internalSearchValue, setInternalSearchValue] = useState(searchValue || '');

  const getKey = useCallback((row: T) => {
    if (typeof keyField === 'function') return keyField(row);
    return String(row[keyField]);
  }, [keyField]);

  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    sorting?.onSortChange(key, direction);
  }, [sortConfig, sorting]);

  const handleFilterChange = useCallback((column: string, value: string) => {
    onFiltersChange?.({ ...filters, [column]: value });
  }, [filters, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setInternalSearchValue(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleSelectAll = useCallback(() => {
    if (!selection) return;
    const allIds = data.map((row) => getKey(row));
    selection.onSelectionChange(new Set(allIds));
  }, [data, selection, getKey]);

  const handleSelectRow = useCallback((id: string) => {
    if (!selection) return;
    const newSelection = new Set(selection.selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    selection.onSelectionChange(newSelection);
  }, [selection]);

  const isAllSelected = selection && data.length > 0 && data.every((row) => selection.selectedIds.has(getKey(row)));

  const filteredData = useMemo(() => {
    let result = [...data];

    if (internalSearchValue) {
      const searchLower = internalSearchValue.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        )
      );
    }

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => String(row[key]) === value);
      }
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const aStr = String(aVal);
        const bStr = String(bVal);
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, internalSearchValue, filters, sortConfig]);

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex flex-wrap items-center gap-3">
          {searchable && (
            <SearchInput
              value={internalSearchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder || 'Search...'}
            />
          )}
          {columns
            .filter((c) => c.filterable && c.filterOptions)
            .map((column) => (
              <FilterMenu
                key={column.key}
                column={column.key}
                value={filters?.[column.key] || ''}
                onChange={(v) => handleFilterChange(column.key, v)}
                options={column.filterOptions || []}
              />
            ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div>
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b bg-muted/50">
                  {selection && (
                    <th scope="col" className="w-12 px-4 py-3 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground',
                        column.sortable && 'cursor-pointer hover:bg-muted/50 select-none',
                        column.width
                      )}
                      style={{ width: column.width }}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        <span>{column.header}</span>
                        {column.sortable && sorting?.sortBy === column.key && (
                          <span aria-hidden="true">
                            {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {column.filterable && column.filterOptions && (
                          <FilterMenu
                            column={column.key}
                            value={filters?.[column.key] || ''}
                            onChange={(v) => handleFilterChange(column.key, v)}
                            options={column.filterOptions || []}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, rowIndex) => {
                  const rowKey = getKey(row);
                  const rowClasses = cn('border-b last:border-0 transition-colors', rowClassName?.(row, rowIndex));

                  return (
                    <tr key={rowKey} className={rowClasses}>
                      {selection && (
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={selection?.selectedIds.has(getKey(row))}
                            onCheckedChange={() => handleSelectRow(getKey(row))}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.render
                            ? column.render(row, rowIndex)
                            : formatCellValue(row[column.key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(pagination.pageSize)} onValueChange={(v) => pagination.onPageSizeChange(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-sm">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

