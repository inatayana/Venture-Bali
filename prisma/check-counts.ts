import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [bookings, reviews, ventures] = await Promise.all([
    prisma.booking.count(),
    prisma.review.count(),
    prisma.venture.count(),
  ]);
  console.log(`bookings: ${bookings} | reviews: ${reviews} | ventures: ${ventures}`);
}

main()
  .catch((error) => {
    console.error('DB check failed:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
