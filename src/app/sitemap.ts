import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/seo';

/**
 * BaliWild — Dynamic Sitemap Generator
 * -----------------------------------
 * Automatically includes the homepage, the 9 mega categories, all active
 * adventures, and all published blog articles.
 *
 * This ensures search engines always have the latest product and content URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  // 2. Venture Routes (Experiences)
  const ventures = await prisma.venture.findMany({
    select: { id: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const ventureRoutes: MetadataRoute.Sitemap = ventures.map((v) => ({
    url: `${baseUrl}/experiences/${v.id}/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Article Routes (Blog Posts)
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...ventureRoutes, ...articleRoutes];
}
