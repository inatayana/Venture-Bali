'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { CalendarDays, Check, Clock, ImageIcon, Info, MapPin, Sparkles, Tag, X } from 'lucide-react';
import { formatPrice } from '@/lib/i18n';
import { couponAppliesTo, getVariantPickupDisplay, getVariantPriceDisplay } from '@/lib/variantDisplay';
import type { Variant } from '@/types/venture';

export interface VariantPromo {
  code: string;
  /** Discount percentage of the launch coupon (display only). */
  percent: number;
}

interface VariantDetailModalProps {
  /** null = closed */
  variant: Variant | null;
  isSelected: boolean;
  promo: VariantPromo;
  onClose: () => void;
  onShowDates: () => void;
  /** Photo shown when the package has no image of its own (usually the product hero). */
  fallbackImageUrl?: string;
}

/**
 * Tier 2 of the package selector: a split-pane detail sheet.
 *
 * Desktop shows the package photo on the left and the full description plus
 * the actions on the right. Mobile collapses to a single scrollable column with
 * the action bar pinned to the bottom, so it stays thumb-friendly.
 *
 * Closes with the X, the backdrop or Escape; body scroll is locked and focus is
 * trapped inside the panel while it is open.
 */
export function VariantDetailModal({
  variant,
  isSelected,
  promo,
  onClose,
  onShowDates,
  fallbackImageUrl,
}: VariantDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest callback without re-running the open/close effect.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isOpen = variant !== null;

  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  if (!variant) return null;

  const { listPriceIdr, promoPriceIdr, priceIdr, discountPercent } =
    getVariantPriceDisplay(variant);
  const inclusions = variant.inclusions ?? [];
  const exclusions = variant.exclusions ?? [];
  const addonCount = variant.addons?.length ?? 0;
  const showCoupon = couponAppliesTo(variant);
  const pickup = getVariantPickupDisplay(variant);
  const imageUrl = variant.imageUrl ?? fallbackImageUrl;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-neutral-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-detail-title"
        className="relative flex max-h-[93vh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-5xl sm:animate-fade-in sm:rounded-3xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md backdrop-blur transition-colors hover:bg-white hover:text-neutral-900 sm:right-4 sm:top-4"
          aria-label="Close package details"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:overflow-hidden">
          {/* Left — package photo */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 sm:aspect-[2/1] lg:aspect-auto lg:h-full lg:min-h-[480px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={variant.title}
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-300">
                <ImageIcon className="h-12 w-12" aria-hidden="true" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-neutral-950/5 to-neutral-950/15" />

            {variant.badge && (
              <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-900 shadow-sm">
                {variant.badge}
              </span>
            )}

            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
                <Clock className="h-3.5 w-3.5" />
                {variant.duration ?? 'Flexible duration'}
              </span>
              {variant.transportBadge && (
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
                  {variant.transportBadge}
                </span>
              )}
            </div>
          </div>

          {/* Right — full description and details */}
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:overflow-y-auto">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Package details
              </p>
              <h2
                id="variant-detail-title"
                className="mt-1 font-heading text-2xl font-bold leading-tight text-neutral-900"
              >
                {variant.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {variant.shortDescription}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {promoPriceIdr !== null && (
                  <span className="text-sm tabular-nums text-neutral-400 line-through">
                    {formatPrice(listPriceIdr)}
                  </span>
                )}
                <span className="font-heading text-2xl font-bold tabular-nums text-neutral-900">
                  {formatPrice(priceIdr)}
                </span>
                <span className="text-xs text-neutral-500">/ guest</span>
                {discountPercent !== null && (
                  <span className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-800">
                    {discountPercent}% off
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-neutral-600">
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
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="font-medium text-neutral-800">{pickup.label}</span>
                  <span aria-hidden="true">·</span>
                  {pickup.detail}
                </p>
              )}

              {showCoupon ? (
                <p className="mt-2.5 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-800 ring-1 ring-neutral-200">
                  <Sparkles className="h-3.5 w-3.5 text-green-600" />
                  Get {promo.percent}% OFF with code
                  <span className="font-mono font-bold tracking-wide">{promo.code}</span>
                </p>
              ) : (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-green-800 ring-1 ring-green-200">
                  <Tag className="h-3.5 w-3.5" />
                  Promo price applied — no code needed
                </p>
              )}
            </div>

            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {inclusions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      What&apos;s included
                    </h3>
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                      {inclusions.map((item) => (
                        <li key={item} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exclusions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Not included
                    </h3>
                    <ul className="space-y-1.5 text-sm text-neutral-500">
                      {exclusions.map((item) => (
                        <li key={item} className="flex items-start gap-1.5">
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {variant.operationNotes && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {variant.operationNotes}
              </p>
            )}
          </div>
        </div>

        {/* Pinned action bar */}
        <div className="shrink-0 border-t border-neutral-200 bg-white px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-neutral-500">
                {isSelected ? 'Selected package' : 'From'}
              </p>
              <p className="font-heading text-lg font-bold tabular-nums text-neutral-900">
                {formatPrice(priceIdr)}
                <span className="text-xs font-normal text-neutral-500"> /guest</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onShowDates}
              className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              <CalendarDays className="h-4 w-4" />
              Show dates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
