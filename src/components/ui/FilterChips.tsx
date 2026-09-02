'use client';

import { cn } from '@/utils/cn';

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  ATV: '🏍️',
  Rafting: '🛶',
  Tubing: '🛝',
  Cycling: '🚴',
  Trekking: '🥾',
  'Water Sports': '🏄',
  Snorkeling: '🤿',
  Extreme: '⚡',
  Combo: '🎯',
};

export function FilterChips({
  categories,
  selectedCategory,
  onSelect,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-hide',
        className
      )}
      role="tablist"
      aria-label="Filter by category"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
          selectedCategory === null
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
        )}
        role="tab"
        aria-selected={selectedCategory === null}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat === selectedCategory ? null : cat)}
          className={cn(
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
            cat === selectedCategory
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          )}
          role="tab"
          aria-selected={cat === selectedCategory}
        >
          {CATEGORY_ICONS[cat] && (
            <span className="mr-1">{CATEGORY_ICONS[cat]}</span>
          )}
          {cat}
        </button>
      ))}
    </div>
  );
}
