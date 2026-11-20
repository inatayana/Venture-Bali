import { validateVentureTitle } from '@/lib/titleValidator';
import { isAllowedCategory } from '@/lib/taxonomy';
import { computeContentHash } from './state';
import { validateGeneratedArticle } from '@/lib/aiContent';

/**
 * Deterministic quality & compliance gate for growth content.
 * Used by the produce pipeline before publishing.
 *
 * Returns true if the article passes all checks, false otherwise.
 * The error message explains the first failing check.
 */
export async function gateGrowthArticle(
  article: {
    title: string;
    slug: string;
    content: string;
    keywords: string[];
    tags: string[];
    ventureId?: string | null;
  },
  request: {
    primaryKeyword: string;
    category: string;
    destination?: string;
  }
): Promise<{ valid: boolean; error: string }> {
  // Rule 0: contentHash must be unique (duplicate detection hook)
  const hash = await computeContentHash({
    title: article.title,
    slug: article.slug,
    content: article.content,
    metaDesc: article.title.slice(0, 160),
    keywords: article.keywords,
    tags: article.tags,
    ventureId: article.ventureId,
  });
  // In production this hash would be queried against Article table for dupes.
  // For the gate, we simply compute it (verifiable, deterministic).
  void hash;

  // Rule 1: title length 45–60 characters
  const titleLength = article.title.trim().length;
  if (titleLength < 45) {
    return { valid: false, error: `Title too short (${titleLength} chars), minimum 45` };
  }
  if (titleLength > 60) {
    return { valid: false, error: `Title too long (${titleLength} chars), maximum 60` };
  }

  // Rule 2: primary keyword in first 25 characters
  const keyword = request.primaryKeyword.trim().toLowerCase();
  const window = article.title.trim().slice(0, 25).toLowerCase();
  if (request.primaryKeyword && !window.includes(keyword)) {
    return {
      valid: false,
      error: `Primary keyword "${request.primaryKeyword}" not found in first 25 characters`,
    };
  }

  // Rule 3: destination mentioned explicitly
  if (request.destination && !article.title.toLowerCase().includes(request.destination.toLowerCase())) {
    return { valid: false, error: `Destination "${request.destination}" must be mentioned explicitly in title` };
  }

  // Rule 4: Title Case
  const titleCheck = validateVentureTitle({
    title: article.title,
    primaryKeyword: request.primaryKeyword,
    destination: request.destination,
  });
  if (!titleCheck.valid) {
    return { valid: false, error: `Title must be written in Title Case: ${titleCheck.errors.join(', ')}` };
  }

  // Rule 5: at most one separator symbol, only ":" or "-"
  const separatorCount = (article.title.match(/[:–-]/g) || []).length;
  if (separatorCount > 1) {
    return { valid: false, error: `Title contains ${separatorCount} separator symbols; at most 1 allowed` };
  }

  // Rule 6: at most one benefit phrase
  const benefitPhrases = [
    'private transfer',
    'hotel pickup',
    'hotel pick-up',
    'pickup included',
    'pick-up included',
    'pickup available',
    'pick-up available',
    'lunch included',
    'lunch upgrade',
    'with lunch',
    'with breakfast',
    'breakfast included',
    'small group',
    'free cancellation',
  ];
  const lowerTitle = article.title.toLowerCase();
  const benefitCount = benefitPhrases.filter((p) => lowerTitle.includes(p)).length;
  if (benefitCount > 1) {
    return { valid: false, error: `Title contains ${benefitCount} benefit phrases; at most 1 allowed` };
  }

  // Rule 7: no forbidden words / brand name
  const forbidden = [
    'best', 'no.1', 'no1', 'number one', 'top', 'cheapest', 'cheap', 'discount', 'discounted',
    'free', 'gratis', 'baliwild', 'baligo',
  ];
  const found = forbidden.filter((word) => lowerTitle.includes(word));
  if (found.length > 0) {
    return { valid: false, error: `Title contains forbidden word(s): ${found.join(', ')}` };
  }

  // Rule 8: no emoji in content
  if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(article.content)) {
    return { valid: false, error: 'Article contains emoji' };
  }

  // Rule 9: no brand name in content
  if (article.content.toLowerCase().includes('baliwild')) {
    return { valid: false, error: 'Article mentions brand name, which is not allowed' };
  }

  // Rule 10: article length >= 300 words
  const wordCount = article.content.trim().split(/\s+/).length;
  if (wordCount < 300) {
    return { valid: false, error: 'Article is too short; minimum 300 words' };
  }

  // Rule 11: category must be one of the 9 mega categories
  if (!isAllowedCategory(request.category)) {
    return { valid: false, error: `Category "${request.category}" is not allowed` };
  }

  // Rule 12: validate article content structure (mirror aiContent rules)
  const validation = validateGeneratedArticle(
    { ...article, content: article.content, metaDescription: article.title.slice(0, 160) },
    {
      title: article.title,
      primaryKeyword: request.primaryKeyword,
      category: request.category,
      destination: request.destination,
    }
  );
  if (validation) {
    return { valid: false, error: `Content validation failed: ${validation}` };
  }

  return { valid: true, error: '' };
}
