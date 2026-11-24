'use client';

import { Languages } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Locale } from '@/lib/i18n';

interface LanguageToggleProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  className?: string;
}

const NEXT_LOCALE: Record<Locale, Locale> = { en: 'id', id: 'en' };
const LOCALE_NAME: Record<Locale, string> = { en: 'English', id: 'Bahasa Indonesia' };

/**
 * Single-button language switch: one tap flips between EN and ID and the
 * label always shows the language that is currently active, so the header
 * needs only one tap target instead of a two-segment control.
 */
export function LanguageToggle({
  locale,
  onLocaleChange,
  className,
}: LanguageToggleProps) {
  const next = NEXT_LOCALE[locale];

  return (
    <button
      type="button"
      onClick={() => onLocaleChange(next)}
      aria-label={`Language: ${LOCALE_NAME[locale]}. Switch to ${LOCALE_NAME[next]}`}
      title={`Switch to ${LOCALE_NAME[next]}`}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900',
        'dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20 dark:hover:text-white',
        className
      )}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span aria-hidden="true">{locale.toUpperCase()}</span>
    </button>
  );
}
