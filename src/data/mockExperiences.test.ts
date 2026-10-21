import { mockExperiences, mockPickupZones, mockVehicleClasses } from './mockExperiences';
import { VENTURES } from './catalogue';
import { MEGA_CATEGORY_SHORT_LABELS, isAllowedCategory } from '@/lib/taxonomy';
import { validateVentureTitle, isVentureSlugValid } from '@/lib/titleValidator';
import type { VentureItem } from '@/types/venture';

describe('mockExperiences Data', () => {
  it('contains one venture per mega category', () => {
    expect(mockExperiences).toHaveLength(9);
    expect(mockExperiences).toHaveLength(VENTURES.length);
  });

  it('all items conform to VentureItem format', () => {
    const requiredFields: (keyof VentureItem)[] = [
      'id',
      'slug',
      'title',
      'description',
      'category',
      'location',
      'priceIdr',
      'durationHours',
      'minParticipants',
      'maxParticipants',
      'rating',
      'reviewCount',
      'imageUrl',
      'isAvailable',
      'createdAt',
      'updatedAt',
    ];

    mockExperiences.forEach((venture) => {
      requiredFields.forEach((field) => {
        expect(venture).toHaveProperty(field);
      });
    });
  });

  it('all venture IDs are unique', () => {
    const ids = mockExperiences.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all slugs are unique', () => {
    const slugs = mockExperiences.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all prices are positive numbers', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.priceIdr).toBeGreaterThan(0);
    });
  });

  it('all durations are positive numbers', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.durationHours).toBeGreaterThan(0);
    });
  });

  it('minParticipants <= maxParticipants for all items', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.minParticipants).toBeLessThanOrEqual(venture.maxParticipants);
    });
  });

  it('ratings are between 1 and 5', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.rating).toBeGreaterThanOrEqual(1);
      expect(venture.rating).toBeLessThanOrEqual(5);
    });
  });

  it('reviewCounts are non-negative', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.reviewCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('every category is one of the 9 mega categories', () => {
    mockExperiences.forEach((venture) => {
      expect(isAllowedCategory(venture.category)).toBe(true);
      expect(MEGA_CATEGORY_SHORT_LABELS).toContain(venture.category as never);
    });
  });

  it('covers all 9 mega categories exactly once', () => {
    const used = new Set(mockExperiences.map((v) => v.category));
    expect(used.size).toBe(9);
    MEGA_CATEGORY_SHORT_LABELS.forEach((category) => {
      expect(used.has(category)).toBe(true);
    });
  });

  it('every title passes the Product Title Constitution', () => {
    mockExperiences.forEach((venture) => {
      const catalogueEntry = VENTURES.find((v) => v.slug === venture.slug);
      expect(catalogueEntry).toBeDefined();

      const result = validateVentureTitle({
        title: venture.title,
        primaryKeyword: catalogueEntry?.primaryKeyword,
        destination: catalogueEntry?.destination,
      });

      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });
  });

  it('every slug passes the slug rules', () => {
    mockExperiences.forEach((venture) => {
      expect(isVentureSlugValid(venture.slug)).toBe(true);
    });
  });

  it('never exposes the brand name in a title or slug', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.title.toLowerCase()).not.toContain('venture bali');
      expect(venture.slug.toLowerCase()).not.toContain('venture-bali');
    });
  });

  it('imageUrls are non-empty strings', () => {
    mockExperiences.forEach((venture) => {
      expect(venture.imageUrl).toBeTruthy();
      expect(typeof venture.imageUrl).toBe('string');
    });
  });

  it('every venture has both booking modes', () => {
    mockExperiences.forEach((venture) => {
      const titles = venture.variants.map((v) => v.title);
      expect(titles).toContain('Self Drive');
      expect(titles).toContain('Private Transfer');
    });
  });

  it('every venture has price tiers, slots and add-ons', () => {
    mockExperiences.forEach((venture) => {
      venture.variants.forEach((variant) => {
        expect(variant.priceTiers.length).toBeGreaterThan(0);
        expect(variant.slotTimes?.length ?? 0).toBeGreaterThan(0);
        expect(variant.addons?.length ?? 0).toBeGreaterThan(0);
      });
    });
  });

  it('exposes the same pickup zones and vehicle classes as the catalogue', () => {
    expect(mockPickupZones).toHaveLength(4);
    expect(mockVehicleClasses).toHaveLength(3);
    expect(mockPickupZones.map((z) => z.id)).toEqual(['zone-1', 'zone-2', 'zone-3', 'zone-4']);
    expect(mockVehicleClasses.map((v) => v.name)).toEqual([
      'STANDARD_SUV',
      'PREMIUM_MPV',
      'MINIVAN',
    ]);
  });

  it('only the outer zone is a custom quote', () => {
    const customQuoteZones = mockPickupZones.filter((z) => z.isCustomQuote);
    expect(customQuoteZones).toHaveLength(1);
    expect(customQuoteZones[0].areaType).toBe('ZONE_4');
  });

  it('has at least one item from each expected location type', () => {
    const locations = mockExperiences.map((v) => v.location);
    const uniqueLocations = new Set(locations);
    expect(uniqueLocations.size).toBeGreaterThanOrEqual(3);
  });
});
