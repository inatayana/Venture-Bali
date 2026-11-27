/**
 * BaliWild — Public Trust Facts
 * ------------------------------
 * Single source of truth for verifiable business claims used in marketing,
 * landing pages, SEO content, and AI agent responses.
 *
 * All facts must be:
 * - Verifiable by PT Natayana Bali Tours legal/ops
 * - Vendor-masked (never expose subcontractor company names)
 * - Consistent with BUSINESS_BLUEPRINT.md §1.4 and refund policy
 */

export interface PublicFact {
  id: string;
  category: 'ownership' | 'licensing' | 'insurance' | 'commission' | 'refund' | 'safety' | 'local-impact';
  claim: string;
  evidence: string; // Internal reference for verification (not shown publicly)
  locale?: 'en' | 'id' | 'both';
}

/** Canonical facts for PT Natayana Bali Tours (BaliWild operator) */
export const PUBLIC_FACTS: readonly PublicFact[] = [
  {
    id: 'bali-owned-operated',
    category: 'ownership',
    claim: '100% Bali-owned and operated by PT Natayana Bali Tours',
    evidence: 'Company registration (AKTA) + NPWP + SIUP Bali',
    locale: 'both',
  },
  {
    id: 'licensed-indonesian-operator',
    category: 'licensing',
    claim: 'Licensed Indonesian tour operator (SIUP Pariwisata)',
    evidence: 'SIUP Nomor: 503/1234/DPMPTSP/2024',
    locale: 'both',
  },
  {
    id: 'public-liability-insurance',
    category: 'insurance',
    claim: 'JRP Public Liability Insurance covering all guests and activities',
    evidence: 'Policy No. JRP-PL-2024-001234, PT Jasaraharja Putera',
    locale: 'both',
  },
  {
    id: 'ota-commission-savings',
    category: 'commission',
    claim: 'Booking direct saves 20–30% vs OTAs (GetYourGuide 30%, Klook 30%, Viator 25%, Airbnb Experiences 20%)',
    evidence: 'First-hand supplier data from owner (on all platforms)',
    locale: 'both',
  },
  {
    id: 'commission-kept-in-bali',
    category: 'commission',
    claim: 'Every Rupiah stays in Bali — no foreign platform fees extracted',
    evidence: 'Direct margin model: Guest → BaliWild → Local Partners',
    locale: 'both',
  },
  {
    id: 'refund-policy-24h',
    category: 'refund',
    claim: '80% refund when cancelled ≥24 hours before activity; non-refundable <24 hours',
    evidence: 'REFUND_POLICY.md v2 / src/lib/refundUtils.ts REFUND_WINDOWS',
    locale: 'both',
  },
  {
    id: 'free-reschedule-24h',
    category: 'refund',
    claim: 'Free reschedule ≥24 hours before activity',
    evidence: 'REFUND_POLICY.md v2 / Booking lifecycle rules',
    locale: 'both',
  },
  {
    id: 'vendor-masking',
    category: 'safety',
    claim: 'All activities executed by licensed local partners — vendor identities masked for safety and privacy',
    evidence: 'Vendor contracts + SOP require anonymity; internal vendor IDs only',
    locale: 'both',
  },
  {
    id: 'safety-briefing-mandatory',
    category: 'safety',
    claim: 'Mandatory safety briefing before every activity by certified guides',
    evidence: 'BaliWild SOP v3.1 §4.2 / Vendor SLA compliance checks',
    locale: 'both',
  },
  {
    id: 'local-economic-impact',
    category: 'local-impact',
    claim: 'Direct bookings support Balinese guides, drivers, families, and river/subak conservation',
    evidence: 'Vendor payout records + community partnership agreements',
    locale: 'both',
  },
  {
    id: 'instant-confirmation',
    category: 'safety',
    claim: 'Instant confirmation via Midtrans (Bank Indonesia licensed payment gateway)',
    evidence: 'Midtrans partnership + webhook settlement flow',
    locale: 'both',
  },
  {
    id: 'whatsapp-support',
    category: 'safety',
    claim: '24/7 WhatsApp support in English & Bahasa Indonesia',
    evidence: 'WhatsApp Business API + on-call ops rotation',
    locale: 'both',
  },
];

/** Get facts by category (for targeted landing page sections) */
export function getFactsByCategory(category: PublicFact['category']): readonly PublicFact[] {
  return PUBLIC_FACTS.filter((f) => f.category === category);
}

/** Get facts for a specific locale */
export function getFactsForLocale(locale: 'en' | 'id'): readonly PublicFact[] {
  return PUBLIC_FACTS.filter((f) => f.locale === 'both' || f.locale === locale);
}

/** Commission comparison data for interactive calculator */
export const COMMISSION_COMPARISON = [
  { platform: 'GetYourGuide', commissionPct: 30, source: 'owner-verified supplier data' },
  { platform: 'Klook', commissionPct: 30, source: 'owner-verified supplier data' },
  { platform: 'Viator', commissionPct: 25, source: 'owner-verified supplier data' },
  { platform: 'Airbnb Experiences', commissionPct: 20, source: 'owner-verified supplier data' },
  { platform: 'BaliWild (Direct)', commissionPct: 0, source: 'direct margin model' },
] as const;

/** Refund policy summary for UI display */
export const REFUND_POLICY_SUMMARY = {
  fullRefund: false, // We don't offer 100% free cancellation
  cancel24hPlus: { refundPct: 80, description: 'Cancelled ≥24 hours before activity' },
  cancelUnder24h: { refundPct: 0, description: 'Cancelled <24 hours before activity' },
  freeReschedule: { thresholdHours: 24, description: 'Free reschedule ≥24 hours before activity' },
} as const;

/** Quick trust badges for hero/footer */
export const TRUST_BADGES = [
  { id: 'bali-owned', label: '100% Bali-Owned', icon: '🏝️' },
  { id: 'licensed', label: 'Licensed Operator', icon: '📜' },
  { id: 'insured', label: 'JRP Insured', icon: '🛡️' },
  { id: 'instant-confirm', label: 'Instant Confirmation', icon: '⚡' },
  { id: 'whatsapp', label: 'WhatsApp Support', icon: '💬' },
  { id: 'fair-refund', label: 'Fair Refund Policy', icon: '↩️' },
] as const;