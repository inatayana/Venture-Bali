import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Wishlist store — the guest's saved adventures.
 *
 * Persists to localStorage so the /wishlists page and the heart buttons on
 * cards and the PDP share one source of truth without an account. Only a
 * minimal summary is stored; the catalogue itself stays in the database.
 */
export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  category: string;
  duration: string;
  rating: number;
  priceFromIdr: number;
  /** Unix ms when the guest saved the item (newest first in the UI). */
  savedAt: number;
  /** Optional pill badge text shown on the card (e.g. "Trending"). */
  badge?: string;
  /** Number of verified reviews, when the catalogue provides it. */
  reviewCount?: number;
}

export type WishlistDraft = Omit<WishlistItem, 'savedAt'>;

interface WishlistState {
  items: WishlistItem[];
  /** True after a signed-in session has merged local items into the database. */
  remoteEnabled: boolean;
  remoteStatus: 'idle' | 'syncing' | 'ready';
  setRemoteEnabled: (enabled: boolean) => void;
  setRemoteStatus: (status: 'idle' | 'syncing' | 'ready') => void;
  /** Replace local items with the server list (DB is the source of truth when signed in). */
  setRemoteItems: (items: WishlistItem[]) => void;
  /** Adds or removes an item. Returns `true` when the item is now saved. */
  toggle: (draft: WishlistDraft) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      remoteEnabled: false,
      remoteStatus: 'idle',
      setRemoteEnabled: (enabled) => set({ remoteEnabled: enabled }),
      setRemoteStatus: (status) => set({ remoteStatus: status }),
      setRemoteItems: (items) => set({ items }),
      toggle: (draft) => {
        const exists = get().items.some((item) => item.id === draft.id);
        if (exists) {
          set((state) => ({ items: state.items.filter((item) => item.id !== draft.id) }));
        } else {
          set((state) => ({
            items: [{ ...draft, savedAt: Date.now() }, ...state.items],
          }));
        }

        // Signed-in customers keep the database in sync with the optimistic UI.
        if (get().remoteEnabled) {
          void fetch('/api/account/wishlist/toggle', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ventureId: draft.id, save: !exists }),
          }).catch(() => {
            console.error('Wishlist server sync failed');
          });
        }

        return !exists;
      },
      remove: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
        if (get().remoteEnabled) {
          void fetch('/api/account/wishlist/toggle', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ventureId: id, save: false }),
          }).catch(() => {
            console.error('Wishlist server sync failed');
          });
        }
      },
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((item) => item.id === id),
    }),
    {
      name: 'baliwild-wishlist',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

/** Build the persisted summary from a catalogue item. */
export function toWishlistDraft(venture: {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  category: string;
  duration: string;
  rating: number;
  priceIdr: number;
  badge?: string;
  reviewCount?: number;
}): WishlistDraft {
  return {
    id: venture.id,
    slug: venture.slug,
    title: venture.title,
    imageUrl: venture.imageUrl,
    category: venture.category,
    duration: venture.duration,
    rating: venture.rating,
    priceFromIdr: venture.priceIdr,
    badge: venture.badge,
    reviewCount: venture.reviewCount,
  };
}
