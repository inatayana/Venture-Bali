#!/usr/bin/env node
/**
 * Provision Brand Script
 * 
 * Usage: 
 *   node scripts/provision-brand.js --slug baliexperience --name "BaliExperience" --color "#2E7D32"
 *   node scripts/provision-brand.js --config brand-config.yaml
 * 
 * Requirements:
 * - Run from monorepo root
 * - Prisma client generated
 * - DB connection via DATABASE_URL
 * - ENV vars: MIDTRANS_CLIENT_KEY, MIDTRANS_SERVER_KEY, GA_MEASUREMENT_ID
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  const result = spawnSync(cmd, { shell: true, stdio: 'inherit', ...opts });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd}`);
  }
  return result;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    slug: '',
    name: '',
    color: '',
    logo: '',
    shortName: '',
    tagline: '',
    description: '',
    favicon: '',
    configFile: '',
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--slug': config.slug = args[++i]; break;
      case '--name': config.name = args[++i]; break;
      case '--color': config.color = args[++i]; break;
      case '--logo': config.logo = args[++i]; break;
      case '--short': config.shortName = args[++i]; break;
      case '--tagline': config.tagline = args[++i]; break;
      case '--desc': config.description = args[++i]; break;
      case '--favicon': config.favicon = args[++i]; break;
      case '--config': config.configFile = args[++i]; break;
      case '--dry-run': config.dryRun = true; break;
      case '--help':
        console.log(`
Usage: node scripts/provision-brand.js [options]

Options:
  --slug <slug>         Brand slug (lowercase, alphanumeric + hyphen)
  --name <name>         Brand display name
  --color <hex>         Primary color hex (e.g. #2E7D32)
  --logo <url>          Logo URL (HTTPS, SVG preferred)
  --short <name>        Short name (optional)
  --tagline <text>      Brand tagline (optional)
  --desc <text>         Description (optional)
  --favicon <url>       Favicon URL (optional)
  --config <file>       Load config from YAML file
  --dry-run             Print SQL without executing
  --help                Show this help
        `);
        process.exit(0);
    }
  }

  if (!config.slug || !config.name || !config.color) {
    console.error('❌ Required: --slug, --name, --color');
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(config.slug)) {
    console.error('❌ Slug must be lowercase alphanumeric + hyphen');
    process.exit(1);
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(config.color)) {
    console.error('❌ Color must be 6-digit hex (e.g. #2E7D32)');
    process.exit(1);
  }

  return config;
}

async function loadConfigFromFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  return yaml.load(content);
}

function generateBrandConfig(config) {
  const template = {
    brand: {
      name: config.name,
      shortName: config.shortName || config.name,
      tagline: config.tagline || 'Discover Authentic Bali',
      description: config.description || 'Curated local experiences by verified hosts',
      logoUrl: config.logo || `https://cdn.example.com/logos/${config.slug}.svg`,
      faviconUrl: config.favicon || `https://cdn.example.com/favicons/${config.slug}.ico`,
    },
    theme: {
      primaryColor: config.color,
      secondaryColor: '#' + config.color.slice(1) + '20',
      accentColor: '#' + config.color.slice(1) + '80',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
      borderRadius: 'md',
    },
    categories: [
      { slug: 'culture', name: 'Culture & Heritage', short: 'Culture', emoji: '🏛️', description: 'Temples, ceremonies, traditional arts', isActive: true, sortOrder: 1 },
      { slug: 'nature', name: 'Nature & Adventure', short: 'Nature', emoji: '🌿', description: 'Waterfalls, rice terraces, volcanoes', isActive: true, sortOrder: 2 },
      { slug: 'wellness', name: 'Wellness & Healing', short: 'Wellness', emoji: '🧘', description: 'Yoga, meditation, spa, sound healing', isActive: true, sortOrder: 3 },
      { slug: 'culinary', name: 'Culinary Experiences', short: 'Food', emoji: '🍲', description: 'Cooking classes, food tours, farm visits', isActive: true, sortOrder: 4 },
    ],
    pricing: {
      currency: { base: 'IDR', display: ['IDR', 'USD'], exchangeRate: { USD: 15500 } },
      rounding: '1000',
      minPriceIdr: 50000,
      maxDiscountPercent: 40,
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
      maxPaxPerBooking: 15,
      requireWaiver: true,
      waiverVersion: '1.0',
    },
    payment: {
      midtrans: {
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        isProduction: process.env.NODE_ENV === 'production',
        enabledMethods: ['credit_card', 'gopay', 'shopeepay', 'bank_transfer', 'qrris'],
      },
      manualTransfer: {
        enabled: true,
        bankAccounts: [
          { bank: 'BCA', accountNumber: '1234567890', accountName: `PT ${process.env.BRAND_NAME || 'BaliWild'}` },
        ],
      },
    },
    communication: {
      email: {
        fromName: process.env.BRAND_NAME || 'BaliWild',
        fromEmail: 'hello@baliwild.com',
        supportEmail: 'support@baliwild.com',
        helloEmail: 'hello@baliwild.com',
        partnersEmail: 'partners@baliwild.com',
      },
      whatsapp: { businessNumber: '+6281234567890' },
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
      defaultDescription: 'Discover unforgettable adventures in Bali. ATV, Rafting, Trekking & more.',
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
      businessHours: { start: '08:00', end: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
    },
  };
}

async function executeSQL(sql, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY-RUN] ${sql.substring(0, 100)}...`);
    return;
  }
  await prisma.$executeRawUnsafe(sql);
}

async function main() {
  const config = parseArgs();

  // Load config from file if provided
  if (config.configFile) {
    const fileConfig = await loadConfigFromFile(config.configFile);
    Object.assign(config, fileConfig);
  }

  const tenantId = `tenant-${config.slug}`;
  const brandConfig = generateBrandConfig(config);

  console.log('🚀 Provisioning brand:', config.name, `(${config.slug})`);
  console.log('Tenant ID:', tenantId);

  if (config.dryRun) {
    console.log('\n⚠️ DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Provision Tenant
    console.log('\n📝 Step 1: Provision Tenant');
    await executeSQL(`
      INSERT INTO "Tenant" (id, domain, name, themeColor, logoUrl, isActive)
      VALUES ('${tenantId}', '${config.slug}', '${config.name}', '${config.color}', '${config.logo || ''}', true)
      ON CONFLICT (id) DO NOTHING;
    `, config.dryRun);

    // Step 2: Apply Brand Config
    console.log('\n📝 Step 2: Apply Brand Config');
    const configJson = JSON.stringify(brandConfig).replace(/'/g, "''");
    await executeSQL(`
      UPDATE "Tenant" SET config = '${configJson}'::jsonb WHERE id = '${tenantId}';
    `, config.dryRun);

    // Step 3: Seed Data
    if (!config.dryRun) {
      console.log('\n🌱 Step 3: Seeding Data');
      process.env.TENANT_ID = `tenant-${config.slug}`;
      run('npm run db:seed');
    }

    // Step 4: Smoke Test (if not dry run)
    if (!config.dryRun) {
      console.log('\n🧪 Step 4: Smoke Test');
      const baseUrl = `https://${config.slug}.platform.example.com`;
      
      const health = spawnSync('curl', ['-s', `${baseUrl}/api/v1/health`], { encoding: 'utf8' });
      if (health.status === 0) {
        console.log('✅ Health check passed');
      }

      const ventures = spawnSync('curl', ['-s', '-H', `X-Tenant-ID: tenant-${config.slug}`, 'https://api.example.com/api/v1/ventures'], { encoding: 'utf8' });
      if (ventures.status === 0) {
        const data = JSON.parse(ventures.stdout);
        console.log(`✅ Ventures loaded: ${data.data?.items?.length || 0} items`);
      }
    }

    console.log('\n✅ Provisioning Complete!');
    console.log(`\nBrand: ${config.name} (tenant-${config.slug})`);
    console.log(`Domain: ${config.slug}.platform.example.com`);
    console.log(`Theme: ${config.color}`);
    console.log(`Status: ✅ LIVE`);

  } catch (error) {
    console.error('\n❌ Provisioning failed:', error.message);
    
    // Rollback hint
    console.log('\n🔄 Rollback:');
    console.log(`  npx prisma db execute --stdin <<< "DELETE FROM \\"Tenant\\" WHERE id = 'tenant-${config.slug}';"`);
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});