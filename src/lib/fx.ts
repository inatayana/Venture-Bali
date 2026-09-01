/**
 * Venture Bali — Multi-Currency Exchange Rate Service
 * Uses exchangerate-api.com for live rates.
 * Fallback to hardcoded rates if API unavailable.
 */

export type Currency = 'IDR' | 'AUD' | 'CNY' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'KRW' | 'MYR' | 'SGD' | 'USD';

export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
];

const FALLBACK_RATES: Record<Currency, number> = {
  IDR: 1,
  USD: 16000,
  AUD: 10500,
  EUR: 17400,
  GBP: 20300,
  SGD: 11900,
  JPY: 107,
  KRW: 11.9,
  CNY: 2200,
  INR: 190,
  MYR: 3400,
};

interface RateCache {
  rates: Record<Currency, number>;
  fetchedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchRates(): Promise<Record<Currency, number>> {
  const apiKey = process.env.EXCHANGERATE_API_KEY;
  if (!apiKey) {
    console.warn('[FX] No API key configured, using fallback rates');
    return FALLBACK_RATES;
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      { next: { revalidate: CACHE_TTL_MS / 1000 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type'] ?? 'API error');

    const rates: Record<string, number> = { IDR: 1 };
    for (const cur of SUPPORTED_CURRENCIES) {
      if (cur.code === 'USD') {
        rates.USD = 1;
      } else if (data.conversion_rates?.[cur.code]) {
        rates[cur.code] = Math.round(FALLBACK_RATES.IDR / data.conversion_rates[cur.code]);
      } else {
        rates[cur.code] = FALLBACK_RATES[cur.code];
      }
    }
    return rates as Record<Currency, number>;
  } catch (err) {
    console.error('[FX] Failed to fetch rates, using fallback:', err);
    return FALLBACK_RATES;
  }
}

export async function getRates(): Promise<Record<Currency, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }
  const rates = await fetchRates();
  cache = { rates, fetchedAt: Date.now() };
  return rates;
}

/**
 * Convert IDR amount to target currency
 */
export async function convertFromIDR(amountIdr: number, targetCurrency: Currency): Promise<number> {
  const rates = await getRates();
  const rate = rates[targetCurrency] ?? FALLBACK_RATES[targetCurrency];
  return Math.round(amountIdr / rate);
}

/**
 * Get all conversions for an IDR amount (for display)
 */
export async function getAllConversions(amountIdr: number): Promise<Record<Currency, number>> {
  const rates = await getRates();
  const result: Record<Currency, number> = {} as Record<Currency, number>;
  for (const cur of SUPPORTED_CURRENCIES) {
    result[cur.code] = Math.round(amountIdr / rates[cur.code]);
  }
  return result;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const info = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  if (!info) return `${amount}`;
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  return `${info.symbol}${amount.toLocaleString('en-US')}`;
}
