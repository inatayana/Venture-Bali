/**
 * Quality-gated activity x destination landing pages.
 * See docs/rfc/PROGRAMMATIC_PAGES.md (owner-approved direction).
 *
 * Destination facts mirror docs/SEO_TAXONOMY.md §2. Nothing here invents
 * reviews, prices or availability — the gate only lets real data through.
 */

import { FORBIDDEN_TITLE_WORDS } from './titleValidator';

export interface DestinationDef {
  slug: string;
  name: string;
  region: string;
  activities: readonly string[];
}

export const DESTINATIONS: readonly DestinationDef[] = [
  { slug: 'ubud', name: 'Ubud', region: 'Gianyar', activities: ['atv', 'rafting', 'tubing', 'cycling', 'trekking'] },
  { slug: 'kintamani', name: 'Kintamani', region: 'Bangli', activities: ['trekking', 'cycling'] },
  { slug: 'nusa-dua', name: 'Nusa Dua', region: 'Tanjung Benoa', activities: ['water-sports'] },
  { slug: 'nusa-penida', name: 'Nusa Penida', region: 'Klungkung', activities: ['snorkeling'] },
  { slug: 'east-bali', name: 'East Bali', region: 'Karangasem', activities: ['rafting', 'snorkeling'] },
  { slug: 'north-bali', name: 'North Bali', region: 'Buleleng', activities: ['trekking', 'snorkeling', 'extreme'] },
  { slug: 'south-bali', name: 'South Bali', region: 'Uluwatu', activities: ['water-sports', 'extreme'] },
  { slug: 'west-bali', name: 'West Bali', region: 'Jembrana', activities: ['trekking', 'snorkeling'] },
] as const;

export interface PageCandidate {
  activitySlug: string;
  activityName: string;
  destination: DestinationDef;
}

export function buildPageSlug(activitySlug: string, destinationSlug: string): string {
  return `${activitySlug}-in-${destinationSlug}`;
}

export function parsePageSlug(slug: string): { activitySlug: string; destinationSlug: string } | null {
  const match = slug.match(/^([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  if (!match) return null;
  return { activitySlug: match[1], destinationSlug: match[2] };
}

export function isSupportedCombination(activitySlug: string, destinationSlug: string): boolean {
  const destination = DESTINATIONS.find((item) => item.slug === destinationSlug);
  return Boolean(destination?.activities.includes(activitySlug));
}

export function buildPageTitle(activityName: string, destinationName: string): string {
  return `${activityName} in ${destinationName}: Guided Bali Adventure`;
}

export interface QualityGateInput {
  productCount: number;
  approvedReviewCount: number;
  intro: string;
  title: string;
}

export function passesQualityGate(input: QualityGateInput): boolean {
  const { productCount, approvedReviewCount, intro, title } = input;
  if (productCount < 2) return false;
  if (approvedReviewCount < 1) return false;
  if (intro.trim().split(/\s+/).filter(Boolean).length < 120) return false;
  if (title.length > 60) return false;
  const lower = title.toLowerCase();
  if (lower.includes('baliwild')) return false;
  return !FORBIDDEN_TITLE_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(title));
}

/** Deterministic, factual editorial intro — no invented claims. */
export function buildEditorialIntro(candidate: PageCandidate, productCount: number): string {
  const { activityName, destination } = candidate;
  return [
    `Looking for ${activityName.toLowerCase()} in ${destination.name}? This guide brings together the guided adventures our Bali-based team can confirm in ${destination.name}, ${destination.region}. Every experience listed here is sold directly, priced in Indonesian rupiah and operated by licensed local providers under BaliWild safety standards.`,
    `Booking direct removes the 20 to 30 percent commission that foreign experience platforms deduct from suppliers, so more of what you pay stays with the guides, drivers and communities who host you on the ground. You can arrive yourself at the meeting point with Self Drive, or add Shared Transfer or Private Transfer by zone on the same product — transport is never sold as a separate adventure.`,
    `Before you go, check the minimum age shown on each product, because the rule is set per adventure rather than applied uniformly across the catalogue. Children aged five to eleven join with an adult, guests aged twelve to fifteen take part independently in the field but cannot book in their own name, and adults aged sixteen to seventy five may book. Cancellation at least twenty four hours before the activity in Bali time returns eighty percent of the price, and every booking includes a digital waiver plus a QR voucher for check in.`,
    `We currently list ${productCount} guided ${activityName.toLowerCase()} adventures in ${destination.name}. Availability depends on the date and group size, so open a product to see live slots, current pricing, meeting details and what to bring. Our Ubud operations team answers questions on WhatsApp and by email before you book and throughout your stay.`,
  ].join('\n\n');
}
