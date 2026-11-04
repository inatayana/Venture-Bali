import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ventures = await prisma.venture.findMany({
    where: { slug: 'ubud-river-tubing-adventure' },
    select: {
      slug: true,
      imageUrl: true,
      gallery: true,
      variants: {
        select: {
          title: true,
          imageUrl: true,
          promoPriceIdr: true,
          priceTiers: { select: { minPax: true, maxPax: true, pricePerPax: true }, orderBy: { minPax: 'asc' } },
        },
      },
    },
  });

  for (const v of ventures) {
    console.log(`venture: ${v.slug} | hero: ${v.imageUrl}`);
    const gallery = Array.isArray(v.gallery) ? (v.gallery as string[]) : [];
    console.log(`gallery (${gallery.length}):`);
    for (const url of gallery) console.log(`   - ${url}`);
    for (const variant of v.variants) {
      console.log(`\n  varian: ${variant.title}`);
      console.log(`    cover     : ${variant.imageUrl ?? '-'}`);
      console.log(`    promoPrice: ${variant.promoPriceIdr ?? '-'}`);
      console.log(`    tiers     : ${variant.priceTiers.map((t) => `${t.minPax}-${t.maxPax}:${t.pricePerPax}`).join(', ')}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('Check failed:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
