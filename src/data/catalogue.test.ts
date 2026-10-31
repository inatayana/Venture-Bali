import {
  CATALOGUE_CATEGORIES,
  LOCATIONS,
  PICKUP_ZONES,
  VEHICLE_CLASSES,
  VENTURES,
  resolveFulfillmentMode,
} from './catalogue';
import {
  MEGA_CATEGORIES,
  MEGA_CATEGORY_SHORT_LABELS,
  MEGA_CATEGORY_SLUGS,
  isAllowedCategory,
  resolveCategory,
} from '@/lib/taxonomy';
import { validateVentureTitle, isVentureSlugValid } from '@/lib/titleValidator';

describe('catalogue', () => {
  it('uses exactly the 9 mega categories from the taxonomy', () => {
    expect(CATALOGUE_CATEGORIES).toEqual([...MEGA_CATEGORY_SHORT_LABELS]);
    expect(CATALOGUE_CATEGORIES).toHaveLength(9);
  });

  it('keeps the category labels aligned with the canonical taxonomy', () => {
    CATALOGUE_CATEGORIES.forEach((label, index) => {
      const resolved = resolveCategory(label);
      expect(resolved).not.toBeNull();
      expect(resolved?.canonical).toBe(MEGA_CATEGORIES[index]);
      expect(resolved?.slug).toBe(MEGA_CATEGORY_SLUGS[index]);
    });
  });

  it('contains one venture per mega category', () => {
    expect(VENTURES).toHaveLength(9);
    const used = VENTURES.map((v) => v.category);
    expect(new Set(used).size).toBe(9);
    expect([...used].sort()).toEqual([...CATALOGUE_CATEGORIES].sort());
  });

  it('uses only allowed categories', () => {
    VENTURES.forEach((venture) => {
      expect(isAllowedCategory(venture.category)).toBe(true);
    });
  });

  it('has valid slugs', () => {
    VENTURES.forEach((venture) => {
      expect(isVentureSlugValid(venture.slug)).toBe(true);
    });
  });

  it('has unique slugs', () => {
    const slugs = VENTURES.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has titles that pass the Product Title Constitution', () => {
    VENTURES.forEach((venture) => {
      const result = validateVentureTitle({
        title: venture.title,
        primaryKeyword: venture.primaryKeyword,
        destination: venture.destination,
      });
      expect(result.errors).toEqual([]);
    });
  });

  it('never exposes the brand name in a title or slug', () => {
    VENTURES.forEach((venture) => {
      expect(venture.title.toLowerCase()).not.toContain('venture bali');
      expect(venture.slug.toLowerCase()).not.toContain('venture-bali');
    });
  });

  it('gives every venture a self-drive and a private-transfer variant with price tiers', () => {
    VENTURES.forEach((venture) => {
      const modes = venture.variants.map((variant) => ({
        variant,
        mode: resolveFulfillmentMode(variant),
      }));
      expect(modes.some((entry) => entry.mode === 'SELF_DRIVE')).toBe(true);
      expect(modes.some((entry) => entry.mode === 'PRIVATE_TRANSFER')).toBe(true);

      venture.variants.forEach((variant) => {
        expect(variant.priceTiers.length).toBeGreaterThan(0);
        variant.priceTiers.forEach((tier) => {
          expect(tier.minPax).toBeLessThanOrEqual(tier.maxPax);
          expect(tier.pricePerPax).toBeGreaterThan(0);
          expect(Number.isInteger(tier.pricePerPax)).toBe(true);
        });
      });
    });
  });

  it('never prices a Private Transfer variant below its Self Drive counterpart', () => {
    VENTURES.forEach((venture) => {
      const selfDrive = venture.variants.find(
        (variant) => resolveFulfillmentMode(variant) === 'SELF_DRIVE'
      );
      const transfer = venture.variants.find(
        (variant) => resolveFulfillmentMode(variant) === 'PRIVATE_TRANSFER'
      );
      if (!selfDrive || !transfer) return;

      const selfDrivePrice = Math.min(...selfDrive.priceTiers.map((t) => t.pricePerPax));
      const transferPrice = Math.min(...transfer.priceTiers.map((t) => t.pricePerPax));

      expect(transferPrice).toBeGreaterThan(selfDrivePrice);
    });
  });

  it('marks transfer-required add-ons only on transfer variants', () => {
    VENTURES.forEach((venture) => {
      venture.variants
        .filter((variant) => resolveFulfillmentMode(variant) === 'SELF_DRIVE')
        .forEach((variant) => {
          variant.addons.forEach((addon) => {
            expect(addon.requiresTransfer).toBe(false);
          });
        });
    });
  });

  it('gives promo prices that undercut the list price', () => {
    VENTURES.forEach((venture) => {
      venture.variants.forEach((variant) => {
        if (variant.promoPriceIdr == null) return;
        const lowestList = Math.min(...variant.priceTiers.map((tier) => tier.pricePerPax));
        expect(variant.promoPriceIdr).toBeGreaterThan(0);
        expect(Number.isInteger(variant.promoPriceIdr)).toBe(true);
        expect(variant.promoPriceIdr).toBeLessThan(lowestList);
      });
    });
  });

  it('keeps every variant departure inside operating hours (08:00–16:00)', () => {
    VENTURES.forEach((venture) => {
      venture.variants.forEach((variant) => {
        if (!variant.slots) return;
        variant.slots.forEach((slot) => {
          const match = slot.time.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
          expect(match).not.toBeNull();
          if (!match) return;
          let hour = Number(match[1]);
          if (match[3] === 'PM' && hour < 12) hour += 12;
          if (match[3] === 'AM' && hour === 12) hour = 0;
          expect(hour).toBeGreaterThanOrEqual(8);
          expect(hour).toBeLessThanOrEqual(15);
        });
      });
    });
  });

  it('keeps every referenced location key resolvable', () => {
    const locationKeys = new Set(LOCATIONS.map((loc) => loc.key));
    VENTURES.forEach((venture) => {
      expect(locationKeys.has(venture.locationKey)).toBe(true);
    });
  });

  it('defines 4 pickup zones with unique area types', () => {
    expect(PICKUP_ZONES).toHaveLength(4);
    const areaTypes = PICKUP_ZONES.map((z) => z.areaType);
    expect(new Set(areaTypes).size).toBe(4);
  });

  it('only charges a surcharge outside the core zone', () => {
    const core = PICKUP_ZONES.find((z) => z.areaType === 'ZONE_1');
    expect(core?.surchargeIdr).toBe(0);
  });

  it('defines 3 vehicle classes with unique names', () => {
    expect(VEHICLE_CLASSES).toHaveLength(3);
    const names = VEHICLE_CLASSES.map((v) => v.name);
    expect(new Set(names).size).toBe(3);
  });

  it('does not let the same add-on be attached twice to one variant', () => {
    VENTURES.forEach((venture) => {
      venture.variants.forEach((variant) => {
        const names = variant.addons.map((a) => a.name);
        expect(new Set(names).size).toBe(names.length);
      });
    });
  });
});
