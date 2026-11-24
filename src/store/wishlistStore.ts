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
}

export type WishlistDraft = Omit<WishlistItem, 'savedAt'>;

interface WishlistState {
  items: WishlistItem[];
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
      toggle: (draft) => {
        const exists = get().items.some((item) => item.id === draft.id);
        if (exists) {
          set((state) => ({ items: state.items.filter((item) => item.id !== draft.id) }));
          return false;
        }
        set((state) => ({
          items: [{ ...draft, savedAt: Date.now() }, ...state.items],
        }));
        return true;
      },
      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
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
  };
}
