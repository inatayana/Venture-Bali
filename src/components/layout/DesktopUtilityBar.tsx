'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronUp,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { cn } from '@/utils/cn';

const CONCIERGE_WHATSAPP_URL = 'https://wa.me/6285117321388';

const linkClass =
  'transition-colors hover:text-neutral-900 hover:underline dark:hover:text-white';

/**
 * Slim desktop-only utility bar pinned to the bottom edge.
 * Hidden on mobile so it never collides with the 4-tab bottom navigation.
 */
export function DesktopUtilityBar() {
  const [supportOpen, setSupportOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  useEffect(() => {
    if (!supportOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setSupportOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSupportOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [supportOpen]);

  // The utility bar is public chrome — never shown on operator/admin screens.
  if (isAdmin) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 hidden h-11 items-center justify-between border-t border-neutral-200 bg-white/95 px-6 text-xs text-neutral-600 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95 dark:text-neutral-400 md:flex"
      role="contentinfo"
      aria-label="BaliWild utility bar"
    >
      {/* Left: legal identity + quick links */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="whitespace-nowrap">© 2026 BaliWild · Operated by PT Natayana Bali Tours</span>
        <span aria-hidden="true">·</span>
        <nav aria-label="Legal" className="flex items-center gap-3">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <Link href="/terms" className={linkClass}>
            Refund Policy
          </Link>
        </nav>
      </div>

      {/* Right: language + currency + support popover */}
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <CurrencySelector />

        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setSupportOpen((open) => !open)}
            aria-expanded={supportOpen}
            aria-haspopup="dialog"
            className="flex min-h-[36px] items-center gap-1 rounded-full px-2 font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/10 dark:hover:text-white"
          >
            Support &amp; resources
            <ChevronUp
              className={cn('h-3.5 w-3.5 transition-transform', supportOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </button>

          {supportOpen && (
            <div
              role="dialog"
              aria-label="Support and resources"
              className="absolute bottom-full right-0 z-40 mb-2 w-80 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-neutral-900"
            >
              <a
                href={CONCIERGE_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSupportOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                    24/7 BaliWild Concierge
                  </span>
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                    Chat with our team on WhatsApp
                  </span>
                </span>
              </a>

              <Link
                href="/terms"
                onClick={() => setSupportOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-ink dark:text-brand">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                    Free Reschedule &amp; Refund Policy
                  </span>
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                    Free reschedule and 80% refund ≥24h before the trip
                  </span>
                </span>
              </Link>

              <Link
                href="/terms"
                onClick={() => setSupportOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                    Safety &amp; Equipment Guarantee
                  </span>
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                    Private fleet · international safety gear · licensed crew
                  </span>
                </span>
              </Link>

              <a
                href="mailto:support@baliwild.com"
                onClick={() => setSupportOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                    Help Center
                  </span>
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                    support@baliwild.com
                  </span>
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
