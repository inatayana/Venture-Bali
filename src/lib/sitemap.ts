import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { MEGA_CATEGORY_SLUGS, resolveCategory } from '@/lib/taxonomy';
import {
  DESTINATIONS,
  buildEditorialIntro,
  buildPageSlug,
  buildPageTitle,
  passesQualityGate,
} from '@/lib/programmaticPages';

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
  images?: string[];
}

function absolute(baseUrl: string, url: string): string {
  return /^https?:\/\//.test(url) ? url : `${baseUrl}${url}`;
}

function toGallery(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Next 14's metadata sitemap ignores image entries, so we render the XML
 * ourselves. Every product carries up to 8 gallery images for Google Images.
 */
export function renderSitemapXml(entries: readonly SitemapEntry[]): string {
  const hasImages = entries.some((entry) => (entry.images?.length ?? 0) > 0);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${
      hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''
    }>`,
  ];

  for (const entry of entries) {
    lines.push('<url>');
    lines.push(`<loc>${escapeXml(entry.url)}</loc>`);
    if (entry.lastModified) lines.push(`<lastmod>${entry.lastModified.toISOString()}</lastmod>`);
    if (entry.changeFrequency) lines.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
    if (typeof entry.priority === 'number') lines.push(`<priority>${entry.priority}</priority>`);
    for (const image of entry.images ?? []) {
      lines.push('<image:image>');
      lines.push(`<image:loc>${escapeXml(image)}</image:loc>`);
      lines.push('</image:image>');
    }
    lines.push('</url>');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

async function getExperiences(baseUrl: string): Promise<SitemapEntry[]> {
  try {
    const ventures = await prisma.venture.findMany({
      select: { id: true, slug: true, imageUrl: true, gallery: true, updatedAt: true },
    });

    return ventures.map((venture) => {
      const images = Array.from(new Set([venture.imageUrl, ...toGallery(venture.gallery)]))
        .filter(Boolean)
        .slice(0, 8)
        .map((image) => absolute(baseUrl, image));

      return {
        url: `${baseUrl}/experiences/${venture.id}/${venture.slug}`,
        lastModified: venture.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
        images,
      };
    });
  } catch (error) {
    console.error('Sitemap: database unavailable, using the offline catalogue:', error);
    return mockExperiences.map((venture) => ({
      url: `${baseUrl}/experiences/${venture.id}/${venture.slug}`,
      lastModified: venture.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: Array.from(new Set([venture.imageUrl, ...venture.gallery]))
        .filter(Boolean)
        .slice(0, 8)
        .map((image) => absolute(baseUrl, image)),
    }));
  }
}

async function getArticles(baseUrl: string): Promise<SitemapEntry[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, publishedAt: true },
    });

    return articles.flatMap((article) =>
      article.publishedAt
        ? [
            {
              url: `${baseUrl}/blog/${article.slug}`,
              lastModified: article.publishedAt,
              changeFrequency: 'monthly' as const,
              priority: 0.7,
            },
          ]
        : []
    );
  } catch (error) {
    console.error('Sitemap: could not load articles:', error);
    return [];
  }
}

/**
 * Static, indexable routes. Kept pure so the hub coverage is unit-testable
 * without a database connection.
 */
export function buildStaticSitemapEntries(baseUrl: string): SitemapEntry[] {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // robots.txt allows the listing and the 9 taxonomy hubs. Omitting them
    // kept them invisible in Search Console despite being indexable.
    {
      url: `${baseUrl}/explore`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...MEGA_CATEGORY_SLUGS.map((slug) => ({
      url: `${baseUrl}/activities/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}

/**
 * Only pages that pass the RFC quality gate reach the sitemap — never thin or
 * unsupported activity x destination combinations.
 */
async function getProgrammaticEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  for (const destination of DESTINATIONS) {
    for (const activitySlug of destination.activities) {
      const category = resolveCategory(activitySlug);
      if (!category) continue;

      try {
        const ventureIds = await prisma.venture.findMany({
          where: {
            category: category.short,
            OR: [
              { location: { name: { contains: destination.name, mode: 'insensitive' } } },
              { title: { contains: destination.name, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        if (ventureIds.length === 0) continue;

        const approvedReviews = await prisma.review.count({
          where: { isApproved: true, ventureId: { in: ventureIds.map((item) => item.id) } },
        });

        const title = buildPageTitle(category.canonical, destination.name);
        const intro = buildEditorialIntro(
          { activitySlug, activityName: category.canonical, destination },
          ventureIds.length
        );

        if (
          !passesQualityGate({
            productCount: ventureIds.length,
            approvedReviewCount: approvedReviews,
            intro,
            title,
          })
        ) {
          continue;
        }

        entries.push({
          url: `${baseUrl}/adventures/${buildPageSlug(activitySlug, destination.slug)}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      } catch (error) {
        console.error(`Sitemap: could not evaluate ${activitySlug}-in-${destination.slug}:`, error);
      }
    }
  }

  return entries;
}

export async function buildSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const [experiences, articles, programmatic] = await Promise.all([
    getExperiences(baseUrl),
    getArticles(baseUrl),
    getProgrammaticEntries(baseUrl),
  ]);

  return [...buildStaticSitemapEntries(baseUrl), ...experiences, ...articles, ...programmatic];
}
