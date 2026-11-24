'use client';

import { Star, Clock, Users, CheckCircle, RefreshCw, Heart, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';
import { PriceApprox } from '@/components/currency/PriceApprox';
import { useWishlist, toWishlistDraft } from '@/store/wishlistStore';
import { useState } from 'react';
import { QuickDateCheck } from '@/components/features/QuickDateCheck';

export interface VentureCardProps {
  venture: VentureItem;
  onSelect?: (ventureId: string) => void;
  href?: string;
  className?: string;
  variant?: 'vertical' | 'horizontal';
  /** Show a "Cek tanggal" action with an availability preview modal. */
  showDateCheck?: boolean;
}

export function VentureCard({
  venture,
  onSelect,
  href,
  className,
  variant = 'vertical',
  showDateCheck = false,
}: VentureCardProps) {
  const wishlisted = useWishlist((state) => state.items.some((item) => item.id === venture.id));
  const toggleWishlist = useWishlist((state) => state.toggle);
  const [imageError, setImageError] = useState(false);

  // Compare promo price vs LIST price (not sale price which already includes promo)
  const hasPromo = venture.promoPriceIdr !== null && venture.promoPriceIdr < venture.listPriceIdr;
  const originalPrice = hasPromo ? venture.listPriceIdr : venture.priceIdr;
  // TypeScript narrowing: when hasPromo is true, promoPriceIdr is number (not null)
  const salePrice: number = hasPromo ? (venture.promoPriceIdr as number) : venture.priceIdr;

  const handleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist(toWishlistDraft(venture));
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(venture.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(venture.id);
    }
  };

  // 2-line Price Block component (used by vertical variant)
  const PriceBlock = () => (
    <div className="min-h-[36px] flex flex-col justify-end">
      {/* Line 1: From + original price (if promo) */}
      <div className="text-xs leading-4 min-h-[16px] flex items-center gap-1.5">
        <span className="text-muted-foreground">From</span>
        {hasPromo && (
          <span className="tabular-nums text-red-500 line-through dark:text-red-400 font-medium">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
      {/* Line 2: Sale price + / guest */}
      <div className="text-sm leading-5 min-h-[20px] flex items-baseline gap-1 mt-0.5">
        <span className="font-bold text-foreground dark:text-white tabular-nums">
          {formatPrice(salePrice)}
        </span>
        <span className="text-xs text-muted-foreground font-normal">/ guest</span>
      </div>
    </div>
  );

  // Horizontal variant content (for mobile list view in Section 3) - Airbnb-style split card
  const horizontalCardBody = (
    <>
      {/* Row 1 — title */}
      <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug text-foreground">
        {venture.title}
      </h3>

      {/* Row 2 — category & duration */}
      <p className="mt-0.5 text-xs text-muted-foreground dark:text-neutral-400">
        {venture.category} · {venture.durationHours} hours
      </p>

      {/* Row 3 — rating & reviews */}
      <p className="mt-1 flex items-center gap-1 text-xs text-foreground/90 dark:text-neutral-200">
        <Star className="h-3 w-3 fill-brand text-brand-ink dark:text-brand" aria-hidden="true" />
        <span className="font-semibold">{venture.rating.toFixed(1)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {venture.reviewCount > 0
            ? `${venture.reviewCount} reviews`
            : '★ New'}
        </span>
      </p>

      {/* Row 4 — price (compact 1-line: From + strikethrough + sale price + /guest) */}
      <div className="mt-1 flex items-baseline gap-1 text-xs leading-4 min-h-[16px] flex-wrap">
        <span className="text-muted-foreground">From</span>
        {hasPromo && (
          <span className="tabular-nums text-red-500 line-through dark:text-red-400 font-medium">
            {formatPrice(originalPrice)}
          </span>
        )}
        <span className="font-bold text-foreground dark:text-white tabular-nums">
          {formatPrice(salePrice)}
        </span>
        <span className="text-muted-foreground font-normal">/ guest</span>
      </div>

      {/* Row 5 — value pill (optional) */}
      <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle className="h-3 w-3" aria-hidden="true" />
        Instant Confirmation
      </span>
    </>
  );

  const horizontalContent = (
    <>
      {/* Left: Image - fixed size 1:1 aspect ratio */}
      <div className="relative w-[124px] h-[124px] sm:w-[140px] sm:h-[140px] shrink-0 rounded-2xl overflow-hidden">
        <div className="overflow-hidden rounded-2xl bg-gray-200">
          <div className="relative aspect-square w-full h-full">
            <Image
              src={venture.imageUrl}
              alt={venture.title}
              fill
              sizes="124px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
            {!imageError && !venture.isAvailable ? (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-red-600 shadow-sm backdrop-blur">
                Sold Out
              </span>
            ) : !imageError && venture.badge ? (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-neutral-800 shadow-sm backdrop-blur">
                {friendlyBadge(venture.badge)}
              </span>
            ) : imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
                <ImageIcon className="h-8 w-8 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              </div>
            ) : null}
          </div>
        </div>
        {/* Wishlist button - top right of image */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${venture.title} from wishlists` : `Save ${venture.title} to wishlists`}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-black/20 text-white backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Heart
            className={cn('h-3.5 w-3.5', wishlisted ? 'fill-red-400 text-red-400' : 'text-white')}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Right: Content - flex-1 with proper text truncation */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        {horizontalCardBody}
      </div>
    </>
  );

  // Vertical variant content (default)
  const content = (
    <>
      <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
        <Image
          src={venture.imageUrl}
          alt={venture.title}
          fill
          sizes="(max-width: 768px) 44vw, (max-width: 1024px) 30vw, (max-width: 1536px) 20vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setImageError(true)}
        />
        {!imageError && !venture.isAvailable ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-600 shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
            Sold Out
          </span>
        ) : !imageError && venture.badge ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-800 shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
            {friendlyBadge(venture.badge)}
          </span>
        ) : imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
            <ImageIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? `Remove ${venture.title} from wishlists` : `Save ${venture.title} to wishlists`}
          aria-pressed={wishlisted}
          className="absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:right-3 sm:top-3"
        >
          <Heart
            className={cn('h-4.5 w-4.5', wishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-700')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Line 1 — title (theme-aware so it stays visible on dark mode) */}
        <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-neutral-900 dark:text-white">
          {venture.title}
        </h3>

        {/* Line 2 — category & duration */}
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">
            {venture.category} · {venture.durationHours}h
          </span>
        </div>

        <div className="mt-2 hidden items-center gap-3 text-xs text-gray-600 sm:flex">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            up to {venture.maxParticipants}
          </span>
          {venture.bookedThisMonth ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 font-medium text-neutral-800">
              <Users className="h-3 w-3" aria-hidden="true" />
              {venture.bookedThisMonth} booked this month
            </span>
          ) : null}
        </div>

        {/* Line 3 — Price Block (2-line fixed) + Rating */}
        <div className="mt-2.5 min-h-[48px] flex flex-col justify-end">
          <div className="flex flex-col min-h-[36px] justify-end">
            <PriceBlock />
          </div>
          <div className="ml-auto flex items-center gap-1 mt-2">
            <Star className="h-3.5 w-3.5 fill-brand text-brand-ink dark:text-brand" aria-hidden="true" />
            {venture.reviewCount > 0 ? (
              <>
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{venture.rating.toFixed(1)}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">({venture.reviewCount})</span>
              </>
            ) : (
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">New</span>
            )}
          </div>
        </div>
        <PriceApprox amountIdr={venture.priceIdr} suffix=" / person" className="mt-0.5 block" />

        {/* Line 4 — operational reassurance tags */}
        <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Users className="h-3 w-3" aria-hidden="true" />
            Beginner Friendly
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            Instant Confirmation
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Free reschedule ≥24h
          </span>
        </div>
      </div>
    </>
  );

  const cardContent = variant === 'horizontal' ? horizontalContent : content;
  const quickDateVariantId = venture.variants?.[0]?.id;
  const dateCheck =
    showDateCheck && quickDateVariantId ? (
      <QuickDateCheck
        variantId={quickDateVariantId}
        ventureHref={href ?? `/experiences/${venture.id}/${venture.slug}`}
        label={venture.title}
      />
    ) : null;
  const cardClassName = cn(
    'relative',
    variant === 'horizontal'
      ? 'flex gap-3.5 h-full items-stretch rounded-2xl bg-white p-2 shadow-sm ring-1 ring-neutral-100 transition-shadow hover:shadow-md dark:bg-neutral-900 dark:ring-white/10'
      : 'group overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full flex flex-col',
    className
  );

  if (href) {
    // Stretched-link pattern: a single absolutely-positioned link covers the
    // card, while the wishlist button (z-20) stays above it and remains
    // interactive. This avoids nesting <a>/<button> inside <a>, which is
    // invalid HTML and causes React hydration mismatches.
    return (
      <div className="relative h-full">
        <article
          className={cardClassName}
          aria-label={`View details for ${venture.title}`}
          data-testid={`venture-card-${venture.id}`}
        >
          <a
            href={href}
            aria-label={`View details for ${venture.title}`}
            className="absolute inset-0 z-10"
          />
          {cardContent}
        </article>
        {dateCheck}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <article
        className={cn(cardClassName, onSelect && 'cursor-pointer')}
        onClick={onSelect ? handleClick : undefined}
        onKeyDown={onSelect ? handleKeyDown : undefined}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        aria-label={`View details for ${venture.title}`}
        data-testid={`venture-card-${venture.id}`}
      >
        {cardContent}
      </article>
      {dateCheck}
    </div>
  );
}

/**
 * Map overly aggressive badge wording to a warmer, broadly appealing label.
 * The catalogue still teaches the exact same product — just framed for
 * every traveller, not only the extreme-sports crowd.
 */
export function friendlyBadge(badge: string): string {
  const value = badge.trim();
  if (/adrenaline/i.test(value)) return 'Best Seller';
  if (/extreme/i.test(value)) return 'Guided Adventure';
  return value;
}