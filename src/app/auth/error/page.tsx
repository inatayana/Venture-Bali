/**
 * BaliWild — Auth Error Page
 *
 * Displayed when magic link verification fails.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication Error | BaliWild',
  description: 'There was an issue with your magic link. Please try again.',
};

const ERROR_MESSAGES: Record<string, { title: string; description: string; action: string }> = {
  missing_token: {
    title: 'No Magic Link Provided',
    description: 'The verification link is missing or incomplete.',
    action: 'Request a new magic link',
  },
  invalid_token: {
    title: 'Invalid Magic Link',
    description: 'This magic link is not valid or has been tampered with.',
    action: 'Request a new magic link',
  },
  expired: {
    title: 'Magic Link Expired',
    description: 'Magic links expire after 30 minutes for security.',
    action: 'Request a new magic link',
  },
  'Customer not found': {
    title: 'Account Not Found',
    description: 'No account exists with this email address.',
    action: 'Check your email or sign up',
  },
  'Token mismatch or expired': {
    title: 'Link Already Used or Expired',
    description: 'This magic link has already been used or has expired.',
    action: 'Request a new magic link',
  },
  default: {
    title: 'Authentication Failed',
    description: 'Something went wrong. Please try again.',
    action: 'Try again',
  },
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; redirect?: string }>;
}) {
  const { code = 'default', redirect = '/' } = await searchParams;
  const error = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.default;

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6" aria-label="BaliWild Home">
            <svg
              className="mx-auto h-10 w-10 text-brand-ink"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16 8L22 16L16 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-neutral-200 p-8 dark:bg-neutral-900 dark:ring-white/10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" aria-hidden="true" />
          </div>

          <h1 className="text-center font-heading text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {error.title}
          </h1>

          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-8">
            {error.description}
          </p>

          <div className="space-y-3">
            <Link
              href={`/auth/magic-link?redirect=${encodeURIComponent(redirect)}`}
              className="block w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              {error.action}
            </Link>

            <Link
              href={redirect}
              className="block w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Back to {redirect === '/' ? 'Home' : 'Previous Page'}
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Need help?{' '}
            <a href="mailto:hello@baliwild.com" className="text-brand-ink hover:underline font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}