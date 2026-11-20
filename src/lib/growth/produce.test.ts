import { gateBrief, produceArticle, type ArticleBrief } from './produce';

jest.mock('@/lib/aiContent', () => ({
  generateArticle: jest.fn(),
  saveArticle: jest.fn(),
  validateGeneratedArticle: jest.fn(() => null),
}));

import { generateArticle, saveArticle } from '@/lib/aiContent';

const mockedGenerate = generateArticle as jest.MockedFunction<typeof generateArticle>;
const mockedSave = saveArticle as jest.MockedFunction<typeof saveArticle>;

const VALID_BRIEF: ArticleBrief = {
  title: 'Ubud Rafting Guide for First Time Visitors in Bali',
  primaryKeyword: 'Ubud rafting',
  category: 'Rafting',
  destination: 'Ubud',
  language: 'en',
};

const LONG_CONTENT = 'Rafting in Ubud is a practical activity for every visitor. '.repeat(50);

function generatedArticle(overrides: Record<string, unknown> = {}) {
  return {
    title: VALID_BRIEF.title,
    slug: 'ubud-rafting-guide-for-first-time-visitors',
    metaDescription: 'A practical rafting guide for first-time visitors to Ubud.',
    keywords: ['ubud rafting', 'bali rafting'],
    tags: ['rafting', 'ubud'],
    content: LONG_CONTENT,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('gateBrief', () => {
  it('accepts a brief that passes every rule', () => {
    expect(gateBrief(VALID_BRIEF)).toBeNull();
  });

  it('rejects a title shorter than 45 characters', () => {
    expect(gateBrief({ ...VALID_BRIEF, title: 'Ubud Rafting' })).toMatch(/too short/i);
  });

  it('rejects a title containing a forbidden word', () => {
    const reason = gateBrief({
      ...VALID_BRIEF,
      title: 'Best Ubud Rafting Guide For First Time Visitors',
    });
    expect(reason).toMatch(/forbidden/i);
  });

  it('rejects a category outside the 9 mega categories', () => {
    expect(gateBrief({ ...VALID_BRIEF, category: 'Hotel' })).toMatch(/9 adventure mega categories/i);
  });

  it('rejects a title whose keyword is not in the first 25 characters', () => {
    const reason = gateBrief({
      ...VALID_BRIEF,
      title: 'A Complete Guide For First Time Visitors To Ubud Rafting',
    });
    expect(reason).toMatch(/first 25/i);
  });
});

describe('produceArticle', () => {
  it('produces and saves a draft for a valid brief', async () => {
    mockedGenerate.mockResolvedValueOnce({ article: generatedArticle(), rejection: null });
    mockedSave.mockResolvedValueOnce({ id: 'art-1', slug: 'ubud-rafting-guide-for-first-time-visitors' });

    const outcome = await produceArticle(VALID_BRIEF);

    expect(outcome).toEqual({
      status: 'drafted',
      reason: null,
      slug: 'ubud-rafting-guide-for-first-time-visitors',
      articleId: 'art-1',
    });
    expect(mockedSave).toHaveBeenCalledWith(expect.anything(), { publish: false });
  });

  it('publishes directly when autoPublish is on', async () => {
    mockedGenerate.mockResolvedValueOnce({ article: generatedArticle(), rejection: null });
    mockedSave.mockResolvedValueOnce({ id: 'art-2', slug: 'ubud-rafting-guide-for-first-time-visitors' });

    const outcome = await produceArticle({ ...VALID_BRIEF, autoPublish: true });

    expect(outcome.status).toBe('published');
    expect(mockedSave).toHaveBeenCalledWith(expect.anything(), { publish: true });
  });

  it('rejects a bad brief without calling Gemini', async () => {
    const outcome = await produceArticle({ ...VALID_BRIEF, title: 'Too Short' });

    expect(outcome.status).toBe('rejected');
    expect(outcome.reason).toMatch(/Title rejected/i);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it('fails cleanly when Gemini is unavailable', async () => {
    mockedGenerate.mockResolvedValueOnce({
      article: null,
      rejection: 'Gemini is not configured. Set GEMINI_API_KEY to generate articles.',
    });

    const outcome = await produceArticle(VALID_BRIEF);

    expect(outcome.status).toBe('failed');
    expect(outcome.reason).toMatch(/Gemini/i);
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it('rejects generated content that fails the compliance gate', async () => {
    mockedGenerate.mockResolvedValueOnce({
      article: generatedArticle({ content: 'This mentions BaliWild in the body. '.repeat(20) }),
      rejection: null,
    });

    const outcome = await produceArticle(VALID_BRIEF);

    expect(outcome.status).toBe('rejected');
    expect(outcome.reason).toMatch(/brand name/i);
    expect(mockedSave).not.toHaveBeenCalled();
  });
});
