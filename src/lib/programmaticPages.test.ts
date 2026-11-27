import {
  DESTINATIONS,
  buildEditorialIntro,
  buildPageSlug,
  buildPageTitle,
  isSupportedCombination,
  parsePageSlug,
  passesQualityGate,
} from './programmaticPages';

const intro = buildEditorialIntro(
  { activitySlug: 'atv', activityName: 'ATV & Off-Road', destination: DESTINATIONS[0] },
  3
);

describe('programmatic page routing', () => {
  it('builds and parses slugs', () => {
    expect(buildPageSlug('atv', 'ubud')).toBe('atv-in-ubud');
    expect(parsePageSlug('atv-in-ubud')).toEqual({ activitySlug: 'atv', destinationSlug: 'ubud' });
    expect(parsePageSlug('atv-ubud')).toBeNull();
  });

  it('only allows taxonomy-approved activity/destination pairs', () => {
    expect(isSupportedCombination('atv', 'ubud')).toBe(true);
    expect(isSupportedCombination('atv', 'nusa-penida')).toBe(false);
    expect(isSupportedCombination('hotels', 'ubud')).toBe(false);
  });

  it('never puts the brand name in a guide title', () => {
    const title = buildPageTitle('ATV & Off-Road', 'Ubud');
    expect(title).not.toMatch(/baliwild/i);
    expect(title.length).toBeLessThanOrEqual(60);
  });
});

describe('passesQualityGate', () => {
  const base = {
    productCount: 3,
    approvedReviewCount: 1,
    intro,
    title: 'ATV & Off-Road in Ubud: Guided Bali Adventure',
  };

  it('accepts a combination with real products and an approved review', () => {
    expect(passesQualityGate(base)).toBe(true);
  });

  it('rejects thin destinations', () => {
    expect(passesQualityGate({ ...base, productCount: 1 })).toBe(false);
  });

  it('rejects destinations without an approved review', () => {
    expect(passesQualityGate({ ...base, approvedReviewCount: 0 })).toBe(false);
  });

  it('rejects a templated intro that is too short', () => {
    expect(passesQualityGate({ ...base, intro: 'Short intro.' })).toBe(false);
  });

  it('rejects forbidden title words and the brand name', () => {
    expect(passesQualityGate({ ...base, title: 'Cheapest ATV in Ubud' })).toBe(false);
    expect(passesQualityGate({ ...base, title: 'BaliWild ATV in Ubud' })).toBe(false);
  });
});

describe('buildEditorialIntro', () => {
  it('is factual and deterministic', () => {
    expect(intro).toBe(
      buildEditorialIntro(
        { activitySlug: 'atv', activityName: 'ATV & Off-Road', destination: DESTINATIONS[0] },
        3
      )
    );
    expect(intro).toMatch(/Indonesian rupiah/);
    expect(intro).toMatch(/eighty percent/);
    expect(intro).not.toMatch(/baliwild/i);
  });
});
