'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';

/**
 * Desktop-only breadcrumb inside <main>, directly under the shared header.
 * Keeps the global header byte-identical on every page while still offering
 * quick Back + Home navigation. Invisible on mobile (<md) where the existing
 * app-shell chrome owns navigation.
 */
export function DesktopBreadcrumb({ label }: { label: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden md:flex max-w-[1440px] mx-auto px-6 lg:px-10 pt-4 items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"
    >
      <button
        type="button"
        onClick={() => window.history.back()}
        aria-label="Go back"
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-brand-ink dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </button>
      <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">/</span>
      <Link href="/" className="rounded px-1 py-0.5 transition-colors hover:text-brand-ink dark:hover:text-white">
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span aria-current="page" className="font-medium text-neutral-900 dark:text-white">
        {label}
      </span>
    </nav>
  );
}
