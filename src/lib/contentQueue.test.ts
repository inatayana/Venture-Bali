import { buildDeterministicArticle, runContentQueue } from './contentQueue';
import { buildArticlePlan } from './contentPlan';
import { prisma } from '@/lib/prisma';
import { generateArticle, saveArticle, validateGeneratedArticle, type GeneratedArticle } from '@/lib/aiContent';
import { isGeminiConfigured } from '@/lib/gemini';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    venture: { findMany: jest.fn() },
    article: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/gemini', () => ({
  isGeminiConfigured: jest.fn(),
}));

jest.mock('@/lib/aiContent', () => {
  const actual = jest.requireActual('@/lib/aiContent') as Record<string, unknown>;
  return {
    ...actual,
    generateArticle: jest.fn(),
    saveArticle: jest.fn(),
    getLinkableVentures: jest.fn(),
    addInternalLinks: jest.fn((content: string) => content),
  };
});

const findVentures = prisma.venture.findMany as jest.Mock;
const findArticles = prisma.article.findMany as jest.Mock;
const generate = generateArticle as jest.Mock;
const save = saveArticle as jest.Mock;
const configured = isGeminiConfigured as jest.Mock;

const venture = {
  id: 'v1',
  title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
  primaryKeyword: 'Ubud ATV',
  category: 'ATV & Off-Road',
  shortDescription: 'Ride a quad bike through Ubud rice terraces and jungle tracks with a local guide.',
  duration: '2 hours',
  highlights: ['Rice terrace track', 'Waterfall stop', 'Safety briefing'],
  inclusions: ['Helmet', 'Guide', 'Refreshment'],
  faqs: [{ question: 'Is prior experience needed?', answer: 'No, beginners are welcome.' }],
  meetingPoint: 'Ubud ATV Base Camp, Payangan',
  location: { name: 'Ubud, Gianyar, Bali' },
};

beforeEach(() => {
  findVentures.mockReset().mockResolvedValue([venture]);
  findArticles.mockReset().mockResolvedValue([]);
  generate.mockReset().mockResolvedValue({ article: null, rejection: 'Gemini is not configured.' });
  save.mockReset().mockResolvedValue({ id: 'a1', slug: 'slug' });
  configured.mockReset().mockReturnValue(false);
});

describe('buildDeterministicArticle', () => {
  it('uses real catalogue fields and passes the content constitution', () => {
    const item = buildArticlePlan([venture])[0];
    const article = buildDeterministicArticle(item, venture);

    expect(article.content).toContain('2 hours');
    expect(article.content).toContain('Ubud ATV Base Camp');
    expect(validateGeneratedArticle(article, {
      title: item.title,
      primaryKeyword: item.primaryKeyword,
      category: item.category,
      destination: item.destination,
    })).toBeNull();
  });
});

describe('runContentQueue', () => {
  it('persists a grounded article when Gemini is unavailable', async () => {
    const result = await runContentQueue({ now: new Date(0), limit: 1, useGemini: false });

    expect(result.planned).toBeGreaterThan(100);
    expect(result.attempted).toBe(1);
    expect(result.deterministic).toBe(1);
    expect(result.generated).toBe(0);
    expect(save).toHaveBeenCalledTimes(1);
    const article = save.mock.calls[0][0] as GeneratedArticle;
    expect(article.content).toContain('2 hours');
  });

  it('stops cleanly when the Gemini quota is exhausted', async () => {
    generate.mockResolvedValue({
      article: null,
      rejection: 'The Gemini free tier quota is exhausted.',
    });

    const result = await runContentQueue({ now: new Date(0), limit: 3, useGemini: true });

    expect(result.quotaExceeded).toBe(true);
    expect(result.attempted).toBe(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('skips slugs that are already stored', async () => {
    const plan = buildArticlePlan([venture]);
    findArticles.mockResolvedValue(plan.map((item) => ({ slug: item.slug })));

    const result = await runContentQueue({ now: new Date(0), limit: 1, useGemini: false });

    expect(result.due).toBe(0);
    expect(save).not.toHaveBeenCalled();
  });

  it('caps the run at the requested limit', async () => {
    const result = await runContentQueue({ now: new Date(0), limit: 2, useGemini: false });
    expect(result.attempted).toBeLessThanOrEqual(2);
  });
});
