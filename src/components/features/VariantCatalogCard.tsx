import Image from 'next/image';
import { Clock } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';
import type { Variant } from '@/types/venture';
import { cn } from '@/utils/cn';

interface VariantCatalogCardProps {
  variant: Variant;
  /** Product-level inclusions shown as the "what you get" bullets. */
  inclusions: string[];
  onShowDates: () => void;
  /** Clicking the card syncs the gallery image and highlights the package. */
  onFocus?: () => void;
  active?: boolean;
}

function lowestListPrice(variant: Variant): number {
  const prices = variant.priceTiers.map((tier) => tier.pricePerPax);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * One interactive row of the variant catalogue: transport thumbnail, duration,
 * inclusions, strikethrough anchoring and a per-row "Show dates" action.
 */
export function VariantCatalogCard({
  variant,
  inclusions,
  onShowDates,
  onFocus,
  active = false,
}: VariantCatalogCardProps) {
  const listPrice = lowestListPrice(variant);
  const promoPrice =
    variant.promoPriceIdr && variant.promoPriceIdr > 0 && variant.promoPriceIdr < listPrice
      ? variant.promoPriceIdr
      : null;
  const price = promoPrice ?? listPrice;
  const bullets = inclusions.slice(0, 3);
  const isGroupPriced = variant.fulfillmentMode === 'PRIVATE_TRANSFER';

  return (
    <div
      onClick={onFocus}
      className={cn(
        'rounded-2xl border-2 bg-white p-4 transition-colors',
        active ? 'border-neutral-900' : 'border-neutral-200',
        onFocus && 'cursor-pointer hover:border-neutral-400'
      )}
    >
      <div className="flex items-start gap-3">
        {variant.imageUrl ? (
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={variant.imageUrl}
              alt={variant.title}
              fill
              sizes="44px"
              className="object-cover"
            />
          </span>
        ) : (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg"
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
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {variant.duration ?? '—'}
            </span>
            {variant.transportBadge && <span>{variant.transportBadge}</span>}
          </div>

          {bullets.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-neutral-600">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="mt-[2px] text-green-600" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {variant.operationNotes && (
            <p className="mt-2 text-xs text-neutral-500">{variant.operationNotes}</p>
          )}

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
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
              </div>
              <span className="text-xs text-neutral-500">
                {isGroupPriced ? 'per guest · car & driver for your group' : 'per guest'}
              </span>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onShowDates();
              }}
              className="min-h-[44px] rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:bg-black"
            >
              Show dates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
