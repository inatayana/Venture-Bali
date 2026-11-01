import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JsonLd } from '@/components/seo/JsonLd';
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
      title: 'Article Not Found | Venture Bali',
      description: 'The requested article could not be found.',
    };
  }

  const title = readText(article.title);
  const description = readText(article.metaDesc);
  const baseUrl = getBaseUrl();
  const suffix = ' | Venture Bali Blog';
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
      siteName: 'Venture Bali',
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
    .replace(/^## (.+)$/gm, '<h2 class="font-heading text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-heading text-3xl font-bold text-gray-900 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-4">')
    .replace(/^(?!<h[12]|<p)(.+)$/gm, '<p class="text-gray-700 leading-relaxed mb-4">$1</p>')
    .replace(/<\/p><p class="text-gray-700 leading-relaxed mb-4">/g, '</p>\n<p class="text-gray-700 leading-relaxed mb-4">');

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
    <main className="min-h-screen bg-gray-50">
      <JsonLd data={structuredData} />
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-blue-600">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{title}</span>
          </nav>
        </div>
      </header>

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            {article.aiGenerated && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                AI generated
              </span>
            )}
          </div>
        </header>

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Tags:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {article.venture && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-600 mb-2">Related adventure:</p>
            <Link
              href={`/experiences/${article.venture.id}/${article.venture.slug}`}
              className="font-heading text-lg font-bold text-blue-600 hover:underline"
            >
              {article.venture.title}
            </Link>
          </div>
        )}

        <div className="mt-8">
          <Link href="/blog" className="text-blue-600 hover:underline text-sm">
            ← Back to all articles
          </Link>
        </div>
      </article>
    </main>
  );
}
