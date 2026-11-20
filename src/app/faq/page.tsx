import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { JsonLd } from '@/components/seo/JsonLd';
import { PUBLIC_FAQS } from '@/lib/publicFacts';

export const metadata: Metadata = {
  title: 'Adventure booking FAQ | BaliWild',
  description:
    'Direct answers about booking direct in Bali: local operation, OTA commission, age rules, transfers, refunds, safety and support.',
};

export default function FaqPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PUBLIC_FAQS.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <JsonLd data={structuredData} />

      <header className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-brand-ink pb-12 text-white">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Straight answers
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Adventure booking FAQ
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">
              Everything you need to know before booking direct with a Bali-based operator —
              priced in IDR, confirmed instantly, and backed by a local team.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl space-y-4">
            {PUBLIC_FAQS.map(({ question, answer }, index) => (
              <article
                key={question}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <h2 className="flex items-start gap-3 font-heading text-lg font-bold">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/25 text-xs text-brand-ink dark:text-brand"
                  >
                    {index + 1}
                  </span>
                  {question}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {answer}
                </p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-brand-ink p-6 text-white dark:bg-neutral-900">
            <h2 className="font-heading text-xl font-bold">Ready to book direct?</h2>
            <p className="mt-1 text-sm text-white/70">
              Choose from nine guided adventure categories, all operated in Bali.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-flex min-h-[48px] items-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink transition-transform hover:scale-[1.02]"
            >
              Explore Guided Adventures
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
