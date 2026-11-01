import { formatCurrency, SUPPORTED_CURRENCIES, type Currency } from './fx';

/** Phase A: the markets that actually book Bali trips. */
export const ACTIVE_CURRENCIES = [
  'IDR',
  'USD',
  'EUR',
  'AUD',
  'SGD',
  'CNY',
  'INR',
  'KRW',
  'JPY',
] as const;
export type ActiveCurrency = (typeof ACTIVE_CURRENCIES)[number];

export const ACTIVE_CURRENCY_INFO = ACTIVE_CURRENCIES.map(
  (code) => SUPPORTED_CURRENCIES.find((currency) => currency.code === code)!
);

const EUROZONE = new Set([
  'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
]);

/** Country → display currency. Anything else stays on IDR (the charge currency). */
export function currencyForCountry(country: string | null | undefined): ActiveCurrency {
  const code = country?.trim().toUpperCase();
  if (!code) return 'IDR';
  if (code === 'US') return 'USD';
  if (code === 'AU' || code === 'NZ') return 'AUD';
  if (code === 'SG') return 'SGD';
  if (code === 'CN') return 'CNY';
  if (code === 'IN') return 'INR';
  if (code === 'KR') return 'KRW';
  if (code === 'JP') return 'JPY';
  if (EUROZONE.has(code)) return 'EUR';
  return 'IDR';
}

export function isActiveCurrency(value: string | null | undefined): value is ActiveCurrency {
  return Boolean(value) && (ACTIVE_CURRENCIES as readonly string[]).includes(value as string);
}

export function convertIdr(
  amountIdr: number,
  currency: ActiveCurrency,
  rates: Record<ActiveCurrency, number>
): number {
  if (currency === 'IDR') return amountIdr;
  return Math.round(amountIdr / (rates[currency] || 1));
}

export function formatMoney(
  amountIdr: number,
  currency: ActiveCurrency,
  rates: Record<ActiveCurrency, number>
): string {
  return formatCurrency(convertIdr(amountIdr, currency, rates), currency as Currency);
}
