'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Locale, type TranslationNamespace, t, translate } from '@/lib/i18n-unified';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (namespaceOrKey: string, key?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (namespaceOrKey: string) => namespaceOrKey,
});

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<'en' | 'id'>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem('baliwild_locale');
    const cookie = readCookie('baliwild-locale');
    const browser = navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en';
    const initial: 'en' | 'id' = stored === 'id' || stored === 'en' ? stored : cookie === 'id' || cookie === 'en' ? cookie : browser;
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = (next: 'en' | 'id') => {
    setLocaleState(next);
    window.localStorage.setItem('baliwild_locale', next);
    writeCookie('baliwild-locale', next);
    document.documentElement.lang = next;
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (namespaceOrKey: string, key?: string) => {
        // Support both old API (t('namespace.key')) and new API (t('namespace', 'key'))
        if (key !== undefined) {
          // New API: t('namespace', 'key') -> use t function (3 args)
          return t(locale as 'en' | 'id', namespaceOrKey as TranslationNamespace, key);
        } else {
          // Old API: t('namespace.key') -> use translate function (2 args)
          return translate(locale as 'en' | 'id', namespaceOrKey);
        }
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}