'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Printer } from 'lucide-react';

export function InvoiceActions({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to my trips
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        aria-label={`Print or save invoice ${bookingCode}`}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-900"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
    </div>
  );
}
