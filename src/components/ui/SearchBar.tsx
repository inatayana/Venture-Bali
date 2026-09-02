'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search adventures in Bali...',
  className,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={cn(
        'relative flex items-center rounded-xl border-2 transition-colors',
        isFocused ? 'border-blue-600 bg-white' : 'border-gray-200 bg-gray-50',
        className
      )}
    >
      <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full px-3 py-3 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
        aria-label="Search adventures"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="p-2 mr-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
