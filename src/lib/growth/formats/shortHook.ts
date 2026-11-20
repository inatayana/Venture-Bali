/**
 * BaliWild — Growth Phase 2: Short Hook (TikTok/Reels) generator
 * -------------------------------------------------------------
 * Generates a short-form video hook for TikTok or Instagram Reels.
 * Pure function + Gemini call; output passes the deterministic gate
 * before being returned as a ContentAsset payload.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §2 (Phase 2 — multi-format)
 */

import { generateJson, isGeminiConfigured } from '@/lib/gemini';
import { gateGrowthArticle } from '@/lib/growth/gate';

export interface ShortHookPayload {
  readonly format: 'SHORT_HOOK';
  readonly platform: 'TIKTOK';
  readonly title: string;
  readonly caption: string;
  readonly callToAction: string;
  readonly hashtags: readonly string[];
  readonly keywords: string[];
  readonly tags: string[];
  readonly wordCount: number;
}

function buildShortHookPrompt(brief: {
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
  const shape = `{
  "title": "the hook text, <=150 chars, Title Case, keyword in first 25",
  "caption": "short caption 30-100 words with 2-5 hashtags",
  "callToAction": "Watch the full video and book your adventure!",
  "hashtags": ["#Bali", "#Adventure", "#Travel"],
  "keywords": ["5-10 keywords"],
  "wordCount": 42
}`;

  return [
    'You are a TikTok content creator for Bali adventures. Create a short video hook (first 3 seconds) that grabs attention.',
    '',
    `Title (use exactly): ${brief.title}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    `Category: ${brief.category}`,
    destLine,
    `Language: ${langName}`,
    '',
    'Rules (strict - violation = rejection):',
    '- The hook (title) must be <=150 characters and include the primary keyword in the first 25 characters.',
    '- Title Case for the title; no brand "BaliWild" anywhere.',
    '- No specific operator, partner or vendor names.',
    '- Never use the words "Best", "Cheapest", "Discount" or "Free".',
    '- No emoji.',
    '- The caption must be punchy, 30-100 words, include 2-5 relevant hashtags.',
    '- Hashtags must start with # and be relevant to Bali adventure (e.g. #Bali #Adventure #Travel).',
    '- CTA: "Watch the full video and book your adventure!" or similar.',
    '- Reply with JSON only, using exactly this shape:',
    shape,
  ].join('\n');
}

export async function generateShortHook(
  brief: {
    title: string;
    primaryKeyword: string;
    category: string;
    destination?: string;
    language?: 'en' | 'id';
  }
): Promise<{ payload: ShortHookPayload | null; rejection: string | null }> {
  if (!isGeminiConfigured()) {
    return {
      payload: null,
      rejection: 'Gemini is not configured. Set GEMINI_API_KEY to generate short hooks.',
    };
  }

  const prompt = buildShortHookPrompt(brief);
  const result = await generateJson<ShortHookPayload>(prompt, {
    temperature: 0.5,
    maxOutputTokens: 1024,
  });

  if (!result) {
    return { payload: null, rejection: 'Gemini did not return a usable short hook.' };
  }

  const titleLength = result.title.length;
  if (titleLength > 150) {
    return { payload: null, rejection: `Title too long (${titleLength} chars), max 150` };
  }
  const keyword = brief.primaryKeyword.trim().toLowerCase();
  const window = result.title.trim().slice(0, 25).toLowerCase();
  if (!window.includes(keyword)) {
    return { payload: null, rejection: `Primary keyword "${brief.primaryKeyword}" not in first 25 chars of hook` };
  }

  const gate = await gateGrowthArticle(
    {
      title: result.title,
      slug: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'hook',
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

  const payload: ShortHookPayload = {
    format: 'SHORT_HOOK',
    platform: 'TIKTOK',
    title: result.title,
    caption: result.caption,
    callToAction: result.callToAction,
    hashtags: result.hashtags,
    keywords: result.keywords,
    tags: result.tags,
    wordCount: result.wordCount,
  };

  return { payload, rejection: null };
}