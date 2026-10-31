import Image from 'next/image';
import { Check, Clock, Plus, X } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';
import type { Variant } from '@/types/venture';
import { cn } from '@/utils/cn';

interface VariantCatalogCardProps {
  variant: Variant;
  selected: boolean;
  onSelect: () => void;
  onShowDates: () => void;
}

function lowestListPrice(variant: Variant): number {
  const prices = variant.priceTiers.map((tier) => tier.pricePerPax);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * Package matrix card: title, duration, inclusions/exclusions, price unit,
 * minimum spend and the two actions (select / show dates).
 */
export function VariantCatalogCard({
  variant,
  selected,
  onSelect,
  onShowDates,
}: VariantCatalogCardProps) {
  const listPrice = lowestListPrice(variant);
  const promoPrice =
    variant.promoPriceIdr && variant.promoPriceIdr > 0 && variant.promoPriceIdr < listPrice
      ? variant.promoPriceIdr
      : null;
  const price = promoPrice ?? listPrice;
  const inclusions = variant.inclusions ?? [];
  const exclusions = variant.exclusions ?? [];
  const addonCount = variant.addons?.length ?? 0;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'cursor-pointer rounded-2xl border-2 bg-white p-5 transition-all',
        selected
          ? 'border-neutral-900 shadow-md'
          : 'border-neutral-200 hover:border-neutral-400'
      )}
    >
      <div className="flex items-start gap-3">
        {variant.imageUrl ? (
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={variant.imageUrl}
              alt={variant.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          </span>
        ) : (
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xl"
            aria-hidden="true"
          >
            {variant.transportBadge?.split(' ')[0] ?? '📍'}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-bold leading-tight text-neutral-900">
              {variant.title}
            </h3>
            {variant.badge && (
              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {variant.badge}
              </span>
            )}
            {selected && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800">
                Selected
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <Clock className="h-3.5 w-3.5" />
              {variant.duration ?? '—'}
            </span>
            {variant.transportBadge && <span>{variant.transportBadge}</span>}
          </div>

          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {variant.shortDescription}
          </p>

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <ul className="space-y-1 text-sm text-neutral-700">
                  {inclusions.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {exclusions.length > 0 && (
                <ul className="space-y-1 text-sm text-neutral-500">
                  {exclusions.slice(0, 2).map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {variant.operationNotes && (
            <p className="mt-2 text-xs text-neutral-500">{variant.operationNotes}</p>
          )}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-neutral-100 pt-3">
            <div>
              <div className="flex items-baseline gap-2">
                {promoPrice !== null && (
                  <span className="text-sm tabular-nums text-neutral-400 line-through">
                    {formatPrice(listPrice)}
                  </span>
                )}
                <span className="font-heading text-xl font-bold tabular-nums text-neutral-900">
                  {formatPrice(price)}
                </span>
                <span className="text-xs text-neutral-500">/ guest</span>
              </div>
              {variant.minimumSpendIdr ? (
                <p className="text-xs text-neutral-500">
                  Minimum {formatPrice(variant.minimumSpendIdr)}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  {variant.fulfillmentMode === 'PRIVATE_TRANSFER'
                    ? 'Private car included for your group'
                    : addonCount > 0
                      ? `${addonCount} add-on${addonCount > 1 ? 's' : ''} available`
                      : 'No minimum spend'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect();
                }}
                className="min-h-[44px] rounded-xl border-2 border-neutral-200 px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-400"
              >
                {selected ? 'Selected' : 'Select'}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onShowDates();
                }}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" /> Show dates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
