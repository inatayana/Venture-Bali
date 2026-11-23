'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Heart, Trash2, Star } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { formatPrice } from '@/lib/i18n';
import { AppShellHeader } from '@/components/layout/AppShellHeader';

/**
 * Wishlist page — the guest's saved adventures (persisted in localStorage,
 * no account required). Each item is a compact split row: one cover image on
 * the left, concise details and actions on the right.
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
    <main className="min-h-screen bg-neutral-50 pb-24">
      <AppShellHeader title="Wishlists" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Wishlists</h1>
        {!mounted ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden="true">
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
          <ul className="mt-6 space-y-4">
            {saved.map((item) => (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10 sm:flex-row"
              >
                <Link
                  href={`/experiences/${item.id}/${item.slug}`}
                  className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-56 lg:w-72"
                  aria-label={`View ${item.title}`}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 288px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {item.category}
                  </p>
                  <Link
                    href={`/experiences/${item.id}/${item.slug}`}
                    className="mt-0.5 line-clamp-2 font-heading text-lg font-bold text-neutral-900 hover:underline dark:text-white"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                    <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {item.rating.toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.duration}</span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-white/10">
                    <div>
                      <span className="text-xs font-medium text-neutral-500">From </span>
                      <span className="font-heading text-lg font-bold tabular-nums text-brand-ink dark:text-white">
                        {formatPrice(item.priceFromIdr)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.title} from wishlists`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <Link
                        href={`/experiences/${item.id}/${item.slug}`}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-900"
                      >
                        View adventure
                      </Link>
                    </div>
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
