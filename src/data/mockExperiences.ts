/**
 * Venture Bali — Mock / Offline Catalogue
 * ---------------------------------------
 * Serves the demo catalogue when no database is reachable (demo builds,
 * preview deployments, local development without a database).
 *
 * The data is DERIVED from `src/data/catalogue.ts` — the exact same module
 * the Prisma seed writes to the database — and is mapped through the same
 * `toVentureItem()` helper the PDP uses. The mock can therefore never drift
 * away from what the seed produces: same products, same titles, same
 * categories, same prices, same shape.
 *
 * Docs: docs/MASTER_PRODUCT_CATALOG.md
 */

import {
  DEFAULT_SLOTS,
  LOCATIONS,
  PICKUP_ZONES,
  TENANT_DOMAIN,
  VEHICLE_CLASSES,
  VENTURES,
  type VentureSeed,
} from './catalogue';
import { toVentureItem, type VentureWithRelations } from '@/lib/ventureMapper';
import type { PickupZone, VehicleClass } from '@/types/venture';

// ============ STABLE IDENTIFIERS ============

/** Mock vehicle class ids — kept stable so the booking widget can reference them. */
const VEHICLE_CLASS_IDS: Record<string, string> = {
  STANDARD_SUV: 'vc-suv',
  PREMIUM_MPV: 'vc-mpv',
  MINIVAN: 'vc-van',
};

/** Mock pickup zone ids — "zone-1" .. "zone-4", matching the widget default. */
const ZONE_IDS = ['zone-1', 'zone-2', 'zone-3', 'zone-4'] as const;

const MOCK_TENANT_ID = 'tenant-001';
const MOCK_NOW = new Date('2026-01-01T00:00:00.000Z');

export const mockVehicleClasses: VehicleClass[] = VEHICLE_CLASSES.map((vc) => ({
  id: VEHICLE_CLASS_IDS[vc.name] ?? vc.name.toLowerCase(),
  name: vc.name,
  label: vc.label,
  description: vc.description,
  vehicleMaxPax: vc.vehicleMaxPax,
  deltaIdr: vc.deltaIdr,
  sortOrder: vc.sortOrder,
  isActive: true,
  createdAt: MOCK_NOW,
  updatedAt: MOCK_NOW,
}));

export const mockPickupZones: PickupZone[] = PICKUP_ZONES.map((zone, index) => ({
  id: ZONE_IDS[index] ?? `zone-${index + 1}`,
  name: zone.name,
  areaType: zone.areaType,
  surchargeIdr: zone.surchargeIdr,
  isCustomQuote: zone.isCustomQuote,
  vehicleMaxPax: zone.vehicleMaxPax,
  isActive: true,
  createdAt: MOCK_NOW,
  updatedAt: MOCK_NOW,
}));

export const mockTenants = [
  {
    id: MOCK_TENANT_ID,
    domain: TENANT_DOMAIN,
    name: 'Venture Bali',
    themeColor: '#1E40AF',
    isActive: true,
  },
];

export const mockLocations = LOCATIONS.map((loc, index) => ({
  id: `loc-${String(index + 1).padStart(3, '0')}`,
  name: loc.name,
  region: loc.region,
  latitude: loc.latitude,
  longitude: loc.longitude,
}));

const locationIdByKey = new Map(mockLocations.map((loc, index) => [LOCATIONS[index].key, loc.id]));

// ============ CATALOGUE -> PRISMA SHAPE ============

/**
 * Convert a catalogue entry into the Prisma row shape so it can be pushed
 * through the same mapper the database rows use.
 */
function toPrismaShape(venture: VentureSeed): VentureWithRelations {
  const location = mockLocations.find((loc) => loc.id === locationIdByKey.get(venture.locationKey));

  return {
    id: `mock-${venture.slug}`,
    slug: venture.slug,
    tenantId: MOCK_TENANT_ID,
    locationId: location?.id ?? null,
    title: venture.title,
    hook3Sec: venture.hook3Sec,
    shortDescription: venture.shortDescription ?? null,
    duration: venture.duration,
    badge: venture.badge,
    highlights: venture.highlights,
    inclusions: venture.inclusions,
    exclusions: venture.exclusions,
    itinerary: venture.itinerary,
    essentialInfo: venture.essentialInfo,
    faqs: venture.faqs,
    languages: venture.languages,
    category: venture.category,
    subcategory: venture.subcategory,
    primaryKeyword: venture.primaryKeyword,
    secondaryKeywords: venture.secondaryKeywords,
    searchTags: venture.searchTags,
    difficulty: venture.difficulty,
    suitableFor: venture.suitableFor,
    imageUrl: venture.imageUrl,
    gallery: venture.gallery,
    videoUrl: null,
    rating: venture.rating,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    location: location
      ? {
          id: location.id,
          name: location.name,
          region: location.region,
          latitude: location.latitude,
          longitude: location.longitude,
          createdAt: MOCK_NOW,
          updatedAt: MOCK_NOW,
        }
      : null,
    variants: venture.variants.map((variant, variantIndex) => ({
      id: `mock-${venture.slug}-${variantIndex + 1}`,
      ventureId: `mock-${venture.slug}`,
      title: variant.title,
      shortDescription: variant.shortDescription,
      badge: variant.badge,
      blackoutDates: variant.blackoutDates,
      createdAt: MOCK_NOW,
      updatedAt: MOCK_NOW,
      priceTiers: variant.priceTiers.map((tier, tierIndex) => ({
        id: `mock-${venture.slug}-${variantIndex + 1}-tier-${tierIndex + 1}`,
        variantId: `mock-${venture.slug}-${variantIndex + 1}`,
        minPax: tier.minPax,
        maxPax: tier.maxPax,
        pricePerPax: tier.pricePerPax,
      })),
      slotTimes: DEFAULT_SLOTS.map((slot, slotIndex) => ({
        id: `mock-${venture.slug}-${variantIndex + 1}-slot-${slotIndex + 1}`,
        variantId: `mock-${venture.slug}-${variantIndex + 1}`,
        time: slot.time,
        maxCapacity: slot.maxCapacity,
        currentBookings: 0,
        isAvailable: true,
        createdAt: MOCK_NOW,
        updatedAt: MOCK_NOW,
      })),
      addons: variant.addons.map((addon, addonIndex) => ({
        id: `mock-${venture.slug}-${variantIndex + 1}-addon-${addonIndex + 1}`,
        variantId: `mock-${venture.slug}-${variantIndex + 1}`,
        name: addon.name,
        price: addon.price,
        description: addon.description,
        requiresTransfer: addon.requiresTransfer,
        isCombo: addon.isCombo,
        createdAt: MOCK_NOW,
        updatedAt: MOCK_NOW,
      })),
    })),
    reviews: [],
  } as VentureWithRelations;
}

/**
 * The offline catalogue — 9 ventures, one per adventure mega category.
 */
export const mockExperiences = VENTURES.map(toPrismaShape).map(toVentureItem);
