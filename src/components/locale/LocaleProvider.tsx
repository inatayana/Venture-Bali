'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translate, type Locale, type MessageKey } from '@/lib/locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => translate('en', key),
});

const LOCALE_KEY = 'baliwild_locale';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    const cookie = readCookie('baliwild-locale');
    const browser = navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en';
    const initial: Locale = stored === 'id' || stored === 'en' ? stored : cookie === 'id' || cookie === 'en' ? cookie : browser;
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_KEY, next);
    writeCookie('baliwild-locale', next);
    document.documentElement.lang = next;
  };

  const value = useMemo(
    () => ({ locale, setLocale, t: (key: MessageKey) => translate(locale, key) }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
