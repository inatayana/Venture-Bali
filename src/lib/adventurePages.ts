/**
 * Server-side loader for quality-gated activity x destination pages.
 *
 * `programmaticPages.ts` stays pure (gate + copy); this module owns the
 * database reads. Both the public page and the sitemap use the same loader so
 * a page can never be published in one place and missing in the other.
 */

import { prisma } from '@/lib/prisma';
import { resolveCategory } from '@/lib/taxonomy';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import type { VentureItem } from '@/types/venture';
import {
  DESTINATIONS,
  buildEditorialIntro,
  buildPageSlug,
  buildPageTitle,
  isSupportedCombination,
  parsePageSlug,
  passesQualityGate,
  type DestinationDef,
  type PageCandidate,
} from './programmaticPages';

export interface AdventurePageData {
  slug: string;
  title: string;
  intro: string;
  candidate: PageCandidate;
  ventures: VentureItem[];
  productCount: number;
  lastModified: Date;
}

export interface PublishedAdventurePage {
  slug: string;
  title: string;
  activitySlug: string;
  activityName: string;
  activityShort: string;
  destinationSlug: string;
  destinationName: string;
  productCount: number;
  lastModified: Date;
}

function newestDate(rows: readonly { updatedAt: Date }[]): Date {
  if (rows.length === 0) return new Date(0);
  return new Date(Math.max(...rows.map((row) => row.updatedAt.getTime())));
}

async function loadDestination(
  activitySlug: string,
  destination: DestinationDef
): Promise<AdventurePageData | null> {
  const category = resolveCategory(activitySlug);
  if (!category) return null;

  const rows = await prisma.venture.findMany({
    where: {
      category: category.short,
      OR: [
        { location: { name: { contains: destination.name, mode: 'insensitive' } } },
        { title: { contains: destination.name, mode: 'insensitive' } },
      ],
    },
    include: ventureWithRelations(),
  });

  if (rows.length === 0) return null;

  const ventures = rows.map((row) => toVentureItem(row));
  const approvedReviews = await prisma.review.count({
    where: { isApproved: true, ventureId: { in: ventures.map((item) => item.id) } },
  });

  const candidate: PageCandidate = {
    activitySlug,
    activityName: category.canonical,
    destination,
  };
  const title = buildPageTitle(category.canonical, destination.name);
  const intro = buildEditorialIntro(candidate, ventures.length);

  if (
    !passesQualityGate({
      productCount: ventures.length,
      approvedReviewCount: approvedReviews,
      intro,
      title,
    })
  ) {
    return null;
  }

  return {
    slug: buildPageSlug(activitySlug, destination.slug),
    title,
    intro,
    candidate,
    ventures,
    productCount: ventures.length,
    lastModified: newestDate(rows),
  };
}

/** Load one published page, or null when the gate rejects the combination. */
export async function loadAdventurePageBySlug(slug: string): Promise<AdventurePageData | null> {
  const parsed = parsePageSlug(slug);
  if (!parsed || !isSupportedCombination(parsed.activitySlug, parsed.destinationSlug)) return null;

  const destination = DESTINATIONS.find((item) => item.slug === parsed.destinationSlug);
  if (!destination) return null;

  return loadDestination(parsed.activitySlug, destination);
}

/**
 * Every published activity x destination page. Pass an activity slug to scope
 * the result to one category hub.
 */
export async function getPublishedAdventurePages(
  activitySlug?: string
): Promise<PublishedAdventurePage[]> {
  const pages: PublishedAdventurePage[] = [];

  for (const destination of DESTINATIONS) {
    for (const candidateSlug of destination.activities) {
      if (activitySlug && candidateSlug !== activitySlug) continue;

      const page = await loadDestination(candidateSlug, destination);
      if (!page) continue;

      const category = resolveCategory(candidateSlug);
      if (!category) continue;

      pages.push({
        slug: page.slug,
        title: page.title,
        activitySlug: candidateSlug,
        activityName: category.canonical,
        activityShort: category.short,
        destinationSlug: destination.slug,
        destinationName: destination.name,
        productCount: page.productCount,
        lastModified: page.lastModified,
      });
    }
  }

  return pages;
}
