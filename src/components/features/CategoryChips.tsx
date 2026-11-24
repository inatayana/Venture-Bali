'use client';

import { useState, useCallback, useMemo, KeyboardEvent } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { CATEGORY_REGISTRY, type MegaCategorySlug as CategorySlug } from '@/lib/taxonomy';
import { cn } from '@/utils/cn';

interface CategoryChipsProps {
  /** Selected category slugs */
  selected: CategorySlug[];
  /** Callback when selection changes */
  onChange: (selected: CategorySlug[]) => void;
  /** Allow multiple selection (default: true) */
  multiSelect?: boolean;
  /** Variant: 'chips' for inline (desktop), 'grid' for bottom sheet (mobile) */
  variant?: 'chips' | 'grid';
  /** Show category emoji (default: true) */
  showEmoji?: boolean;
  /** Max chips to show before overflow (chips variant only) */
  maxVisible?: number;
  /** Aria label for the group */
  ariaLabel?: string;
  /** Additional className */
  className?: string;
}

/**
 * CategoryChips - Reusable category filter component
 * 
 * Used in:
 * - Desktop: ExploreSearchBar (chips variant, horizontal scroll)
 * - Mobile: FilterBottomSheet (grid variant, wrap grid)
 * 
 * Features:
 * - 9 BaliWild categories with emoji
 * - Multi/single select mode
 * - Keyboard navigation (ArrowLeft/Right, Enter, Space, Escape)
 * - Smooth selection animation
 * - Screen reader accessible
 * - Responsive layout
 */
export function CategoryChips({
  selected,
  onChange,
  multiSelect = true,
  variant = 'chips',
  showEmoji = true,
  maxVisible,
  ariaLabel = 'Filter by activity type',
  className,
}: CategoryChipsProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Memoize categories for performance
  const categories = useMemo(() => CATEGORY_REGISTRY, []);

  const handleToggle = useCallback(
    (slug: CategorySlug) => {
      const isSelected = selected.includes(slug);
      let newSelected: CategorySlug[];

      if (multiSelect) {
        newSelected = isSelected
          ? selected.filter((s) => s !== slug)
          : [...selected, slug];
      } else {
        newSelected = isSelected ? [] : [slug];
      }

      onChange(newSelected);
    },
    [selected, multiSelect, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const maxIndex = categories.length - 1;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(maxIndex);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleToggle(categories[index].slug);
          break;
        case 'Escape':
          e.preventDefault();
          setFocusedIndex(-1);
          (e.target as HTMLButtonElement).blur();
          break;
      }
    },
    [categories, handleToggle]
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  const isSelected = useCallback(
    (slug: CategorySlug) => selected.includes(slug),
    [selected]
  );

  // Container classes based on variant
  const containerClass = cn(
    'flex gap-2',
    variant === 'chips'
      ? 'flex-nowrap overflow-x-auto scrollbar-hide pb-2 -mb-2 pr-2'
      : 'flex-wrap',
    className
  );

  // Chip classes
  const chipBaseClass = cn(
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-full',
    'text-sm font-medium transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'touch-manipulation'
  );

  const getChipClass = (slug: CategorySlug) => {
    const selectedState = isSelected(slug);
    return cn(
      chipBaseClass,
      selectedState
        ? 'bg-brand-ink text-brand border-brand-ink shadow-sm'
        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:border-brand-ink/50 hover:bg-brand/5 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5',
      'animate-in zoom-in-95 duration-150 ease-out'
    );
  };

  // Grid variant (mobile bottom sheet) - larger touch targets
  const gridChipClass = cn(
    'flex flex-col items-center gap-1 px-3 py-3 rounded-xl min-w-[80px]',
    'text-sm font-medium transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
    'touch-manipulation'
  );

  const getGridChipClass = (slug: CategorySlug) => {
    const selectedState = isSelected(slug);
    return cn(
      gridChipClass,
      selectedState
        ? 'bg-brand-ink text-brand border-brand-ink shadow-sm'
        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:border-brand-ink/50 hover:bg-brand/5 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5',
      'animate-in zoom-in-95 duration-150 ease-out'
    );
  };

  // Determine visible categories (for chips variant with maxVisible)
  const visibleCategories = useMemo(() => {
    if (variant === 'chips' && maxVisible && categories.length > maxVisible) {
      // Always show selected + first (maxVisible - selectedCount) unselected
      const selectedCats = categories.filter((c) => isSelected(c.slug));
      const unselectedCats = categories.filter((c) => !isSelected(c.slug));
      const remainingSlots = maxVisible - selectedCats.length;
      return [...selectedCats, ...unselectedCats.slice(0, Math.max(0, remainingSlots))];
    }
    return categories;
  }, [categories, variant, maxVisible, isSelected]);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={containerClass}
      data-variant={variant}
    >
      {visibleCategories.map((category, index) => {
        const slug = category.slug;
        const selectedState = isSelected(slug);
        const isFocused = focusedIndex === index;

        if (variant === 'grid') {
          return (
            <button
              key={slug}
              type="button"
              role={multiSelect ? 'checkbox' : 'radio'}
              aria-checked={selectedState}
              aria-label={`${category.short} ${selectedState ? 'selected' : 'not selected'}`}
              onClick={() => handleToggle(slug)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              className={getGridChipClass(slug)}
              tabIndex={isFocused ? 0 : -1}
            >
              {showEmoji && (
                <span className="text-2xl leading-none" aria-hidden="true">
                  {category.emoji}
                </span>
              )}
              <span className="font-medium">{category.short}</span>
              {selectedState && (
                <Check className="w-4 h-4 text-brand shrink-0 animate-in zoom-in-95 duration-100" aria-hidden="true" />
              )}
            </button>
          );
        }

        return (
          <button
            key={slug}
            type="button"
            role={multiSelect ? 'checkbox' : 'radio'}
            aria-checked={selectedState}
            aria-label={`${category.short} ${selectedState ? 'selected' : 'not selected'}`}
            onClick={() => handleToggle(slug)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            className={getChipClass(slug)}
            tabIndex={isFocused ? 0 : -1}
            style={isFocused ? { boxShadow: '0 0 0 2px #000000, 0 0 0 4px hsl(var(--brand))' } : undefined}
          >
            {showEmoji && (
              <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
                {category.emoji}
              </span>
            )}
            <span className="whitespace-nowrap">{category.short}</span>
            {selectedState && (
              <Check className="w-4 h-4 flex-shrink-0 animate-in zoom-in-95 duration-100" aria-hidden="true" />
            )}
          </button>
        );
      })}

      {/* Overflow indicator for chips variant */}
      {variant === 'chips' && maxVisible && categories.length > maxVisible && !visibleCategories.every((c) => isSelected(c.slug)) && (
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 hover:border-brand-ink/50 hover:bg-brand/5 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label={`${categories.length - visibleCategories.length} more categories available`}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
          <span>+{categories.length - visibleCategories.length}</span>
        </button>
      )}
    </div>
  );
}

/**
 * CategoryChip - Single chip component (for use outside the group)
 */
export function CategoryChip({
  category,
  selected = false,
  onClick,
  showEmoji = true,
  variant = 'chips',
  className,
}: {
  category: typeof CATEGORY_REGISTRY[0];
  selected?: boolean;
  onClick?: () => void;
  showEmoji?: boolean;
  variant?: 'chips' | 'grid';
  className?: string;
}) {
  const chipClass = variant === 'grid' ? 'flex flex-col items-center gap-1 px-3 py-3 rounded-xl min-w-[80px]' : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap';

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`${category.short} ${selected ? 'selected' : 'not selected'}`}
      onClick={onClick}
      className={cn(
        chipClass,
        'text-sm font-medium transition-all duration-200 ease-out animate-in zoom-in-95 duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        selected
          ? 'bg-brand-ink text-brand border-brand-ink shadow-sm'
          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:border-brand-ink/50 hover:bg-brand/5 dark:hover:border-brand-ink/50 dark:hover:bg-brand/5',
        className
      )}
    >
      {showEmoji && (
        <span className={variant === 'grid' ? 'text-2xl' : 'text-base'} aria-hidden="true">
          {category.emoji}
        </span>
      )}
      <span className={variant === 'grid' ? '' : 'whitespace-nowrap'}>{category.short}</span>
      {selected && <Check className="w-4 h-4 animate-in zoom-in-95 duration-100" aria-hidden="true" />}
    </button>
  );
}