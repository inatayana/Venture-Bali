'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, AlertTriangle, RefreshCw } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Link href="/" aria-label="BaliWild home" className="inline-block">
            <BrandWordmark className="text-3xl text-brand-ink" />
          </Link>
        </div>

        <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-3">Terjadi kesalahan</h1>
        <p className="text-neutral-600 mb-8">
          Maaf, ada yang tidak beres di sisi kami. Tim teknis kami sudah mendapat
          notifikasi dan sedang menyelidikinya.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 w-full rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>

          <Link
            href="/"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 w-full rounded-xl border-2 border-brand-ink px-6 text-base font-semibold text-brand-ink hover:bg-brand-ink/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}