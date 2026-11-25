'use client';

import { useEffect, useState } from 'react';
import { useWishlist, type WishlistItem } from '@/store/wishlistStore';

export interface CustomerSessionUser {
  accountId: string;
  customerId: string;
  name: string;
  email: string;
  tenantId: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
  whatsapp: string;
  countryCode: string;
  hasPassword: boolean;
}

/** One merge attempt per account per page load (StrictMode-safe). */
let syncedAccountId: string | null = null;

/**
 * Customer session probe — reads the server-verified session from
 * `/api/account/me`. The old implementation base64-decoded a client cookie,
 * which was unsigned and contained PII; it must never be used for auth.
 *
 * NOTE: never fall back to the admin session here — admin identity must
 * never leak into the public header.
 */
export function useCustomerSession(): { user: CustomerSessionUser | null; loading: boolean } {
  const [user, setUser] = useState<CustomerSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const accountId = user?.accountId ?? null;

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/account/me', {
      signal: controller.signal,
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { success?: boolean; data?: CustomerSessionUser } | null) => {
        if (!payload?.success || !payload.data) return null;
        return payload.data;
      })
      .then((session) => setUser(session))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  // Phase 3: merge the guest localStorage wishlist into the account only after
  // the server confirms every item was saved. Nothing is deleted prematurely.
  useEffect(() => {
    const store = useWishlist.getState();

    if (!accountId) {
      syncedAccountId = null;
      store.setRemoteEnabled(false);
      store.setRemoteStatus('idle');
      return;
    }

    if (syncedAccountId === accountId) return;
    syncedAccountId = accountId;
    store.setRemoteStatus('syncing');

    const items = store.items.map((item) => ({
      ventureId: item.id,
      savedAt: new Date(item.savedAt).toISOString(),
    }));

    void fetch('/api/account/wishlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { success?: boolean; data?: { items?: unknown[] } } | null) => {
        if (!payload?.success || !Array.isArray(payload.data?.items)) {
          syncedAccountId = null;
          useWishlist.getState().setRemoteStatus('ready');
          return;
        }
        const remote = useWishlist.getState();
        remote.setRemoteItems(payload.data.items as WishlistItem[]);
        remote.setRemoteEnabled(true);
        remote.setRemoteStatus('ready');
      })
      .catch(() => {
        syncedAccountId = null;
        useWishlist.getState().setRemoteStatus('ready');
      });
  }, [accountId]);

  return { user, loading };
}
