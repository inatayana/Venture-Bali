/**
 * BaliWild — Magic Link Request Page
 *
 * Enter email to receive a magic link for authentication.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useMagicLink } from '@/hooks/useAuth';
import { BrandWordmark } from '@/components/layout/BrandWordmark';

export const metadata = {
  title: 'Sign in with Magic Link | BaliWild',
  description: 'Enter your email to receive a secure sign-in link.',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MagicLinkPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { requestMagicLink } = useMagicLink();

  const validateEmail = (value: string): string | null => {
    if (!value) return 'Email is required';
    if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await requestMagicLink(email);
      setStatus('success');
      setMessage(
        `Magic link sent to ${email}. Check your inbox (and spam folder). Link expires in 30 minutes.`
      );
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to send magic link. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6" aria-label="BaliWild Home">
            <BrandWordmark className="mx-auto h-10 w-10 text-brand-ink" />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">
            Sign in to BaliWild
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Enter your email and we&apos;ll send you a secure sign-in link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-neutral-200 p-8 dark:bg-neutral-900 dark:ring-white/10">
          {status === 'success' ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Check your inbox
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">{message}</p>
              <Link
                href="/"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900"
              >
                Continue to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[52px] pl-11 pr-4 rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                    disabled={status === 'loading'}
                    required
                    autoFocus
                  />
                </div>
                {status === 'error' && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" aria-hidden="true" />
                    Send Magic Link
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
            No account?{' '}
            <Link href="/auth/magic-link" className="font-medium text-brand-ink hover:underline dark:text-brand">
              Same thing — we&apos;ll create one for you
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-brand-ink">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-brand-ink">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}