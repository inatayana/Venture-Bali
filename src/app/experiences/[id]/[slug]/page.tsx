import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import {
  toVentureItem,
  ventureWithRelations,
} from '@/lib/ventureMapper';
import { generateVentureMetadata, generateVentureStructuredData, type SupportedDomain } from '@/lib/seo';
import { ExperienceDetailClient } from './ExperienceDetailClient';
import type { VentureItem } from '@/types/venture';

interface PageProps {
  params: { id: string; slug: string };
}

async function getExperience(id: string, slug: string): Promise<VentureItem | null> {
  try {
    const venture = await prisma.venture.findFirst({
      where: { OR: [{ id }, { slug }] },
      include: ventureWithRelations,
    });
    return venture ? toVentureItem(venture) : null;
  } catch (error) {
    console.error('Prisma query failed, falling back to mock data:', error);
    return mockExperiences.find((v) => v.id === id || v.slug === slug) ?? null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const venture = await getExperience(params.id, params.slug);

  if (!venture) {
    return {
      title: 'Experience Not Found | Venture Bali',
      description: 'The requested experience could not be found.',
    };
  }

  return generateVentureMetadata({
    venture,
    domain: 'localhost' as SupportedDomain,
  });
}

export default async function ExperienceDetailPage({ params }: PageProps) {
  const venture = await getExperience(params.id, params.slug);

  if (!venture) {
    notFound();
  }

  const structuredData = generateVentureStructuredData({
    venture,
    domain: 'localhost' as SupportedDomain,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ExperienceDetailClient venture={venture} />
    </>
  );
}
