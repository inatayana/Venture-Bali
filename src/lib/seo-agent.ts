/**
 * BaliWild — Expert SEO AI Agent
 * ----------------------------
 * An expert AI agent specialized in SEO for adventure tourism in Bali.
 *
 * This agent orchestrates SEO tasks including keyword research, content auditing,
 * backlink strategy planning, and indexing management.
 */

import { prisma } from '@/lib/prisma';
import { generateJson, isGeminiConfigured } from '@/lib/gemini';
import { MEGA_CATEGORIES } from '@/lib/taxonomy';
import { validateVentureTitle } from '@/lib/titleValidator';

export interface SeoAuditResult {
  score: number;
  issues: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    target: string;
  }[];
  suggestions: string[];
}

export interface KeywordRecommendation {
  keyword: string;
  difficulty: 'low' | 'medium' | 'high';
  potential: number;
  reason: string;
}

export interface BacklinkStrategy {
  targetSites: { url: string; niche: string; method: string }[];
  outreachTemplates: { subject: string; body: string }[];
}

/**
 * Audit the SEO health of the entire catalogue or a specific product.
 */
export async function auditCatalogueSeo(): Promise<SeoAuditResult> {
  const ventures = await prisma.venture.findMany({
    select: { id: true, title: true, category: true, location: { select: { name: true } }, primaryKeyword: true },
  });

  const issues: SeoAuditResult['issues'] = [];
  let scoreTotal = 0;

  for (const venture of ventures) {
    const check = validateVentureTitle({
      title: venture.title,
      primaryKeyword: venture.primaryKeyword || `${venture.location?.name || ''} ${venture.category}`,
    });

    if (!check.valid) {
      issues.push({
        type: 'critical',
        message: `Title Constitution Violation: ${check.errors.join(', ')}`,
        target: venture.title,
      });
    } else {
      scoreTotal += 1;
    }
  }

  const averageScore = ventures.length > 0 ? (scoreTotal / ventures.length) * 100 : 0;

  return {
    score: Math.round(averageScore),
    issues,
    suggestions: [
      'Ensure all titles include a primary keyword in the first 25 characters.',
      'Audit articles for internal linking density.',
      'Target long-tail keywords like "Jungle ATV Ubud" instead of just "Bali ATV".',
    ],
  };
}

/**
 * Use Gemini to suggest new organic keywords based on current market trends
 * and BaliWild's 9-category taxonomy.
 */
export async function suggestOrganicKeywords(category?: string): Promise<KeywordRecommendation[]> {
  if (!isGeminiConfigured()) return [];

  const prompt = `You are a Senior SEO Expert for Bali adventure tourism. 
  Suggest 5 high-potential long-tail organic keywords for the ${category || 'Bali Adventure'} category.
  Stay within the BaliWild taxonomy: ${MEGA_CATEGORIES.join(', ')}.
  Focus on keywords that show high search intent for booking.
  
  Return JSON only:
  Array<{ "keyword": string, "difficulty": "low"|"medium"|"high", "potential": number, "reason": string }>`;

  const result = await generateJson<KeywordRecommendation[]>(prompt);
  return result || [];
}

/**
 * Generate a backlink outreach strategy.
 */
export async function planBacklinkStrategy(topic: string): Promise<BacklinkStrategy> {
  if (!isGeminiConfigured()) {
    return { targetSites: [], outreachTemplates: [] };
  }

  const prompt = `Develop a backlink strategy for a Bali adventure article about "${topic}".
  Identify 3 types of target sites (e.g., travel blogs, adventure news) and provide an outreach template.
  
  Return JSON only:
  {
    "targetSites": [{ "url": "example.com", "niche": "string", "method": "Guest Post | PR" }],
    "outreachTemplates": [{ "subject": "string", "body": "string" }]
  }`;

  const result = await generateJson<BacklinkStrategy>(prompt);
  return result || { targetSites: [], outreachTemplates: [] };
}

/**
 * Request indexing for a specific URL.
 * Currently a placeholder for Google Search Console API.
 */
export async function requestIndexing(url: string): Promise<{ success: boolean; message: string }> {
  // In a real implementation, this would call the Google Indexing API.
  // Requires a Service Account key (JSON) from Google Cloud.
  
  console.log(`[SEO Agent] Requesting indexing for ${url}`);
  
  return {
    success: true,
    message: `Indexing request submitted for ${url}. Google usually crawls within 24-48 hours.`,
  };
}
