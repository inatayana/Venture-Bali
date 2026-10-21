import {
  validateVentureTitle,
  isVentureTitleValid,
  isVentureSlugValid,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
} from './titleValidator';

describe('Title Validator (PRODUCT_TITLE_CONSTITUTION.md)', () => {
  describe('valid titles', () => {
    it('accepts a canonical ATV title', () => {
      const result = validateVentureTitle({
        title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
        primaryKeyword: 'Ubud ATV',
        destination: 'Ubud',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a canonical Rafting title', () => {
      const result = validateVentureTitle({
        title: 'Ayung Rafting White Water Adventure with Hotel Pickup',
        primaryKeyword: 'Ayung Rafting',
        destination: 'Ayung',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts a canonical Water Sports title', () => {
      const result = validateVentureTitle({
        title: 'Nusa Dua Water Sports Adventure with Hotel Pickup',
        primaryKeyword: 'Nusa Dua Water Sports',
        destination: 'Nusa Dua',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts a canonical Combo title', () => {
      const result = validateVentureTitle({
        title: 'Ubud ATV and Ayung Rafting Adventure Full Day Combo',
        primaryKeyword: 'Ubud ATV',
        destination: 'Ubud',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('rule 1 — length', () => {
    it('rejects a title shorter than 45 characters', () => {
      const result = validateVentureTitle({ title: 'Ubud ATV Ride' });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('too short');
      expect(result.length).toBeLessThan(TITLE_MIN_LENGTH);
    });

    it('rejects a title longer than 60 characters', () => {
      const long = 'Ubud Jungle ATV Quad Bike Ride Through The Deep Bali Jungle With Private Transfer';
      const result = validateVentureTitle({ title: long });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('too long');
      expect(result.length).toBeGreaterThan(TITLE_MAX_LENGTH);
    });
  });

  describe('rule 2 — primary keyword in the first 25 characters', () => {
    it('rejects a title whose keyword only appears after character 25', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle Ride and Explore the Ayung Rafting Banks',
        primaryKeyword: 'Ayung Rafting',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('first 25 characters');
    });

    it('accepts a keyword that falls entirely within the first 25 characters', () => {
      // "Ubud Jungle " = 12 characters, so "Waterfall" spans characters 13-21.
      const result = validateVentureTitle({
        title: 'Ubud Jungle Waterfall Ride through Rice Fields Today',
        primaryKeyword: 'Waterfall',
      });
      expect(result.errors.join(' ')).not.toContain('first 25 characters');
    });
  });

  describe('rule 3 — destination', () => {
    it('rejects a title that never mentions the destination', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle Ride through Rice Terraces and Waterfalls',
        destination: 'Kintamani',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('Destination');
    });
  });

  describe('rule 4 — Title Case', () => {
    it('rejects a lowercase title', () => {
      const result = validateVentureTitle({
        title: 'ubud jungle ride through rice terraces and waterfalls',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('Title Case');
    });

    it('allows lowercase minor words in the middle of a title', () => {
      const result = validateVentureTitle({
        title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
      });
      expect(result.errors.join(' ')).not.toContain('Title Case');
    });

    it('allows uppercase acronyms', () => {
      const result = validateVentureTitle({
        title: 'Ubud ATV Jungle Ride with 4WD Off Road Experience',
      });
      expect(result.errors.join(' ')).not.toContain('Title Case');
    });
  });

  describe('rule 5 — separators', () => {
    it('rejects more than one separator symbol', () => {
      const result = validateVentureTitle({
        title: 'Ubud: Jungle ATV Ride - Rice Terraces and Waterfalls',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('separator');
    });

    it('allows a single dash separator', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle ATV Ride - Rice Terraces and Waterfalls',
      });
      expect(result.errors.join(' ')).not.toContain('separator');
    });
  });

  describe('rule 6 — benefits', () => {
    it('rejects more than one benefit phrase', () => {
      const result = validateVentureTitle({
        title: 'Ubud ATV Ride with Private Transfer and Lunch Included',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('benefit');
    });

    it('allows a single benefit phrase', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle ATV Ride with Private Transfer Experience',
      });
      expect(result.errors.join(' ')).not.toContain('benefit');
    });
  });

  describe('rule 7 — forbidden words', () => {
    it.each(['Best', 'Cheapest', 'Discount', 'Free', 'No.1'])(
      'rejects the forbidden word "%s"',
      (word) => {
        const result = validateVentureTitle({
          title: `Ubud Jungle ATV Ride ${word} Adventure of the Day`,
        });
        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toContain('forbidden');
      }
    );

    it('rejects the brand name in a title', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle ATV Ride with Venture Bali Private Transfer',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('forbidden');
    });

    it('does not flag a forbidden word that is part of a longer word', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle ATV Ride through Bestfriend Rice Terraces',
      });
      expect(result.errors.join(' ')).not.toContain('forbidden');
    });
  });

  describe('rule 8 — emoji', () => {
    it('rejects a title containing an emoji', () => {
      const result = validateVentureTitle({
        title: 'Ubud Jungle ATV Ride through Rice Terraces 🏍️ Today',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('emoji');
    });
  });

  describe('isVentureTitleValid', () => {
    it('returns true only for a fully valid title', () => {
      expect(
        isVentureTitleValid({
          title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
          primaryKeyword: 'Ubud ATV',
          destination: 'Ubud',
        })
      ).toBe(true);

      expect(isVentureTitleValid({ title: 'Ubud ATV' })).toBe(false);
    });
  });

  describe('slug validation', () => {
    it.each([
      'ubud-jungle-atv-ride',
      'ayung-river-white-water-rafting',
      'nusa-penida-snorkeling',
    ])('accepts the slug "%s"', (slug) => {
      expect(isVentureSlugValid(slug)).toBe(true);
    });

    it.each([
      ['Ubud-ATV-Ride', 'uppercase'],
      ['ubud_atv_ride', 'underscore'],
      ['-ubud-atv-', 'leading/trailing hyphen'],
      ['ubud--atv', 'double hyphen'],
      ['venture-bali-atv', 'brand name'],
      ['', 'empty'],
    ])('rejects the slug "%s" (%s)', (slug) => {
      expect(isVentureSlugValid(slug)).toBe(false);
    });
  });
});
