'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { cn } from '@/utils/cn';

interface CategoryQuickMenuProps {
  /** Canonical category of the product currently open. */
  currentCategory: string;
}

/**
 * Breadcrumb category that doubles as a quick switcher: tapping it opens the
 * nine adventure categories and links to the catalogue pre-filtered by that
 * category (`/?category=<slug>`, read by VentureExplorer).
 *
 * Closes on outside click and Escape; the link targets are plain anchors so the
 * menu works without any extra router plumbing.
 */
export function CategoryQuickMenu({ currentCategory }: CategoryQuickMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const normalized = currentCategory.trim().toLowerCase();

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Change category (now ${currentCategory})`}
        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <span className="max-w-[104px] truncate">{currentCategory}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Browse by category"
          className="absolute left-0 top-full z-50 mt-1.5 max-h-[min(70vh,22rem)] w-56 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-xl"
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Browse by category
          </p>

          {CATEGORY_REGISTRY.map((category) => {
            const isActive =
              category.canonical.toLowerCase() === normalized ||
              category.short.toLowerCase() === normalized;

            return (
              <a
                key={category.slug}
                role="menuitem"
                href={`/?category=${category.slug}`}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-neutral-50',
                  isActive ? 'font-semibold text-neutral-900' : 'text-neutral-700'
                )}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {category.emoji}
                </span>
                <span className="flex-1">{category.short}</span>
                {isActive && <Check className="h-4 w-4 text-green-600" aria-hidden="true" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
