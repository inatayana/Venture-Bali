'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ACTIVE_CURRENCIES,
  currencyForCountry,
  isActiveCurrency,
  type ActiveCurrency,
} from '@/lib/currency';
import { fallbackRate } from '@/lib/fx';

interface CurrencyContextValue {
  currency: ActiveCurrency;
  rates: Record<ActiveCurrency, number>;
  setCurrency: (currency: ActiveCurrency) => void;
  ready: boolean;
}

const fallbackRates = Object.fromEntries(
  ACTIVE_CURRENCIES.map((currency) => [currency, fallbackRate(currency)])
) as Record<ActiveCurrency, number>;

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'IDR',
  rates: fallbackRates,
  setCurrency: () => {},
  ready: false,
});

const CURRENCY_KEY = 'baliwild_currency';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<ActiveCurrency>('IDR');
  const [rates, setRates] = useState(fallbackRates);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENCY_KEY);
    const cookieCurrency = readCookie('baliwild-currency');
    const country = readCookie('baliwild-country');
    const browserCountry = navigator.language?.split('-')[1];
    const initial =
      (isActiveCurrency(stored) && stored) ||
      (isActiveCurrency(cookieCurrency) && cookieCurrency) ||
      currencyForCountry(country || browserCountry);

    setCurrencyState(initial);
    setReady(true);

    fetch('/api/fx/rates')
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.success && payload.data?.rates) {
          setRates(payload.data.rates as Record<ActiveCurrency, number>);
        }
      })
      .catch(() => {
        /* keep static fallback rates */
      });
  }, []);

  const setCurrency = (next: ActiveCurrency) => {
    setCurrencyState(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
    writeCookie('baliwild-currency', next);
  };

  const value = useMemo(
    () => ({ currency, rates, setCurrency, ready }),
    [currency, rates, ready]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
