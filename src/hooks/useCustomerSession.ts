'use client';

import { useEffect, useState } from 'react';

export interface CustomerSessionUser {
  accountId: string;
  customerId: string;
  name: string;
  email: string;
  tenantId: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}

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

  return { user, loading };
}
