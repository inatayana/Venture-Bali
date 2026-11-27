'use client';

import { useState, useMemo } from 'react';
import { COMMISSION_COMPARISON, REFUND_POLICY_SUMMARY } from '@/lib/publicFacts';
import { formatCurrency } from '@/lib/currency';

interface CalculatorProps {
  basePriceIdr: number;
  activityName: string;
}

export function PriceCalculator({ basePriceIdr, activityName }: CalculatorProps) {
  const [pax, setPax] = useState(2);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');

  const calculations = useMemo(() => {
    const totalBase = basePriceIdr * pax;
    return COMMISSION_COMPARISON.map((ota) => {
      const commission = totalBase * (ota.commissionPct / 100);
      const total = totalBase + commission;
      const savings = commission;
      const savingsPct = totalBase > 0 ? Math.round((savings / total) * 100) : 0;
      return {
        ...ota,
        baseTotal: totalBase,
        commission,
        total,
        savings,
        savingsPct,
      };
    });
  }, [basePriceIdr, pax]);

  const baliWild = calculations.find((c) => c.platform === 'BaliWild (Direct)');
  const highestOta = calculations.reduce((max, c) =>
    c.platform !== 'BaliWild (Direct)' && c.total > max.total ? c : max,
    calculations[0]
  );

  const formatPrice = (idr: number) => {
    if (currency === 'USD') {
      const usd = idr / 15500; // Approximate rate
      return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return formatCurrency(idr, 'IDR');
  };

  return (
    <section className="bg-neutral-50 rounded-2xl p-6 lg:p-8" aria-labelledby="calculator-title">
      <h2 id="calculator-title" className="font-heading text-2xl lg:text-3xl font-bold text-center mb-2">
        Compare: {activityName}
      </h2>
      <p className="text-center text-neutral-600 mb-6">
        Select travellers to see real-time savings vs major OTAs
      </p>

      {/* Pax Selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <label htmlFor="pax-select" className="text-sm font-medium text-neutral-700">
          Travellers:
        </label>
        <select
          id="pax-select"
          value={pax}
          onChange={(e) => setPax(Number(e.target.value))}
          className="min-h-[44px] px-4 py-2 rounded-lg border border-neutral-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'Adult' : 'Adults'}
            </option>
          ))}
        </select>
      </div>

      {/* Currency Toggle */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setCurrency('IDR')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currency === 'IDR'
              ? 'bg-brand-ink text-brand'
              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
          }`}
        >
          IDR
        </button>
        <button
          onClick={() => setCurrency('USD')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currency === 'USD'
              ? 'bg-brand-ink text-brand'
              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
          }`}
        >
          ≈ USD
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left" role="table">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-neutral-700">Platform</th>
              <th className="px-4 py-3 font-semibold text-neutral-700 text-right">Base Price</th>
              <th className="px-4 py-3 font-semibold text-neutral-700 text-right">Fees</th>
              <th className="px-4 py-3 font-semibold text-neutral-700 text-right">You Pay</th>
              <th className="px-4 py-3 font-semibold text-neutral-700 text-right">Savings</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map((row) => {
              const isBaliWild = row.platform === 'BaliWild (Direct)';
              const isHighestOta = !isBaliWild && row.total === highestOta.total;
              return (
                <tr
                  key={row.platform}
                  className={`border-t border-neutral-100 transition-colors ${
                    isBaliWild ? 'bg-brand/10' : isHighestOta ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <span className={`inline-flex items-center gap-2 ${isBaliWild ? 'text-brand-ink' : ''}`}>
                      {isBaliWild && <span className="text-lg" aria-hidden="true">🟢</span>}
                      {row.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600 tabular-nums">
                    {formatPrice(row.baseTotal)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {isBaliWild ? (
                      <span className="text-green-600 font-medium">+{formatPrice(0)}</span>
                    ) : (
                      <span className="text-red-600 font-medium">+{formatPrice(row.commission)} ({row.commissionPct}%)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-lg tabular-nums">
                    {isBaliWild ? (
                      <span className="text-brand-ink">{formatPrice(row.total)}</span>
                    ) : (
                      <span className="text-neutral-900">{formatPrice(row.total)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isBaliWild ? (
                      <span className="text-green-600 font-medium">
                        ✓ Direct price — no hidden fees
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Save {formatPrice(row.savings)} ({row.savingsPct}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Savings Highlight */}
      {baliWild && highestOta && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30">
          <p className="text-center text-lg font-semibold text-brand-ink">
            💚 You save <span className="text-2xl">{formatPrice(highestOta.savings)}</span> ({highestOta.savingsPct}%) — that's a nice dinner in Bali!
          </p>
        </div>
      )}

      {/* Refund Policy Notice */}
      <details className="mt-6 group">
        <summary className="cursor-pointer flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
          <span className="font-medium">Refund & Reschedule Policy</span>
          <span className="transition-transform group-open:rotate-180" aria-hidden="true">▼</span>
        </summary>
        <div className="mt-3 p-4 bg-neutral-50 rounded-xl space-y-2 text-sm text-neutral-700">
          <div className="flex justify-between">
            <span>Cancelled ≥24 hours before</span>
            <span className="font-semibold text-green-600">{REFUND_POLICY_SUMMARY.cancel24hPlus.refundPct}% refund</span>
          </div>
          <div className="flex justify-between">
            <span>Cancelled <24 hours before</span>
            <span className="font-semibold text-red-600">Non-refundable</span>
          </div>
          <div className="flex justify-between">
            <span>Reschedule ≥24 hours before</span>
            <span className="font-semibold text-brand-ink">Free</span>
          </div>
          <p className="text-neutral-500 text-xs mt-2">
            Policy per REFUND_POLICY.md v2. Guide already committed <24h.
          </p>
        </div>
      </details>
    </section>
  );
}