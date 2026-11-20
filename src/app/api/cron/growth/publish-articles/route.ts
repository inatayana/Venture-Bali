import { NextRequest, NextResponse } from 'next/server';
import { produceArticle, produceAsset, type AssetFormat } from '@/lib/growth/produce';

export const dynamic = 'force-dynamic';

/**
 * Growth Phase 1 — web article producer cron.
 *
 * Produces ONE gated web article per invocation from an explicit brief.
 * The brief is passed as query params because the GrowthTopic table does not
 * exist yet (owner-approved migration pending, spec §13.2). Once it lands,
 * this route will read `TRIAGED` topics from the table instead.
 *
 * Publication stays human-gated by default (`autoPublish=false`): the job
 * stores a draft in the `Article` table, and an operator publishes it from
 * the admin panel. This matches spec §7.1 (main blog publish = APPROVAL).
 *
 * Phase 2: adds the `format` query param to produce multi-format assets:
 *   format=VIDEO_SCRIPT | SHORT_HOOK | SOCIAL_POST | FAQ_BLOCK | ARTICLE (default)
 *
 * For non-ARTICLE formats the asset is returned in-memory (no DB persistence
 * yet — ContentAsset table awaits owner-approved migration, §13.2).
 *
 * Example:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://app/api/cron/growth/publish-articles?title=...&primaryKeyword=...&category=rafting"
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §6.3, §6.4, §8 (Fase 2)
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron token' } },
      { status: 401 }
    );
  }

  const sp = request.nextUrl.searchParams;
  const title = (sp.get('title') ?? '').trim();
  const primaryKeyword = (sp.get('primaryKeyword') ?? '').trim();
  const category = (sp.get('category') ?? '').trim();
  const destination = (sp.get('destination') ?? '').trim() || undefined;
  const languageParam = sp.get('language');
  const language: 'en' | 'id' = languageParam === 'en' ? 'en' : 'id';
  const autoPublish = sp.get('autoPublish') === 'true';

  const formatParam = (sp.get('format') ?? 'ARTICLE').trim().toUpperCase();
  const VALID_FORMATS: readonly AssetFormat[] = ['ARTICLE', 'VIDEO_SCRIPT', 'SHORT_HOOK', 'SOCIAL_POST', 'FAQ_BLOCK'];
  if (!VALID_FORMATS.includes(formatParam as AssetFormat)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}.`,
        },
      },
      { status: 400 }
    );
  }

  if (!title || !primaryKeyword || !category) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Provide "title", "primaryKeyword" and "category" query params.',
        },
      },
      { status: 400 }
    );
  }

  try {
    if (formatParam === 'ARTICLE') {
      const outcome = await produceArticle({
        title,
        primaryKeyword,
        category,
        destination,
        language,
        autoPublish,
      });

      return NextResponse.json({ success: true, data: outcome });
    }

    const brief = {
      title,
      primaryKeyword,
      category,
      destination,
      language,
    };

    const outcome = await produceAsset({
      ...brief,
      format: formatParam as AssetFormat,
    });

    const data = outcome.status === 'generated'
      ? { asset: outcome.payload, contentHash: outcome.contentHash }
      : { outcome };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Growth publish-articles cron failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Growth publish job failed' } },
      { status: 500 }
    );
  }
}
