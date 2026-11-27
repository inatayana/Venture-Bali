/**
 * Single source of truth for public, AEO-facing facts.
 *
 * Every statement here is taken from an approved document:
 * - docs/BUSINESS_BLUEPRINT.md §1.4 (mission, OTA commission, age rules)
 * - docs/BRAND_GUIDELINES.md §5.1 (allowed claims)
 * - src/lib/refundUtils.ts (refund windows)
 * - src/lib/brand.ts (contact details)
 * - src/lib/taxonomy.ts (the 9 adventure categories)
 *
 * Owner decision 2026-11-27: PT Natayana Bali Tours (PT Perorangan) is legally
 * registered and insured, so the "Bali-owned and operated" claim is approved.
 * No invented reviews, ratings, urgency or partner names.
 */

import { BRAND_EMAIL_HELLO, BRAND_EMAIL_SUPPORT } from './brand';
import { MEGA_CATEGORIES } from './taxonomy';

export interface PublicFaq {
  question: string;
  answer: string;
}

export const PUBLIC_FAQS: readonly PublicFaq[] = [
  {
    question: 'Is BaliWild a local Bali operator?',
    answer:
      'BaliWild is a Bali-owned and operated adventure operator based in Ubud, Gianyar. We sell directly, arrange licensed local providers, and stay responsible from booking through completion — no foreign OTA commission is deducted from your payment.',
  },
  {
    question:
      'Why is booking direct cheaper than booking through GetYourGuide, Klook, Viator or Airbnb Experiences?',
    answer:
      'Those platforms deduct a commission from the supplier: GetYourGuide 30%, Klook 30%, Viator 25% and Airbnb Experiences 20% (first-hand supplier data). Booking at baliwild.com removes that 20–30% cut, so the direct price is transparent while local guides, drivers and safety equipment are still paid properly.',
  },
  {
    question: 'What are the age rules for adventures?',
    answer:
      'Children aged 5–11 must be accompanied by an adult. Guests aged 12–15 can take part independently in the field but cannot book in their own name because they do not hold a payment card. Adults aged 16–75 may book. The minimum age is set per product — check the product page for the exact figure.',
  },
  {
    question: 'Do I need my own transport, or is hotel pickup available?',
    answer:
      'Every product is offered in three booking modes on the same listing: Self Drive (meet at the starting point, the default), Shared Transfer and Private Transfer by pickup zone. You are not sold a separate transport product.',
  },
  {
    question: 'What is the cancellation and refund policy?',
    answer:
      'Cancel at least 24 hours before the activity (Bali time, WITA) and receive an 80% refund with a 20% cancellation fee. Cancellations inside 24 hours and no-shows are non-refundable. Free rescheduling is available up to 24 hours before the activity.',
  },
  {
    question: 'What safety measures are in place?',
    answer:
      'Every adventure includes a safety briefing, international-standard equipment such as helmets and life jackets, a well-maintained fleet, participant insurance and a Digital Waiver completed before the activity.',
  },
  {
    question: 'Do I need to print a voucher?',
    answer:
      'No. Your booking has a digital voucher with a QR code that the local team scans at check-in.',
  },
  {
    question: 'How can I reach the team?',
    answer:
      `Chat the Ubud operations team on WhatsApp (link on every page) or email ${BRAND_EMAIL_HELLO} for general enquiries. Existing guests can use ${BRAND_EMAIL_SUPPORT} for changes, refunds and on-trip help.`,
  },
] as const;

export const PUBLIC_FACTS = {
  name: 'BaliWild',
  domain: 'baliwild.com',
  tagline: 'Own the wild.',
  base: 'Ubud, Gianyar, Bali, Indonesia',
  categories: [...MEGA_CATEGORIES],
  commission: {
    getyourguide: 30,
    klook: 30,
    viator: 25,
    airbnbExperiences: 20,
  },
  fulfilmentModes: ['Self Drive', 'Shared Transfer', 'Private Transfer'],
  refund: {
    cutoffHours: 24,
    refundPercent: 80,
    feePercent: 20,
    timezone: 'WITA (UTC+8)',
  },
  age: {
    kids: '5–11 accompanied by an adult',
    youth: '12–15 independent on-site, cannot book in own name',
    adult: '16–75 may book',
    note: 'Minimum age is set per product.',
  },
} as const;
