import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/seo';
import { buildSitemapEntries, renderSitemapXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';

/** `/sitemap.xml` with product galleries encoded as an image sitemap. */
export async function GET() {
  const entries = await buildSitemapEntries(getBaseUrl());

  return new NextResponse(renderSitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
