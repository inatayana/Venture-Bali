/**
 * BaliWild — Growth Phase 2: FAQ Block generator (AI_ANSWER)
 * ----------------------------------------------------------
 * Generates structured FAQ blocks for AI answer engines and on-page FAQs.
 * Pure function + Gemini call; output passes the deterministic gate
 * before being returned as a ContentAsset payload.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §2 (Phase 2 — multi-format)
 */

import { generateJson, isGeminiConfigured } from '@/lib/gemini';
import { gateGrowthArticle } from '@/lib/growth/gate';

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export interface FaqBlockPayload {
  readonly format: 'FAQ_BLOCK';
  readonly platform: 'AI_ANSWER';
  readonly title: string;
  readonly faqs: readonly FaqItem[];
  readonly keywords: string[];
  readonly tags: string[];
  readonly totalQuestions: number;
}

function buildFaqBlockPrompt(brief: {
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
    'You are a Bali travel writer. Create a FAQ block for a Bali adventure activity.',
    '',
    `Title (use exactly): ${brief.title}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    `Category: ${brief.category}`,
    destLine,
    `Language: ${langName}`,
    '',
    'Rules (strict - violation = rejection):',
    '- No brand "BaliWild" anywhere.',
    '- No specific operator, partner or vendor names.',
    '- Never use the words "Best", "Cheapest", "Discount" or "Free".',
    '- No emoji.',
    '- 3-7 question/answer pairs. Each answer 20-60 words, practical and specific.',
    '- Questions must end with "?" and cover: what it is, who it suits, what to bring, safety, cost range (IDR), and booking.',
    '- Reply with JSON only, using exactly this shape:',
    '{',
    '  "title": "the title, Title Case, <=60 chars, keyword in first 25",',
    '  "faqs": [',
    '    {"question": "What is the activity all about?", "answer": "..."},',
    '    {"question": "Who is this suitable for?", "answer": "..."}',
    '  ],',
    '  "keywords": ["5-10 keywords"],',
    '  "tags": ["3-6 tags"],',
    '  "totalQuestions": 5',
    '}',
  ].join('\n');
}

export async function generateFaqBlock(
  brief: {
    title: string;
    primaryKeyword: string;
    category: string;
    destination?: string;
    language?: 'en' | 'id';
  }
): Promise<{ payload: FaqBlockPayload | null; rejection: string | null }> {
  if (!isGeminiConfigured()) {
    return {
      payload: null,
      rejection: 'Gemini is not configured. Set GEMINI_API_KEY to generate FAQ blocks.',
    };
  }

  const prompt = buildFaqBlockPrompt(brief);
  const result = await generateJson<FaqBlockPayload>(prompt, {
    temperature: 0.4,
    maxOutputTokens: 2048,
  });

  if (!result) {
    return { payload: null, rejection: 'Gemini did not return a usable FAQ block.' };
  }

  if (!Array.isArray(result.faqs) || result.faqs.length < 2) {
    return { payload: null, rejection: 'FAQ block must contain at least 2 Q&A pairs.' };
  }
  const badQuestion = result.faqs.find((f) => !f.question?.trim().endsWith('?'));
  if (badQuestion) {
    return { payload: null, rejection: `Question "${badQuestion.question}" must end with '?'` };
  }

  const gate = await gateGrowthArticle(
    {
      title: result.title,
      slug: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'faq',
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

  if (result.faqs.length < 3 || result.faqs.length > 7) {
    return {
      payload: null,
      rejection: `FAQ block must have 3-7 questions, got ${result.faqs.length}`,
    };
  }

  const payload: FaqBlockPayload = {
    format: 'FAQ_BLOCK',
    platform: 'AI_ANSWER',
    title: result.title,
    faqs: result.faqs,
    keywords: result.keywords,
    tags: result.tags,
    totalQuestions: result.faqs.length,
  };

  return { payload, rejection: null };
}