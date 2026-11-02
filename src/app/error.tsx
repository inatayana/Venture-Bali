'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { Button } from '@/components/ui';
import { BRAND_EMAIL_SUPPORT } from '@/lib/brand';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary.
 *
 * The raw error message is only shown in development. In production the guest
 * sees a calm recovery path, while the digest is logged for the operator.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // The digest is safe to log. Never log customer data or stack traces here.
    console.error('Unhandled application error', { digest: error.digest });
  }, [error.digest]);

  const detail =
    process.env.NODE_ENV === 'development' && error.message ? error.message : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <Link href="/" aria-label="BaliWild home" className="inline-flex">
          <BrandWordmark className="text-2xl text-brand-ink" />
        </Link>

        <div className="mt-8 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </span>
        </div>

        <h1 className="mt-4 font-heading text-3xl font-bold uppercase tracking-wide text-gray-900">
          Something went off the trail
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          This page could not load. Your booking data is safe. Try again, or contact support if it
          keeps happening.
        </p>

        {detail && (
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-left text-xs text-gray-500 ring-1 ring-gray-200">
            {detail}
          </p>
        )}

        {error.digest && (
          <p className="mt-3 text-xs text-gray-500">
            Reference: <span className="font-mono text-gray-700">{error.digest}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={reset} size="lg" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 px-6 text-sm font-semibold uppercase tracking-wider text-neutral-900 transition-colors hover:bg-brand sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <a
          href={`mailto:${BRAND_EMAIL_SUPPORT}`}
          className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {BRAND_EMAIL_SUPPORT}
        </a>
      </div>
    </main>
  );
}
