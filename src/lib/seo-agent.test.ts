import {
  auditCatalogueSeo,
  planBacklinkStrategy,
  requestIndexing,
  suggestOrganicKeywords,
} from './seo-agent';
import { prisma } from '@/lib/prisma';
import { generateJson, isGeminiConfigured } from '@/lib/gemini';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    venture: { findMany: jest.fn() },
    article: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/gemini', () => ({
  isGeminiConfigured: jest.fn(),
  generateJson: jest.fn(),
}));

const findVentures = prisma.venture.findMany as jest.Mock;
const findArticles = prisma.article.findMany as jest.Mock;
const configured = isGeminiConfigured as jest.Mock;
const json = generateJson as jest.Mock;

const GOOD_TITLE = 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls';

beforeEach(() => {
  findVentures.mockReset();
  findArticles.mockReset();
  configured.mockReset();
  json.mockReset();
  configured.mockReturnValue(false);
  findArticles.mockResolvedValue([]);
});

describe('requestIndexing', () => {
  it('never reports a fabricated success', async () => {
    const result = await requestIndexing('https://baliwild.com/blog/atv-ubud');
    expect(result.success).toBe(false);
    expect(result.status).toBe('not_configured');
    expect(result.message).toContain('belum dikonfigurasi');
  });

  it('rejects non-https or invalid URLs', async () => {
    const result = await requestIndexing('http://baliwild.com/blog/atv-ubud');
    expect(result.success).toBe(false);
    expect(result.status).toBe('invalid_url');
  });
});

describe('auditCatalogueSeo', () => {
  it('audits real fields and derives suggestions from the issues found', async () => {
    findVentures.mockResolvedValue([
      {
        id: 'v1',
        slug: 'ubud-atv-jungle-ride',
        title: GOOD_TITLE,
        category: 'ATV & Off-Road',
        primaryKeyword: 'Ubud ATV',
        imageUrl: '/images/atv-ubud.svg',
        faqs: [{ question: 'How long?', answer: 'Two hours.' }],
      },
      {
        id: 'v2',
        slug: 'Bad_Slug!',
        title: 'Bad',
        category: 'Rafting',
        primaryKeyword: null,
        imageUrl: '',
        faqs: [],
      },
    ]);
    findArticles.mockResolvedValue([
      {
        slug: 'rafting-guide',
        title: { en: 'Ayung Rafting Guide' },
        metaDesc: {},
        content: 'No product links here.',
        publishedAt: null,
      },
    ]);

    const result = await auditCatalogueSeo();
    expect(result.checkedItems).toBe(14); // 5 product checks x2 + 4 article checks
    expect(result.score).toBeLessThan(100);
    expect(result.issues.some((issue) => issue.target === 'Bad_Slug!')).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes('no internal link'))).toBe(true);
    expect(result.suggestions.join(' ')).toContain('primaryKeyword');
    expect(result.suggestions.join(' ')).toContain('/experiences/');
  });
});

describe('suggestOrganicKeywords', () => {
  it('derives keywords from the catalogue when Gemini is unavailable', async () => {
    findVentures.mockResolvedValue([
      {
        title: GOOD_TITLE,
        category: 'ATV & Off-Road',
        primaryKeyword: 'Ubud ATV',
        location: { name: 'Ubud' },
      },
    ]);

    const result = await suggestOrganicKeywords();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.source === 'catalogue')).toBe(true);
    expect(result.some((item) => item.keyword === 'Ubud ATV')).toBe(true);
    expect(result.every((item) => item.reason.length > 0)).toBe(true);
  });

  it('falls back to the catalogue when Gemini returns invalid data', async () => {
    configured.mockReturnValue(true);
    json.mockResolvedValue({ not: 'an array' });
    findVentures.mockResolvedValue([
      {
        title: GOOD_TITLE,
        category: 'ATV & Off-Road',
        primaryKeyword: 'Ubud ATV',
        location: { name: 'Ubud' },
      },
    ]);

    const result = await suggestOrganicKeywords();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.source === 'catalogue')).toBe(true);
  });

  it('validates a Gemini answer field by field', async () => {
    configured.mockReturnValue(true);
    json.mockResolvedValue([
      { keyword: 'Ubud ATV', difficulty: 'impossible', potential: 9000, reason: 42 },
      { keyword: '   ', difficulty: 'low', potential: 1, reason: 'empty' },
    ]);
    findVentures.mockResolvedValue([]);

    const result = await suggestOrganicKeywords();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      keyword: 'Ubud ATV',
      difficulty: 'medium',
      potential: 100,
      source: 'gemini',
    });
    expect(result[0].reason).toBe('');
  });
});

describe('planBacklinkStrategy', () => {
  it('returns a labelled template instead of invented targets without Gemini', async () => {
    const result = await planBacklinkStrategy('Ubud ATV');
    expect(result.targetSites).toEqual([]);
    expect(result.source).toBe('template');
    expect(result.note).toContain('belum terverifikasi');
    expect(result.outreachTemplates[0].subject).toContain('Ubud ATV');
  });

  it('filters out non-https or malformed URLs from a Gemini answer', async () => {
    configured.mockReturnValue(true);
    json.mockResolvedValue({
      targetSites: [
        { url: 'http://spam.example', niche: 'blog', method: 'Guest Post' },
        { url: 'not-a-url', niche: 'blog', method: 'PR' },
        { url: 'https://travel.example/guide', niche: 'travel', method: 'Guest Post' },
      ],
      outreachTemplates: [{ subject: 'Hello', body: 'Body' }],
    });

    const result = await planBacklinkStrategy('Ubud ATV');
    expect(result.targetSites).toHaveLength(1);
    expect(result.targetSites[0].url).toBe('https://travel.example/guide');
  });
});
