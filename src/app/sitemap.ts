import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { getBaseUrl } from '@/lib/seo';

async function getExperienceSlugs(): Promise<Array<{ id: string; slug: string }>> {
  try {
    const ventures = await prisma.venture.findMany({
      select: { id: true, slug: true },
    });
    return ventures.map((venture) => ({ id: venture.id, slug: venture.slug }));
  } catch (error) {
    console.error('Prisma query failed, falling back to mock data:', error);
    return mockExperiences.map((venture) => ({ id: venture.id, slug: venture.slug }));
  }
}

async function getArticleSlugs(): Promise<string[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true },
    });
    return articles.map((article) => article.slug);
  } catch (error) {
    console.error('Prisma query failed, falling back to empty list:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const slugs = await getExperienceSlugs();
  const articleSlugs = await getArticleSlugs();

  const experienceUrls: MetadataRoute.Sitemap = slugs.map(({ id, slug }) => ({
    url: `${baseUrl}/experiences/${id}/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const blogUrls: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

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
    ...experienceUrls,
    ...blogUrls,
  ];
}
