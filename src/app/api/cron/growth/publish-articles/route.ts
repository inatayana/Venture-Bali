import { NextRequest, NextResponse } from 'next/server';
import { produceArticle } from '@/lib/growth/produce';

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
 * Example:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://app/api/cron/growth/publish-articles?title=...&primaryKeyword=...&category=rafting"
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §6.3, §10.1
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
    const outcome = await produceArticle({
      title,
      primaryKeyword,
      category,
      destination,
      language,
      autoPublish,
    });

    return NextResponse.json({ success: true, data: outcome });
  } catch (error) {
    console.error('Growth publish-articles cron failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Growth publish job failed' } },
      { status: 500 }
    );
  }
}
