/**
 * BaliWild — Growth Phase 2: Social Post (Facebook) generator
 * ------------------------------------------------------------
 * Generates a Facebook post for a topic brief.
 * Pure function + Gemini call; output passes the deterministic gate
 * before being returned as a ContentAsset payload.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §2 (Phase 2 — multi-format)
 */

import { generateJson, isGeminiConfigured } from '@/lib/gemini';
import { gateGrowthArticle } from '@/lib/growth/gate';

export interface SocialPostPayload {
  readonly format: 'SOCIAL_POST';
  readonly platform: 'FACEBOOK';
  readonly title: string;
  readonly body: string;
  readonly callToAction: string;
  readonly hashtags: readonly string[];
  readonly keywords: string[];
  readonly tags: string[];
  readonly wordCount: number;
}

function buildSocialPostPrompt(brief: {
  title: string;
  primaryKeyword: string;
  category: string;
  destination?: string;
  language?: 'en' | 'id';
}): string {
  const lang = brief.language ?? 'en';
  const langName = lang === 'id' ? 'Bahasa Indonesia' : 'English';
  const destLine = brief.destination
    ? `Destination: ${brief.destination}`
    : '';

  return [
    'You are a Bali adventure brand content writer. Create a Facebook post for a Bali adventure activity.',
    '',
    `Title (use exactly): ${brief.title}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    `Category: ${brief.category}`,
    destLine,
    `Language: ${langName}`,
    '',
    'Rules (strict - violation = rejection):',
    '- Friendly, practical tone; no brand "BaliWild" anywhere.',
    '- No specific operator, partner or vendor names.',
    '- Never use the words "Best", "Cheapest", "Discount" or "Free".',
    '- No emoji.',
    '- Body: 40-80 words, practical hook, mention booking modes (activity location OR private transfer with hotel pickup).',
    '- CTA: "Explore and book at the link below."',
    '- Reply with JSON only, using exactly this shape:',
    '{',
    '  "title": "the title, Title Case, <=60 chars, keyword in first 25",',
    '  "body": "the Facebook post text 40-80 words",',
    '  "callToAction": "Explore and book at the link below.",',
    '  "hashtags": ["#Bali", "#Adventure"],',
    '  "keywords": ["5-10 keywords"],',
    '  "tags": ["3-6 tags"],',
    '  "wordCount": 55',
    '}',
  ].join('\n');
}

export async function generateSocialPost(
  brief: {
    title: string;
    primaryKeyword: string;
    category: string;
    destination?: string;
    language?: 'en' | 'id';
  }
): Promise<{ payload: SocialPostPayload | null; rejection: string | null }> {
  if (!isGeminiConfigured()) {
    return {
      payload: null,
      rejection: 'Gemini is not configured. Set GEMINI_API_KEY to generate social posts.',
    };
  }

  const prompt = buildSocialPostPrompt(brief);
  const result = await generateJson<SocialPostPayload>(prompt, {
    temperature: 0.5,
    maxOutputTokens: 1024,
  });

  if (!result) {
    return { payload: null, rejection: 'Gemini did not return a usable social post.' };
  }

  const wordCount = result.body.trim().split(/\s+/).length;
  if (wordCount < 20 || wordCount > 80) {
    return { payload: null, rejection: `Post body too short (${wordCount} words), need 20-80` };
  }

  const gate = await gateGrowthArticle(
    {
      title: result.title,
      slug: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'social',
      content: JSON.stringify(result),
      keywords: result.keywords,
      tags: result.tags,
    },
    {
      primaryKeyword: brief.primaryKeyword,
      category: brief.category,
      destination: brief.destination,
    }
  );

  if (!gate.valid) {
    return { payload: null, rejection: 'Gate rejected: ' + gate.error };
  }

  const payload: SocialPostPayload = {
    format: 'SOCIAL_POST',
    platform: 'FACEBOOK',
    title: result.title,
    body: result.body,
    callToAction: result.callToAction,
    hashtags: result.hashtags,
    keywords: result.keywords,
    tags: result.tags,
    wordCount,
  };

  return { payload, rejection: null };
}
