import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, FileText, MessageCircle, ShieldCheck } from 'lucide-react';
import { AppShellHeader } from '@/components/layout/AppShellHeader';

export const metadata: Metadata = {
  title: 'Help Center | BaliWild',
  description: 'Answers about booking, payment, pickup, refunds and cancellations.',
  robots: { index: true, follow: true },
};

const LINKS = [
  {
    href: '/messages',
    title: 'Ask the assistant',
    description: 'Prices, availability, pickup and booking questions, answered from live data.',
    icon: MessageCircle,
  },
  {
    href: '/refund',
    title: 'Refund & cancellation',
    description: '80% refund when you cancel at least 24 hours before the activity.',
    icon: FileText,
  },
  {
    href: '/terms',
    title: 'Terms & conditions',
    description: 'Booking rules, age policies and safety responsibilities.',
    icon: ShieldCheck,
  },
  {
    href: '/privacy',
    title: 'Privacy policy',
    description: 'How your contact and booking details are handled.',
    icon: FileText,
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <AppShellHeader title="Help" />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">
          How can we help?
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Pick a topic below, or message our team on WhatsApp during operating hours.
        </p>

        <ul className="mt-8 space-y-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition-colors hover:border-brand dark:bg-neutral-900 dark:ring-white/10"
              >
                <link.icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-base font-bold text-neutral-900 dark:text-white">
                    {link.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-600 dark:text-neutral-400">
                    {link.description}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <a
          href="https://wa.me/6285117321388"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp +62 851 1732 1388
        </a>
      </div>
    </main>
  );
}
