'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWishlist, type WishlistItem } from '@/store/wishlistStore';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';
import { DesktopBreadcrumb } from '@/components/layout/DesktopBreadcrumb';
import { WishlistList } from '@/components/ui/WishlistList';
import { Toast } from '@/components/ui/Toast';

/**
 * Wishlist page — the guest's saved adventures (persisted in localStorage,
 * no account required). Cards are horizontal splits: image on the left,
 * product details on the right. The heart toggles the item in the wishlist;
 * removing shows a toast with an Undo action.
 */
export default function WishlistsPage() {
  const items = useWishlist((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const [removedItem, setRemovedItem] = useState<WishlistItem | null>(null);
  const toggleWishlist = useWishlist((state) => state.toggle);

  // localStorage hydration happens client-side only; render the empty shell
  // on the server and after hydration to avoid a mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUndo = () => {
    if (removedItem) {
      toggleWishlist(removedItem);
    }
    setRemovedItem(null);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pb-24 md:pb-12">
      <GlobalDesktopHeader />
      <DesktopBreadcrumb label="Wishlists" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Wishlists</h1>
        {!mounted ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            ))}
          </div>
        ) : items.length === 0 ? (
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
          <WishlistList onRemoved={setRemovedItem} />
        )}
      </div>
      <Toast
        open={removedItem !== null}
        message="Item dihapus dari wishlist"
        actionLabel="Undo"
        onAction={handleUndo}
        onClose={() => setRemovedItem(null)}
      />
    </main>
  );
}
