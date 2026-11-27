import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { VentureCard } from '@/components/ui';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { getBaseUrl } from '@/lib/seo';
import { PUBLIC_FAQS } from '@/lib/publicFacts';
import { loadAdventurePageBySlug } from '@/lib/adventurePages';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadAdventurePageBySlug(slug);
  if (!page) {
    return {
      title: 'Adventure guide not found | BaliWild',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();
  const description = `${page.intro.slice(0, 150).trimEnd()}...`;

  return {
    title: page.title,
    description,
    alternates: { canonical: `${baseUrl}/adventures/${slug}` },
    openGraph: {
      title: page.title,
      description,
      url: `${baseUrl}/adventures/${slug}`,
      siteName: 'BaliWild',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProgrammaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadAdventurePageBySlug(slug);
  if (!page) notFound();

  const baseUrl = getBaseUrl();
  const { candidate, title, intro, ventures } = page;
  const canonical = `${baseUrl}/adventures/${slug}`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      url: canonical,
      numberOfItems: ventures.length,
      itemListElement: ventures.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: `${baseUrl}/experiences/${item.id}/${item.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: PUBLIC_FAQS.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Adventure guides',
          item: `${baseUrl}/adventures`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${candidate.activityName} in Bali`,
          item: `${baseUrl}/activities/${candidate.activitySlug}`,
        },
        { '@type': 'ListItem', position: 4, name: title, item: canonical },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <JsonLd data={structuredData} />
      <header className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <Link
            href="/adventures"
            className="text-sm font-semibold text-brand hover:text-white"
          >
            All destination guides
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          {' / '}
          <Link href="/adventures" className="hover:underline">
            Adventure guides
          </Link>
          {' / '}
          <Link
            href={`/activities/${candidate.activitySlug}`}
            className="hover:underline"
          >
            {candidate.activityName}
          </Link>
          {' / '}
          <span>{candidate.destination.name}</span>
        </nav>

        <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
          {title}
        </h1>
        <div className="mt-4 max-w-4xl space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {intro.split('\n\n').map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink dark:text-brand">
          {ventures.length} guided adventures in {candidate.destination.name}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ventures.map((item) => (
            <VentureCard
              key={item.id}
              venture={item}
              href={`/experiences/${item.id}/${item.slug}`}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 rounded-2xl bg-brand-ink p-6 text-white dark:bg-neutral-900">
          <Link
            href={`/activities/${candidate.activitySlug}`}
            className="min-h-[48px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink"
          >
            More {candidate.activityName} in Bali
          </Link>
          <Link
            href="/experiences"
            className="min-h-[48px] rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white"
          >
            Explore all adventures
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
