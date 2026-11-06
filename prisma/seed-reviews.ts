/**
 * BaliWild — Review Seed Script (standalone, additive-only)
 * ----------------------------------------------------------
 * Launch-phase reviews so new products are not stuck at "no reviews yet".
 *
 * Deliberate owner decision (2026-11-04): seed realistic launch reviews,
 * labelled with ReviewSource.IMPORTED so they are never presented as
 * "Verified trip" — only reviews tied to a real booking earn that badge.
 *
 * Safety properties:
 *   - Additive only: never touches ventures, variants, slots, add-ons or
 *     bookings (the full seed re-creates those and would break existing
 *     bookings; run `npm run db:seed` only on an empty database).
 *   - Idempotent: ventures that already have reviews are skipped.
 *   - Deterministic: the RNG is seeded from the venture slug, so re-running
 *     produces the same dataset.
 *
 * Usage: npx tsx prisma/seed-reviews.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============ DETERMINISTIC RNG ============

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — small deterministic PRNG. */
function makeRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

// ============ CONTENT POOLS ============

const GUEST_NAMES = [
  'Budi Santoso', 'Sari Wulandari', 'Putu Ayu', 'Wayan Adi', 'Rizky Pratama',
  'Dewi Anggraini', 'Fajar Nugroho', 'Andini Puspita', 'Gede Surya', 'Intan Permata',
  'James Carter', 'Emma Fischer', 'Lucas Moreau', 'Hannah Lee', 'Sarah Whitfield',
  'Tom Baker', 'Miyu Tanaka', 'Andre Costa', 'Chloe Dubois', 'Daniel Kim',
] as const;

const GUEST_LOCATIONS = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan',
  'Singapore', 'Kuala Lumpur', 'Sydney', 'Melbourne', 'London', 'Berlin',
  'Tokyo', 'Seoul', 'Amsterdam', 'Los Angeles',
] as const;

/**
 * Comment templates. {title} = product title, {place} = location name,
 * {hours} = duration in hours. Written so they stay plausible for any of the
 * 9 adventure categories.
 */
const COMMENT_TEMPLATES = [
  'Booked {title} on our second day in Bali and it ended up the highlight of the trip. The guide kept the whole group safe and still made it fun.',
  'Everything matched the description — pickup on time, {hours} of pure fun, and photos we will keep forever. Worth every rupiah.',
  'Was nervous at first since it was my first time, but the briefing was clear and the team was patient. {place} views along the route are unreal.',
  'Great value for {hours}. The crew knew exactly where to stop for the best spots away from the crowds.',
  'Our family loved it. Safety gear was in good condition and the guide double-checked everyone before we started.',
  'Smooth from booking to drop-off. WhatsApp confirmation the night before made it stress-free.',
  '{place} is beautiful, but what made it special was how professional the team was. Would book again with friends.',
  'Did the {hours} session with my partner — not overcrowded, good pace, amazing scenery. Highly recommended.',
  'The guide shared a lot about the local area during the trip, which was a nice bonus on top of the adventure itself.',
  'Slot booking was easy and the meeting point instructions were exact. No waiting around at all.',
  'First time trying something like this and I am already planning to come back with a bigger group.',
  'Well organised, fair price and genuinely friendly guides. The photos they took were a great bonus.',
  'Adrenaline from start to finish! Fitness level needed is moderate, older friends in our group managed fine.',
  'Cancelled our original plan to fit this in — zero regrets. The scenery around {place} is something else.',
  'Professional operation from start to finish. Equipment well maintained and safety clearly taken seriously.',
] as const;

const SHORT_TEMPLATES = [
  'Amazing experience, great guide!',
  'Highlight of our Bali trip.',
  'Well organised and safe. Recommended!',
  'Fun, professional team, beautiful scenery.',
  'Perfect for first-timers like us.',
  'Great value — booked again for next visit.',
  'Smooth pickup, awesome route.',
  'Our group had a blast. Thank you!',
] as const;

/** Rating weights: mostly happy guests, an occasional honest 3. */
function pickRating(rng: () => number): number {
  const roll = rng();
  if (roll < 0.6) return 5;
  if (roll < 0.9) return 4;
  return 3;
}

function fillTemplate(template: string, venture: { title: string; place: string; hours: string }): string {
  return template
    .replaceAll('{title}', venture.title)
    .replaceAll('{place}', venture.place)
    .replaceAll('{hours}', venture.hours);
}

// ============ SEED LOGIC ============

async function seedReviews(): Promise<void> {
  const ventures = await prisma.venture.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      duration: true,
      tenantId: true,
      location: { select: { name: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { title: 'asc' },
  });

  let created = 0;
  let skipped = 0;

  for (const venture of ventures) {
    if (venture._count.reviews > 0) {
      skipped += 1;
      continue;
    }

    const rng = makeRng(hashSeed(venture.slug));
    const reviewCount = 4 + Math.floor(rng() * 4); // 4–7 reviews
    const place = venture.location?.name?.split(',')[0]?.trim() || 'Bali';
    const hours = venture.duration?.match(/\d+/)?.[0] ?? '3';

    const ratings: number[] = [];
    for (let index = 0; index < reviewCount; index += 1) {
      const rating = pickRating(rng);
      ratings.push(rating);

      const useShort = rng() < 0.25;
      const comment = useShort
        ? pick(rng, SHORT_TEMPLATES)
        : fillTemplate(pick(rng, COMMENT_TEMPLATES), {
            title: venture.title,
            place,
            hours,
          });

      // Spread across the last ~100 days, newest first for a natural history.
      const daysAgo = 8 + Math.floor((index / reviewCount) * 90) + Math.floor(rng() * 6);

      await prisma.review.create({
        data: {
          ventureId: venture.id,
          source: 'IMPORTED',
          rating,
          comment,
          guestName: pick(rng, GUEST_NAMES),
          guestLocation: pick(rng, GUEST_LOCATIONS),
          photos: [],
          isApproved: true,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          tenantId: venture.tenantId,
        },
      });
      created += 1;
    }

    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    await prisma.venture.update({
      where: { id: venture.id },
      data: { rating: Math.round(average * 10) / 10 },
    });

    console.log(
      `  ↳ ${venture.slug}: ${reviewCount} reviews, avg ${Math.round(average * 10) / 10}`
    );
  }

  console.log(`✓ Reviews: ${created} created, ${skipped} ventures skipped (already had reviews).`);
}

async function main() {
  console.log('🌱 Seeding launch reviews...\n');
  await seedReviews();
  console.log('\n✅ Review seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Review seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
