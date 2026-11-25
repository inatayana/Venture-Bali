'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';

type Mode = 'signin' | 'signup';
type Step = 'details' | 'code';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-white/15 dark:bg-neutral-900 dark:text-white';

/** Never allow an open redirect through ?next=. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/profile';
  return raw;
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? 'Something went wrong. Please try again.';
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [countryCode, setCountryCode] = useState('ID');
  const [code, setCode] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function sendCode(event?: FormEvent): Promise<void> {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const url = mode === 'signup' ? '/api/account/signup' : '/api/account/otp/request';
    const payload =
      mode === 'signup'
        ? { name, email, whatsapp, countryCode }
        : { email };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      setStep('code');
      setNotice(`If that email can be used, we sent a 6-digit code to ${email}.`);
    } catch {
      setError('Could not send the code. Please check your connection.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/account/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError('Could not verify the code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPassword(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/account/password/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode: Mode): void {
    setMode(nextMode);
    setStep('details');
    setCode('');
    setUsePassword(false);
    setError(null);
    setNotice(null);
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
      </span>

      <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
        {step === 'code' ? 'Enter your code' : mode === 'signup' ? 'Create your account' : 'Sign in to BaliWild'}
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {step === 'code'
          ? 'We emailed you a 6-digit code. It expires in 10 minutes and can be used once.'
          : 'No password needed. We email you a one-time code to keep your account safe.'}
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {notice && <p className="mt-4 text-sm text-green-700 dark:text-green-400">{notice}</p>}

      {step === 'details' ? (
        <form onSubmit={usePassword && mode === 'signin' ? signInWithPassword : sendCode} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Full name</label>
                <input id="name" required minLength={2} className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div>
                  <label htmlFor="countryCode" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Code</label>
                  <input id="countryCode" required className={inputClass} value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} maxLength={2} />
                </div>
                <div>
                  <label htmlFor="whatsapp" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">WhatsApp</label>
                  <input id="whatsapp" required className={inputClass} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} inputMode="tel" autoComplete="tel" />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Email address</label>
            <input id="email" required type="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </div>

          {usePassword && mode === 'signin' ? (
            <>
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Password</label>
                <input
                  id="password"
                  required
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" size="lg" fullWidth isLoading={busy}>
                Sign in with password
              </Button>
              <button
                type="button"
                onClick={() => { setUsePassword(false); setError(null); }}
                className="w-full text-center text-sm font-semibold text-brand-ink hover:underline dark:text-brand"
              >
                Use a one-time code instead
              </button>
            </>
          ) : (
            <>
              <Button type="submit" size="lg" fullWidth isLoading={busy}>
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                {mode === 'signup' ? 'Send activation code' : 'Send sign-in code'}
              </Button>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { setUsePassword(true); setError(null); }}
                  className="w-full text-center text-sm font-semibold text-brand-ink hover:underline dark:text-brand"
                >
                  Use a password instead
                </button>
              )}
            </>
          )}
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6 space-y-4">
          <div>
            <label htmlFor="code" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">6-digit code</label>
            <input
              id="code"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
            />
          </div>

          <Button type="submit" size="lg" fullWidth isLoading={busy}>
            Verify and continue
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => void sendCode()} disabled={busy} className="font-semibold text-brand-ink hover:underline disabled:opacity-50">
              Resend code
            </button>
            <button type="button" onClick={() => setStep('details')} className="inline-flex items-center gap-1 text-neutral-600 hover:underline dark:text-neutral-400">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Change details
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 border-t border-neutral-200 pt-5 text-center text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-400">
        {mode === 'signin' ? (
          <>
            No account yet?{' '}
            <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-brand-ink hover:underline dark:text-brand">
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-brand-ink hover:underline dark:text-brand">
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="mt-3 text-center text-xs text-neutral-500">
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline">Terms</Link> and{' '}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}
