import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'Adventure Blog | BaliWild',
  description: 'Guides, tips and stories about adventure activities in Bali.',
};

export const revalidate = 60;

interface ArticleListItem {
  id: string;
  slug: string;
  title: { en?: string; id?: string } | string;
  metaDesc: { en?: string; id?: string } | string;
  tags: string[];
  publishedAt: Date | null;
  createdAt: Date;
}

function readText(value: { en?: string; id?: string } | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en ?? value.id ?? '';
}

async function getArticles(): Promise<ArticleListItem[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        metaDesc: true,
        tags: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    return articles as ArticleListItem[];
  } catch (error) {
    console.error('Failed to load articles:', error);
    return [];
  }
}

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="bg-brand-ink text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-brand transition-colors hover:text-white"
          >
            Explore adventures →
          </Link>
        </div>

        <div className="container mx-auto px-4 pb-12 pt-6">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
            Field notes
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold uppercase tracking-wide sm:text-5xl">
            Adventure Blog
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            Guides, tips and stories for people who would rather be outside. Own the wild.
          </p>
        </div>
      </header>

      <section className="container mx-auto px-4 py-10">
        {articles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-heading text-xl font-bold uppercase tracking-wide text-neutral-900">
              No field notes yet
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              New Bali adventure guides are on the way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-xl"
              >
                <Link href={`/blog/${article.slug}`} className="block p-6">
                  <h2 className="mb-2 line-clamp-2 font-heading text-xl font-bold text-neutral-900 group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                    {readText(article.title)}
                  </h2>
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                    {readText(article.metaDesc)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand/30 px-2 py-1 text-xs font-semibold text-neutral-900"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                    <p className="text-xs text-neutral-400">
                      {article.publishedAt &&
                        new Date(article.publishedAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                    </p>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Read guide →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
