/**
 * Tenant Configuration Service
 * 
 * Provides brand-specific configuration loaded from database
 * with fallback to environment variables.
 * 
 * All brand customization points are defined here.
 */

import { z } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * Brand Configuration Schema
 * 
 * This schema defines ALL customization points for a brand.
 * New brands only need to provide a YAML/JSON matching this schema.
 */
export const BrandConfigSchema = z.object({
  // Brand Identity
  brand: z.object({
    name: z.string().min(1).max(50),
    shortName: z.string().min(1).max(20).optional(),
    tagline: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
    faviconUrl: z.string().url().optional(),
  }),

  // Theme & Visual
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontHeading: z.string().optional(),
    fontBody: z.string().optional(),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
  }),

  // Category Taxonomy (which adventure categories this brand offers)
  categories: z.array(z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    short: z.string().max(20).optional(),
    emoji: z.string().max(4).optional(),
    description: z.string().max(200).optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })).min(1),

  // Pricing Rules
  pricing: z.object({
    currency: z.object({
      base: z.enum(['IDR']).default('IDR'),
      display: z.array(z.enum(['IDR', 'USD', 'AUD', 'SGD', 'EUR'])).default(['IDR', 'USD']),
      exchangeRate: z.object({
        USD: z.number().positive().default(15500),
      }).optional(),
    }),
    rounding: z.enum(['none', '100', '1000', '5000']).default('1000'),
    minPriceIdr: z.number().int().positive().default(50000),
    maxDiscountPercent: z.number().int().min(0).max(100).default(50),
    promoStacking: z.boolean().default(false),
    couponStacking: z.boolean().default(false),
  }),

  // Booking Rules
  booking: z.object({
    minAdvanceHours: z.number().int().min(0).default(2),
    maxAdvanceDays: z.number().int().min(1).default(365),
    cancellationPolicy: z.object({
      freeCancellationHours: z.number().int().min(0).default(24),
      refundPercentTiers: z.array(z.object({
        hoursBefore: z.number().int().min(0),
        refundPercent: z.number().int().min(0).max(100),
      })).default([
        { hoursBefore: 24, refundPercent: 80 },
        { hoursBefore: 12, refundPercent: 50 },
        { hoursBefore: 0, refundPercent: 0 },
      ]),
    }),
    holdDurationMinutes: z.number().int().min(5).default(15),
    maxPaxPerBooking: z.number().int().min(1).default(20),
    requireWaiver: z.boolean().default(true),
    waiverVersion: z.string().default('1.0'),
  }),

  // Payment Configuration
  payment: z.object({
    midtrans: z.object({
      clientKey: z.string().optional(),
      serverKey: z.string().optional(),
      isProduction: z.boolean().default(false),
      enabledMethods: z.array(z.enum([
        'credit_card', 'gopay', 'shopeepay', 'dana', 'ovo',
        'bca_va', 'bni_va', 'bri_va', 'permata_va', 'mandiri_va',
        'alfamart', 'indomaret', 'qrris', 'bank_transfer'
      ])).default(['credit_card', 'gopay', 'bank_transfer', 'qrris']),
    }),
    manualTransfer: z.object({
      enabled: z.boolean().default(true),
      bankAccounts: z.array(z.object({
        bank: z.string(),
        accountNumber: z.string(),
        accountName: z.string(),
      })).optional(),
    }),
  }),

  // Communication
  communication: z.object({
    email: z.object({
      fromName: z.string(),
      fromEmail: z.string().email(),
      supportEmail: z.string().email(),
      helloEmail: z.string().email(),
      partnersEmail: z.string().email(),
      templates: z.record(z.string()).optional(),
    }),
    whatsapp: z.object({
      businessNumber: z.string().optional(),
      apiKey: z.string().optional(),
      templateNamespace: z.string().optional(),
    }),
    notifications: z.object({
      bookingConfirmation: z.boolean().default(true),
      paymentReminder: z.boolean().default(true),
      pickupReminder: z.boolean().default(true),
      reviewRequest: z.boolean().default(true),
      reviewRequestDelayHours: z.number().int().min(1).default(24),
    }),
  }),

  // SEO & Content
  seo: z.object({
    defaultTitle: z.string().max(60).optional(),
    defaultDescription: z.string().max(160).optional(),
    ogImageUrl: z.string().url().optional(),
    twitterHandle: z.string().optional(),
    googleAnalyticsId: z.string().optional(),
    googleSearchConsoleId: z.string().optional(),
  }),

  // Features Flags
  features: z.object({
    aiContentGeneration: z.boolean().default(true),
    reviewInvites: z.boolean().default(true),
    couponCodes: z.boolean().default(true),
    groupBooking: z.boolean().default(false),
    giftCards: z.boolean().default(false),
    loyaltyProgram: z.boolean().default(false),
    multiLanguage: z.boolean().default(true),
    pwa: z.boolean().default(true),
  }),

  // Localization
  localization: z.object({
    defaultLocale: z.enum(['en', 'id']).default('en'),
    supportedLocales: z.array(z.enum(['en', 'id', 'zh', 'ja', 'ko'])).default(['en', 'id']),
    dateFormat: z.string().default('DD MMM YYYY'),
    timeFormat: z.string().default('HH:mm'),
    numberFormat: z.enum(['id-ID', 'en-US']).default('id-ID'),
  }),

  // Operational
  operations: z.object({
    timezone: z.string().default('Asia/Makassar'),
    businessHours: z.object({
      start: z.string().default('08:00'),
      end: z.string().default('22:00'),
      days: z.array(z.number().int().min(0).max(6)).default([0,1,2,3,4,5,6]),
    }),
    supportPhone: z.string().optional(),
    emergencyPhone: z.string().optional(),
  }),
});

export type BrandConfig = z.infer<typeof BrandConfigSchema>;

/**
 * Default brand configuration (BaliWild Adventures)
 * Used as fallback when tenant config not found
 */
export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brand: {
    name: 'BaliWild Adventures',
    shortName: 'BaliWild',
    tagline: 'Own the Wild. Born & Built in Bali 🌿',
    description: 'Adventure bookings across Bali with licensed local operators — instant confirmation and free reschedule up to 24 hours before.',
    logoUrl: '/images/logo-baliwild.svg',
    faviconUrl: '/icons/favicon.ico',
  },
  theme: {
    primaryColor: '#FFEE00',
    secondaryColor: '#1A1A1A',
    accentColor: '#1E3A2B',
    fontHeading: 'Barlow Condensed',
    fontBody: 'Plus Jakarta Sans',
    borderRadius: 'md',
  },
  categories: [
    { slug: 'atv', name: 'ATV & Off-Road', short: 'ATV', emoji: '🏁', description: 'All-terrain vehicle adventures through rice terraces and jungles', isActive: true, sortOrder: 1 },
    { slug: 'rafting', name: 'Rafting', short: 'Rafting', emoji: '🚣', description: 'White water rafting on Bali\'s scenic rivers', isActive: true, sortOrder: 2 },
    { slug: 'tubing', name: 'River Tubing', short: 'Tubing', emoji: '🛟', description: 'Relaxing river tubing through hidden canyons', isActive: true, sortOrder: 3 },
    { slug: 'cycling', name: 'Cycling', short: 'Cycling', emoji: '🚴', description: 'Mountain and road cycling through Bali\'s landscapes', isActive: true, sortOrder: 4 },
    { slug: 'trekking', name: 'Trekking & Hiking', short: 'Trekking', emoji: '🥾', description: 'Volcano hikes and jungle treks with local guides', isActive: true, sortOrder: 5 },
    { slug: 'water-sports', name: 'Water Sports', short: 'Water Sports', emoji: '🏄', description: 'Surfing, paddleboarding, and ocean adventures', isActive: true, sortOrder: 6 },
    { slug: 'snorkeling', name: 'Snorkeling & Diving', short: 'Snorkeling', emoji: '🤿', description: 'Coral reef exploration and marine life encounters', isActive: true, sortOrder: 7 },
    { slug: 'extreme', name: 'Extreme Adventures', short: 'Extreme', emoji: '🪂', description: 'Canyoning, paragliding, and adrenaline experiences', isActive: true, sortOrder: 8 },
    { slug: 'combo', name: 'Adventure Combo Packages', short: 'Combo', emoji: '🎁', description: 'Multi-activity packages for the ultimate Bali adventure', isActive: true, sortOrder: 9 },
  ],
  pricing: {
    currency: {
      base: 'IDR',
      display: ['IDR', 'USD'],
      exchangeRate: { USD: 15500 },
    },
    rounding: '1000',
    minPriceIdr: 50000,
    maxDiscountPercent: 50,
    promoStacking: false,
    couponStacking: false,
  },
  booking: {
    minAdvanceHours: 2,
    maxAdvanceDays: 365,
    cancellationPolicy: {
      freeCancellationHours: 24,
      refundPercentTiers: [
        { hoursBefore: 24, refundPercent: 80 },
        { hoursBefore: 12, refundPercent: 50 },
        { hoursBefore: 0, refundPercent: 0 },
      ],
    },
    holdDurationMinutes: 15,
    maxPaxPerBooking: 20,
    requireWaiver: true,
    waiverVersion: '1.0',
  },
  payment: {
    midtrans: {
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      isProduction: process.env.NODE_ENV === 'production',
      enabledMethods: ['credit_card', 'gopay', 'bank_transfer', 'qrris'],
    },
    manualTransfer: {
      enabled: true,
      bankAccounts: [
        { bank: 'BCA', accountNumber: '1234567890', accountName: 'PT BaliWild Adventures' },
        { bank: 'Mandiri', accountNumber: '0987654321', accountName: 'PT BaliWild Adventures' },
      ],
    },
  },
  communication: {
    email: {
      fromName: 'BaliWild Adventures',
      fromEmail: 'hello@baliwild.com',
      supportEmail: 'support@baliwild.com',
      helloEmail: 'hello@baliwild.com',
      partnersEmail: 'partners@baliwild.com',
    },
    whatsapp: {
      businessNumber: '+6281234567890',
    },
    notifications: {
      bookingConfirmation: true,
      paymentReminder: true,
      pickupReminder: true,
      reviewRequest: true,
      reviewRequestDelayHours: 24,
    },
  },
  seo: {
    defaultTitle: 'BaliWild Adventures - Book Your Bali Adventure',
    defaultDescription: 'Discover unforgettable adventures in Bali. ATV, Rafting, Trekking & more. Instant confirmation, free reschedule.',
    ogImageUrl: '/images/og-baliwild.jpg',
    twitterHandle: '@baliwild',
    googleAnalyticsId: process.env.GA_MEASUREMENT_ID,
  },
  features: {
    aiContentGeneration: true,
    reviewInvites: true,
    couponCodes: true,
    groupBooking: false,
    giftCards: false,
    loyaltyProgram: false,
    multiLanguage: true,
    pwa: true,
  },
  localization: {
    defaultLocale: 'en',
    supportedLocales: ['en', 'id'],
    dateFormat: 'DD MMM YYYY',
    timeFormat: 'HH:mm',
    numberFormat: 'id-ID',
  },
  operations: {
    timezone: 'Asia/Makassar',
    businessHours: {
      start: '08:00',
      end: '22:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  },
};

// In-memory cache for brand configs
const brandConfigCache = new Map<string, { config: BrandConfig; expires: number }>();
const BRAND_CONFIG_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get brand configuration for a tenant
 * Loads from database with fallback to default config
 */
export async function getBrandConfig(tenantId: string): Promise<BrandConfig> {
  // Check cache
  const cached = brandConfigCache.get(tenantId);
  if (cached && cached.expires > Date.now()) {
    return cached.config;
  }

  try {
    // Try to load from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
        themeColor: true,
        logoUrl: true,
        config: true, // JSON field for brand config
      },
    });

    if (tenant?.config) {
      // Validate and merge with defaults
      const parsed = BrandConfigSchema.safeParse(tenant.config);
      if (parsed.success) {
        const config = mergeWithDefaults(parsed.data);
        brandConfigCache.set(tenantId, { config, expires: Date.now() + BRAND_CONFIG_TTL });
        return config;
      }
      console.warn(`Invalid brand config for tenant ${tenantId}, using defaults`);
    }

    // Fallback to default with tenant-specific overrides
    const config = createTenantDefaultConfig(tenant);
    brandConfigCache.set(tenantId, { config, expires: Date.now() + BRAND_CONFIG_TTL });
    return config;
  } catch (error) {
    console.error(`Failed to load brand config for ${tenantId}:`, error);
    return DEFAULT_BRAND_CONFIG;
  }
}

/**
 * Create default config with tenant-specific overrides
 */
function createTenantDefaultConfig(tenant: { id: string; name: string; domain: string; themeColor: string; logoUrl: string | null } | null): BrandConfig {
  if (!tenant) return DEFAULT_BRAND_CONFIG;

  return {
    ...DEFAULT_BRAND_CONFIG,
    brand: {
      ...DEFAULT_BRAND_CONFIG.brand,
      name: tenant.name || DEFAULT_BRAND_CONFIG.brand.name,
    },
    theme: {
      ...DEFAULT_BRAND_CONFIG.theme,
      primaryColor: tenant.themeColor || DEFAULT_BRAND_CONFIG.theme.primaryColor,
    },
  };
}

/**
 * Merge tenant config with defaults (tenant values take precedence)
 */
function mergeWithDefaults(tenantConfig: BrandConfig): BrandConfig {
  return {
    brand: { ...DEFAULT_BRAND_CONFIG.brand, ...tenantConfig.brand },
    theme: { ...DEFAULT_BRAND_CONFIG.theme, ...tenantConfig.theme },
    categories: tenantConfig.categories.length > 0 ? tenantConfig.categories : DEFAULT_BRAND_CONFIG.categories,
    pricing: { ...DEFAULT_BRAND_CONFIG.pricing, ...tenantConfig.pricing },
    booking: { ...DEFAULT_BRAND_CONFIG.booking, ...tenantConfig.booking },
    payment: { ...DEFAULT_BRAND_CONFIG.payment, ...tenantConfig.payment },
    communication: { ...DEFAULT_BRAND_CONFIG.communication, ...tenantConfig.communication },
    seo: { ...DEFAULT_BRAND_CONFIG.seo, ...tenantConfig.seo },
    features: { ...DEFAULT_BRAND_CONFIG.features, ...tenantConfig.features },
    localization: { ...DEFAULT_BRAND_CONFIG.localization, ...tenantConfig.localization },
    operations: { ...DEFAULT_BRAND_CONFIG.operations, ...tenantConfig.operations },
  };
}

/**
 * Clear brand config cache
 */
export function clearBrandConfigCache(tenantId?: string): void {
  if (tenantId) {
    brandConfigCache.delete(tenantId);
  } else {
    brandConfigCache.clear();
  }
}

/**
 * Validate brand config (for admin UI)
 */
export function validateBrandConfig(config: unknown): { success: boolean; errors?: z.ZodError; data?: BrandConfig } {
  const result = BrandConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: mergeWithDefaults(result.data) };
  }
  return { success: false, errors: result.error };
}