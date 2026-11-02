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
        'inline-flex items-center bg-inset rounded-lg p-0.5',
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
            'min-h-[44px] rounded-md px-4 py-2 text-sm font-medium transition-all',
            locale === lang.code
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
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
