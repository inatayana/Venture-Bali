'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { formatPrice } from '@/lib/i18n';
import { Star } from 'lucide-react';

/**
 * Wishlist page — the guest's saved adventures (persisted in localStorage,
 * no account required). Destination of the heart tab in the App Shell.
 */
export default function WishlistsPage() {
  const items = useWishlist((state) => state.items);
  const remove = useWishlist((state) => state.remove);
  const [mounted, setMounted] = useState(false);

  // localStorage hydration happens client-side only; render the empty shell
  // on the server and after hydration to avoid a mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  const saved = [...items].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-12">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Wishlists</h1>
        {!mounted ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Heart className="h-7 w-7 text-neutral-400" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-heading text-xl font-bold text-neutral-900 dark:text-white">
              No saved adventures yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
              Explore Bali&apos;s best activities and tap the heart to keep them here.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900"
            >
              Explore adventures
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((item) => (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10"
              >
                {/* 4-image preview grid */}
                <Link
                  href={`/experiences/${item.id}/${item.slug}`}
                  className="relative aspect-square w-full overflow-hidden"
                  aria-label={`View ${item.title}`}
                >
                  <div className="grid grid-cols-2 gap-0.5 h-full w-full">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden"
                        style={{ backgroundColor: '#e5e7eb' }}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={`${item.title} preview ${i + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                </Link>

                {/* Metadata */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {item.category}
                      </p>
                      <Link
                        href={`/experiences/${item.id}/${item.slug}`}
                        className="mt-0.5 line-clamp-2 font-heading text-base font-bold text-neutral-900 hover:underline dark:text-white"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                        <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {item.rating.toFixed(1)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.duration}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.title} from wishlists`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-white/10">
                    <div>
                      <span className="text-xs font-medium text-neutral-500">From</span>{' '}
                      <span className="font-heading text-lg font-bold tabular-nums text-brand-ink">
                        {formatPrice(item.priceFromIdr)}
                      </span>
                    </div>
                    <Link
                      href={`/experiences/${item.id}/${item.slug}`}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-900"
                    >
                      Book now
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}