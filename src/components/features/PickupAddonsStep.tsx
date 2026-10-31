'use client';

import { useMemo } from 'react';
import { Check, Plus } from 'lucide-react';
import { normalizeAddons } from '@/lib/addons';
import { filterAddonsForMode } from '@/lib/pricing';
import { formatPrice } from '@/lib/i18n';
import type { Addon, FulfillmentMode } from '@/types/venture';
import { cn } from '@/utils/cn';

export interface PickupAddonsStepProps {
  addons: Addon[] | Record<string, unknown> | string | null | undefined;
  variantId: string;
  fulfillmentMode: FulfillmentMode;
  selectedAddonIds: string[];
  onToggle: (addonId: string) => void;
}

export function PickupAddonsStep({
  addons,
  variantId,
  fulfillmentMode,
  selectedAddonIds,
  onToggle,
}: PickupAddonsStepProps) {
  const normalized = useMemo(
    () => normalizeAddons(addons, { variantId }),
    [addons, variantId],
  );

  const addonsWithState = useMemo(
    () => filterAddonsForMode(normalized, fulfillmentMode),
    [normalized, fulfillmentMode],
  );

  if (addonsWithState.length === 0) {
    return (
      <p className="text-sm text-gray-400" data-testid="pickup-addons-empty">
        No add-ons available for this package.
      </p>
    );
  }

  return (
    <div>
      <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Plus className="w-4 h-4" /> Combos &amp; Add-ons
      </h3>
      {fulfillmentMode !== 'PRIVATE_TRANSFER' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
          Combos require hotel transfer — select a transport option to unlock.
        </p>
      )}
      <div className="space-y-2">
        {addonsWithState.map((addon) => {
          const checked = selectedAddonIds.includes(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => !addon.isDisabled && onToggle(addon.id)}
              disabled={addon.isDisabled}
              aria-pressed={checked}
              data-testid={`pickup-addon-${addon.id}`}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left min-h-[44px]',
                addon.isDisabled && 'opacity-50 cursor-not-allowed border-gray-100',
                !addon.isDisabled && checked && 'border-brand-ink bg-brand/40',
                !addon.isDisabled && !checked && 'border-gray-200 hover:border-gray-300',
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                  checked ? 'bg-brand-ink border-brand-ink text-brand' : 'border-gray-300',
                )}
              >
                {checked && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <div className="flex-1">
                <span className={cn('font-medium text-sm block', addon.isDisabled ? 'text-gray-400' : 'text-gray-900')}>
                  {addon.name}
                  {addon.isCombo && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded">COMBO</span>
                  )}
                </span>
                {addon.description && (
                  <span className="text-xs text-gray-500 block mt-0.5">{addon.description}</span>
                )}
                {addon.isDisabled && <span className="text-xs text-amber-700">Requires hotel transfer</span>}
              </div>
              <span className={cn('font-heading text-sm font-bold tabular-nums shrink-0', addon.isDisabled ? 'text-gray-400' : 'text-brand-ink')}>
                + {formatPrice(addon.price)}/pax
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
