import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { mockVentures } from '@/data/mockVentures';
import { getBaseUrl } from '@/lib/seo';

async function getVentureSlugs(): Promise<string[]> {
  try {
    const ventures = await prisma.venture.findMany({
      select: { slug: true },
    });
    return ventures.map((venture) => venture.slug);
  } catch (error) {
    console.error('Prisma query failed, falling back to mock data:', error);
    return mockVentures.map((venture) => venture.slug);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const slugs = await getVentureSlugs();

  const ventureUrls: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/ventures/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...ventureUrls,
  ];
}
