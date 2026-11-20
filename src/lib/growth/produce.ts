/**
 * BaliWild — Growth: Article & Multi-Format Producer
 * ---------------------------------------------------
 * Phase 1: web article pipeline (brief → gate → generate → save)
 * Phase 2: multi-format producer (VIDEO_SCRIPT, SHORT_HOOK, SOCIAL_POST, FAQ_BLOCK)
 *
 * Phase 1 reuses the existing Article table. Phase 2 returns in-memory payloads
 * (no DB persistence yet — GrowthTopic/ContentAsset tables await owner-approved
 * migration per docs/CONTENT_GROWTH_ARCHITECT.md §13.2).
 *
 * Guardrail: the deterministic gate runs BEFORE the model is called, so a
 * constitution-violating title never burns a Gemini request. The generated
 * asset is gated again before being returned.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §6.2–§6.4 (Fase 1), §8 (Fase 2)
 */

import {
  generateArticle,
  saveArticle,
  type ArticleRequest,
} from '@/lib/aiContent';
import { validateVentureTitle } from '@/lib/titleValidator';
import { isAllowedCategory } from '@/lib/taxonomy';
import { gateGrowthArticle } from './gate';
import {
  generateVideoScript,
  type VideoScriptPayload,
  generateShortHook,
  type ShortHookPayload,
  generateSocialPost,
  type SocialPostPayload,
  generateFaqBlock,
  type FaqBlockPayload,
  type GrowthFormat,
} from './formats';

export interface ArticleBrief {
  /** Working title, must pass the Product Title Constitution. */
  title: string;
  /** Primary keyword the article targets. */
  primaryKeyword: string;
  /** One of the 9 mega categories (canonical name, short label or slug). */
  category: string;
  /** Optional destination, e.g. "Ubud". */
  destination?: string;
  language?: 'en' | 'id';
  /**
   * When true the article is stored already published. Default false so the
   * human approval gate (spec §7.1) stays in the loop for Phase 1.
   * Owner decision pending: §13.2 item 3.
   */
  autoPublish?: boolean;
}

export type AssetFormat = 'ARTICLE' | GrowthFormat;

export interface AssetBrief extends ArticleBrief {
  /** Output format. Default 'ARTICLE' for backward compatibility. */
  format?: AssetFormat;
  /** Target platform. Defaults by format. */
  platform?: 'WEB' | 'YOUTUBE' | 'TIKTOK' | 'FACEBOOK' | 'AI_ANSWER';
}

export type ProduceStatus = 'drafted' | 'published' | 'rejected' | 'failed';

export interface ProduceOutcome {
  status: ProduceStatus;
  reason: string | null;
  slug: string | null;
  articleId: string | null;
}

/** In-memory result for non-article formats (Phase 2). */
export interface AssetOutcome {
  status: 'generated' | 'rejected' | 'failed';
  reason: string | null;
  payload:
    | VideoScriptPayload
    | ShortHookPayload
    | SocialPostPayload
    | FaqBlockPayload
    | null;
  contentHash: string | null;
}

/**
 * Deterministic gate that runs BEFORE the model is called. It saves tokens
 * and gives the operator an immediate, specific reason on rejection.
 * Works for all formats — title constitution + taxonomy only.
 */
export function gateBrief(brief: AssetBrief): string | null {
  const titleCheck = validateVentureTitle({
    title: brief.title,
    primaryKeyword: brief.primaryKeyword,
    destination: brief.destination,
  });
  if (!titleCheck.valid) {
    return `Title rejected: ${titleCheck.errors.join(' ')}`;
  }

  if (!isAllowedCategory(brief.category)) {
    return `Category "${brief.category}" is not one of the 9 adventure mega categories.`;
  }

  return null;
}

/**
 * Produce one web article from a brief (Phase 1).
 *
 * Steps:
 *  1. Deterministic gate (title constitution + taxonomy).
 *  2. Gemini generation via `generateArticle` (which validates its own output).
 *  3. Full deterministic gate on the generated content.
 *  4. Persist to the `Article` table as a draft (or published when asked).
 */
export async function produceArticle(brief: ArticleBrief): Promise<ProduceOutcome> {
  const rejection = gateBrief(brief);
  if (rejection) {
    return { status: 'rejected', reason: rejection, slug: null, articleId: null };
  }

  const request: ArticleRequest = {
    title: brief.title,
    primaryKeyword: brief.primaryKeyword,
    category: brief.category,
    destination: brief.destination,
    language: brief.language ?? 'id',
  };

  const result = await generateArticle(request);
  if (!result.article) {
    return {
      status: 'failed',
      reason: result.rejection ?? 'Gemini did not return a usable article.',
      slug: null,
      articleId: null,
    };
  }

  const gate = await gateGrowthArticle(
    {
      title: result.article.title,
      slug: result.article.slug,
      content: result.article.content,
      keywords: result.article.keywords,
      tags: result.article.tags,
    },
    {
      primaryKeyword: brief.primaryKeyword,
      category: brief.category,
      destination: brief.destination,
    }
  );

  if (!gate.valid) {
    return { status: 'rejected', reason: gate.error, slug: null, articleId: null };
  }

  const saved = await saveArticle(result.article, { publish: brief.autoPublish === true });
  return {
    status: brief.autoPublish === true ? 'published' : 'drafted',
    reason: null,
    slug: saved.slug,
    articleId: saved.id,
  };
}

/**
 * Produce one multi-format asset from a brief (Phase 2).
 *
 * Steps:
 *  1. Deterministic gate (title constitution + taxonomy).
 *  2. Format-specific Gemini generation (video script / short hook / social post / FAQ).
 *  3. Format-specific gate + structural checks inside the generator.
 *  4. Returns in-memory payload (NOT persisted — no ContentAsset table yet).
 */
export async function produceAsset(brief: AssetBrief): Promise<AssetOutcome> {
  const rejection = gateBrief(brief);
  if (rejection) {
    return {
      status: 'rejected',
      reason: rejection,
      payload: null,
      contentHash: null,
    };
  }

  const format = brief.format ?? 'ARTICLE';
  const lang = brief.language ?? 'id';

  // Route to the correct generator
  let payload:
    | VideoScriptPayload
    | ShortHookPayload
    | SocialPostPayload
    | FaqBlockPayload
    | null = null;
  let genRejection: string | null = null;

  if (format === 'ARTICLE') {
    // Reuse Phase 1 pipeline for articles (persists to DB)
    const articleOutcome = await produceArticle(brief);
    if (articleOutcome.status === 'rejected' || articleOutcome.status === 'failed') {
      return {
        status: articleOutcome.status === 'rejected' ? 'rejected' : 'failed',
        reason: articleOutcome.reason,
        payload: null,
        contentHash: null,
      };
    }
    // Article persisted — return a minimal payload wrapper
    return {
      status: 'generated',
      reason: null,
      payload: null, // article saved to DB; caller uses articleId/slug
      contentHash: null,
    };
  }

  const generatorBrief = {
    title: brief.title,
    primaryKeyword: brief.primaryKeyword,
    category: brief.category,
    destination: brief.destination,
    language: lang,
  };

  if (format === 'VIDEO_SCRIPT') {
    const result = await generateVideoScript(generatorBrief);
    payload = result.payload;
    genRejection = result.rejection;
  } else if (format === 'SHORT_HOOK') {
    const result = await generateShortHook(generatorBrief);
    payload = result.payload;
    genRejection = result.rejection;
  } else if (format === 'SOCIAL_POST') {
    const result = await generateSocialPost(generatorBrief);
    payload = result.payload;
    genRejection = result.rejection;
  } else if (format === 'FAQ_BLOCK') {
    const result = await generateFaqBlock(generatorBrief);
    payload = result.payload;
    genRejection = result.rejection;
  } else {
    return {
      status: 'failed',
      reason: `Unknown format: ${format}`,
      payload: null,
      contentHash: null,
    };
  }

  if (genRejection) {
    return { status: 'failed', reason: genRejection, payload: null, contentHash: null };
  }

  if (!payload) {
    return {
      status: 'failed',
      reason: 'Generator returned null payload without rejection.',
      payload: null,
      contentHash: null,
    };
  }

  // Compute content hash for dupe detection (will be used when ContentAsset table lands)
  const { computeContentHash } = await import('./state');
  const contentHash = await computeContentHash({
    title: payload.title,
    slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    content: JSON.stringify(payload),
    metaDesc: '',
    keywords: payload.keywords,
    tags: payload.tags,
    ventureId: null,
  });

  return {
    status: 'generated',
    reason: null,
    payload,
    contentHash,
  };
}