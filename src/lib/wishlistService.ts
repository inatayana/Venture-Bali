/**
 * BaliWild — Server-side wishlist (Customer actor)
 * -------------------------------------------------
 * Guest wishlists stay in localStorage. Once signed in, the same items are
 * merged into `CustomerWishlist` and become the source of truth. Every query
 * is scoped by tenantId.
 */

import { prisma } from '@/lib/prisma';
import type { WishlistItem } from '@/store/wishlistStore';

type WishlistRow = {
  savedAt: Date;
  venture: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string;
    category: string;
    duration: string;
    rating: number;
    badge: string | null;
    variants: Array<{
      promoPriceIdr: number | null;
      priceTiers: Array<{ pricePerPax: number }>;
    }>;
    reviews: Array<{ id: string }>;
  };
};

/** Map a database row to the same shape the client store already renders. */
export function toWishlistItem(row: WishlistRow): WishlistItem {
  const prices = row.venture.variants.flatMap((variant) =>
    [variant.promoPriceIdr, ...variant.priceTiers.map((tier) => tier.pricePerPax)].filter(
      (value): value is number => typeof value === 'number' && value > 0,
    ),
  );

  return {
    id: row.venture.id,
    slug: row.venture.slug,
    title: row.venture.title,
    imageUrl: row.venture.imageUrl,
    category: row.venture.category,
    duration: row.venture.duration,
    rating: row.venture.rating,
    priceFromIdr: prices.length > 0 ? Math.min(...prices) : 0,
    badge: row.venture.badge ?? undefined,
    reviewCount: row.venture.reviews.length,
    savedAt: row.savedAt.getTime(),
  };
}

const include = {
  venture: {
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      category: true,
      duration: true,
      rating: true,
      badge: true,
      variants: {
        select: {
          promoPriceIdr: true,
          priceTiers: { select: { pricePerPax: true } },
        },
      },
      reviews: { where: { isApproved: true }, select: { id: true } },
    },
  },
} as const;

export async function listWishlist(accountId: string, tenantId: string): Promise<WishlistItem[]> {
  const rows = await prisma.customerWishlist.findMany({
    where: { accountId, tenantId },
    orderBy: { savedAt: 'desc' },
    include,
  });
  return rows.map(toWishlistItem);
}

/** Merge guest items into the account. Unknown/stale venture ids are skipped. */
export async function syncWishlist(
  accountId: string,
  tenantId: string,
  items: Array<{ ventureId: string; savedAt?: string }>,
): Promise<WishlistItem[]> {
  const ids = Array.from(new Set(items.map((item) => item.ventureId)));
  if (ids.length === 0) return listWishlist(accountId, tenantId);

  const ventures = await prisma.venture.findMany({
    where: { id: { in: ids }, tenantId },
    select: { id: true },
  });
  const allowed = new Set(ventures.map((venture) => venture.id));
  const savedAtById = new Map(
    items.flatMap((item) => {
      const parsed = item.savedAt ? new Date(item.savedAt) : null;
      return parsed && !Number.isNaN(parsed.getTime()) ? [[item.ventureId, parsed] as const] : [];
    }),
  );

  const data = Array.from(allowed).map((ventureId) => ({
    accountId,
    tenantId,
    ventureId,
    savedAt: savedAtById.get(ventureId) ?? new Date(),
  }));

  if (data.length > 0) {
    await prisma.customerWishlist.createMany({ data, skipDuplicates: true });
  }

  return listWishlist(accountId, tenantId);
}

/** Add or remove one item for a signed-in customer. */
export async function setWishlistItem(
  accountId: string,
  tenantId: string,
  ventureId: string,
  save: boolean,
): Promise<boolean> {
  if (save) {
    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, tenantId },
      select: { id: true },
    });
    if (!venture) return false;

    await prisma.customerWishlist.upsert({
      where: { accountId_ventureId: { accountId, ventureId } },
      create: { accountId, tenantId, ventureId },
      update: {},
    });
    return true;
  }

  await prisma.customerWishlist.deleteMany({ where: { accountId, tenantId, ventureId } });
  return true;
}
