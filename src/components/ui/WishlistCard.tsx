'use client';

import { Star, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/i18n';
import { cn } from '@/utils/cn';
import { useWishlist, type WishlistItem } from '@/store/wishlistStore';
import { friendlyBadge } from './VentureCard';

export interface WishlistCardProps {
  /** The saved adventure. */
  item: WishlistItem;
  /** Called when the heart toggles the item off the wishlist. */
  onRemoved?: (item: WishlistItem) => void;
}

/**
 * WishlistCard — horizontal two-panel card: the main image on the left,
 * product details on the right. The heart on the image toggles the item in
 * the wishlist.
 */
export function WishlistCard({ item, onRemoved }: WishlistCardProps) {
  const wishlisted = useWishlist((state) => state.has(item.id));
  const toggle = useWishlist((state) => state.toggle);

  const detailHref = `/experiences/${item.id}/${item.slug}`;
  const badge = item.badge ? friendlyBadge(item.badge) : null;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!toggle(item) && onRemoved) {
      onRemoved(item);
    }
  };

  return (
    <li className="relative flex w-full items-stretch overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
      {/* Left: main image (thumbnail). The heart button sits on top of it. */}
      <Link
        href={detailHref}
        aria-label={`View ${item.title}`}
        className="group relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl sm:w-32"
      >
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 639px) 7rem, 8rem"
          className="rounded-2xl object-cover transition-duration-300 group-hover:scale-105"
        />
        {badge ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-800 shadow-sm">
            {badge}
          </span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={wishlisted ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
        aria-pressed={wishlisted}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
      >
        <Heart
          className={cn('h-4 w-4 transition-colors', wishlisted ? 'fill-red-400 text-red-400' : 'text-neutral-700')}
          aria-hidden="true"
        />
      </button>

      {/* Right: details */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 sm:p-5">
        <Link href={detailHref} className="line-clamp-2 font-semibold leading-snug text-neutral-900 hover:underline dark:text-white">
          {item.title}
        </Link>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {item.category} · {item.duration}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <Star className="h-3.5 w-3.5 shrink-0 fill-brand text-brand-ink" aria-hidden="true" />
          <span className="font-semibold text-neutral-900 dark:text-white">{item.rating.toFixed(2)}</span>
          {item.reviewCount ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{`${item.reviewCount.toLocaleString('en-US')} ratings`}</span>
            </>
          ) : null}
        </div>
        <div className="mt-auto pt-3">
          <p className="font-semibold text-sm tabular-nums text-brand-ink">
            From {formatPrice(item.priceFromIdr)} / guest
          </p>
        </div>
      </div>
    </li>
  );
}
