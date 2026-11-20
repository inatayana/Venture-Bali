import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildLlmsTxt } from '@/lib/llms';
import { getBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/** `/llms.txt` — factual, machine-readable briefing for answer engines. */
export async function GET() {
  const baseUrl = getBaseUrl();
  let products: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    duration: string;
    minAge: number | null;
  }> = [];

  try {
    products = await prisma.venture.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        duration: true,
        minAge: true,
      },
      orderBy: { title: 'asc' },
    });
  } catch (error) {
    console.error('llms.txt: database unavailable, omitting live catalogue:', error);
  }

  return new NextResponse(buildLlmsTxt(baseUrl, products), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
