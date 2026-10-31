import {
  MEGA_CATEGORIES,
  MEGA_CATEGORY_SHORT_LABELS,
  MEGA_CATEGORY_SLUGS,
  CATEGORY_REGISTRY,
  CATEGORY_FILTERS,
  isAllowedCategory,
  resolveCategory,
  findForbiddenCategories,
} from './taxonomy';

describe('Taxonomy (9 adventure mega categories)', () => {
  it('exposes exactly 9 mega categories', () => {
    expect(MEGA_CATEGORIES).toHaveLength(9);
    expect(CATEGORY_REGISTRY).toHaveLength(9);
  });

  it('keeps short labels and slugs aligned with the canonical list', () => {
    expect(MEGA_CATEGORY_SHORT_LABELS).toHaveLength(MEGA_CATEGORIES.length);
    expect(MEGA_CATEGORY_SLUGS).toHaveLength(MEGA_CATEGORIES.length);
    CATEGORY_REGISTRY.forEach((entry, index) => {
      expect(entry.canonical).toBe(MEGA_CATEGORIES[index]);
      expect(entry.short).toBe(MEGA_CATEGORY_SHORT_LABELS[index]);
      expect(entry.slug).toBe(MEGA_CATEGORY_SLUGS[index]);
    });
  });

  it('exposes the 9 short labels used by the homepage filter chips', () => {
    expect(CATEGORY_FILTERS).toEqual([
      'ATV',
      'Rafting',
      'Tubing',
      'Cycling',
      'Trekking',
      'Water Sports',
      'Snorkeling',
      'Extreme',
      'Combo',
    ]);
  });

  describe('isAllowedCategory', () => {
    it.each([
      'ATV',
      'atv',
      'ATV & Off-Road',
      'Rafting',
      'River Tubing',
      'Cycling',
      'Trekking & Hiking',
      'Water Sports',
      'Snorkeling & Diving',
      'Extreme Adventures',
      'Adventure Combo Packages',
      'quad bike',
      'manta',
    ])('accepts "%s"', (category) => {
      expect(isAllowedCategory(category)).toBe(true);
    });

    it.each(['Hotel', 'Flight', 'Car Rental', 'Restaurant', 'Spa', ''])(
      'rejects "%s"',
      (category) => {
        expect(isAllowedCategory(category)).toBe(false);
      }
    );
  });

  describe('resolveCategory', () => {
    it('resolves a short label to its canonical category', () => {
      const resolved = resolveCategory('Tubing');
      expect(resolved?.canonical).toBe('River Tubing');
      expect(resolved?.slug).toBe('tubing');
    });

    it('resolves an alias', () => {
      const resolved = resolveCategory('jet ski');
      expect(resolved?.canonical).toBe('Water Sports');
    });

    it('returns null for a forbidden category', () => {
      expect(resolveCategory('Hotel')).toBeNull();
    });
  });

  describe('findForbiddenCategories', () => {
    it('detects out-of-scope categories', () => {
      expect(findForbiddenCategories('Hotel Booking')).toContain('hotel');
      expect(findForbiddenCategories('Flight Tickets')).toContain('flight');
      expect(findForbiddenCategories('Car Rental')).toContain('car rental');
    });

    it('returns an empty list for allowed categories', () => {
      expect(findForbiddenCategories('ATV & Off-Road')).toEqual([]);
      expect(findForbiddenCategories('Water Sports')).toEqual([]);
    });
  });
});
