/**
 * Venture Bali — AI Content Engine
 * ---------------------------------
 * Generates the long-tail SEO articles that power the blog and the
 * programmatic landing pages.
 *
 * Every generated article is validated against the Product Title
 * Constitution and the 9-category taxonomy before it is stored, and the
 * internal links to the catalogue are inserted automatically.
 *
 * Docs: Venture_Bali_PRD_PPS.md §2 (Autonomous AI Content & SEO Wizard),
 *       docs/SEO_TAXONOMY.md
 */

import { prisma } from '@/lib/prisma';
import { generateJson, getLastFailure, isGeminiConfigured } from '@/lib/gemini';
import { MEGA_CATEGORY_SLUGS, isAllowedCategory } from '@/lib/taxonomy';
import { validateVentureTitle, isVentureSlugValid } from '@/lib/titleValidator';

export interface GeneratedArticle {
  title: string;
  slug: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  content: string;
}

export interface ArticleRequest {
  /** A working title, 45-60 characters. */
  title: string;
  /** Primary keyword the article targets. */
  primaryKeyword: string;
  /** One of the 9 mega categories. */
  category: string;
  /** Optional destination, e.g. "Ubud". */
  destination?: string;
  /** Optional product slug to link to. */
  ventureSlug?: string;
  language?: 'en' | 'id';
}

export interface ArticleGenerationResult {
  article: GeneratedArticle | null;
  /** Why the generation was rejected, when it was. */
  rejection: string | null;
}

/**
 * The prompt that shapes the article. It states the house rules so the
 * model does not produce a generic travel blog post.
 */
function buildPrompt(request: ArticleRequest): string {
  const language = request.language ?? 'en';

  return `Write a long-tail SEO article for a Bali adventure booking platform.

Title (use exactly): ${request.title}
Primary keyword: ${request.primaryKeyword}
Category: ${request.category}
${request.destination ? `Destination: ${request.destination}\n` : ''}
Language: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}

Rules:
- Open with a short paragraph that answers the search intent straight away.
- Use the primary keyword naturally in the first paragraph and in one subheading.
- Use markdown headings (##) and short paragraphs. Aim for 600-900 words.
- Be specific and practical: what the activity is, who it suits, what to
  bring, how long it takes, what it costs in general terms.
- Never mention the brand "Venture Bali".
- Never name a specific operator, partner or vendor.
- Never use the words "Best", "Cheapest", "Discount" or "Free" to describe a product.
- Never use emoji.
- End with a short section "## Booking options" that mentions the two booking
  modes: meeting the operator at the activity location, and private transfer
  with hotel pickup.

Reply with JSON only, using exactly this shape:
{
  "title": "the title, unchanged",
  "slug": "lowercase-hyphen-slug",
  "metaDescription": "a meta description of at most 160 characters",
  "keywords": ["5 to 10 keywords"],
  "tags": ["3 to 6 tags"],
  "content": "the full article in markdown"
}`;
}

/**
 * Generate an article. Returns null when Gemini is unavailable or the
 * answer is not usable.
 */
export async function generateArticle(
  request: ArticleRequest
): Promise<ArticleGenerationResult> {
  if (!isGeminiConfigured()) {
    return {
      article: null,
      rejection: 'Gemini is not configured. Set GEMINI_API_KEY to generate articles.',
    };
  }

  const generated = await generateJson<GeneratedArticle>(buildPrompt(request), {
    temperature: 0.6,
    maxOutputTokens: 4096,
  });

  if (!generated) {
    const failure = getLastFailure();

    if (failure?.quotaExceeded) {
      return {
        article: null,
        rejection:
          'The Gemini free tier quota is exhausted. Wait for the quota to reset or upgrade the plan, then try again.',
      };
    }

    if (failure) {
      return { article: null, rejection: failure.message };
    }

    return {
      article: null,
      rejection: 'Gemini did not return a usable article. Try again.',
    };
  }

  const rejection = validateGeneratedArticle(generated, request);
  if (rejection) {
    return { article: null, rejection };
  }

  return { article: { ...generated, slug: generated.slug.toLowerCase() }, rejection: null };
}

/**
 * Enforce the house rules on a generated article.
 * Returns a reason when the article must be rejected.
 */
export function validateGeneratedArticle(
  article: GeneratedArticle,
  request: ArticleRequest
): string | null {
  if (!article?.title || !article?.content) {
    return 'The article has no title or no content.';
  }

  const titleCheck = validateVentureTitle({
    title: article.title,
    primaryKeyword: request.primaryKeyword,
    destination: request.destination,
  });

  if (!titleCheck.valid) {
    return `The title violates the Product Title Constitution: ${titleCheck.errors.join(' ')}`;
  }

  if (!isVentureSlugValid(article.slug)) {
    return `The slug "${article.slug}" is not valid.`;
  }

  if (!isAllowedCategory(request.category)) {
    return `"${request.category}" is not one of the 9 adventure mega categories.`;
  }

  if (article.content.length < 300) {
    return 'The article is too short to be useful.';
  }

  if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(article.content)) {
    return 'The article contains emoji.';
  }

  if (article.content.toLowerCase().includes('venture bali')) {
    return 'The article mentions the brand name, which is not allowed.';
  }

  return null;
}

/**
 * Insert the internal links to the catalogue.
 * Every mention of a product title becomes a link to that product.
 */
export function addInternalLinks(
  content: string,
  ventures: { title: string; slug: string }[]
): string {
  let result = content;

  for (const venture of ventures) {
    if (!venture.title || !venture.slug) continue;
    const link = `[${venture.title}](/experiences/${venture.slug})`;
    result = result.split(venture.title).join(link);
  }

  return result;
}

/**
 * Store a generated article.
 */
export async function saveArticle(
  article: GeneratedArticle,
  options: { publish?: boolean; ventureId?: string } = {}
): Promise<{ id: string; slug: string }> {
  const title = { en: article.title, id: article.title };
  const metaDesc = { en: article.metaDescription, id: article.metaDescription };

  const existing = await prisma.article.findUnique({ where: { slug: article.slug } });

  if (existing) {
    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: {
        title: title as unknown as object,
        content: article.content,
        metaDesc: metaDesc as unknown as object,
        keywords: article.keywords,
        tags: article.tags,
        publishedAt: options.publish === false ? null : (existing.publishedAt ?? new Date()),
        aiGenerated: true,
        ventureId: options.ventureId ?? existing.ventureId,
      },
    });
    return { id: updated.id, slug: updated.slug };
  }

  const created = await prisma.article.create({
    data: {
      slug: article.slug,
      title: title as unknown as object,
      content: article.content,
      metaDesc: metaDesc as unknown as object,
      keywords: article.keywords,
      tags: article.tags,
      publishedAt: options.publish === false ? null : new Date(),
      aiGenerated: true,
      ventureId: options.ventureId ?? null,
    },
  });

  return { id: created.id, slug: created.slug };
}

/**
 * The catalogue entries that can be linked from an article.
 */
export async function getLinkableVentures(): Promise<{ title: string; slug: string }[]> {
  const rows = await prisma.venture.findMany({
    select: { title: true, slug: true },
    orderBy: { title: 'asc' },
  });
  return rows;
}

/**
 * The category slugs available for an article, for the admin form.
 */
export function getArticleCategories(): string[] {
  return [...MEGA_CATEGORY_SLUGS];
}
