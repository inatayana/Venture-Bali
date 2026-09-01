import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mockVentures } from '@/data/mockVentures';
import { generateVentureMetadata, generateVentureStructuredData, type SupportedDomain } from '@/lib/seo';
import { VentureDetailClient } from './VentureDetailClient';
import type { VentureItem } from '@/types/venture';

interface PageProps {
  params: { slug: string };
}

async function getVentureBySlug(slug: string): Promise<VentureItem | null> {
  try {
    const venture = await prisma.venture.findUnique({
      where: { slug },
    });
    return venture as VentureItem | null;
  } catch (error) {
    console.error('Prisma query failed, falling back to mock data:', error);
    return mockVentures.find((v) => v.slug === slug) ?? null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const venture = await getVentureBySlug(params.slug);

  if (!venture) {
    return {
      title: 'Venture Not Found | Venture Bali',
      description: 'The requested venture could not be found.',
    };
  }

  return generateVentureMetadata({
    venture,
    domain: 'localhost' as SupportedDomain,
  });
}

export default async function VentureDetailPage({ params }: PageProps) {
  const venture = await getVentureBySlug(params.slug);

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
      <VentureDetailClient venture={venture} />
    </>
  );
}
