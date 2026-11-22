import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JsonLd } from '@/components/seo/JsonLd';
import { VentureCard } from '@/components/ui';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { getBaseUrl } from '@/lib/seo';
import { resolveCategory } from '@/lib/taxonomy';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import { PUBLIC_FAQS } from '@/lib/publicFacts';
import {
  DESTINATIONS,
  buildEditorialIntro,
  buildPageTitle,
  isSupportedCombination,
  parsePageSlug,
  passesQualityGate,
} from '@/lib/programmaticPages';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadPage(slug: string) {
  const parsed = parsePageSlug(slug);
  if (!parsed || !isSupportedCombination(parsed.activitySlug, parsed.destinationSlug)) return null;

  const destination = DESTINATIONS.find((item) => item.slug === parsed.destinationSlug);
  const category = resolveCategory(parsed.activitySlug);
  if (!destination || !category) return null;

  const rows = await prisma.venture.findMany({
    where: {
      category: category.short,
      OR: [
        { location: { name: { contains: destination.name, mode: 'insensitive' } } },
        { title: { contains: destination.name, mode: 'insensitive' } },
      ],
    },
    include: ventureWithRelations(),
  });

  const ventures = rows.map((row) => toVentureItem(row));

  if (ventures.length === 0) return null;

  const approvedReviews = await prisma.review.count({
    where: { isApproved: true, ventureId: { in: ventures.map((item) => item.id) } },
  });

  const candidate = {
    activitySlug: parsed.activitySlug,
    activityName: category.canonical,
    destination,
  };
  const title = buildPageTitle(category.canonical, destination.name);
  const intro = buildEditorialIntro(candidate, ventures.length);

  if (
    !passesQualityGate({
      productCount: ventures.length,
      approvedReviewCount: approvedReviews,
      intro,
      title,
    })
  ) {
    // Thin or unsupported combination — never publish or index it.
    return null;
  }

  return { candidate, title, intro, ventures };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: 'Adventures in Bali | BaliWild' };

  const baseUrl = getBaseUrl();
  return {
    title: page.title,
    description: `${page.intro.slice(0, 150).trimEnd()}...`,
    alternates: { canonical: `${baseUrl}/adventures/${slug}` },
    openGraph: {
      title: page.title,
      description: `Guided ${page.candidate.activityName.toLowerCase()} in ${page.candidate.destination.name}, operated locally in Bali.`,
      type: 'website',
    },
  };
}

export default async function ProgrammaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  const baseUrl = getBaseUrl();
  const { candidate, title, intro, ventures } = page;
  const canonical = `${baseUrl}/adventures/${slug}`;

  // `toVentureItem` resolves the real price from Variant/PriceTier, so cards
  // show the same live price as the rest of the catalogue.
  const items = ventures;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      url: canonical,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
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
          name: `${candidate.activityName} in Bali`,
          item: `${baseUrl}/activities/${candidate.activitySlug}`,
        },
        { '@type': 'ListItem', position: 3, name: title, item: canonical },
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
          <Link href="/faq" className="text-sm font-semibold text-brand hover:text-white">
            FAQs
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
          <Link href="/" className="hover:underline">Home</Link>
          {' / '}
          <Link href={`/activities/${candidate.activitySlug}`} className="hover:underline">
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
          {items.length} guided adventures in {candidate.destination.name}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <VentureCard
              key={item.id}
              venture={item}
              href={`/experiences/${item.id}/${item.slug}`}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 rounded-2xl bg-brand-ink p-6 text-white dark:bg-neutral-900">
          <Link href="/explore" className="min-h-[48px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink">
            Explore all adventures
          </Link>
          <Link href="/faq" className="min-h-[48px] rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white">
            Why book direct
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
