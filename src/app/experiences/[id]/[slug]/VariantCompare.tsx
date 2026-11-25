'use client';

import { X } from 'lucide-react';
import type { Variant } from '@/types/venture';
import { formatPrice } from '@/lib/i18n';
import { getVariantPickupDisplay, getVariantPriceDisplay } from '@/lib/variantDisplay';

interface VariantCompareProps {
  variants: Variant[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onSelect: (id: string) => void;
}

/** Max 3 packages — keeps the tray readable on mobile. */
export const MAX_COMPARE = 3;

/**
 * Sticky side-by-side comparison of the guest's shortlisted packages.
 * Facts come from the same display helpers used by the cards and the detail
 * modal, so the comparison can never show a different price or transfer mode.
 */
export function VariantCompare({ variants, onRemove, onClear, onSelect }: VariantCompareProps) {
  if (variants.length === 0) return null;

  const rows: Array<{ label: string; value: (variant: Variant) => string }> = [
    { label: 'Price / guest', value: (v) => formatPrice(getVariantPriceDisplay(v).priceIdr) },
    { label: 'Duration', value: (v) => v.duration ?? 'See details' },
    { label: 'Transfer', value: (v) => getVariantPickupDisplay(v)?.label ?? 'See details' },
    {
      label: 'Included',
      value: (v) => (v.inclusions?.length ? v.inclusions.slice(0, 3).join(', ') : 'See details'),
    },
    {
      label: 'Cancellation',
      value: () => 'Free reschedule ≥24h · 80% refund ≥24h',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Compare packages"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur dark:border-white/10 dark:bg-neutral-900/95"
      style={{ bottom: 'calc(var(--cookie-consent-height, 0px) + 4rem)' }}
    >
      <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-10">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            Compare packages ({variants.length}/{MAX_COMPARE})
          </p>
          <button
            type="button"
            onClick={onClear}
            className="min-h-[36px] text-xs font-semibold text-neutral-700 underline dark:text-neutral-200"
          >
            Clear all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className="w-28 shrink-0 pr-3 align-top font-semibold text-neutral-500" />
                {variants.map((variant) => (
                  <th key={variant.id} className="min-w-[150px] pr-3 align-top">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-heading text-sm font-bold text-neutral-900 dark:text-white">
                        {variant.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(variant.id)}
                        aria-label={`Remove ${variant.title} from comparison`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-neutral-100 dark:border-white/5">
                  <th className="pr-3 py-1.5 font-semibold text-neutral-500">{row.label}</th>
                  {variants.map((variant) => (
                    <td key={variant.id} className="pr-3 py-1.5 text-neutral-800 dark:text-neutral-200">
                      {row.value(variant)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-neutral-100 dark:border-white/5">
                <th className="pr-3 py-2" />
                {variants.map((variant) => (
                  <td key={variant.id} className="pr-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelect(variant.id)}
                      className="min-h-[40px] w-full rounded-lg bg-brand-ink px-3 text-xs font-bold text-white dark:bg-brand dark:text-brand-ink"
                    >
                      Select this package
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
