import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'You are offline | Venture Bali',
  description: 'Reconnect to keep browsing Bali adventures.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <WifiOff className="h-8 w-8 text-neutral-500" />
      </span>
      <h1 className="font-heading text-2xl font-bold text-neutral-900">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-600">
        Your connection dropped. Pages you already visited are still available, and everything
        else comes back as soon as you reconnect.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white"
      >
        Try the homepage
      </Link>
    </main>
  );
}
