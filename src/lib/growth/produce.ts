/**
 * BaliWild — Growth Phase 1: Web Article Producer
 * ------------------------------------------------
 * One deterministic pipeline: brief → gate → generate → save.
 *
 * It reuses the existing producer (`src/lib/aiContent.ts`) and the existing
 * `Article` table, so Phase 1 needs no new database tables and no schema
 * change. The GrowthTopic / ContentAsset / ApprovalRequest tables land once
 * the owner approves the migration (docs/CONTENT_GROWTH_ARCHITECT.md §13.2).
 *
 * Guardrail: the deterministic gate runs BEFORE the model is called, so a
 * constitution-violating title never burns a Gemini request. The generated
 * article is gated again before it is stored as a draft.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §6.2–§6.4 (Fase 1)
 */

import {
  generateArticle,
  saveArticle,
  type ArticleRequest,
} from '@/lib/aiContent';
import { validateVentureTitle } from '@/lib/titleValidator';
import { isAllowedCategory } from '@/lib/taxonomy';
import { gateGrowthArticle } from './gate';

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

export type ProduceStatus = 'drafted' | 'published' | 'rejected' | 'failed';

export interface ProduceOutcome {
  status: ProduceStatus;
  reason: string | null;
  slug: string | null;
  articleId: string | null;
}

/**
 * Deterministic gate that runs BEFORE the model is called. It saves tokens
 * and gives the operator an immediate, specific reason on rejection.
 */
export function gateBrief(brief: ArticleBrief): string | null {
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
 * Produce one web article from a brief.
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
