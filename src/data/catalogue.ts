/**
 * Venture Bali — Master Product Catalogue
 * ---------------------------------------
 * The single source of truth for the demo catalogue: 9 ventures (one per
 * adventure mega category), each with Self Drive and Private Transfer
 * variants, pax-based price tiers, slot times and add-ons.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * `prisma/seed.ts` writes this catalogue to the database and
 * `src/data/mockExperiences.ts` serves it as the offline fallback for demo
 * and preview builds. Both read the same definitions, so the mock can never
 * drift away from what the seed actually produces.
 *
 * This module is PURE DATA — it has no runtime imports on purpose, so it can
 * be loaded by the Node-native TypeScript seed runner as well as by the
 * Next.js bundle. The category labels are kept in sync with
 * `src/lib/taxonomy.ts` by `src/data/catalogue.test.ts`.
 *
 * Docs: docs/MASTER_PRODUCT_CATALOG.md, docs/SEO_TAXONOMY.md,
 *       docs/BOOKING_ARCHITECTURE.md, docs/PRODUCT_TITLE_CONSTITUTION.md
 */

// ============ CATEGORY LABELS ============
// Kept as plain strings so this module stays dependency-free.
// `src/data/catalogue.test.ts` asserts they match src/lib/taxonomy.ts.
export const CATALOGUE_CATEGORIES = [
  'ATV',
  'Rafting',
  'Tubing',
  'Cycling',
  'Trekking',
  'Water Sports',
  'Snorkeling',
  'Extreme',
  'Combo',
] as const;

// ============ CONSTANTS ============

// Short category labels are the single source of truth (src/lib/taxonomy.ts).
// The DB stores the short label so the homepage filter chips match directly.
export const TAXONOMY = {
  ATV: CATALOGUE_CATEGORIES[0],
  RAFTING: CATALOGUE_CATEGORIES[1],
  TUBING: CATALOGUE_CATEGORIES[2],
  CYCLING: CATALOGUE_CATEGORIES[3],
  TREKKING: CATALOGUE_CATEGORIES[4],
  WATER_SPORTS: CATALOGUE_CATEGORIES[5],
  SNORKELING: CATALOGUE_CATEGORIES[6],
  EXTREME: CATALOGUE_CATEGORIES[7],
  COMBO: CATALOGUE_CATEGORIES[8],
} as const;

export const TENANT_DOMAIN = 'venturebali.com';
export const TENANT_NAME = 'Venture Bali';
export const TENANT_THEME = '#1E40AF';

// Pickup zones — surcharge applies when the pickup zone differs from the
// activity zone. Zone 1 (core Bali) and the Nusa Dua / Ubud corridor are
// surcharge-free (see BOOKING_ARCHITECTURE.md §3).
export const PICKUP_ZONES = [
  {
    name: 'Core Area — Ubud & Gianyar',
    areaType: 'ZONE_1' as const,
    surchargeIdr: 0,
    isCustomQuote: false,
    vehicleMaxPax: 6,
  },
  {
    name: 'South 1 — Kuta, Seminyak, Canggu, Sanur',
    areaType: 'ZONE_2' as const,
    surchargeIdr: 224000,
    isCustomQuote: false,
    vehicleMaxPax: 6,
  },
  {
    name: 'South 2 — Nusa Dua, Jimbaran, Uluwatu',
    areaType: 'ZONE_3' as const,
    surchargeIdr: 320000,
    isCustomQuote: false,
    vehicleMaxPax: 6,
  },
  {
    name: 'Outer — Amed, Lovina, Pemuteran, Tulamben',
    areaType: 'ZONE_4' as const,
    surchargeIdr: 0,
    isCustomQuote: true,
    vehicleMaxPax: 6,
  },
];

export const VEHICLE_CLASSES = [
  {
    name: 'STANDARD_SUV' as const,
    label: 'Standard SUV · up to 4 pax',
    description: 'Compact SUV, comfortable for small groups',
    vehicleMaxPax: 4,
    deltaIdr: 0,
    sortOrder: 1,
  },
  {
    name: 'PREMIUM_MPV' as const,
    label: 'Premium MPV · up to 6 pax',
    description: 'Spacious MPV with extra legroom',
    vehicleMaxPax: 6,
    deltaIdr: 100000,
    sortOrder: 2,
  },
  {
    name: 'MINIVAN' as const,
    label: 'Minivan · up to 12 pax',
    description: 'Large minivan for groups',
    vehicleMaxPax: 12,
    deltaIdr: 250000,
    sortOrder: 3,
  },
];

export const LOCATIONS = [
  {
    key: 'ubud',
    name: 'Tegallalang, Ubud, Gianyar, Bali',
    region: 'Gianyar',
    latitude: -8.4312,
    longitude: 115.2791,
  },
  {
    key: 'kintamani',
    name: 'Kintamani, Bangli, Bali',
    region: 'Bangli',
    latitude: -8.2425,
    longitude: 115.5087,
  },
  {
    key: 'nusa-penida',
    name: 'Nusa Penida Island, Klungkung, Bali',
    region: 'Klungkung',
    latitude: -8.7301,
    longitude: 115.5328,
  },
  {
    key: 'sayan',
    name: 'Sayan, Ubud, Gianyar, Bali',
    region: 'Gianyar',
    latitude: -8.4937,
    longitude: 115.2506,
  },
  {
    key: 'jatiluwih',
    name: 'Jatiluwih, Tabanan, Bali',
    region: 'Tabanan',
    latitude: -8.4386,
    longitude: 115.1503,
  },
  {
    key: 'karangasem',
    name: 'Karangasem, Bali',
    region: 'Karangasem',
    latitude: -8.4889,
    longitude: 115.6133,
  },
  {
    key: 'kuta',
    name: 'Kuta, Badung, Bali',
    region: 'Badung',
    latitude: -8.7223,
    longitude: 115.1686,
  },
  {
    key: 'nusa-dua',
    name: 'Nusa Dua, Badung, Bali',
    region: 'Badung',
    latitude: -8.8007,
    longitude: 115.2288,
  },
  {
    key: 'pangandaran',
    name: 'Pangandaran, West Java',
    region: 'Pangandaran',
    latitude: -7.6151,
    longitude: 108.4761,
  },
  {
    key: 'blue-lagoon',
    name: 'Blue Lagoon, Abiansemal, Bali',
    region: 'Badung',
    latitude: -8.6367,
    longitude: 115.3851,
  },
];

// Slot times shared by most activities.
// Format matches the display convention already used in the UI
// (src/data/mockExperiences.ts → "06:00 AM").
export const DEFAULT_SLOTS = [
  { time: '06:00 AM', maxCapacity: 10 },
  { time: '08:00 AM', maxCapacity: 10 },
  { time: '10:00 AM', maxCapacity: 10 },
  { time: '01:00 PM', maxCapacity: 10 },
  { time: '03:00 PM', maxCapacity: 10 },
  { time: '05:00 PM', maxCapacity: 10 },
];

/**
 * Tubing departures follow operating hours 08:00–16:00 WITA.
 * The last start is `16:00 − duration`, so longer packages sell fewer slots:
 *   3 hrs → last start 13:00 · 4 hrs → 12:00 · 6 hrs → 10:00.
 */
export const TUBING_SLOTS = {
  THREE_HOURS: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'],
  FOUR_HOURS: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'],
  SIX_HOURS: ['08:00 AM', '09:00 AM', '10:00 AM'],
} as const;

function toSlots(times: readonly string[]): SlotSeed[] {
  return times.map((time) => ({ time, maxCapacity: 10 }));
}

// ============ MEETING POINTS ============
// Exact base-camp locations for SELF_DRIVE guests. Generic place names only —
// never vendor names (docs/OPERATION_CONTRACT.md).
export const MEETING_POINTS: Record<
  string,
  { name: string; latitude: number; longitude: number }
> = {
  'ubud-atv-jungle-ride': {
    name: 'Ubud ATV Base Camp — Payangan',
    latitude: -8.435,
    longitude: 115.272,
  },
  'ayung-river-white-water-rafting': {
    name: 'Ayung River Base Camp — Kedewatan',
    latitude: -8.478,
    longitude: 115.247,
  },
  'ubud-river-tubing-adventure': {
    name: 'Kelan River Base Camp — Tampaksiring',
    latitude: -8.427,
    longitude: 115.312,
  },
  'kintamani-ubud-downhill-cycling': {
    name: 'Kintamani Cycling Start — Pinggan',
    latitude: -8.317,
    longitude: 115.33,
  },
  'mount-batur-sunrise-trekking': {
    name: 'Mount Batur Trailhead — Toya Bungkah',
    latitude: -8.253,
    longitude: 115.397,
  },
  'nusa-dua-water-sports-package': {
    name: 'Tanjung Benoa Water Sports Centre',
    latitude: -8.756,
    longitude: 115.211,
  },
  'nusa-penida-snorkeling': {
    name: 'Toyapakeh Jetty — Nusa Penida',
    latitude: -8.7,
    longitude: 115.464,
  },
  'bali-waterfall-canyoning-adventure': {
    name: 'Gitgit Canyoning Base — Buleleng',
    latitude: -8.193,
    longitude: 115.123,
  },
  'ubud-atv-ayung-rafting-combo': {
    name: 'Ubud Combo Base Camp — Kedewatan',
    latitude: -8.47,
    longitude: 115.26,
  },
};

// ============ SAFETY GUIDELINES ============
// Structured requirements per product, shown in the Safety & requirements card.
export const SAFETY_INFO: Record<
  string,
  { minAge: number; maxWeightKg: number; briefing: string }
> = {
  'ubud-atv-jungle-ride': {
    minAge: 12,
    maxWeightKg: 120,
    briefing: 'Helmet fitting and a full safety briefing before every ride. Closed shoes are required.',
  },
  'ayung-river-white-water-rafting': {
    minAge: 7,
    maxWeightKg: 120,
    briefing: 'Life-jacket fitting and paddle briefing before launch. Swimming is not required but recommended.',
  },
  'ubud-river-tubing-adventure': {
    minAge: 6,
    maxWeightKg: 100,
    briefing: 'Life-jacket and tube briefing at the river gate. Lifeguards are stationed at entry and exit.',
  },
  'kintamani-ubud-downhill-cycling': {
    minAge: 12,
    maxWeightKg: 110,
    briefing: 'Helmet fitting and braking briefing before the descent. Moderate fitness required.',
  },
  'mount-batur-sunrise-trekking': {
    minAge: 10,
    maxWeightKg: 120,
    briefing: 'Headlamp and trekking briefing at the trailhead. Basic fitness required for the sunrise ascent.',
  },
  'nusa-dua-water-sports-package': {
    minAge: 10,
    maxWeightKg: 100,
    briefing: 'Life-jacket and equipment briefing before each activity. Some rides require swimming ability.',
  },
  'nusa-penida-snorkeling': {
    minAge: 8,
    maxWeightKg: 100,
    briefing: 'Life-jacket and snorkel briefing before entering the water. Swimming ability recommended.',
  },
  'bali-waterfall-canyoning-adventure': {
    minAge: 15,
    maxWeightKg: 100,
    briefing: 'Harness and rope briefing by certified guides. Strong fitness and comfort with heights required.',
  },
  'ubud-atv-ayung-rafting-combo': {
    minAge: 12,
    maxWeightKg: 110,
    briefing: 'Separate safety briefings for the ATV and rafting sessions. Closed shoes and swimwear required.',
  },
};

// ============ COUPONS ============
export type CouponSeed = {
  code: string;
  label: string;
  discountPercent: number;
  minPax: number;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  usageLimit: number | null;
};

/**
 * Launch coupon. Promo prices and coupons never stack: the coupon applies to
 * packages sold at list price (see docs/BOOKING_ARCHITECTURE.md §5).
 */
export const COUPONS: CouponSeed[] = [
  {
    code: 'TRYBALI2026',
    label: 'Try Bali 2026 — 40% off',
    discountPercent: 40,
    minPax: 1,
    validFrom: null,
    validUntil: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    usageLimit: 100,
  },
];

// ============ TYPE HELPERS ============

export type PriceTierSeed = { minPax: number; maxPax: number; pricePerPax: number };

export type AddonSeed = {
  name: string;
  price: number;
  description: string;
  requiresTransfer: boolean;
  isCombo: boolean;
};

export type SlotSeed = { time: string; maxCapacity: number };

export type VariantSeed = {
  title: string;
  shortDescription: string;
  badge: string | null;
  /** Transport / tier badge shown on the catalogue card. */
  transportBadge?: string;
  /** Gallery image shown when this package is selected. */
  imageUrl?: string;
  /** Human duration for this variant; falls back to the venture duration. */
  duration?: string;
  /** Package-level inclusions; empty falls back to the venture lists. */
  inclusions?: string[];
  /** Package-level exclusions; empty falls back to the venture lists. */
  exclusions?: string[];
  /** Optional minimum spend enforced by the pricing engine (IDR). */
  minimumSpendIdr?: number | null;
  /** Derived from the title when omitted (Private Transfer / Shared Transfer / else Self Drive). */
  fulfillmentMode?: 'SELF_DRIVE' | 'SHARED_TRANSFER' | 'PRIVATE_TRANSFER';
  /** Flat promo price per pax (IDR). Replaces the tier price when lower. */
  promoPriceIdr?: number | null;
  operationNotes?: string | null;
  sortOrder?: number;
  /** Departure slots for this variant; falls back to DEFAULT_SLOTS. */
  slots?: SlotSeed[];
  priceTiers: PriceTierSeed[];
  blackoutDates: string[];
  addons: AddonSeed[];
};

/**
 * The single derivation used by the seed, the mock catalogue and the tests.
 * Variants that do not declare a mode fall back to their title.
 */
export function resolveFulfillmentMode(
  variant: Pick<VariantSeed, 'title' | 'fulfillmentMode'>
): 'SELF_DRIVE' | 'SHARED_TRANSFER' | 'PRIVATE_TRANSFER' {
  if (variant.fulfillmentMode) return variant.fulfillmentMode;
  if (/shared/i.test(variant.title)) return 'SHARED_TRANSFER';
  if (/private/i.test(variant.title)) return 'PRIVATE_TRANSFER';
  return 'SELF_DRIVE';
}

export type VentureSeed = {
  slug: string;
  title: string;
  hook3Sec: string;
  shortDescription: string;
  duration: string;
  badge: string | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: { time: string; activity: string }[];
  essentialInfo: {
    perfectFor: string[];
    whatToBring: string[];
    knowBeforeYouGo: string[];
  };
  faqs: { question: string; answer: string }[];
  languages: string[];
  category: string;
  subcategory: string | null;
  primaryKeyword: string;
  destination: string;
  secondaryKeywords: string[];
  searchTags: string[];
  difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING';
  suitableFor: string[];
  imageUrl: string;
  gallery: string[];
  rating: number;
  locationKey: string;
  variants: VariantSeed[];
};

// ============ ADD-ON CATALOG ============
// Reusable add-ons offered across products (per-product availability is set
// in the variant definitions below).

export const ADDON_PHOTOGRAPHY: AddonSeed = {
  name: 'Professional Photography',
  price: 150000,
  description: '1-hour session with 20 edited photos',
  requiresTransfer: false,
  isCombo: false,
};

export const ADDON_LUNCH: AddonSeed = {
  name: 'Local Lunch',
  price: 85000,
  description: 'Set menu at a nearby local eatery',
  requiresTransfer: false,
  isCombo: false,
};

export const ADDON_BUFFET: AddonSeed = {
  name: 'Hotel Buffet Lunch Upgrade',
  price: 150000,
  description: 'Upgrade to an international buffet lunch',
  requiresTransfer: true,
  isCombo: true,
};

export const ADDON_HOT_SPRING: AddonSeed = {
  name: 'Natural Hot Spring Entry',
  price: 120000,
  description: 'Relax at a natural hot spring after the activity',
  requiresTransfer: false,
  isCombo: false,
};

export const ADDON_RAFTING_COMBO: AddonSeed = {
  name: 'Ayung River Rafting Combo',
  price: 350000,
  description: 'Add white-water rafting to your package',
  requiresTransfer: true,
  isCombo: true,
};

export const ADDON_TUBING_COMBO: AddonSeed = {
  name: 'Water Tubing Combo',
  price: 300000,
  description: 'Add river tubing to your package',
  requiresTransfer: true,
  isCombo: true,
};

// ============ VENTURE SEEDS (9 MEGA CATEGORIES) ============

export const VENTURES: VentureSeed[] = [
  // ---------- 1. ATV ----------
  {
    slug: 'ubud-atv-jungle-ride',
    title: 'Ubud ATV Jungle Ride through Rice Terraces and Waterfalls',
    hook3Sec: 'Ride a quad bike across Bali jungle trails and rice terraces',
    shortDescription:
      'Guided ATV adventure through the jungles and rice paddies of Ubud with a full safety briefing and local guide.',
    duration: '2.5 hours',
    badge: 'Best Seller',
    highlights: [
      'Quad bike through rice paddies and jungle trails',
      'Certified local guide and safety briefing',
      'Helmet, goggles and rain protection included',
      'Hotel pickup available',
    ],
    inclusions: ['ATV rental', 'Safety gear', 'Certified guide', 'Insurance', 'Drinking water'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '08:00', activity: 'Arrival and safety briefing' },
      { time: '08:30', activity: 'ATV ride through the jungle trail' },
      { time: '09:45', activity: 'Rice terrace photo stop' },
      { time: '10:30', activity: 'Return to meeting point' },
    ],
    essentialInfo: {
      perfectFor: ['First-time riders', 'Couples', 'Family groups'],
      whatToBring: ['Closed shoes', 'Change of clothes', 'Sunscreen'],
      knowBeforeYouGo: ['Minimum age 12', 'Valid driving licence not required', 'Health conditions may limit participation'],
    },
    faqs: [
      {
        question: 'Do I need a driving licence to ride the ATV?',
        answer:
          'No driving licence is required. All participants receive a safety briefing and are guided by a certified instructor throughout the ride.',
      },
      {
        question: 'Is the activity suitable for children?',
        answer: 'Children aged 12 and above can join as passengers. Under 12 is not permitted due to safety regulations.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.ATV,
    subcategory: 'Jungle Trail',
    primaryKeyword: 'Ubud ATV',
    destination: 'Ubud',
    secondaryKeywords: ['quad bike Bali', 'ATV jungle Ubud', 'rice terrace ATV'],
    searchTags: ['atv', 'quad bike', 'ubud', 'offroad', 'rice terrace'],
    difficulty: 'EASY',
    suitableFor: ['First-timers', 'Couples', 'Families'],
    imageUrl: '/images/atv-ubud.svg',
    gallery: ['/images/atv-ubud.svg', '/images/atv-ubud-2.svg', '/images/atv-ubud-3.svg'],
    rating: 4.8,
    locationKey: 'ubud',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Ride the ATV yourself and meet directly at the trail head',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 550000 },
          { minPax: 2, maxPax: 2, pricePerPax: 450000 },
          { minPax: 3, maxPax: 4, pricePerPax: 420000 },
          { minPax: 5, maxPax: 10, pricePerPax: 380000 },
        ],
        blackoutDates: ['2026-12-25'],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH, ADDON_HOT_SPRING],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Hotel pickup and drop-off included, meet at your hotel',
        badge: 'Most Popular',
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 750000 },
          { minPax: 2, maxPax: 2, pricePerPax: 650000 },
          { minPax: 3, maxPax: 4, pricePerPax: 620000 },
          { minPax: 5, maxPax: 10, pricePerPax: 580000 },
        ],
        blackoutDates: ['2026-12-25'],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH, ADDON_HOT_SPRING, ADDON_RAFTING_COMBO, ADDON_TUBING_COMBO, ADDON_BUFFET],
      },
    ],
  },

  // ---------- 2. RAFTING ----------
  {
    slug: 'ayung-river-white-water-rafting',
    title: 'Ayung Rafting White Water Adventure with Hotel Pickup',
    hook3Sec: 'Paddle the grade 2-3 rapids of the Ayung River with a safety crew',
    shortDescription:
      'A guided white-water rafting trip along the Ayung River with helmets, life jackets, a safety kayak escort and an optional lunch stop.',
    duration: '3 hours',
    badge: 'Adventure',
    highlights: [
      'Class 2-3 rapids with an experienced safety crew',
      'Full safety equipment and certified guides',
      'Natural river scenery and coffee plantation stops',
      'Shower and changing facilities on site',
    ],
    inclusions: ['Rafting equipment', 'Certified guide', 'Safety kayak', 'Insurance', 'Changing room'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '08:30', activity: 'Registration and equipment fitting' },
      { time: '09:00', activity: 'Safety briefing and river entry' },
      { time: '10:00', activity: 'Coffee plantation break' },
      { time: '11:00', activity: 'Rampage rapid and finish' },
    ],
    essentialInfo: {
      perfectFor: ['Groups', 'Team building', 'Active travellers'],
      whatToBring: ['Swimwear', 'Sandals', 'Change of clothes', 'Dry bag'],
      knowBeforeYouGo: ['Minimum age 8', 'Maximum weight 90 kg per person', 'Not recommended for guests with heart conditions'],
    },
    faqs: [
      {
        question: 'Is the rafting suitable for beginners?',
        answer:
          'Yes. The route is graded 2-3 which is beginner friendly. A safety kayak and certified guides are on the water at all times.',
      },
      {
        question: 'What should I bring with me?',
        answer:
          'Bring swimwear, sandals, a change of clothes and a dry bag for your phone. We provide helmets, life jackets and all paddling equipment.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.RAFTING,
    subcategory: 'River White Water',
    primaryKeyword: 'Ayung Rafting',
    destination: 'Ayung',
    secondaryKeywords: ['white water rafting Bali', 'rafting Ubud', 'Ayung river adventure'],
    searchTags: ['rafting', 'ayung', 'white water', 'river', 'kayaking'],
    difficulty: 'MODERATE',
    suitableFor: ['Groups', 'Team building', 'Active travellers'],
    imageUrl: '/images/rafting.svg',
    gallery: ['/images/rafting.svg', '/images/rafting-2.svg', '/images/rafting-3.svg'],
    rating: 4.7,
    locationKey: 'ubud',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Arrive at the river gate and join the group departure',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 450000 },
          { minPax: 2, maxPax: 2, pricePerPax: 400000 },
          { minPax: 3, maxPax: 4, pricePerPax: 375000 },
          { minPax: 5, maxPax: 10, pricePerPax: 350000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Round-trip hotel pickup and drop-off included',
        badge: 'Most Popular',
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 650000 },
          { minPax: 2, maxPax: 2, pricePerPax: 600000 },
          { minPax: 3, maxPax: 4, pricePerPax: 575000 },
          { minPax: 5, maxPax: 10, pricePerPax: 550000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH, ADDON_BUFFET],
      },
    ],
  },

  // ---------- 3. TUBING ----------
  {
    slug: 'ubud-river-tubing-adventure',
    title: 'Ubud Tubing: Hidden Canyon Adventure with Lunch',
    hook3Sec: 'Float down the Kelan River on a tube through the green valley',
    shortDescription:
      'Relaxing river tubing on the Kelan River with two gentle sections, a safety kayak escort and a complimentary lunch.',
    duration: '3 hours',
    badge: 'Family Friendly',
    highlights: [
      'Two scenic tube sections along the Kelan River',
      'Safety kayak escort on every run',
      'Lifeguards stationed at entry and exit points',
      'Complimentary lunch after the run',
    ],
    inclusions: ['Tube and paddle', 'Safety kayak escort', 'Lifeguard support', 'Lunch', 'Insurance', 'Drinking water'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '08:00', activity: 'Registration and equipment fitting' },
      { time: '08:30', activity: 'Tubing entry and first section' },
      { time: '09:30', activity: 'Second section and refreshment stop' },
      { time: '10:15', activity: 'Return to the meeting point' },
    ],
    essentialInfo: {
      perfectFor: ['Families', 'Children from age 6', 'Relaxed groups'],
      whatToBring: ['Swimwear', 'Towel', 'Sunscreen', 'Waterproof phone pouch'],
      knowBeforeYouGo: ['Minimum age 6', 'Maximum weight 100 kg per person', 'Water levels vary with the season'],
    },
    faqs: [
      {
        question: 'Is water tubing safe for children?',
        answer:
          'Yes. The route is calm with no rapids, and lifeguards are stationed along the river. Children aged 6 and above can join.',
      },
      {
        question: 'What happens if it rains?',
        answer:
          'Light rain does not stop the activity as the valley is sheltered. Your guide will advise if conditions are unsafe.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.TUBING,
    subcategory: 'River Tube',
    primaryKeyword: 'Ubud Tubing',
    destination: 'Ubud',
    secondaryKeywords: ['water tubing Bali', 'river tubing Ubud', 'Kelan tube adventure'],
    searchTags: ['tubing', 'kelan', 'river', 'float', 'family'],
    difficulty: 'EASY',
    suitableFor: ['Families', 'Children', 'Relaxed groups'],
    imageUrl: '/images/tubing.svg',
    gallery: ['/images/tubing.svg', '/images/tubing-2.svg', '/images/tubing-3.svg'],
    rating: 4.6,
    locationKey: 'ubud',
    variants: [
      {
        title: 'River Tubing with Meeting Point',
        shortDescription: 'Gear, guide and lunch included. Make your own way to the river gate.',
        badge: null,
        transportBadge: '📍 Meeting Point',
        imageUrl: '/images/tubing.svg',
        duration: '3 hrs',
        fulfillmentMode: 'SELF_DRIVE',
        promoPriceIdr: 300000,
        operationNotes: 'Meet at the Kelan river gate 15 minutes before departure',
        inclusions: ['Tube, paddle and life jacket', 'Certified river guide', 'Lunch after the run', 'Activity insurance'],
        exclusions: ['Hotel transfer', 'Personal expenses', 'Photos (available as add-on)'],
        sortOrder: 1,
        slots: toSlots(TUBING_SLOTS.THREE_HOURS),
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 450000 },
          { minPax: 2, maxPax: 2, pricePerPax: 400000 },
          { minPax: 3, maxPax: 4, pricePerPax: 380000 },
          { minPax: 5, maxPax: 10, pricePerPax: 350000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY],
      },
      {
        title: 'River Tubing with Shared Transfer',
        shortDescription: 'Hotel shuttle pick-up and drop-off shared with other guests.',
        badge: null,
        transportBadge: '🚐 Shared Transfer',
        imageUrl: '/images/tubing-2.svg',
        duration: '4 hrs',
        fulfillmentMode: 'SHARED_TRANSFER',
        promoPriceIdr: 440000,
        operationNotes: 'Shuttle fee is charged per guest; departure times are fixed',
        inclusions: ['Tube, paddle and life jacket', 'Certified river guide', 'Lunch', 'Shared hotel shuttle', 'Activity insurance'],
        exclusions: ['Personal expenses', 'Photos (available as add-on)'],
        sortOrder: 2,
        slots: toSlots(TUBING_SLOTS.FOUR_HOURS),
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 650000 },
          { minPax: 2, maxPax: 2, pricePerPax: 600000 },
          { minPax: 3, maxPax: 4, pricePerPax: 580000 },
          { minPax: 5, maxPax: 10, pricePerPax: 550000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY],
      },
      {
        title: 'River Tubing with Private Transfer',
        shortDescription: 'Private car and driver for your group, door to door.',
        badge: 'Most Popular',
        transportBadge: '🚗 Private Transfer',
        imageUrl: '/images/tubing-3.svg',
        duration: '4 hrs',
        fulfillmentMode: 'PRIVATE_TRANSFER',
        promoPriceIdr: 600000,
        operationNotes: 'Private vehicle class is selected at checkout',
        inclusions: ['Tube, paddle and life jacket', 'Certified river guide', 'Lunch', 'Private car & driver', 'Activity insurance'],
        exclusions: ['Personal expenses', 'Entrance fees'],
        minimumSpendIdr: 1200000,
        sortOrder: 3,
        slots: toSlots(TUBING_SLOTS.FOUR_HOURS),
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 850000 },
          { minPax: 2, maxPax: 2, pricePerPax: 800000 },
          { minPax: 3, maxPax: 4, pricePerPax: 780000 },
          { minPax: 5, maxPax: 10, pricePerPax: 750000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_BUFFET],
      },
      {
        title: 'River Tubing with Ubud Highlights Tour',
        shortDescription: 'Tubing, lunch, plus temple and rice terrace visits in one day.',
        badge: null,
        transportBadge: '🏛️ Ubud Highlights',
        imageUrl: '/images/tubing-2.svg',
        duration: '6 hrs',
        fulfillmentMode: 'SELF_DRIVE',
        promoPriceIdr: null,
        operationNotes: 'Full-day bundle; the coupon applies because this package has no promo price',
        inclusions: ['Tubing with guide and gear', 'Lunch', 'Temple visit', 'Rice terrace visit', 'Activity insurance'],
        exclusions: ['Personal expenses', 'Temple donation'],
        sortOrder: 4,
        slots: toSlots(TUBING_SLOTS.SIX_HOURS),
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 950000 },
          { minPax: 2, maxPax: 2, pricePerPax: 900000 },
          { minPax: 3, maxPax: 4, pricePerPax: 880000 },
          { minPax: 5, maxPax: 10, pricePerPax: 850000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY],
      },
    ],
  },

  // ---------- 4. CYCLING ----------
  {
    slug: 'kintamani-ubud-downhill-cycling',
    title: 'Ubud Cycling Downhill Tour through Villages to the Coast',
    hook3Sec: 'Cycle downhill from the hills to the Indian Ocean coastline',
    shortDescription:
      'A guided downhill cycle from the Bali hills through villages and rice fields to the southern coastline, with a beachside refreshment stop.',
    duration: '4 hours',
    badge: 'Scenic Route',
    highlights: [
      'Guided downhill route from hills to the coast',
      'Temple and village visit along the way',
      'Beachside refreshment stop included',
      'Mountain bike, helmet and gloves provided',
    ],
    inclusions: ['Mountain bike', 'Helmet and gloves', 'Certified guide', 'Water and refreshments', 'Insurance'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '07:00', activity: 'Hotel pickup and bike fitting' },
      { time: '08:00', activity: 'Cycle through the hillside villages' },
      { time: '09:30', activity: 'Temple visit and coffee break' },
      { time: '11:00', activity: 'Reach the beach and finish' },
    ],
    essentialInfo: {
      perfectFor: ['Active travellers', 'Groups', 'Couples'],
      whatToBring: ['Sport shoes', 'Light clothing', 'Sunscreen', 'Water bottle'],
      knowBeforeYouGo: ['Minimum age 12', 'Route length approximately 25 km', 'Moderate fitness required'],
    },
    faqs: [
      {
        question: 'How difficult is the cycling route?',
        answer:
          'The route is mostly downhill or flat, so it suits anyone with moderate fitness. The total distance is around 25 kilometres.',
      },
      {
        question: 'Is the bike suitable for my height?',
        answer:
          'Our guides fit the bike to your height before departure and can swap to another frame if needed.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.CYCLING,
    subcategory: 'Downhill Coastal',
    primaryKeyword: 'Ubud Cycling',
    destination: 'Ubud',
    secondaryKeywords: ['downhill cycling Bali', 'bike tour Ubud', 'coastal cycling'],
    searchTags: ['cycling', 'bike', 'downhill', 'coast', 'village'],
    difficulty: 'MODERATE',
    suitableFor: ['Active travellers', 'Groups', 'Couples'],
    imageUrl: '/images/cycling.svg',
    gallery: ['/images/cycling.svg', '/images/cycling-2.svg', '/images/cycling-3.svg'],
    rating: 4.7,
    locationKey: 'jatiluwih',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Meet at the hill start point and cycle independently with a guide',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 500000 },
          { minPax: 2, maxPax: 2, pricePerPax: 450000 },
          { minPax: 3, maxPax: 4, pricePerPax: 420000 },
          { minPax: 5, maxPax: 10, pricePerPax: 390000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Hotel pickup, bike fitting support and drop-off at the beach',
        badge: 'Most Popular',
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 700000 },
          { minPax: 2, maxPax: 2, pricePerPax: 650000 },
          { minPax: 3, maxPax: 4, pricePerPax: 620000 },
          { minPax: 5, maxPax: 10, pricePerPax: 590000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH, ADDON_BUFFET],
      },
    ],
  },

  // ---------- 5. TREKKING ----------
  {
    slug: 'mount-batur-sunrise-trekking',
    title: 'Mount Batur Trekking Sunrise Adventure with Breakfast',
    hook3Sec: 'Climb to a volcanic summit for a sunrise above the clouds',
    shortDescription:
      'A guided pre-dawn trek to the summit of Mount Batur with a volcanic-steam breakfast and a natural hot spring soak to finish.',
    duration: '6 hours',
    badge: 'Epic Views',
    highlights: [
      'Summit sunrise above the clouds and Lake Batur',
      'Volcanic steam breakfast cooked on the lava fields',
      'Natural hot spring soak to finish the trek',
      'Headlamp, trekking poles and warm layers provided',
    ],
    inclusions: ['Certified mountain guide', 'Breakfast and lunch', 'Hot spring entry', 'Trekking equipment', 'Insurance'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '02:00', activity: 'Hotel pickup for the climb start' },
      { time: '03:30', activity: 'Trek through the lava field trail' },
      { time: '06:15', activity: 'Summit sunrise and photography' },
      { time: '07:30', activity: 'Volcanic steam breakfast' },
      { time: '09:00', activity: 'Hot spring soak and return' },
    ],
    essentialInfo: {
      perfectFor: ['Hikers', 'Sunrise lovers', 'Active travellers'],
      whatToBring: ['Warm jacket', 'Long trousers', 'Flashlight', 'Gloves'],
      knowBeforeYouGo: ['Minimum age 10', 'Approximately 2 hours of uphill trekking', 'Fitness level required'],
    },
    faqs: [
      {
        question: 'What time do we start and finish?',
        answer:
          'Pickup is around 2:00 AM so you reach the summit before first light. We return to your hotel around 10:00 AM.',
      },
      {
        question: 'Is the summit trek suitable for beginners?',
        answer:
          'The trail is about 2 km uphill. It suits guests in reasonable shape who can walk steep terrain for two hours.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.TREKKING,
    subcategory: 'Volcano Summit',
    primaryKeyword: 'Mount Batur',
    destination: 'Mount Batur',
    secondaryKeywords: ['Batur sunrise hike', 'Bali volcano trek', 'Batur summit tour'],
    searchTags: ['trekking', 'batur', 'sunrise', 'volcano', 'hiking'],
    difficulty: 'CHALLENGING',
    suitableFor: ['Hikers', 'Sunrise lovers', 'Active travellers'],
    imageUrl: '/images/mount-batur.svg',
    gallery: ['/images/mount-batur.svg', '/images/mount-batur-2.svg', '/images/mount-batur-3.svg'],
    rating: 4.9,
    locationKey: 'kintamani',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Drive to the trail head yourself and join the guided ascent',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 800000 },
          { minPax: 2, maxPax: 2, pricePerPax: 650000 },
          { minPax: 3, maxPax: 4, pricePerPax: 600000 },
          { minPax: 5, maxPax: 10, pricePerPax: 550000 },
        ],
        blackoutDates: ['2026-12-31'],
        addons: [ADDON_PHOTOGRAPHY, ADDON_HOT_SPRING],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Early morning hotel pickup and return transfer included',
        badge: 'Most Popular',
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 950000 },
          { minPax: 2, maxPax: 2, pricePerPax: 800000 },
          { minPax: 3, maxPax: 4, pricePerPax: 750000 },
          { minPax: 5, maxPax: 10, pricePerPax: 700000 },
        ],
        blackoutDates: ['2026-12-31'],
        addons: [ADDON_PHOTOGRAPHY, ADDON_HOT_SPRING, ADDON_BUFFET],
      },
    ],
  },

  // ---------- 6. WATER SPORTS ----------
  {
    slug: 'nusa-dua-water-sports-package',
    title: 'Nusa Dua Water Sports Adventure with Hotel Pickup',
    hook3Sec: 'Waterski, banana boat and jet ski on a blue volcanic lagoon',
    shortDescription:
      'A full water sports session on the Blue Lagoon with waterskiing, banana boat rides and a jet ski experience for groups.',
    duration: '3 hours',
    badge: 'Group Fun',
    highlights: [
      'Waterski, banana boat and jet ski rotations',
      'Safety brief and life jacket fitting included',
      'Shower and changing facilities on site',
      'Soft drinks and fresh fruit included',
    ],
    inclusions: ['Waterski equipment', 'Banana boat ride', 'Jet ski session', 'Safety equipment', 'Drinks'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '09:00', activity: 'Arrival and safety briefing' },
      { time: '09:30', activity: 'Waterski and banana boat rotations' },
      { time: '10:45', activity: 'Jet ski session' },
      { time: '11:30', activity: 'Shower, refreshments and finish' },
    ],
    essentialInfo: {
      perfectFor: ['Groups', 'Team building', 'Active travellers'],
      whatToBring: ['Swimwear', 'Towel', 'Sunscreen', 'Sandals'],
      knowBeforeYouGo: ['Minimum age 12 for jet ski', 'Maximum weight 90 kg per person', 'Swim ability required'],
    },
    faqs: [
      {
        question: 'How long do we spend on each activity?',
        answer:
          'You rotate through waterski, banana boat and jet ski. Most guests spend about 20 minutes on each activity.',
      },
      {
        question: 'Do I need any experience?',
        answer:
          'No experience is needed. Our instructors demonstrate every activity and ride with you on your first turn.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.WATER_SPORTS,
    subcategory: 'Lagoon Session',
    primaryKeyword: 'Nusa Dua Water Sports',
    destination: 'Nusa Dua',
    secondaryKeywords: ['waterski Bali', 'banana boat Ubud', 'jet ski Blue Lagoon'],
    searchTags: ['water sports', 'waterski', 'banana boat', 'jet ski', 'lagoon'],
    difficulty: 'EASY',
    suitableFor: ['Groups', 'Team building', 'Active travellers'],
    imageUrl: '/images/water-sports.svg',
    gallery: ['/images/water-sports.svg', '/images/water-sports-2.svg', '/images/water-sports-3.svg'],
    rating: 4.5,
    locationKey: 'blue-lagoon',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Arrive at the lagoon and meet the water sports team',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 600000 },
          { minPax: 2, maxPax: 2, pricePerPax: 550000 },
          { minPax: 3, maxPax: 4, pricePerPax: 520000 },
          { minPax: 5, maxPax: 10, pricePerPax: 480000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Hotel pickup and drop-off included',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 800000 },
          { minPax: 2, maxPax: 2, pricePerPax: 750000 },
          { minPax: 3, maxPax: 4, pricePerPax: 720000 },
          { minPax: 5, maxPax: 10, pricePerPax: 680000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH, ADDON_BUFFET],
      },
    ],
  },

  // ---------- 7. SNORKELING ----------
  {
    slug: 'nusa-penida-snorkeling',
    title: 'Nusa Penida Snorkeling with Manta Rays and Lunch',
    hook3Sec: 'Snorkel three crystal bays and swim with manta rays',
    shortDescription:
      'A full day boat trip to Nusa Penida covering three snorkeling sites, with manta ray encounters, a beach break and a set lunch.',
    duration: '8 hours',
    badge: 'Marine Life',
    highlights: [
      'Three snorkeling sites around Nusa Penida',
      'Manta ray cleaning station visit',
      'Crystal Bay and Angel Billabong snorkel stops',
      'Boat lunch and drinking water included',
    ],
    inclusions: ['Speedboat transfer', 'Snorkeling equipment', 'Set lunch on board', 'Insurance', 'Drinking water'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '07:30', activity: 'Pickup and transfer to Sanur harbour' },
      { time: '08:30', activity: 'Snorkel at Manta Point' },
      { time: '10:00', activity: 'Snorkel at Crystal Bay' },
      { time: '12:00', activity: 'Lunch on the boat' },
      { time: '13:30', activity: 'Snorkel at Angel Billabong' },
      { time: '15:00', activity: 'Return to Sanur' },
    ],
    essentialInfo: {
      perfectFor: ['Families', 'Snorkelling beginners', 'Marine life lovers'],
      whatToBring: ['Towel', 'Sunscreen', 'Swimwear', 'Change of clothes'],
      knowBeforeYouGo: ['Minimum age 6', 'Must be able to swim', 'Boat ride may be bumpy in rough seas'],
    },
    faqs: [
      {
        question: 'Can we see manta rays?',
        answer:
          'Manta sightings are common at Manta Point but never guaranteed, as they are wild animals. Your guide will find them if conditions allow.',
      },
      {
        question: 'Is the boat ride safe?',
        answer:
          'The speedboat has life jackets for every guest and a trained skipper. Life jackets are worn for the entire journey.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.SNORKELING,
    subcategory: 'Island Boat Trip',
    primaryKeyword: 'Nusa Penida Snorkeling',
    destination: 'Nusa Penida',
    secondaryKeywords: ['Manta Point snorkeling', 'Nusa Penida boat trip', 'Crystal Bay snorkel'],
    searchTags: ['snorkeling', 'nusa penida', 'manta ray', 'boat trip', 'crystal bay'],
    difficulty: 'EASY',
    suitableFor: ['Families', 'Beginners', 'Marine life lovers'],
    imageUrl: '/images/nusa-penida.svg',
    gallery: ['/images/nusa-penida.svg', '/images/nusa-penida-2.svg', '/images/nusa-penida-3.svg'],
    rating: 4.7,
    locationKey: 'nusa-penida',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Meet at Sanur harbour and board the boat there',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 1050000 },
          { minPax: 2, maxPax: 2, pricePerPax: 850000 },
          { minPax: 3, maxPax: 4, pricePerPax: 780000 },
          { minPax: 5, maxPax: 10, pricePerPax: 720000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Hotel pickup and return transfer included',
        badge: 'Most Popular',
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 1200000 },
          { minPax: 2, maxPax: 2, pricePerPax: 1000000 },
          { minPax: 3, maxPax: 4, pricePerPax: 930000 },
          { minPax: 5, maxPax: 10, pricePerPax: 870000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH, ADDON_BUFFET],
      },
    ],
  },

  // ---------- 8. EXTREME ----------
  {
    slug: 'bali-waterfall-canyoning-adventure',
    title: 'Sayan Canyoning Adventure with Abseil and Cliff Jumping',
    hook3Sec: 'Abseil, jump and swim through a hidden jungle canyon',
    shortDescription:
      'A guided canyoning descent with cliff jumps, natural water slides and swimming through a narrow jungle gorge.',
    duration: '4 hours',
    badge: 'Adrenaline',
    highlights: [
      'Natural rock jumps from up to 10 metres',
      'Water slides carved into the rock face',
      'Cliff abseil with a trained guide',
      'Safety equipment and dry bag provided',
    ],
    inclusions: ['Certified canyoning guide', 'Safety equipment and dry bag', 'Insurance', 'Drinking water', 'Changing room'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '08:00', activity: 'Pickup and canyon walk-in' },
      { time: '09:00', activity: 'Abseil practice and first jump' },
      { time: '10:00', activity: 'Water slide and gorge swim' },
      { time: '11:30', activity: 'Climb out and return transfer' },
    ],
    essentialInfo: {
      perfectFor: ['Adrenaline seekers', 'Experienced swimmers', 'Active groups'],
      whatToBring: ['Swimwear', 'Sports shoes with grip', 'Towel', 'Change of clothes'],
      knowBeforeYouGo: ['Minimum age 14', 'Strong swimming ability required', 'Not suitable for guests with heart conditions'],
    },
    faqs: [
      {
        question: 'Do I need to be an experienced swimmer?',
        answer:
          'Yes. The route includes a natural water slide and a deep gorge swim, so you must be a confident swimmer.',
      },
      {
        question: 'How high are the jumps?',
        answer:
          'Jumps range from 2 to 10 metres. Your guide will explain every jump and let you choose your height.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.EXTREME,
    subcategory: 'Canyoning',
    primaryKeyword: 'Sayan Canyoning',
    destination: 'Sayan',
    secondaryKeywords: ['Sayan canyoning', 'canyon jumping Bali', 'cliff jumping Ubud'],
    searchTags: ['extreme', 'canyoning', 'jumping', 'abseil', 'gorge'],
    difficulty: 'CHALLENGING',
    suitableFor: ['Adrenaline seekers', 'Strong swimmers', 'Active groups'],
    imageUrl: '/images/canyoning.svg',
    gallery: ['/images/canyoning.svg', '/images/canyoning-2.svg', '/images/canyoning-3.svg'],
    rating: 4.8,
    locationKey: 'sayan',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Meet at the canyon entrance and gear up on site',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 750000 },
          { minPax: 2, maxPax: 2, pricePerPax: 680000 },
          { minPax: 3, maxPax: 4, pricePerPax: 640000 },
          { minPax: 5, maxPax: 8, pricePerPax: 600000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Hotel pickup, gear fitting and return transfer included',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 950000 },
          { minPax: 2, maxPax: 2, pricePerPax: 880000 },
          { minPax: 3, maxPax: 4, pricePerPax: 840000 },
          { minPax: 5, maxPax: 8, pricePerPax: 800000 },
        ],
        blackoutDates: [],
        addons: [ADDON_PHOTOGRAPHY, ADDON_LUNCH],
      },
    ],
  },

  // ---------- 9. COMBO ----------
  {
    slug: 'ubud-atv-ayung-rafting-combo',
    title: 'Ubud ATV and Ayung Rafting Adventure Full Day Combo',
    hook3Sec: 'ATV, rafting and lunch in a single Bali adventure day',
    shortDescription:
      'The best of Ubud in one day: a jungle ATV ride, an Ayung River rafting session and a traditional Balinese lunch, all with transfers included.',
    duration: '8 hours',
    badge: 'Best Value',
    highlights: [
      'Jungle ATV ride combined with river rafting',
      'Traditional Balinese lunch in a local compound',
      'Hotel pickup and drop-off throughout the day',
      'All equipment, guides and insurance included',
    ],
    inclusions: ['ATV rental and rafting', 'Certified guides', 'Lunch', 'All safety equipment', 'Insurance'],
    exclusions: ['Personal expenses', 'Optional add-on services'],
    itinerary: [
      { time: '07:30', activity: 'Hotel pickup and ATV safety briefing' },
      { time: '08:00', activity: 'Jungle ATV ride' },
      { time: '10:30', activity: 'Ayung River rafting session' },
      { time: '12:30', activity: 'Traditional Balinese lunch' },
      { time: '14:00', activity: 'Return hotel transfer' },
    ],
    essentialInfo: {
      perfectFor: ['Families', 'Groups', 'First-time visitors'],
      whatToBring: ['Closed shoes for ATV', 'Swimwear for rafting', 'Change of clothes', 'Towel'],
      knowBeforeYouGo: ['Minimum age 12 for ATV', 'Minimum age 8 for rafting', 'Full day of activity'],
    },
    faqs: [
      {
        question: 'Is this suitable for a family with teenagers?',
        answer:
          'Yes. The combo is our most popular family package for guests aged 12 and above. A short break is scheduled between activities.',
      },
      {
        question: 'Can I leave one activity out?',
        answer:
          'Yes. The booking desk can adjust the package before payment if you prefer to skip either the ATV or the rafting session.',
      },
    ],
    languages: ['en', 'id'],
    category: TAXONOMY.COMBO,
    subcategory: 'Half & Full Day Package',
    primaryKeyword: 'Ubud ATV',
    destination: 'Ubud',
    secondaryKeywords: ['Ubud combo tour', 'ATV rafting combo', 'Bali activity package'],
    searchTags: ['combo', 'package', 'atv', 'rafting', 'full day'],
    difficulty: 'MODERATE',
    suitableFor: ['Families', 'Groups', 'First-time visitors'],
    imageUrl: '/images/combo.svg',
    gallery: ['/images/combo.svg', '/images/combo-2.svg', '/images/combo-3.svg'],
    rating: 4.9,
    locationKey: 'ubud',
    variants: [
      {
        title: 'Self Drive',
        shortDescription: 'Meet at the ATV trail head, transfers between activities included',
        badge: null,
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 1250000 },
          { minPax: 2, maxPax: 2, pricePerPax: 1150000 },
          { minPax: 3, maxPax: 4, pricePerPax: 1100000 },
          { minPax: 5, maxPax: 10, pricePerPax: 1050000 },
        ],
        blackoutDates: ['2026-12-25'],
        addons: [ADDON_PHOTOGRAPHY, ADDON_HOT_SPRING],
      },
      {
        title: 'Private Transfer',
        shortDescription: 'Full hotel pickup and drop-off for the entire day',
        badge: 'Best Value',
        priceTiers: [
          { minPax: 1, maxPax: 1, pricePerPax: 1450000 },
          { minPax: 2, maxPax: 2, pricePerPax: 1350000 },
          { minPax: 3, maxPax: 4, pricePerPax: 1300000 },
          { minPax: 5, maxPax: 10, pricePerPax: 1250000 },
        ],
        blackoutDates: ['2026-12-25'],
        addons: [ADDON_PHOTOGRAPHY, ADDON_HOT_SPRING, ADDON_BUFFET],
      },
    ],
  },
];
