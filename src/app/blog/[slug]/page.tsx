import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JsonLd } from '@/components/seo/JsonLd';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { generateArticleStructuredData, getBaseUrl } from '@/lib/seo';

interface Article {
  id: string;
  slug: string;
  title: { en?: string; id?: string } | string;
  content: string;
  metaDesc: { en?: string; id?: string } | string;
  keywords: string[];
  tags: string[];
  publishedAt: Date | null;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  ventureId: string | null;
  venture?: { id: string; slug: string; title: string } | null;
}

function readText(value: { en?: string; id?: string } | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en ?? value.id ?? '';
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: { venture: { select: { id: true, slug: true, title: true } } },
    });
    return article as Article | null;
  } catch (error) {
    console.error('Failed to load article:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article || !article.publishedAt) {
    return {
      title: 'Article Not Found | BaliWild',
      description: 'The requested article could not be found.',
    };
  }

  const title = readText(article.title);
  const description = readText(article.metaDesc);
  const baseUrl = getBaseUrl();
  const suffix = ' | BaliWild Blog';
  const metaTitle = title.length + suffix.length <= 60 ? `${title}${suffix}` : title;
  const metaDescription =
    description.length > 155 ? `${description.slice(0, 152).trimEnd()}...` : description;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `${baseUrl}/blog/${article.slug}`,
    },
    openGraph: {
      title,
      description: metaDescription,
      url: `${baseUrl}/blog/${article.slug}`,
      siteName: 'BaliWild',
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article || !article.publishedAt) {
    notFound();
  }

  const title = readText(article.title);
  const description = readText(article.metaDesc);

  const htmlContent = article.content
    .replace(/^## (.+)$/gm, '<h2 class="font-heading text-2xl font-bold uppercase tracking-wide text-neutral-900 mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-heading text-3xl font-bold text-neutral-900 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="text-neutral-700 leading-relaxed mb-4">')
    .replace(/^(?!<h[12]|<p)(.+)$/gm, '<p class="text-neutral-700 leading-relaxed mb-4">$1</p>')
    .replace(/<\/p><p class="text-neutral-700 leading-relaxed mb-4">/g, '</p>\n<p class="text-neutral-700 leading-relaxed mb-4">');

  const structuredData = generateArticleStructuredData(
    {
      slug: article.slug,
      title,
      description,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      keywords: article.keywords,
      tags: article.tags,
    },
    getBaseUrl()
  );

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={structuredData} />

      <header className="bg-brand-ink text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <Link
            href="/blog"
            className="text-sm font-semibold text-brand transition-colors hover:text-white"
          >
            ← Field notes
          </Link>
        </div>

        <div className="container mx-auto max-w-3xl px-4 pb-16 pt-6">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/50" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <span>/</span>
            <span className="text-white/80">{title}</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">{description}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
            <span className="font-semibold uppercase tracking-[0.18em] text-brand">BaliWild field notes</span>
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
          </div>
        </div>
      </header>

      <article className="container mx-auto -mt-8 max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {article.tags.length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                Tags
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand/30 px-3 py-1 text-xs font-semibold text-neutral-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {article.venture && (
          <div className="mt-8 rounded-2xl bg-brand-ink p-6 text-white sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
              Related adventure
            </p>
            <Link
              href={`/experiences/${article.venture.id}/${article.venture.slug}`}
              className="mt-2 block font-heading text-xl font-bold uppercase tracking-wide text-white hover:text-brand"
            >
              {article.venture.title}
            </Link>
            <Link
              href={`/experiences/${article.venture.id}/${article.venture.slug}`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-brand px-5 text-sm font-bold uppercase tracking-wider text-brand-ink"
            >
              View dates & book
            </Link>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/blog"
            className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
          >
            ← Back to all field notes
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
