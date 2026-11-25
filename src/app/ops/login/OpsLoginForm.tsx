'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30';

export function OpsLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/ops/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(payload?.error?.message ?? 'Could not sign in');
        return;
      }
      router.replace('/ops');
      router.refresh();
    } catch {
      setError('Could not sign in. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl bg-neutral-900 p-6 shadow-xl ring-1 ring-white/10 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Field operations</p>
      <h1 className="mt-2 font-heading text-2xl font-bold text-white">Staff sign in</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Manifest and check-in only. Supplier and payment information is never shown here.
      </p>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-950/50 px-4 py-3 text-sm text-red-300">{error}</p>}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="ops-email" className="text-sm font-semibold text-neutral-200">Work email</label>
          <input id="ops-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} autoComplete="username" />
        </div>
        <div>
          <label htmlFor="ops-password" className="text-sm font-semibold text-neutral-200">Password</label>
          <input id="ops-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoComplete="current-password" />
        </div>
        <Button type="submit" size="lg" fullWidth isLoading={busy} className="!bg-emerald-500 !text-neutral-950 hover:!bg-emerald-400">
          Sign in to manifest
        </Button>
      </form>
    </section>
  );
}
