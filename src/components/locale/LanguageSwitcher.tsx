'use client';

import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from './LocaleProvider';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <LanguageToggle locale={locale} onLocaleChange={setLocale} className={className} />
  );
}
