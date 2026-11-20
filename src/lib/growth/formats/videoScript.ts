/**
 * BaliWild — Growth Phase 2: Video Script (YouTube) generator
 * -------------------------------------------------------------
 * Generates a structured YouTube video script from a topic brief.
 * Pure function + Gemini call; output passes the deterministic gate
 * before being returned as a ContentAsset payload.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §2 (Phase 2 — multi-format)
 */

import { generateJson, isGeminiConfigured } from '@/lib/gemini';
import { gateGrowthArticle } from '@/lib/growth/gate';

export interface VideoScriptPayload {
  readonly format: 'VIDEO_SCRIPT';
  readonly platform: 'YOUTUBE';
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly {
    title: string;
    duration: string;
    summary: string;
  }[];
  readonly cta: string;
  readonly estimatedDuration: string;
  readonly keywords: string[];
  readonly tags: string[];
}

function buildVideoScriptPrompt(brief: {
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
  "title": "the title, unchanged",
  "intro": "hook paragraph (first 30s, must include keyword in first 25 chars)",
  "sections": [
    {"title": "## Main Activity", "duration": "2:30", "summary": "what the activity is"},
    {"title": "## Safety & How-to", "duration": "3:00", "summary": "how to do it safely"},
    {"title": "## Highlights", "duration": "1:30", "summary": "best bits / scenery"},
    {"title": "## Booking", "duration": "0:30", "summary": "CTA with booking modes"}
  ],
  "cta": "Check availability and book your adventure at the activity location, or choose private transfer with hotel pickup.",
  "estimatedDuration": "7"
}`;

  return [
    'You are a Bali content creator. Produce a YouTube video script for a Bali adventure activity.',
    '',
    `Title (use exactly): ${brief.title}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    `Category: ${brief.category}`,
    destLine,
    `Language: ${langName}`,
    '',
    'Rules (strict - violation = rejection):',
    '- Opens with a hook in the first 30 seconds that includes the primary keyword naturally in the first 25 characters.',
    '- Title Case for the title; no brand "BaliWild" anywhere.',
    '- No specific operator, partner or vendor names.',
    '- Never use the words "Best", "Cheapest", "Discount" or "Free".',
    '- No emoji.',
    '- Structure: Hook -> Main Activity -> Safety/How-to -> Highlights/CTA.',
    '- CTA: "Check availability and book your adventure at the activity location, or choose private transfer with hotel pickup."',
    '- End with estimated total duration in minutes (integer 5-60).',
    '- Reply with JSON only, using exactly this shape:',
    shape,
  ].join('\n');
}

export async function generateVideoScript(
  brief: {
    title: string;
    primaryKeyword: string;
    category: string;
    destination?: string;
    language?: 'en' | 'id';
  }
): Promise<{ payload: VideoScriptPayload | null; rejection: string | null }> {
  if (!isGeminiConfigured()) {
    return {
      payload: null,
      rejection: 'Gemini is not configured. Set GEMINI_API_KEY to generate video scripts.',
    };
  }

  const prompt = buildVideoScriptPrompt(brief);
  const result = await generateJson<VideoScriptPayload>(prompt, {
    temperature: 0.5,
    maxOutputTokens: 2048,
  });

  if (!result) {
    return { payload: null, rejection: 'Gemini did not return a usable video script.' };
  }

  const gate = await gateGrowthArticle(
    {
      title: result.title,
      slug: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'video',
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

  const payload: VideoScriptPayload = {
    format: 'VIDEO_SCRIPT',
    platform: 'YOUTUBE',
    title: result.title,
    intro: result.intro,
    sections: result.sections,
    cta: result.cta,
    estimatedDuration: result.estimatedDuration + ' min',
    keywords: result.keywords,
    tags: result.tags,
  };

  return { payload, rejection: null };
}