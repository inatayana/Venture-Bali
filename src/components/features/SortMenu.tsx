'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SortOption {
  value: string;
  label: string;
}

interface SortMenuProps {
  value: string;
  options: readonly SortOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Sort control for the catalogue: a compact icon button that opens a popup with
 * the available orders instead of the native `<select>` dropdown.
 *
 * Closes on outside click, Escape or after picking an option.
 */
export function SortMenu({ value, options, onChange, className }: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Sort adventures (now ${active?.label ?? 'Recommended'})`}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:px-3"
      >
        <ArrowUpDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <span className="hidden max-w-[8.5rem] truncate sm:inline">{active?.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort adventures"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Sort by
          </p>

          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                  isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'
                )}
              >
                <span className="flex-1">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
