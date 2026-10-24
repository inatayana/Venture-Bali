import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Adventure Blog | Venture Bali',
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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading text-4xl font-bold uppercase tracking-wider text-blue-600">
            Adventure Blog
          </h1>
          <p className="text-gray-600 mt-1">Guides, tips and stories about adventure activities in Bali</p>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No articles published yet.</p>
            <p className="text-sm text-gray-400">
              Visit the{' '}
              <Link href="/admin/content" className="text-blue-600 hover:underline">
                AI Content Wizard
              </Link>{' '}
              to generate your first article.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <Link href={`/blog/${article.slug}`} className="block p-6">
                  <h2 className="font-heading text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {readText(article.title)}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {readText(article.metaDesc)}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {article.publishedAt && (
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
