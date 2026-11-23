'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Homepage email capture (newsletter / lead magnet). Posts to
 * /api/subscribe and shows a local success/error state — the address is
 * saved server-side even when the welcome email is not configured.
 */
export function EmailCaptureSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? 'Something went wrong. Please try again.');
      }

      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-10 md:py-14" aria-labelledby="home-capture-heading">
      <div className="mx-auto max-w-[1440px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-10 dark:border-white/10 dark:bg-neutral-950">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Newsletter</p>
        <h2
          id="home-capture-heading"
          className="mt-2 font-heading text-2xl font-bold text-neutral-900 md:text-3xl dark:text-white"
        >
          {status === 'success' ? 'You are on the list' : 'Stay in the loop'}
        </h2>

        {status === 'success' ? (
          <p
            aria-live="polite"
            className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            Thanks for subscribing. Watch your inbox for a welcome note from the BaliWild team.
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              Occasional notes on new adventures, seasonal openings and practical travel intel for
              Bali. No spam — unsubscribe anytime.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={status === 'submitting'}
                aria-invalid={status === 'error'}
                className="h-12 flex-1 rounded-xl border-neutral-200 text-sm dark:border-white/10"
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={status === 'submitting'}
                className="h-12 rounded-xl px-6"
              >
                Join the list
              </Button>
            </form>

            <p
              aria-live="polite"
              className={cn('mt-3 text-sm', status === 'error' ? 'text-red-600' : 'text-neutral-500')}
            >
              {message ?? 'We only use your email for the newsletter. Unsubscribe anytime.'}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
