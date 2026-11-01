import { NextResponse } from 'next/server';
import { ACTIVE_CURRENCIES, type ActiveCurrency } from '@/lib/currency';
import { fallbackRate, getRates } from '@/lib/fx';

export const revalidate = 86400;

/**
 * Daily display rates (IDR per 1 unit). Payment is always charged in IDR; these
 * rates only power the approximate prices shown to international guests.
 */
export async function GET() {
  try {
    const live = await getRates();
    const rates = Object.fromEntries(
      ACTIVE_CURRENCIES.map((currency) => [currency, live[currency] || fallbackRate(currency)])
    ) as Record<ActiveCurrency, number>;

    return NextResponse.json(
      { success: true, data: { base: 'IDR', rates, updatedAt: new Date().toISOString() } },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    );
  } catch {
    const rates = Object.fromEntries(
      ACTIVE_CURRENCIES.map((currency) => [currency, fallbackRate(currency)])
    ) as Record<ActiveCurrency, number>;

    return NextResponse.json({
      success: true,
      data: { base: 'IDR', rates, updatedAt: new Date().toISOString(), fallback: true },
    });
  }
}
