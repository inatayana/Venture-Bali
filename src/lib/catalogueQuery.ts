/**
 * Server-side catalogue pagination.
 *
 * The catalogue used to fetch every venture (with all relations) and sort it in
 * memory. That does not scale as the content engine adds products. This module
 * pushes filtering, ordering and LIMIT/OFFSET into the database.
 *
 * Price ordering is the one case Prisma cannot express: the "from" price is
 * MIN(PriceTier.pricePerPax, active promo) across variants. A single aggregate
 * SQL query returns the ordered page of ids plus the exact total, then only
 * those rows are hydrated with relations.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import { resolveCategory } from '@/lib/taxonomy';
import type { VentureItem } from '@/types/venture';

export const CATALOGUE_SORTS = ['popular', 'newest', 'price-asc', 'price-desc'] as const;
export type CatalogueSort = (typeof CATALOGUE_SORTS)[number];

export interface CatalogueQueryInput {
  category?: string | null;
  query?: string | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
}

export interface CataloguePage {
  items: VentureItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

function normalizeSort(sort?: string | null): CatalogueSort {
  return CATALOGUE_SORTS.includes(sort as CatalogueSort) ? (sort as CatalogueSort) : 'popular';
}

function normalizePage(value?: number): number {
  return Number.isFinite(value) && (value ?? 0) > 0 ? Math.floor(value as number) : 1;
}

function normalizePageSize(value?: number): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(value as number));
}

/**
 * URL slugs (`atv`, `water-sports`) and UI labels (`ATV`, `Water Sports`) are
 * not the value stored on `Venture.category`; the database stores the short
 * label. Resolve every accepted alias to that short label so a category link
 * can never silently return an empty catalogue.
 */
function normalizeCategory(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return resolveCategory(raw)?.short ?? raw;
}

function buildWhere(category?: string | null, query?: string | null): Prisma.VentureWhereInput {
  const where: Prisma.VentureWhereInput = {};
  if (category) where.category = category;
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { shortDescription: { contains: query, mode: 'insensitive' } },
    ];
  }
  return where;
}

/** Build a parameterised WHERE clause. Only values go through $n placeholders. */
function buildSqlWhere(
  category: string | null,
  query: string | null,
  params: Array<string | number>
): string {
  const conditions: string[] = [];
  if (category) {
    params.push(category);
    conditions.push(`v."category" = $${params.length}`);
  }
  if (query) {
    const like = `%${query}%`;
    params.push(like, like);
    conditions.push(
      `(v."title" ILIKE $${params.length - 1} OR v."shortDescription" ILIKE $${params.length})`
    );
  }
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

async function getPriceOrderedIds(
  sort: 'price-asc' | 'price-desc',
  category: string | null,
  query: string | null,
  skip: number,
  take: number
): Promise<{ ids: string[]; total: number }> {
  const params: Array<string | number> = [];
  const whereSql = buildSqlWhere(category, query, params);
  // The direction is from a whitelist, never from raw user input.
  const direction = sort === 'price-asc' ? 'ASC' : 'DESC';
  params.push(take, skip);
  const limitParam = `$${params.length - 1}`;
  const offsetParam = `$${params.length}`;

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; total: number }>>(
    `SELECT q."id", COUNT(*) OVER()::int AS "total"
    FROM (
      SELECT v."id",
        CASE
          WHEN MIN(pt."pricePerPax") IS NULL AND MIN(NULLIF(va."promoPriceIdr", 0)) IS NULL THEN 0
          ELSE LEAST(
            COALESCE(MIN(pt."pricePerPax"), 2147483647),
            COALESCE(MIN(NULLIF(va."promoPriceIdr", 0)), 2147483647)
          )
        END AS "sortPrice"
      FROM "Venture" v
      LEFT JOIN "Variant" va ON va."ventureId" = v."id"
      LEFT JOIN "PriceTier" pt ON pt."variantId" = va."id"
      ${whereSql}
      GROUP BY v."id"
    ) q
    ORDER BY q."sortPrice" ${direction}, q."id" ASC
    LIMIT ${limitParam} OFFSET ${offsetParam}`,
    ...params
  );

  return {
    ids: rows.map((row) => row.id),
    total: Number(rows[0]?.total ?? 0),
  };
}

export async function getCataloguePage(input: CatalogueQueryInput = {}): Promise<CataloguePage> {
  const sort = normalizeSort(input.sort);
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const category = normalizeCategory(input.category);
  const query = input.query?.trim() || null;
  const skip = (page - 1) * pageSize;

  let ids: string[];
  let total: number;

  if (sort === 'price-asc' || sort === 'price-desc') {
    const result = await getPriceOrderedIds(sort, category, query, skip, pageSize);
    ids = result.ids;
    total = result.total;
  } else {
    const where = buildWhere(category, query);
    const orderBy: Prisma.VentureOrderByWithRelationInput[] =
      sort === 'newest' ? [{ createdAt: 'desc' }, { id: 'asc' }] : [{ rating: 'desc' }, { id: 'asc' }];
    const [rows, count] = await Promise.all([
      prisma.venture.findMany({ where, orderBy, skip, take: pageSize, include: ventureWithRelations() }),
      prisma.venture.count({ where }),
    ]);
    ids = rows.map((row) => row.id);
    total = count;
  }

  let items: VentureItem[] = [];
  if (ids.length > 0) {
    const rows = await prisma.venture.findMany({
      where: { id: { in: ids } },
      include: ventureWithRelations(),
    });
    const byId = new Map(rows.map((row) => [row.id, toVentureItem(row)]));
    items = ids
      .map((id) => byId.get(id))
      .filter((item): item is VentureItem => item !== undefined);
  }

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
