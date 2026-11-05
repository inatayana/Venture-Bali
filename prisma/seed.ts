/**
 * BaliWild — Prisma Seed Script
 * -----------------------------------
 * Seeds base reference data and demo ventures for all 9 adventure mega categories.
 *
 * Usage:
 *   npx prisma db seed
 *
 * Rules enforced (see AGENTS.md §9):
 *   - Only the 9 adventure mega categories are used.
 *   - "BaliWild" brand name never appears in product titles or slugs.
 *   - Vendor / partner names are never exposed.
 *   - All prices are IDR integers.
 *
 * Docs: docs/MASTER_PRODUCT_CATALOG.md, docs/SEO_TAXONOMY.md,
 *       docs/BOOKING_ARCHITECTURE.md, docs/PRODUCT_TITLE_CONSTITUTION.md
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/adminAuth.ts';
import type { Prisma } from '@prisma/client';
import { validateVentureTitle, isVentureSlugValid } from '../src/lib/titleValidator.ts';
import { isAllowedCategory } from '../src/lib/taxonomy.ts';
import {
  CATALOGUE_CATEGORIES,
  COUPONS,
  DEFAULT_SLOTS,
  LOCATIONS,
  MEETING_POINTS,
  PICKUP_ZONES,
  SAFETY_INFO,
  TENANT_DOMAIN,
  TENANT_NAME,
  TENANT_THEME,
  VEHICLE_CLASSES,
  VENTURES,
  resolveFulfillmentMode,
  type VentureSeed,
} from '../src/data/catalogue.ts';

const prisma = new PrismaClient();


// ============ GUARDRAILS (AGENTS.md §9) ============

/**
 * Validate every seeded venture against the Product Title Constitution and the
 * 9-category taxonomy BEFORE touching the database.
 * Fails fast so a non-compliant product can never reach production.
 */
function assertSeedCompliance(ventures: VentureSeed[]): void {
  const problems: string[] = [];

  for (const venture of ventures) {
    if (!isAllowedCategory(venture.category)) {
      problems.push(`[${venture.slug}] category "${venture.category}" is not one of the 9 mega categories.`);
    }

    if (!isVentureSlugValid(venture.slug)) {
      problems.push(`[${venture.slug}] slug is invalid (lowercase, hyphen only, no brand name).`);
    }

    const result = validateVentureTitle({
      title: venture.title,
      primaryKeyword: venture.primaryKeyword,
      destination: venture.destination,
    });

    if (!result.valid) {
      problems.push(
        `[${venture.slug}] title "${venture.title}" violates the title constitution:\n    - ${result.errors.join('\n    - ')}`
      );
    }
  }

  if (problems.length > 0) {
    console.error('\n❌ Seed data violates the product guardrails:\n');
    for (const problem of problems) console.error(`  • ${problem}`);
    console.error('\nFix the seed data before running the seed.\n');
    process.exit(1);
  }

  console.log(`✓ Guardrails passed for ${ventures.length} ventures.`);
}

// ============ SEED LOGIC ============

async function seedTenant() {
  const tenant = await prisma.tenant.upsert({
    where: { domain: TENANT_DOMAIN },
    update: { name: TENANT_NAME, themeColor: TENANT_THEME, isActive: true },
    create: {
      domain: TENANT_DOMAIN,
      name: TENANT_NAME,
      themeColor: TENANT_THEME,
      isActive: true,
    },
  });
  console.log(`✓ Tenant: ${tenant.name} (${tenant.domain})`);
  return tenant;
}

async function seedLocations() {
  const map = new Map<string, string>();
  for (const loc of LOCATIONS) {
    const existing = await prisma.location.findFirst({ where: { name: loc.name } });
    const record = existing
      ? await prisma.location.update({
          where: { id: existing.id },
          data: {
            region: loc.region,
            latitude: loc.latitude,
            longitude: loc.longitude,
          },
        })
      : await prisma.location.create({
          data: {
            name: loc.name,
            region: loc.region,
            latitude: loc.latitude,
            longitude: loc.longitude,
          },
        });
    map.set(loc.key, record.id);
  }
  console.log(`✓ Locations: ${LOCATIONS.length}`);
  return map;
}

async function seedPickupZones(): Promise<Map<string, string>> {
  const zoneIds = new Map<string, string>();
  for (const zone of PICKUP_ZONES) {
    const record = await prisma.pickupZone.upsert({
      where: { name: zone.name },
      update: {
        areaType: zone.areaType,
        surchargeIdr: zone.surchargeIdr,
        surchargePerPaxIdr: zone.surchargePerPaxIdr,
        isCustomQuote: zone.isCustomQuote,
        vehicleMaxPax: zone.vehicleMaxPax,
        isActive: true,
      },
      create: {
        name: zone.name,
        areaType: zone.areaType,
        surchargeIdr: zone.surchargeIdr,
        surchargePerPaxIdr: zone.surchargePerPaxIdr,
        isCustomQuote: zone.isCustomQuote,
        vehicleMaxPax: zone.vehicleMaxPax,
        isActive: true,
      },
    });
    zoneIds.set(zone.areaType, record.id);
  }
  console.log(`✓ Pickup zones: ${PICKUP_ZONES.length}`);
  return zoneIds;
}

async function seedVehicleClasses() {
  for (const vc of VEHICLE_CLASSES) {
    await prisma.vehicleClass.upsert({
      where: { name: vc.name },
      update: {
        label: vc.label,
        description: vc.description,
        vehicleMaxPax: vc.vehicleMaxPax,
        deltaIdr: vc.deltaIdr,
        sortOrder: vc.sortOrder,
        isActive: true,
      },
      create: vc,
    });
  }
  console.log(`✓ Vehicle classes: ${VEHICLE_CLASSES.length}`);
}

async function seedCoupons() {
  for (const coupon of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        label: coupon.label,
        discountPercent: coupon.discountPercent,
        minPax: coupon.minPax,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
      },
      create: {
        code: coupon.code,
        label: coupon.label,
        discountPercent: coupon.discountPercent,
        minPax: coupon.minPax,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
      },
    });
  }
  console.log(`✓ Coupons: ${COUPONS.map((coupon) => coupon.code).join(', ')}`);
}

async function seedVentures(
  tenantId: string,
  locationIds: Map<string, string>,
  pickupZoneIds: Map<string, string>,
) {
  for (const v of VENTURES) {
    const locationId = locationIds.get(v.locationKey) ?? null;
    const meetingPoint = MEETING_POINTS[v.slug] ?? null;
    const safety = SAFETY_INFO[v.slug] ?? null;

    const venture = await prisma.venture.upsert({
      where: { slug: v.slug },
      update: {
        title: v.title,
        hook3Sec: v.hook3Sec,
        shortDescription: v.shortDescription,
        longDescription: v.longDescription ?? null,
        duration: v.duration,
        badge: v.badge,
        meetingPoint: meetingPoint?.name ?? null,
        meetingPointLat: meetingPoint?.latitude ?? null,
        meetingPointLng: meetingPoint?.longitude ?? null,
        minAge: safety?.minAge ?? null,
        maxWeightKg: safety?.maxWeightKg ?? null,
        safetyBriefing: safety?.briefing ?? null,
        highlights: v.highlights as unknown as Prisma.InputJsonValue,
        inclusions: v.inclusions as unknown as Prisma.InputJsonValue,
        exclusions: v.exclusions as unknown as Prisma.InputJsonValue,
        itinerary: v.itinerary as unknown as Prisma.InputJsonValue,
        essentialInfo: v.essentialInfo as unknown as Prisma.InputJsonValue,
        faqs: v.faqs as unknown as Prisma.InputJsonValue,
        languages: v.languages as unknown as Prisma.InputJsonValue,
        category: v.category,
        subcategory: v.subcategory,
        primaryKeyword: v.primaryKeyword,
        secondaryKeywords: v.secondaryKeywords as unknown as Prisma.InputJsonValue,
        searchTags: v.searchTags as unknown as Prisma.InputJsonValue,
        difficulty: v.difficulty,
        suitableFor: v.suitableFor as unknown as Prisma.InputJsonValue,
        imageUrl: v.imageUrl,
        gallery: v.gallery as unknown as Prisma.InputJsonValue,
        rating: v.rating,
        tenantId,
        locationId,
      },
      create: {
        slug: v.slug,
        title: v.title,
        hook3Sec: v.hook3Sec,
        shortDescription: v.shortDescription,
        longDescription: v.longDescription ?? null,
        duration: v.duration,
        badge: v.badge,
        meetingPoint: meetingPoint?.name ?? null,
        meetingPointLat: meetingPoint?.latitude ?? null,
        meetingPointLng: meetingPoint?.longitude ?? null,
        minAge: safety?.minAge ?? null,
        maxWeightKg: safety?.maxWeightKg ?? null,
        safetyBriefing: safety?.briefing ?? null,
        highlights: v.highlights as unknown as Prisma.InputJsonValue,
        inclusions: v.inclusions as unknown as Prisma.InputJsonValue,
        exclusions: v.exclusions as unknown as Prisma.InputJsonValue,
        itinerary: v.itinerary as unknown as Prisma.InputJsonValue,
        essentialInfo: v.essentialInfo as unknown as Prisma.InputJsonValue,
        faqs: v.faqs as unknown as Prisma.InputJsonValue,
        languages: v.languages as unknown as Prisma.InputJsonValue,
        category: v.category,
        subcategory: v.subcategory,
        primaryKeyword: v.primaryKeyword,
        secondaryKeywords: v.secondaryKeywords as unknown as Prisma.InputJsonValue,
        searchTags: v.searchTags as unknown as Prisma.InputJsonValue,
        difficulty: v.difficulty,
        suitableFor: v.suitableFor as unknown as Prisma.InputJsonValue,
        imageUrl: v.imageUrl,
        gallery: v.gallery as unknown as Prisma.InputJsonValue,
        rating: v.rating,
        tenantId,
        locationId,
      },
    });

    // Remove variants that no longer exist in the catalogue, but never delete
    // one that already has bookings (that would cascade and erase history).
    const seededTitles = v.variants.map((variant) => variant.title);
    const removed = await prisma.variant.deleteMany({
      where: {
        ventureId: venture.id,
        title: { notIn: seededTitles },
        bookings: { none: {} },
      },
    });
    if (removed.count > 0) {
      console.log(`  ↳ ${v.slug}: removed ${removed.count} stale variant(s)`);
    }

    // Variants — identified by (ventureId, title)
    for (const variantSeed of v.variants) {
      const existingVariant = await prisma.variant.findFirst({
        where: { ventureId: venture.id, title: variantSeed.title },
      });

      const variant = existingVariant
        ? await prisma.variant.update({
            where: { id: existingVariant.id },
            data: {
              shortDescription: variantSeed.shortDescription,
              badge: variantSeed.badge,
              transportBadge: variantSeed.transportBadge ?? null,
              imageUrl: variantSeed.imageUrl ?? null,
              duration: variantSeed.duration ?? v.duration,
              fulfillmentMode: resolveFulfillmentMode(variantSeed),
              pickupZoneId: variantSeed.pickupZoneAreaType
                ? pickupZoneIds.get(variantSeed.pickupZoneAreaType) ?? null
                : null,
              promoPriceIdr: variantSeed.promoPriceIdr ?? null,
              operationNotes: variantSeed.operationNotes ?? null,
              inclusions: (variantSeed.inclusions ?? []) as unknown as Prisma.InputJsonValue,
              exclusions: (variantSeed.exclusions ?? []) as unknown as Prisma.InputJsonValue,
              minimumSpendIdr: variantSeed.minimumSpendIdr ?? null,
              sortOrder: variantSeed.sortOrder ?? 0,
              blackoutDates:
                variantSeed.blackoutDates as unknown as Prisma.InputJsonValue,
            },
          })
        : await prisma.variant.create({
            data: {
              ventureId: venture.id,
              title: variantSeed.title,
              shortDescription: variantSeed.shortDescription,
              badge: variantSeed.badge,
              transportBadge: variantSeed.transportBadge ?? null,
              imageUrl: variantSeed.imageUrl ?? null,
              duration: variantSeed.duration ?? v.duration,
              fulfillmentMode: resolveFulfillmentMode(variantSeed),
              pickupZoneId: variantSeed.pickupZoneAreaType
                ? pickupZoneIds.get(variantSeed.pickupZoneAreaType) ?? null
                : null,
              promoPriceIdr: variantSeed.promoPriceIdr ?? null,
              operationNotes: variantSeed.operationNotes ?? null,
              inclusions: (variantSeed.inclusions ?? []) as unknown as Prisma.InputJsonValue,
              exclusions: (variantSeed.exclusions ?? []) as unknown as Prisma.InputJsonValue,
              minimumSpendIdr: variantSeed.minimumSpendIdr ?? null,
              sortOrder: variantSeed.sortOrder ?? 0,
              blackoutDates:
                variantSeed.blackoutDates as unknown as Prisma.InputJsonValue,
            },
          });

      // Price tiers. Re-seeding MUST preserve admin-set age-tiered pricing
      // (pricingModel + kids/youth prices) — those live only in the database
      // and are NOT in the catalogue seed data. Match existing tiers by
      // (minPax, maxPax) and carry the admin fields forward; if the catalogue
      // ever does specify them, the catalogue wins.
      const existingTiers = await prisma.priceTier.findMany({ where: { variantId: variant.id } });
      await prisma.priceTier.deleteMany({ where: { variantId: variant.id } });
      await prisma.priceTier.createMany({
        data: variantSeed.priceTiers.map((tier) => {
          const existing = existingTiers.find(
            (t) => t.minPax === tier.minPax && t.maxPax === tier.maxPax
          );
          return {
            variantId: variant.id,
            minPax: tier.minPax,
            maxPax: tier.maxPax,
            pricePerPax: tier.pricePerPax,
            pricingModel: tier.pricingModel ?? existing?.pricingModel ?? 'FLAT_PER_GUEST',
            kidsPricePerPax: tier.kidsPricePerPax ?? existing?.kidsPricePerPax ?? null,
            youthPricePerPax: tier.youthPricePerPax ?? existing?.youthPricePerPax ?? null,
          };
        }),
      });

      // Slot times
      await prisma.slotTime.deleteMany({ where: { variantId: variant.id } });
      await prisma.slotTime.createMany({
        data: (variantSeed.slots ?? DEFAULT_SLOTS).map((slot) => ({
          variantId: variant.id,
          time: slot.time,
          maxCapacity: slot.maxCapacity,
          currentBookings: 0,
          isAvailable: true,
        })),
      });

      // Add-ons
      await prisma.addon.deleteMany({ where: { variantId: variant.id } });
      for (const addon of variantSeed.addons) {
        await prisma.addon.create({
          data: {
            variantId: variant.id,
            name: addon.name,
            price: addon.price,
            description: addon.description,
            requiresTransfer: addon.requiresTransfer,
            isCombo: addon.isCombo,
          },
        });
      }
    }
  }
  console.log(`✓ Ventures: ${VENTURES.length} (${VENTURES.reduce((sum, v) => sum + v.variants.length, 0)} variants)`);
}

// ============ MAIN ============

/**
 * Optionally provision the first admin account at seed time.
 *
 * Set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD (+ optional ADMIN_SEED_ROLE, default
 * ADMIN) in the environment to bootstrap admin access in fresh databases —
 * the alternative was the unsafe habit of hardcoding credentials in the repo,
 * which this project no longer tolerates. Without these variables nothing is
 * created; in production prefer `npm run admin:create` interactively instead.
 */
async function seedAdminFromEnv() {
  const email = (process.env.ADMIN_SEED_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? '';
  const role = (process.env.ADMIN_SEED_ROLE ?? 'ADMIN').trim().toUpperCase();

  if (!email && !password) {
    console.log('— Admin seed skipped (set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD to provision one)');
    return;
  }
  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must both be set');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 12 characters');
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
    throw new Error(`ADMIN_SEED_ROLE must be one of SUPER_ADMIN | ADMIN | EDITOR | VIEWER, got "${role}"`);
  }

  const passwordHash = hashPassword(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: role as 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER', isActive: true },
    create: { email, name: email.split('@')[0], passwordHash, role: role as 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER', isActive: true },
  });
  console.log(`✓ Admin provisioned from env: ${email} (${role})`);
}

async function main() {
  console.log('🌱 Seeding BaliWild database...\n');

  assertSeedCompliance(VENTURES);

  const tenant = await seedTenant();
  const locationIds = await seedLocations();
  const zoneIds = await seedPickupZones();
  await seedVehicleClasses();
  await seedVentures(tenant.id, locationIds, zoneIds);
  await seedCoupons();
  await seedAdminFromEnv();

  console.log('\n✅ Seed completed successfully.');
  console.log(`   Categories covered: ${CATALOGUE_CATEGORIES.join(', ')}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
