'use client';

import { useEffect, useState } from 'react';

export interface CustomerSessionUser {
  name: string;
  email: string;
}

const CUSTOMER_SESSION_COOKIE = 'baliwild-customer';

/**
 * Placeholder-ready customer session probe.
 *
 * BaliWild customers authenticate via magic links (URL tokens), not an
 * account session, so today every visitor is a guest and this returns
 * `{ user: null }`. When customer auth ships, the middleware/route handler
 * sets the `baliwild-customer` cookie and this hook picks it up — no
 * component changes required.
 *
 * NOTE: never fall back to the admin session here — admin identity must
 * never leak into the public header.
 */
export function useCustomerSession(): { user: CustomerSessionUser | null } {
  const [user, setUser] = useState<CustomerSessionUser | null>(null);

  useEffect(() => {
    const match = document.cookie.split('; ').find((row) => row.startsWith(`${CUSTOMER_SESSION_COOKIE}=`));
    if (!match) return;
    try {
      const payload = decodeURIComponent(match.split('=')[1] ?? '');
      const parsed = JSON.parse(atob(payload)) as Partial<CustomerSessionUser>;
      if (parsed.email) {
        setUser({ name: parsed.name ?? parsed.email, email: parsed.email });
      }
    } catch {
      // Malformed cookie — treat as guest.
    }
  }, []);

  return { user };
}
