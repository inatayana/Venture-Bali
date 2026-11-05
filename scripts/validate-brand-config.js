#!/usr/bin/env node
/**
 * Validate Brand Config Script
 * 
 * Usage: 
 *   npm run brand:validate -- --config brand-config.yaml
 *   node scripts/validate-brand-config.js --config brand-config.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { z } = require('zod');

const BrandConfigSchema = z.object({
  brand: z.object({
    name: z.string().min(1).max(50),
    shortName: z.string().min(1).max(20).optional(),
    tagline: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
    faviconUrl: z.string().url().optional(),
  }),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontHeading: z.string().optional(),
    fontBody: z.string().optional(),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
  }),
  categories: z.array(z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    short: z.string().max(20).optional(),
    emoji: z.string().max(4).optional(),
    description: z.string().max(200).optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })).min(1),
  pricing: z.object({
    currency: z.object({
      base: z.enum(['IDR']).default('IDR'),
      display: z.array(z.enum(['IDR', 'USD', 'AUD', 'SGD', 'EUR'])).default(['IDR', 'USD']),
      exchangeRate: z.object({
        USD: z.number().positive().default(15500),
        AUD: z.number().positive().optional(),
        SGD: z.number().positive().optional(),
        EUR: z.number().positive().optional(),
      }).optional(),
    }),
    rounding: z.enum(['none', '100', '1000', '5000']).default('1000'),
    minPriceIdr: z.number().int().positive().default(50000),
    maxDiscountPercent: z.number().int().min(0).max(100).default(50),
    promoStacking: z.boolean().default(false),
    couponStacking: z.boolean().default(false),
  }),
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
  seo: z.object({
    defaultTitle: z.string().max(60).optional(),
    defaultDescription: z.string().max(160).optional(),
    ogImageUrl: z.string().url().optional(),
    twitterHandle: z.string().optional(),
    googleAnalyticsId: z.string().optional(),
  }),
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
  localization: z.object({
    defaultLocale: z.enum(['en', 'id']).default('en'),
    supportedLocales: z.array(z.enum(['en', 'id', 'zh', 'ja', 'ko'])).default(['en', 'id']),
    dateFormat: z.string().default('DD MMM YYYY'),
    timeFormat: z.string().default('HH:mm'),
    numberFormat: z.enum(['id-ID', 'en-US']).default('id-ID'),
  }),
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

function main() {
  const args = process.argv.slice(2);
  
  let configFile = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && i + 1 < args.length) {
      configFile = args[i + 1];
    }
  }
  
  if (!configFile) {
    console.error('❌ Usage: node validate-brand-config.js --config <file.yaml>');
    process.exit(1);
  }
  
  if (!fs.existsSync(configFile)) {
    console.error(`❌ File not found: ${configFile}`);
    process.exit(1);
  }
  
  console.log(`🔍 Validating: ${configFile}`);
  
  try {
    const content = fs.readFileSync(configFile, 'utf8');
    const config = yaml.load(content);
    
    const result = BrandConfigSchema.safeParse(config);
    
    if (!result.success) {
      console.error('\n❌ Validation Failed:');
      result.error.errors.forEach(err => {
        console.error(`  ❌ ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    
    console.log('✅ Valid brand configuration');
    console.log('\n📋 Summary:');
    console.log(`  Brand: ${result.data.brand.name}`);
    console.log(`  Primary Color: ${result.data.theme.primaryColor}`);
    console.log(`  Categories: ${result.data.categories.filter(c => c.isActive).length} active`);
    console.log(`  Features: ${Object.entries(result.data.features).filter(([_, v]) => v).map(([k]) => k).join(', ')}`);
    console.log(`  Locales: ${result.data.localization.supportedLocales.join(', ')}`);
    
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      console.error('❌ YAML Parse Error:', error.message);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();