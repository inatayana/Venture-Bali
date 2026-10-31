'use client';

import Image from 'next/image';
import { CalendarDays, Check, Clock, ImageIcon, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';
import { getVariantPickupDisplay, getVariantPriceDisplay } from '@/lib/variantDisplay';
import type { Variant } from '@/types/venture';
import { cn } from '@/utils/cn';

interface VariantCatalogCardProps {
  variant: Variant;
  selected: boolean;
  onSelect: () => void;
  onShowDates: () => void;
  /** Opens the Tier 2 detail modal. Falls back to `onSelect` when omitted. */
  onOpenDetails?: () => void;
  /** Photo shown when the package has no image of its own (usually the product hero). */
  fallbackImageUrl?: string;
}

/**
 * Tier 1 of the package selector: a compact, photo-led card.
 *
 * The whole card is clickable and opens the detail modal (Tier 2); the two
 * inline actions keep their original behaviour (select / open the booking
 * sheet). Title and price stay visible for scanning without opening anything.
 */
export function VariantCatalogCard({
  variant,
  selected,
  onSelect,
  onShowDates,
  onOpenDetails,
  fallbackImageUrl,
}: VariantCatalogCardProps) {
  const { listPriceIdr, promoPriceIdr, priceIdr } = getVariantPriceDisplay(variant);
  const pickup = getVariantPickupDisplay(variant);
  const inclusions = variant.inclusions ?? [];
  const addonCount = variant.addons?.length ?? 0;
  const openDetails = onOpenDetails ?? onSelect;
  const imageUrl = variant.imageUrl ?? fallbackImageUrl;

  return (
    <article
      onClick={openDetails}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border bg-white transition-all duration-300',
        'shadow-[0_1px_2px_rgba(17,24,39,0.06)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(17,24,39,0.45)]',
        selected
          ? 'border-neutral-900 ring-1 ring-neutral-900/10'
          : 'border-neutral-200 hover:border-neutral-300'
      )}
    >
      <div className="flex gap-3.5 p-3.5 sm:gap-4 sm:p-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-[120px] sm:w-[120px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={variant.title}
              fill
              sizes="120px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
            </span>
          )}

          {promoPriceIdr !== null && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700 shadow-sm">
              Promo
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            {variant.badge && (
              <span className="mb-1 inline-block rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {variant.badge}
              </span>
            )}
            <h3 className="font-heading text-[15px] font-bold leading-snug text-neutral-900 sm:text-base">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openDetails();
                }}
                className="rounded text-left decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-2 group-hover:underline"
              >
                {variant.title}
              </button>
            </h3>
          </div>

          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-600 sm:text-sm">
            {variant.shortDescription}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-700">
              <Clock className="h-3.5 w-3.5" />
              {variant.duration ?? '—'}
            </span>
            {variant.transportBadge && (
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-medium text-neutral-600 ring-1 ring-neutral-200">
                {variant.transportBadge}
              </span>
            )}
            {inclusions.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                <Check className="h-3.5 w-3.5" />
                {inclusions.length} included
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2.5 border-t border-neutral-100 bg-neutral-50/50 px-3.5 py-3 sm:px-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xs font-medium text-neutral-500">From</span>
            {promoPriceIdr !== null && (
              <span className="text-xs tabular-nums text-neutral-400 line-through">
                {formatPrice(listPriceIdr)}
              </span>
            )}
            <span className="font-heading text-lg font-bold tabular-nums text-neutral-900">
              {formatPrice(priceIdr)}
            </span>
            <span className="text-xs text-neutral-500">/ guest</span>
          </div>
          <p className="text-xs text-neutral-500">
            {variant.minimumSpendIdr ? (
              <>Minimum {formatPrice(variant.minimumSpendIdr)} to book</>
            ) : addonCount > 0 ? (
              <>
                {addonCount} add-on{addonCount > 1 ? 's' : ''} available
              </>
            ) : !pickup ? (
              'No minimum spend'
            ) : null}
          </p>
          {pickup && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-neutral-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="font-medium text-neutral-700">{pickup.label}</span>
              <span aria-hidden="true">·</span>
              {pickup.detail}
            </p>
          )}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className={cn(
              'inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors sm:flex-none',
              selected
                ? 'border-2 border-green-600 bg-green-50 text-green-800'
                : 'border-2 border-neutral-200 text-neutral-800 hover:border-neutral-400 hover:bg-white'
            )}
          >
            {selected && <Check className="h-4 w-4" />}
            {selected ? 'Selected' : 'Select'}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onShowDates();
            }}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 sm:flex-none"
          >
            <CalendarDays className="h-4 w-4" />
            Show dates
          </button>
        </div>
      </div>
    </article>
  );
}
