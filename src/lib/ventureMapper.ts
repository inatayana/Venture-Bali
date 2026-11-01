/**
 * Venture Bali — Venture Mapper
 * -------------------------------
 * Converts a Prisma `Venture` row (with relations) into the `VentureItem`
 * view model that the UI, SEO helpers and booking widget consume.
 *
 * WHY THIS EXISTS
 * ---------------
 * The `VentureItem` view model carries derived fields that do not exist as
 * columns on the `Venture` table: `description`, `priceIdr`, `durationHours`,
 * `minParticipants`, `maxParticipants`, `reviewCount`, `isAvailable` and
 * `location` (a string).
 *
 * The PDP used to do `return venture as VentureItem` — an unchecked cast that
 * silently produced `undefined` for every derived field whenever the row came
 * from the real database instead of the mock fixtures. This mapper derives
 * those fields explicitly and parses the JSON columns defensively.
 *
 * Business rules are enforced here as well as in the query, so the view model
 * is safe no matter which include the caller used — e.g. only approved
 * reviews are counted.
 *
 * Docs: docs/PRODUCT_DETAIL_SPEC.md, docs/BOOKING_ARCHITECTURE.md
 */

import type { Prisma } from '@prisma/client';
import { findCountry } from '@/lib/countries';
import type {
  EssentialInfo,
  FaqItem,
  ItineraryItem,
  SuitableFor,
  VentureItem,
} from '@/types/venture';

// ============ RELATION SHAPE ============

export const ventureWithRelations = {
  location: true,
  variants: {
    include: {
      priceTiers: { orderBy: { minPax: 'asc' } },
      slotTimes: { orderBy: { time: 'asc' } },
      addons: true,
      pickupZone: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
  reviews: {
    where: { isApproved: true },
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { name: true, countryCode: true } } },
  },
} satisfies Prisma.VentureInclude;

export type VentureWithRelations = Prisma.VentureGetPayload<{
  include: typeof ventureWithRelations;
}>;

// ============ SAFE JSON PARSERS ============

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asItinerary(value: unknown): ItineraryItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const time = typeof item.time === 'string' ? item.time : null;
    const activity = typeof item.activity === 'string' ? item.activity : null;
    if (time === null || activity === null) return [];

    const duration = typeof item.duration === 'string' ? item.duration : undefined;
    const durationMinutes =
      typeof item.durationMinutes === 'number' && Number.isFinite(item.durationMinutes)
        ? item.durationMinutes
        : undefined;

    return [{ time, activity, duration, durationMinutes }];
  });
}

function asFaqs(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const question = typeof item.question === 'string' ? item.question : null;
    const answer = typeof item.answer === 'string' ? item.answer : null;
    return question !== null && answer !== null ? [{ question, answer }] : [];
  });
}

function asEssentialInfo(value: unknown): EssentialInfo {
  if (!isRecord(value)) {
    return { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] };
  }
  return {
    perfectFor: asStringArray(value.perfectFor),
    whatToBring: asStringArray(value.whatToBring),
    knowBeforeYouGo: asStringArray(value.knowBeforeYouGo),
  };
}

const SUITABLE_FOR_VALUES: readonly SuitableFor[] = [
  'KIDS',
  'COUPLE',
  'FAMILY',
  'SOLO',
  'GROUP',
];

function asSuitableFor(value: unknown): SuitableFor[] {
  return asStringArray(value).filter((item): item is SuitableFor =>
    (SUITABLE_FOR_VALUES as readonly string[]).includes(item)
  );
}

// ============ DERIVED FIELDS ============

/**
 * Parse a human duration such as "2.5 hours" or "8 hours" into hours.
 * Falls back to 0 when the string cannot be parsed.
 */
export function parseDurationHours(duration: string): number {
  const match = duration.match(/([\d]+(?:[.,]\d+)?)/);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * The lowest price per pax across every variant and tier — this is the
 * "from" price shown on cards and in structured data. An active promo price
 * replaces the tier price for the same calculation.
 */
export function deriveFromPrice(venture: VentureWithRelations): number {
  const prices = venture.variants.flatMap((variant) => {
    const promo =
      variant.promoPriceIdr !== null && variant.promoPriceIdr > 0 ? variant.promoPriceIdr : null;
    return variant.priceTiers.map((tier) =>
      promo !== null && promo < tier.pricePerPax ? promo : tier.pricePerPax
    );
  });
  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * Participant bounds derived from the price tiers:
 * `minParticipants` is the lowest tier bound, `maxParticipants` the highest.
 */
export function deriveParticipantBounds(venture: VentureWithRelations): {
  min: number;
  max: number;
} {
  const tiers = venture.variants.flatMap((variant) => variant.priceTiers);
  if (tiers.length === 0) return { min: 1, max: 1 };

  return {
    min: Math.min(...tiers.map((tier) => tier.minPax)),
    max: Math.max(...tiers.map((tier) => tier.maxPax)),
  };
}

/**
 * A venture is bookable when at least one variant still has an open slot.
 */
export function deriveIsAvailable(venture: VentureWithRelations): boolean {
  return venture.variants.some((variant) =>
    variant.slotTimes.some(
      (slot) => slot.isAvailable && slot.maxCapacity - slot.currentBookings > 0
    )
  );
}

// ============ MAPPER ============

/**
 * Map a Prisma venture (with relations) to the `VentureItem` view model.
 */
export function toVentureItem(venture: VentureWithRelations): VentureItem {
  const { min, max } = deriveParticipantBounds(venture);
  const ventureInclusions = asStringArray(venture.inclusions);
  const ventureExclusions = asStringArray(venture.exclusions);
  const approvedReviews = venture.reviews.filter((review) => review.isApproved);
  // Real reviews outrank the seeded editorial rating once they exist.
  const rating =
    approvedReviews.length > 0
      ? Math.round(
          (approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
            approvedReviews.length) *
            10
        ) / 10
      : venture.rating;

  return {
    id: venture.id,
    slug: venture.slug,
    tenantId: venture.tenantId,
    locationId: venture.locationId ?? undefined,

    title: venture.title,
    hook3Sec: venture.hook3Sec,
    shortDescription: venture.shortDescription ?? undefined,
    longDescription: venture.longDescription ?? undefined,
    duration: venture.duration,
    badge: venture.badge ?? undefined,
    meetingPoint: venture.meetingPoint
      ? {
          name: venture.meetingPoint,
          latitude: venture.meetingPointLat ?? 0,
          longitude: venture.meetingPointLng ?? 0,
        }
      : undefined,
    minAge: venture.minAge ?? undefined,
    maxWeightKg: venture.maxWeightKg ?? undefined,
    safetyBriefing: venture.safetyBriefing ?? undefined,

    highlights: asStringArray(venture.highlights),
    inclusions: ventureInclusions,
    exclusions: ventureExclusions,
    itinerary: asItinerary(venture.itinerary),
    essentialInfo: asEssentialInfo(venture.essentialInfo),
    faqs: asFaqs(venture.faqs),
    languages: asStringArray(venture.languages),

    category: venture.category,
    subcategory: venture.subcategory ?? undefined,
    primaryKeyword: venture.primaryKeyword ?? undefined,
    secondaryKeywords: asStringArray(venture.secondaryKeywords),
    searchTags: asStringArray(venture.searchTags),

    difficulty: venture.difficulty,
    suitableFor: asSuitableFor(venture.suitableFor),

    imageUrl: venture.imageUrl,
    gallery: asStringArray(venture.gallery),
    videoUrl: venture.videoUrl ?? undefined,
    rating,

    createdAt: venture.createdAt,
    updatedAt: venture.updatedAt,

    variants: venture.variants.map((variant) => ({
      id: variant.id,
      ventureId: variant.ventureId,
      title: variant.title,
      shortDescription: variant.shortDescription,
      badge: variant.badge ?? undefined,
      transportBadge: variant.transportBadge ?? undefined,
      imageUrl: variant.imageUrl ?? undefined,
      duration: variant.duration ?? undefined,
      fulfillmentMode: variant.fulfillmentMode,
      promoPriceIdr: variant.promoPriceIdr ?? undefined,
      operationNotes: variant.operationNotes ?? undefined,
      inclusions: (() => {
        const list = asStringArray(variant.inclusions);
        return list.length > 0 ? list : ventureInclusions;
      })(),
      exclusions: (() => {
        const list = asStringArray(variant.exclusions);
        return list.length > 0 ? list : ventureExclusions;
      })(),
      minimumSpendIdr: variant.minimumSpendIdr ?? undefined,
      pickupZoneId: variant.pickupZoneId ?? undefined,
      pickupZone: variant.pickupZone
        ? {
            id: variant.pickupZone.id,
            name: variant.pickupZone.name,
            areaType: variant.pickupZone.areaType,
            surchargeIdr: variant.pickupZone.surchargeIdr,
            isCustomQuote: variant.pickupZone.isCustomQuote,
            vehicleMaxPax: variant.pickupZone.vehicleMaxPax,
          }
        : undefined,
      sortOrder: variant.sortOrder,
      priceTiers: variant.priceTiers.map((tier) => ({
        minPax: tier.minPax,
        maxPax: tier.maxPax,
        pricePerPax: tier.pricePerPax,
      })),
      blackoutDates: asStringArray(variant.blackoutDates),
      slotTimes: variant.slotTimes.map((slot) => ({
        id: slot.id,
        variantId: slot.variantId,
        time: slot.time,
        maxCapacity: slot.maxCapacity,
        currentBookings: slot.currentBookings,
        isAvailable: slot.isAvailable,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      })),
      addons: variant.addons.map((addon) => ({
        id: addon.id,
        variantId: addon.variantId,
        name: addon.name,
        price: addon.price,
        description: addon.description ?? undefined,
        requiresTransfer: addon.requiresTransfer,
        isCombo: addon.isCombo,
        createdAt: addon.createdAt,
        updatedAt: addon.updatedAt,
      })),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    })),

    // ---- derived view-model fields ----
    description: venture.shortDescription ?? venture.hook3Sec,
    priceIdr: deriveFromPrice(venture),
    durationHours: parseDurationHours(venture.duration),
    minParticipants: min,
    maxParticipants: max,
    reviewCount: approvedReviews.length,
    reviewList: venture.reviews
      .filter((review) => review.isApproved)
      .slice(0, 50)
      .map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        author: review.customer?.name?.trim().split(' ')[0] || 'Verified guest',
        country: review.customer?.countryCode
          ? findCountry(review.customer.countryCode).name
          : undefined,
        isVerified: Boolean(review.bookingId),
        createdAt: review.createdAt,
      })),
    isAvailable: deriveIsAvailable(venture),
    location: venture.location?.name ?? '',
  };
}
