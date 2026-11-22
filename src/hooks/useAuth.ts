/**
 * BaliWild — Client-side Authentication Hook
 *
 * Provides reactive auth state for components.
 * Uses SWR for caching and revalidation.
 */

'use client';

import useSWR from 'swr';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export type User = {
  id: string;
  email: string;
  name: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  });

export function useAuth(options: { required?: boolean; redirectTo?: string } = {}) {
  const { required = false, redirectTo = '/auth/magic-link' } = options;
  const router = useRouter();
  const pathname = usePathname();

  const { data, error, isLoading, mutate } = useSWR<{ authenticated: boolean; user: User }>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000, // 30 seconds
      onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 2) return;
        setTimeout(() => revalidate({ rollbackOnError: true }), 1000 * retryCount);
      },
    }
  );

  const user = data?.user ?? null;
  const loading = isLoading && !data;
  const authenticated = data?.authenticated === true;

  // Redirect if auth required but not authenticated
  useEffect(() => {
    if (required && !loading && !authenticated) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [required, loading, authenticated, redirectTo, pathname, router]);

  const login = useCallback(
    async (email: string, redirectTo?: string) => {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: redirectTo ?? pathname }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send magic link');
      return data;
    },
    [pathname]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    mutate({ authenticated: false, user: null }, false); // optimistic update
    router.push('/');
    router.refresh();
  }, [mutate, router]);

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    user,
    loading,
    authenticated,
    error,
    login,
    logout,
    refresh,
    mutate,
  } as AuthState & {
    login: (email: string, redirectTo?: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
  };
}

/**
 * Hook for magic link request (without requiring auth).
 */
export function useMagicLink() {
  const requestMagicLink = useCallback(
    async (email: string, redirectTo?: string) => {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send magic link');
      return data;
    },
    []
  );

  return { requestMagicLink };
}