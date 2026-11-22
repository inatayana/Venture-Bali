/**
 * BaliWild — Content plan
 * -----------------------
 * Deterministic, data-grounded backlog of long-tail article ideas. Every item
 * is validated against the Product Title Constitution and the 9-category
 * taxonomy before it enters the plan, so a cron run can never enqueue a title
 * that would be rejected later.
 */

import { MEGA_CATEGORIES, resolveCategory } from '@/lib/taxonomy';
import { isVentureSlugValid, validateVentureTitle } from '@/lib/titleValidator';

/** Gemini free tier allows ~20 requests/day/model; leave headroom for chat. */
export const DEFAULT_DAILY_ARTICLE_LIMIT = 15;

export interface PlanVenture {
  id: string;
  title: string;
  primaryKeyword: string | null;
  category: string;
  location?: { name: string } | null;
}

export interface ArticlePlanItem {
  slug: string;
  title: string;
  primaryKeyword: string;
  category: string;
  destination: string;
  ventureId?: string;
}

export const BALI_DESTINATIONS = [
  'Ubud',
  'Canggu',
  'Seminyak',
  'Sanur',
  'Nusa Dua',
  'Jimbaran',
  'Uluwatu',
  'Kuta',
  'Amed',
  'Lovina',
  'Munduk',
  'Sidemen',
  'Nusa Penida',
  'Tulamben',
  'Tabanan',
] as const;

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleTemplates(place: string, short: string): string[] {
  return [
    `${place} ${short} Adventure for First Time Visitors in Bali`,
    `${place} ${short} Guide: Prices, Slots and Booking Tips`,
    `${place} ${short} Experience in Bali for Beginners and Families`,
  ];
}

function makeItem(
  place: string,
  category: string,
  venture?: PlanVenture
): ArticlePlanItem[] {
  const categoryDef = resolveCategory(category);
  if (!categoryDef) return [];

  const items: ArticlePlanItem[] = [];
  for (const title of titleTemplates(place, categoryDef.short)) {
    const preferred = venture?.primaryKeyword?.trim() || `${place} ${categoryDef.short}`;
    const keyword = title.toLowerCase().slice(0, 25).includes(preferred.toLowerCase())
      ? preferred
      : `${place} ${categoryDef.short}`;
    const validation = validateVentureTitle({ title, primaryKeyword: keyword, destination: place });
    const slug = toSlug(title);
    if (!validation.valid || !isVentureSlugValid(slug)) continue;
    items.push({
      slug,
      title,
      primaryKeyword: keyword,
      category: categoryDef.canonical,
      destination: place,
      ...(venture ? { ventureId: venture.id } : {}),
    });
  }
  return items;
}

/** Build the full de-duplicated backlog from real products + 9-taxonomy. */
export function buildArticlePlan(ventures: PlanVenture[]): ArticlePlanItem[] {
  const plan: ArticlePlanItem[] = [];
  const seen = new Set<string>();

  const add = (item: ArticlePlanItem) => {
    if (seen.has(item.slug)) return;
    seen.add(item.slug);
    plan.push(item);
  };

  for (const venture of ventures) {
    const place = (venture.location?.name ?? '').split(',')[0]?.trim() || 'Bali';
    for (const item of makeItem(place, venture.category, venture)) add(item);
  }

  for (const destination of BALI_DESTINATIONS) {
    for (const category of MEGA_CATEGORIES) {
      for (const item of makeItem(destination, category)) add(item);
    }
  }

  return plan;
}

/**
 * Pick today's slice. The offset is derived from the day number so repeated
 * runs on the same day select the same items; existing slugs are always skipped.
 */
export function selectDueArticles(
  plan: ArticlePlanItem[],
  existingSlugs: ReadonlySet<string>,
  limit: number,
  now: Date
): ArticlePlanItem[] {
  if (plan.length === 0 || limit <= 0) return [];
  const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const start = ((dayIndex * limit) % plan.length + plan.length) % plan.length;
  const due: ArticlePlanItem[] = [];

  for (let offset = 0; offset < plan.length && due.length < limit; offset += 1) {
    const item = plan[(start + offset) % plan.length];
    if (existingSlugs.has(item.slug)) continue;
    due.push(item);
  }
  return due;
}
