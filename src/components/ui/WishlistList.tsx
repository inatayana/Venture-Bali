'use client';

import type { WishlistItem } from '@/store/wishlistStore';
import { useWishlist } from '@/store/wishlistStore';
import { WishlistCard } from './WishlistCard';

export interface WishlistListProps {
  /** Called when an item is toggled off the wishlist. */
  onRemoved?: (item: WishlistItem) => void;
}

/**
 * WishlistList — the wishlist page grid: cards sorted newest first,
 * one row of horizontal cards per column (single column on mobile,
 * two columns on desktop).
 */
export function WishlistList({ onRemoved }: WishlistListProps) {
  const items = useWishlist((state) => state.items);
  const saved = [...items].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {saved.map((item) => (
        <WishlistCard key={item.id} item={item} onRemoved={onRemoved} />
      ))}
    </ul>
  );
}
