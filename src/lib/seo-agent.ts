/**
 * BaliWild — Expert SEO AI Agent
 * ----------------------------
 * An SEO agent for Bali adventure tourism. Every number and recommendation in
 * this module is derived from the database or from an explicitly labelled
 * heuristic. Nothing here claims an action succeeded unless it actually ran.
 *
 * Guardrail (docs/AI_AGENT.md §1): tools are the source of truth; the model
 * only explains them. When Gemini is unavailable the agent degrades to
 * catalogue-derived suggestions instead of inventing data.
 */

import { prisma } from '@/lib/prisma';
import { generateJson, isGeminiConfigured } from '@/lib/gemini';
import { MEGA_CATEGORIES, resolveCategory } from '@/lib/taxonomy';
import { isVentureSlugValid, validateVentureTitle } from '@/lib/titleValidator';

export interface SeoAuditResult {
  /** Percentage of checks that passed. 0 when there is nothing to check. */
  score: number;
  issues: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    target: string;
  }[];
  /** Suggestions generated from the issues actually found, never generic filler. */
  suggestions: string[];
  checkedAt: string;
  checkedItems: number;
}

export interface KeywordRecommendation {
  keyword: string;
  difficulty: 'low' | 'medium' | 'high';
  potential: number;
  reason: string;
  /** Where the recommendation came from. Never claim "trend data" without it. */
  source?: 'gemini' | 'catalogue';
}

export interface BacklinkStrategy {
  /** Only real, syntactically valid URLs are allowed. Empty when unverified. */
  targetSites: { url: string; niche: string; method: string }[];
  outreachTemplates: { subject: string; body: string }[];
  source?: 'gemini' | 'template';
  note?: string;
}

export interface IndexingResult {
  success: boolean;
  message: string;
  status: 'not_configured' | 'invalid_url';
}

type AuditIssue = SeoAuditResult['issues'][number];

function nonEmptyJson(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}

/**
 * Audit the SEO health of the catalogue: title constitution, keyword/slug
 * hygiene, structured-data inputs on products, and internal linking/freshness
 * on published articles. Every issue points to a real row.
 */
export async function auditCatalogueSeo(): Promise<SeoAuditResult> {
  const [ventures, articles] = await Promise.all([
    prisma.venture.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        primaryKeyword: true,
        imageUrl: true,
        faqs: true,
      },
    }),
    prisma.article.findMany({
      select: {
        slug: true,
        title: true,
        metaDesc: true,
        content: true,
        publishedAt: true,
      },
    }),
  ]);

  const issues: AuditIssue[] = [];
  let passed = 0;
  let total = 0;

  function check(ok: boolean, type: AuditIssue['type'], message: string, target: string): void {
    total += 1;
    if (ok) passed += 1;
    else issues.push({ type, message, target });
  }

  for (const venture of ventures) {
    const titleCheck = validateVentureTitle({
      title: venture.title,
      primaryKeyword: venture.primaryKeyword || venture.category,
    });
    check(
      titleCheck.valid,
      'critical',
      titleCheck.valid ? '' : `Title Constitution Violation: ${titleCheck.errors.join(', ')}`,
      venture.slug
    );
    check(
      Boolean(venture.primaryKeyword && venture.primaryKeyword.trim().length > 0),
      'warning',
      'Missing primaryKeyword — long-tail targeting and internal links cannot be generated.',
      venture.slug
    );
    check(
      isVentureSlugValid(venture.slug),
      'warning',
      'Invalid product slug.',
      venture.slug
    );
    check(
      venture.imageUrl.trim().length > 0,
      'warning',
      'Missing cover image — Product/ TouristAttraction structured data will have no image.',
      venture.slug
    );
    check(
      Array.isArray(venture.faqs) && venture.faqs.length > 0,
      'info',
      'No FAQs — FAQPage rich result unavailable.',
      venture.slug
    );
  }

  for (const article of articles) {
    const hasTitle = nonEmptyJson(article.title);
    const hasMeta = nonEmptyJson(article.metaDesc);
    check(hasTitle, 'critical', 'Article has no usable title.', article.slug);
    check(hasMeta, 'warning', 'Article has no meta description.', article.slug);
    check(
      /\/experiences\//.test(article.content),
      'warning',
      'Article has no internal link to a product page.',
      article.slug
    );
    check(
      article.publishedAt != null,
      'info',
      'Article is not published.',
      article.slug
    );
  }

  const suggestions: string[] = [];
  const missingKeyword = issues.filter((i) => i.message.startsWith('Missing primaryKeyword')).length;
  const missingLinks = issues.filter((i) => i.message.includes('no internal link')).length;
  const unpublished = issues.filter((i) => i.message.includes('not published')).length;
  if (missingKeyword > 0) {
    suggestions.push(`Tambahkan primaryKeyword pada ${missingKeyword} venture agar audit dan internal linking konsisten.`);
  }
  if (missingLinks > 0) {
    suggestions.push(`Sisipkan tautan /experiences/ pada ${missingLinks} artikel untuk membangun topical authority.`);
  }
  if (unpublished > 0) {
    suggestions.push(`Publikasikan ${unpublished} artikel yang masih berstatus draft.`);
  }
  if (suggestions.length === 0 && total > 0) {
    suggestions.push('Tidak ada temuan baru. Ulangi audit setelah konten atau katalog berubah.');
  }

  return {
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    issues,
    suggestions,
    checkedAt: new Date().toISOString(),
    checkedItems: total,
  };
}

function sanitizeSuggestions(value: unknown): KeywordRecommendation[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(['low', 'medium', 'high']);
  const seen = new Set<string>();
  const result: KeywordRecommendation[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item == null) continue;
    const row = item as Record<string, unknown>;
    const keyword = typeof row.keyword === 'string' ? row.keyword.trim() : '';
    if (!keyword || keyword.length > 120 || seen.has(keyword.toLowerCase())) continue;
    const difficulty =
      typeof row.difficulty === 'string' && allowed.has(row.difficulty)
        ? (row.difficulty as KeywordRecommendation['difficulty'])
        : 'medium';
    const potential = typeof row.potential === 'number' && Number.isFinite(row.potential)
      ? Math.max(0, Math.min(100, Math.round(row.potential)))
      : 0;
    seen.add(keyword.toLowerCase());
    result.push({
      keyword,
      difficulty,
      potential,
      reason: typeof row.reason === 'string' ? row.reason.slice(0, 240) : '',
      source: 'gemini',
    });
    if (result.length >= 5) break;
  }
  return result;
}

/**
 * Deterministic, catalogue-derived keyword seeds. Used when Gemini is absent
 * or fails. `potential` counts the real products supporting the keyword; it is
 * not a fabricated search-volume estimate.
 */
function catalogueKeywords(
  rows: {
    title: string;
    category: string;
    primaryKeyword: string | null;
    location: { name: string } | null;
  }[]
): KeywordRecommendation[] {
  const result: KeywordRecommendation[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const categoryDef = resolveCategory(row.category);
    const place = row.location?.name?.trim() ?? '';
    const candidates: { keyword: string; difficulty: KeywordRecommendation['difficulty']; reason: string }[] = [];

    if (place && categoryDef) {
      candidates.push({
        keyword: `${place} ${categoryDef.short}`,
        difficulty: 'low',
        reason: `Dari katalog: ${row.title}`,
      });
    }
    if (categoryDef) {
      candidates.push({
        keyword: `${categoryDef.canonical} Bali`,
        difficulty: 'high',
        reason: `Kategori katalog: ${categoryDef.canonical}`,
      });
    }
    if (row.primaryKeyword?.trim()) {
      candidates.push({
        keyword: row.primaryKeyword.trim(),
        difficulty: 'medium',
        reason: `Primary keyword produk: ${row.title}`,
      });
    }

    for (const candidate of candidates) {
      const key = candidate.keyword.toLowerCase();
      if (!candidate.keyword || candidate.keyword.length > 120 || seen.has(key)) continue;
      seen.add(key);
      result.push({
        ...candidate,
        potential: rows.filter((other) =>
          other.title.toLowerCase().includes(candidate.keyword.split(' ')[0].toLowerCase())
        ).length,
        source: 'catalogue',
      });
      if (result.length >= 5) return result;
    }
  }
  return result;
}

/**
 * Suggest long-tail keywords. A Gemini answer is validated field by field;
 * without Gemini the seeds come from the seeded catalogue and 9-taxonomy.
 */
export async function suggestOrganicKeywords(category?: string): Promise<KeywordRecommendation[]> {
  const where = category && category.trim() ? { category: category.trim() } : undefined;
  const rows = await prisma.venture.findMany({
    where,
    select: {
      title: true,
      category: true,
      primaryKeyword: true,
      location: { select: { name: true } },
    },
    take: 50,
  });

  if (isGeminiConfigured()) {
    const categoryLabel = category?.trim() || 'Bali Adventure';
    const result = await generateJson<unknown>(
      `You are an SEO analyst for Bali adventure tourism.
Suggest 5 long-tail keywords for the ${categoryLabel} category.
Use only these categories: ${MEGA_CATEGORIES.join(', ')}.
Return JSON only: Array<{ "keyword": string, "difficulty": "low"|"medium"|"high", "potential": number, "reason": string }>`
    );
    const clean = sanitizeSuggestions(result);
    if (clean.length > 0) return clean;
  }

  return catalogueKeywords(rows);
}

function sanitizeBacklinks(value: unknown): BacklinkStrategy {
  const empty: BacklinkStrategy = {
    targetSites: [],
    outreachTemplates: [],
    source: 'gemini',
  };
  if (typeof value !== 'object' || value == null) return empty;
  const row = value as Record<string, unknown>;

  const targetSites = Array.isArray(row.targetSites)
    ? row.targetSites.flatMap((item): BacklinkStrategy['targetSites'] => {
        if (typeof item !== 'object' || item == null) return [];
        const site = item as Record<string, unknown>;
        if (typeof site.url !== 'string') return [];
        try {
          const parsed = new URL(site.url);
          if (parsed.protocol !== 'https:') return [];
        } catch {
          return [];
        }
        return [{
          url: site.url,
          niche: typeof site.niche === 'string' ? site.niche.slice(0, 120) : '',
          method: typeof site.method === 'string' ? site.method.slice(0, 120) : '',
        }];
      })
    : [];

  const outreachTemplates = Array.isArray(row.outreachTemplates)
    ? row.outreachTemplates.flatMap((item): BacklinkStrategy['outreachTemplates'] => {
        if (typeof item !== 'object' || item == null) return [];
        const template = item as Record<string, unknown>;
        if (typeof template.subject !== 'string' || typeof template.body !== 'string') return [];
        return [{ subject: template.subject.slice(0, 200), body: template.body.slice(0, 4000) }];
      })
    : [];

  return { targetSites, outreachTemplates, source: 'gemini' };
}

/**
 * Outreach planning. Without Gemini no target URLs are invented — only a
 * reusable template and an explicit note that targets need manual research.
 */
export async function planBacklinkStrategy(topic: string): Promise<BacklinkStrategy> {
  if (isGeminiConfigured()) {
    const result = await generateJson<unknown>(
      `Develop a backlink strategy for a Bali adventure article about "${topic}".
Return JSON only: { "targetSites": [{ "url": "https://...", "niche": "string", "method": "Guest Post | PR" }], "outreachTemplates": [{ "subject": "string", "body": "string" }] }`
    );
    return sanitizeBacklinks(result);
  }

  return {
    targetSites: [],
    outreachTemplates: [
      {
        subject: `Collaboration: ${topic || 'Bali adventure guide'}`,
        body: `Halo, kami menyusun panduan ${topic || 'petualangan di Bali'} berbasis data lapangan dan ingin berkolaborasi. Silakan balas jika Anda tertarik menerima drafnya.\n\n[Halaman ini belum memiliki target terverifikasi — riset manual diperlukan sebelum mengirim.]`,
      },
    ],
    source: 'template',
    note: 'Target backlink belum terverifikasi. Ini template, bukan daftar situs nyata.',
  };
}

/**
 * Indexing requests are NOT available until a Google Indexing API credential
 * is configured. This function never reports a fabricated success.
 */
export async function requestIndexing(url: string): Promise<IndexingResult> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('http is not allowed');
  } catch {
    return {
      success: false,
      message: 'URL tidak valid. Gunakan URL https:// absolut.',
      status: 'invalid_url',
    };
  }

  return {
    success: false,
    message:
      'Google Indexing API belum dikonfigurasi. Artikel tetap masuk sitemap dan akan terindeks melalui crawl normal.',
    status: 'not_configured',
  };
}
