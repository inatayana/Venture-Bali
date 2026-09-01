import { mockVentures } from './mockVentures';
import type { VentureItem } from '@/types/venture';

describe('mockVentures Data', () => {
  it('contains exactly 3 venture items', () => {
    expect(mockVentures).toHaveLength(3);
  });

  it('all items conform to VentureItem format', () => {
    const requiredFields: (keyof VentureItem)[] = [
      'id', 'slug', 'title', 'description', 'category', 'location',
      'priceIdr', 'durationHours', 'minParticipants', 'maxParticipants',
      'rating', 'reviewCount', 'imageUrl', 'isAvailable',
      'createdAt', 'updatedAt',
    ];

    mockVentures.forEach((venture) => {
      requiredFields.forEach((field) => {
        expect(venture).toHaveProperty(field);
      });
    });
  });

  it('all venture IDs are unique', () => {
    const ids = mockVentures.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all slugs are unique', () => {
    const slugs = mockVentures.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all prices are positive numbers', () => {
    mockVentures.forEach((venture) => {
      expect(venture.priceIdr).toBeGreaterThan(0);
    });
  });

  it('all durations are positive numbers', () => {
    mockVentures.forEach((venture) => {
      expect(venture.durationHours).toBeGreaterThan(0);
    });
  });

  it('minParticipants <= maxParticipants for all items', () => {
    mockVentures.forEach((venture) => {
      expect(venture.minParticipants).toBeLessThanOrEqual(venture.maxParticipants);
    });
  });

  it('ratings are between 1 and 5', () => {
    mockVentures.forEach((venture) => {
      expect(venture.rating).toBeGreaterThanOrEqual(1);
      expect(venture.rating).toBeLessThanOrEqual(5);
    });
  });

  it('reviewCounts are non-negative', () => {
    mockVentures.forEach((venture) => {
      expect(venture.reviewCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('all categories are valid', () => {
    const validCategories = ['beach', 'mountain', 'culture', 'adventure', 'wellness'];
    mockVentures.forEach((venture) => {
      expect(validCategories).toContain(venture.category);
    });
  });

  it('imageUrls are non-empty strings', () => {
    mockVentures.forEach((venture) => {
      expect(venture.imageUrl).toBeTruthy();
      expect(typeof venture.imageUrl).toBe('string');
    });
  });

  it('createdAt dates are before updatedAt', () => {
    mockVentures.forEach((venture) => {
      const created = new Date(venture.createdAt);
      const updated = new Date(venture.updatedAt);
      expect(created.getTime()).toBeLessThanOrEqual(updated.getTime());
    });
  });

  it('has at least one item from each expected location type', () => {
    const locations = mockVentures.map((v) => v.location);
    const uniqueLocations = new Set(locations);
    expect(uniqueLocations.size).toBeGreaterThanOrEqual(3);
  });
});
