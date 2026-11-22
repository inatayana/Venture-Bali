import {
  DESTINATIONS,
  buildEditorialIntro,
  buildPageSlug,
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
});

describe('passesQualityGate', () => {
  const base = {
    productCount: 3,
    approvedReviewCount: 1,
    intro,
    title: 'ATV & Off-Road in Ubud: Guided Bali Adventure',
  };

  it('accepts a page backed by real products and approved reviews', () => {
    expect(passesQualityGate(base)).toBe(true);
  });

  it.each([
    ['fewer than two products', { productCount: 1 }],
    ['no approved reviews', { approvedReviewCount: 0 }],
    ['thin intro', { intro: 'Short intro.' }],
    ['brand in title', { title: 'BaliWild ATV in Ubud Guided Adventure Package' }],
    ['forbidden claim', { title: 'Best ATV in Ubud Guided Bali Adventure' }],
  ])('rejects %s', (_label, override) => {
    expect(passesQualityGate({ ...base, ...override })).toBe(false);
  });
});

describe('buildEditorialIntro', () => {
  it('is unique per destination and free of forbidden claims', () => {
    const ubud = buildEditorialIntro(
      { activitySlug: 'atv', activityName: 'ATV & Off-Road', destination: DESTINATIONS[0] },
      3
    );
    const kintamani = buildEditorialIntro(
      { activitySlug: 'trekking', activityName: 'Trekking & Hiking', destination: DESTINATIONS[1] },
      2
    );
    expect(ubud).toContain('Ubud, Gianyar');
    expect(kintamani).toContain('Kintamani, Bangli');
    expect(ubud).not.toBe(kintamani);
    expect(ubud.toLowerCase()).not.toContain('zero foreign vendors');
    expect(ubud.toLowerCase()).not.toContain('cheapest');
  });
});
