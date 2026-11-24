'use client';

import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from './LocaleProvider';

export function LanguageSwitcher({
  className,
  onLocaleChange,
}: { className?: string; onLocaleChange?: (locale: 'en' | 'id') => void }) {
  const { locale, setLocale } = useLocale();

  const handleLocaleChange = (next: 'en' | 'id') => {
    setLocale(next);
    onLocaleChange?.(next);
  };

  return (
    <LanguageToggle locale={locale} onLocaleChange={handleLocaleChange} className={className} />
  );
}
