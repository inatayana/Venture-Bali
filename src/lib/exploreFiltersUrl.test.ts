import {
  applyExploreFilters,
  DEFAULT_EXPLORE_URL_FILTERS,
  EXPLORE_SORT_VALUES,
  parseExploreFilters,
  sameExploreFilters,
} from './exploreFiltersUrl';

describe('parseExploreFilters', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseExploreFilters('')).toEqual(DEFAULT_EXPLORE_URL_FILTERS);
    expect(parseExploreFilters(new URLSearchParams())).toEqual(DEFAULT_EXPLORE_URL_FILTERS);
  });

  it('accepts every category token shape and normalises to the short label', () => {
    expect(parseExploreFilters('?category=atv').selectedCategory).toBe('ATV');
    expect(parseExploreFilters('?category=Rafting').selectedCategory).toBe('Rafting');
    expect(parseExploreFilters('?category=River%20Tubing').selectedCategory).toBe('Tubing');
    expect(parseExploreFilters('?category=quad%20bike').selectedCategory).toBe('ATV');
  });

  it('ignores unknown categories instead of throwing', () => {
    expect(parseExploreFilters('?category=hotels').selectedCategory).toBeNull();
  });

  it('keeps only known sort values', () => {
    for (const value of EXPLORE_SORT_VALUES) {
      expect(parseExploreFilters(`?sort=${value}`).sortBy).toBe(value);
    }
    expect(parseExploreFilters('?sort=top').sortBy).toBe('recommended');
    expect(parseExploreFilters('?sort=').sortBy).toBe('recommended');
  });

  it('reads the legacy logistics flags, including true/false spellings', () => {
    expect(parseExploreFilters('?transferIncluded=1&selfDrive=1&bestSeller=1')).toMatchObject({
      transferIncluded: true,
      selfDriveOnly: true,
      bestSellerOnly: true,
    });
    expect(parseExploreFilters('?transferIncluded=true&selfDrive=TRUE')).toMatchObject({
      transferIncluded: true,
      selfDriveOnly: true,
    });
    expect(parseExploreFilters('?transferIncluded=0&selfDrive=false&bestSeller=')).toMatchObject({
      transferIncluded: false,
      selfDriveOnly: false,
      bestSellerOnly: false,
    });
  });
});

describe('applyExploreFilters', () => {
  it('writes the canonical category slug and short flags', () => {
    const params = applyExploreFilters('', {
      selectedCategory: 'ATV',
      sortBy: 'rating',
      transferIncluded: true,
      selfDriveOnly: true,
      bestSellerOnly: true,
    });

    expect(params.get('category')).toBe('atv');
    expect(params.get('sort')).toBe('rating');
    expect(params.get('transferIncluded')).toBe('1');
    expect(params.get('selfDrive')).toBe('1');
    expect(params.get('bestSeller')).toBe('1');
  });

  it('drops defaults so the shared link stays short', () => {
    const params = applyExploreFilters('?category=atv&sort=rating&selfDrive=1', {
      ...DEFAULT_EXPLORE_URL_FILTERS,
    });

    expect(params.toString()).toBe('');
  });

  it('preserves search, date, guests and unrelated params', () => {
    const params = applyExploreFilters('?q=ATV&date=2027-06-15&pax=2&utm_source=newsletter', {
      selectedCategory: 'Rafting',
      sortBy: 'recommended',
      transferIncluded: false,
      selfDriveOnly: false,
      bestSellerOnly: false,
    });

    expect(params.get('q')).toBe('ATV');
    expect(params.get('date')).toBe('2027-06-15');
    expect(params.get('pax')).toBe('2');
    expect(params.get('utm_source')).toBe('newsletter');
    expect(params.get('category')).toBe('rafting');
    expect(params.has('sort')).toBe(false);
  });

  it('round-trips through parse without losing state', () => {
    const state = {
      selectedCategory: 'Snorkeling',
      sortBy: 'price-low',
      transferIncluded: true,
      selfDriveOnly: false,
      bestSellerOnly: true,
    };

    expect(parseExploreFilters(applyExploreFilters('?q=Ubud', state))).toEqual(state);
  });

  it('drops a category that is not part of the taxonomy', () => {
    const params = applyExploreFilters('?category=atv', {
      ...DEFAULT_EXPLORE_URL_FILTERS,
      selectedCategory: 'Hotels',
    });

    expect(params.has('category')).toBe(false);
  });
});

describe('sameExploreFilters', () => {
  it('compares every field', () => {
    const base = { ...DEFAULT_EXPLORE_URL_FILTERS };
    expect(sameExploreFilters(base, { ...base })).toBe(true);
    expect(sameExploreFilters(base, { ...base, sortBy: 'rating' })).toBe(false);
    expect(sameExploreFilters(base, { ...base, selectedCategory: 'ATV' })).toBe(false);
    expect(sameExploreFilters(base, { ...base, selfDriveOnly: true })).toBe(false);
  });
});
