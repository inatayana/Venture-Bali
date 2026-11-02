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
        className="relative flex max-h-[93vh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:max-h-[88vh] sm:max-w-5xl sm:animate-fade-in sm:rounded-3xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-foreground-secondary shadow-md backdrop-blur transition-colors hover:bg-surface hover:text-foreground sm:right-4 sm:top-4"
          aria-label="Close package details"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:overflow-hidden">
          {/* Left — package photo */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-inset sm:aspect-[2/1] lg:aspect-auto lg:h-full lg:min-h-[480px]">
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
              <div className="flex h-full w-full items-center justify-center text-foreground-muted/50">
                <ImageIcon className="h-12 w-12" aria-hidden="true" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-neutral-950/5 to-neutral-950/15" />

            {variant.badge && (
              <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-ink shadow-sm">
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Package details
              </p>
              <h2
                id="variant-detail-title"
                className="mt-1 font-heading text-2xl font-bold leading-tight text-foreground"
              >
                {variant.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {variant.shortDescription}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-base/70 p-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {promoPriceIdr !== null && (
                  <span className="text-sm tabular-nums text-foreground-secondary line-through">
                    {formatPrice(listPriceIdr)}
                  </span>
                )}
                <span className="font-heading text-2xl font-bold tabular-nums text-foreground">
                  {formatPrice(priceIdr)}
                </span>
                <span className="text-xs text-foreground-muted">/ guest</span>
                {discountPercent !== null && (
                  <span className="ml-auto rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-success">
                    {discountPercent}% off
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-foreground-secondary">
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
                <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-secondary">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
                  <span className="font-medium text-foreground">{pickup.label}</span>
                  <span aria-hidden="true">·</span>
                  {pickup.detail}
                </p>
              )}

              {showCoupon ? (
                <p className="mt-2.5 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-line">
                  <Sparkles className="h-3.5 w-3.5 text-success" />
                  Get {promo.percent}% OFF with code
                  <span className="font-mono font-bold tracking-wide">{promo.code}</span>
                </p>
              ) : (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-green-200">
                  <Tag className="h-3.5 w-3.5" />
                  Promo price applied — no code needed
                </p>
              )}
            </div>

            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {inclusions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                      What&apos;s included
                    </h3>
                    <ul className="space-y-1.5 text-sm text-foreground-secondary">
                      {inclusions.map((item) => (
                        <li key={item} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exclusions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                      Not included
                    </h3>
                    <ul className="space-y-1.5 text-sm text-foreground-muted">
                      {exclusions.map((item) => (
                        <li key={item} className="flex items-start gap-1.5">
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {variant.operationNotes && (
              <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {variant.operationNotes}
              </p>
            )}
          </div>
        </div>

        {/* Pinned action bar */}
        <div className="shrink-0 border-t border-line bg-surface px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-foreground-muted">
                {isSelected ? 'Selected package' : 'From'}
              </p>
              <p className="font-heading text-lg font-bold tabular-nums text-foreground">
                {formatPrice(priceIdr)}
                <span className="text-xs font-normal text-foreground-muted"> /guest</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onShowDates}
              className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand transition-colors hover:bg-neutral-900"
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
