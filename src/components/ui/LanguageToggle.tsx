'use client';

import { cn } from '@/utils/cn';
import type { Locale } from '@/lib/i18n';

interface LanguageToggleProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  className?: string;
}

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'id', label: 'ID' },
];

export function LanguageToggle({
  locale,
  onLocaleChange,
  className,
}: LanguageToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center bg-gray-100 rounded-lg p-0.5',
        className
      )}
      role="radiogroup"
      aria-label="Language"
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onLocaleChange(lang.code)}
          className={cn(
            'px-3 py-1 text-sm font-medium rounded-md transition-all',
            locale === lang.code
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
          role="radio"
          aria-checked={locale === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
