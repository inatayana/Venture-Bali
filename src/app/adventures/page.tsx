import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getPublishedAdventurePages } from '@/lib/adventurePages';
import type { PublishedAdventurePage } from '@/lib/adventurePages';
import { getBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Adventure Guides by Destination | BaliWild',
  description:
    'Browse quality-gated Bali adventure guides by activity and destination — real products, live prices and locally operated trips.',
  alternates: { canonical: `${getBaseUrl()}/adventures` },
  robots: { index: true, follow: true },
};

export default async function AdventuresIndexPage() {
  const pages = await getPublishedAdventurePages();

  const grouped = new Map<string, PublishedAdventurePage[]>();
  for (const page of pages) {
    const list = grouped.get(page.activityName) ?? [];
    list.push(page);
    grouped.set(page.activityName, list);
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <Link href="/experiences" className="text-sm font-semibold text-brand hover:text-white">
            All adventures
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink dark:text-brand">
          Activity × destination
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
          Bali adventure guides by destination
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Every guide below is published only when the destination has at least two real products and
          one approved guest review. Prices are shown in Indonesian rupiah and availability is live on
          each product page.
        </p>

        {pages.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-8 text-sm text-neutral-600 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300">
            Guides are being prepared. In the meantime, browse the full catalogue.
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {[...grouped.entries()].map(([activityName, items]) => (
              <section key={activityName}>
                <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                  {activityName}
                </h2>
                <ul className="mt-3 space-y-2">
                  {items.map((page) => (
                    <li key={page.slug}>
                      <Link
                        href={`/adventures/${page.slug}`}
                        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-ink underline decoration-brand decoration-2 underline-offset-4 hover:text-brand dark:text-brand"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3 rounded-2xl bg-brand-ink p-6 text-white dark:bg-neutral-900">
          <Link
            href="/experiences"
            className="min-h-[48px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink"
          >
            Browse all adventures
          </Link>
          <Link
            href="/about"
            className="min-h-[48px] rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white"
          >
            Our local story
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
