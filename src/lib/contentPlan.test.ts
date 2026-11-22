import {
  BALI_DESTINATIONS,
  buildArticlePlan,
  selectDueArticles,
  DEFAULT_DAILY_ARTICLE_LIMIT,
  type PlanVenture,
} from './contentPlan';
import { MEGA_CATEGORIES } from '@/lib/taxonomy';
import { isVentureSlugValid, validateVentureTitle } from '@/lib/titleValidator';

const venture: PlanVenture = {
  id: 'v1',
  title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
  primaryKeyword: 'Ubud ATV',
  category: 'ATV & Off-Road',
  location: { name: 'Ubud, Gianyar, Bali' },
};

describe('buildArticlePlan', () => {
  it('builds a large backlog of constitution-valid, taxonomy-safe ideas', () => {
    const plan = buildArticlePlan([venture]);
    expect(plan.length).toBeGreaterThan(100);
    expect(plan.length).toBeLessThanOrEqual(BALI_DESTINATIONS.length * MEGA_CATEGORIES.length * 3 + 3);

    for (const item of plan) {
      expect(isVentureSlugValid(item.slug)).toBe(true);
      expect(MEGA_CATEGORIES).toContain(item.category);
      expect(validateVentureTitle({
        title: item.title,
        primaryKeyword: item.primaryKeyword,
        destination: item.destination,
      }).valid).toBe(true);
      expect(item.title.toLowerCase()).not.toContain('baliwild');
    }
  });

  it('de-duplicates slugs', () => {
    const plan = buildArticlePlan([venture, venture]);
    expect(new Set(plan.map((item) => item.slug)).size).toBe(plan.length);
  });

  it('keeps the daily cap below the Gemini free-tier budget', () => {
    expect(DEFAULT_DAILY_ARTICLE_LIMIT).toBeLessThan(20);
  });
});

describe('selectDueArticles', () => {
  const plan = buildArticlePlan([venture]);

  it('is deterministic for the same day and skips existing slugs', () => {
    const now = new Date('2026-11-22T12:00:00.000Z');
    const existing = new Set([plan[0].slug, plan[1].slug]);
    const first = selectDueArticles(plan, existing, 3, now);
    const second = selectDueArticles(plan, existing, 3, now);

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first.every((item) => !existing.has(item.slug))).toBe(true);
  });

  it('rotates to a different slice on another day', () => {
    const a = selectDueArticles(plan, new Set(), 3, new Date('2026-11-22T00:00:00.000Z'));
    const b = selectDueArticles(plan, new Set(), 3, new Date('2026-11-23T00:00:00.000Z'));
    expect(a.map((item) => item.slug)).not.toEqual(b.map((item) => item.slug));
  });

  it('returns nothing for an empty plan or a zero limit', () => {
    expect(selectDueArticles([], new Set(), 5, new Date())).toEqual([]);
    expect(selectDueArticles(plan, new Set(), 0, new Date())).toEqual([]);
  });
});
