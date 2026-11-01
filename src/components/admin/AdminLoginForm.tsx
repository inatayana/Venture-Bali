'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload?.error?.message ?? 'Sign-in failed');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Sign-in failed. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
          placeholder="operator@baliwild.com"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-ink"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2.5 rounded-lg bg-brand-ink text-brand font-heading font-semibold uppercase tracking-wider text-sm hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
