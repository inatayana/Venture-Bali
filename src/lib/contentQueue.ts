/**
 * BaliWild — Autonomous content queue
 * ------------------------------------
 * Produces at most 15 articles per day from a deterministic plan. Gemini is
 * used when available; when it is absent or out of quota, venture-derived
 * articles are built from real catalogue fields instead of being skipped.
 * Nothing in this module invents prices, slots, reviews or availability.
 */

import { prisma } from '@/lib/prisma';
import { isGeminiConfigured } from '@/lib/gemini';
import {
  addInternalLinks,
  generateArticle,
  getLinkableVentures,
  saveArticle,
  validateGeneratedArticle,
  type GeneratedArticle,
} from '@/lib/aiContent';
import {
  buildArticlePlan,
  selectDueArticles,
  DEFAULT_DAILY_ARTICLE_LIMIT,
  type ArticlePlanItem,
  type PlanVenture,
} from './contentPlan';

interface QueueVenture extends PlanVenture {
  shortDescription: string | null;
  duration: string;
  highlights: unknown;
  inclusions: unknown;
  faqs: unknown;
  meetingPoint: string | null;
}

export interface QueueRunResult {
  date: string;
  planned: number;
  due: number;
  attempted: number;
  generated: number;
  deterministic: number;
  failed: number;
  quotaExceeded: boolean;
  slugs: string[];
}

const EMOJI_PATTERN = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

function clean(value: string): string {
  return value.replace(EMOJI_PATTERN, '').replace(/baliwild/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function asFaqs(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item == null) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.question !== 'string' || typeof row.answer !== 'string') return [];
    return [{ question: clean(row.question), answer: clean(row.answer) }];
  });
}

/**
 * Build a short, factual article from fields that actually exist on the
 * venture row. Used only when no model output is available.
 */
export function buildDeterministicArticle(
  item: ArticlePlanItem,
  venture: QueueVenture
): GeneratedArticle {
  const highlights = asStringArray(venture.highlights).slice(0, 5);
  const inclusions = asStringArray(venture.inclusions).slice(0, 5);
  const faqs = asFaqs(venture.faqs).slice(0, 3);

  const sections: string[] = [
    clean(venture.shortDescription ?? `${item.title} is a ${item.category.toLowerCase()} experience based in ${item.destination}, Bali.`),
    '',
    '## What to expect',
    ...(highlights.length > 0 ? highlights.map((line) => `- ${clean(line)}`) : ['- A guided session with a local operator.']),
    '',
    `## Duration\n\n${clean(venture.duration)}`,
    '',
    '## Meeting point',
    '',
    clean(venture.meetingPoint ?? 'The exact meeting point is confirmed in your booking voucher.'),
    '',
    '## What is included',
    '',
    ...(inclusions.length > 0 ? inclusions.map((line) => `- ${clean(line)}`) : ['- Safety briefing and basic equipment.']),
    '',
    '## Booking options',
    '',
    'You can meet the operator at the activity location or choose private transfer with hotel pickup. Prices depend on the date and group size; check the live availability on the product page.',
  ];

  if (faqs.length > 0) {
    sections.push('', '## Frequently asked questions', '');
    for (const faq of faqs) sections.push(`**${faq.question}** ${faq.answer}`, '');
  }

  return {
    title: item.title,
    slug: item.slug,
    metaDescription: clean(`Practical guide to ${item.title.toLowerCase()}: duration, meeting point, inclusions and booking options. ${item.destination}, Bali.`).slice(0, 160),
    keywords: [item.primaryKeyword, item.category, item.destination, 'Bali adventure'],
    tags: [item.category, item.destination],
    content: sections.join('\n'),
  };
}

export async function runContentQueue(
  options: { now?: Date; limit?: number; useGemini?: boolean } = {}
): Promise<QueueRunResult> {
  const now = options.now ?? new Date();
  const configuredLimit = Number.parseInt(process.env.CONTENT_DAILY_ARTICLE_LIMIT ?? '', 10);
  const limit =
    options.limit ??
    (Number.isFinite(configuredLimit) && configuredLimit > 0
      ? Math.min(configuredLimit, DEFAULT_DAILY_ARTICLE_LIMIT)
      : DEFAULT_DAILY_ARTICLE_LIMIT);

  const [ventureRows, articleRows] = await Promise.all([
    prisma.venture.findMany({
      select: {
        id: true,
        title: true,
        primaryKeyword: true,
        category: true,
        shortDescription: true,
        duration: true,
        highlights: true,
        inclusions: true,
        faqs: true,
        meetingPoint: true,
        location: { select: { name: true } },
      },
    }),
    prisma.article.findMany({ select: { slug: true } }),
  ]);

  const ventures = ventureRows as QueueVenture[];
  const ventureById = new Map(ventures.map((venture) => [venture.id, venture]));
  const plan = buildArticlePlan(ventures);
  const due = selectDueArticles(plan, new Set(articleRows.map((row) => row.slug)), limit, now);
  const linkables = await getLinkableVentures();
  const useGemini = options.useGemini ?? isGeminiConfigured();

  const result: QueueRunResult = {
    date: now.toISOString().slice(0, 10),
    planned: plan.length,
    due: due.length,
    attempted: 0,
    generated: 0,
    deterministic: 0,
    failed: 0,
    quotaExceeded: false,
    slugs: [],
  };

  for (const item of due) {
    result.attempted += 1;
    let article: GeneratedArticle | null = null;
    let deterministic = false;

    if (useGemini) {
      const generated = await generateArticle({
        title: item.title,
        primaryKeyword: item.primaryKeyword,
        category: item.category,
        destination: item.destination,
      });
      if (generated.article) article = generated.article;
      else if (generated.rejection?.toLowerCase().includes('quota')) {
        result.quotaExceeded = true;
        break;
      }
    }

    const venture = item.ventureId ? ventureById.get(item.ventureId) : undefined;
    if (!article && venture) {
      article = buildDeterministicArticle(item, venture);
      deterministic = true;
    }
    if (!article) {
      result.failed += 1;
      continue;
    }

    const request = {
      title: item.title,
      primaryKeyword: item.primaryKeyword,
      category: item.category,
      destination: item.destination,
    };
    if (validateGeneratedArticle(article, request)) {
      result.failed += 1;
      continue;
    }

    article.content = addInternalLinks(article.content, linkables);
    await saveArticle(article, { publish: true, ventureId: item.ventureId });
    if (deterministic) result.deterministic += 1;
    else result.generated += 1;
    result.slugs.push(article.slug);
  }

  return result;
}
