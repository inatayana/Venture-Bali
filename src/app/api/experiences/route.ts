import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import { isAllowedCategory } from '@/lib/taxonomy';
import { validateVentureTitle } from '@/lib/titleValidator';

export const dynamic = 'force-dynamic';

/** The tenant that owns the public catalogue. */
const DEFAULT_TENANT_DOMAIN = 'venturebali.com';

/**
 * Schema for creating a venture.
 * Mirrors the columns the `Venture` table actually has — no phantom fields.
 */
const createVentureSchema = z.object({
  title: z.string().trim().min(45).max(60, 'Title must be 45-60 characters'),
  hook3Sec: z.string().trim().min(10).max(120),
  shortDescription: z.string().trim().max(200).optional(),
  duration: z.string().trim().min(3).max(40),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().max(60).optional(),
  primaryKeyword: z.string().trim().max(80).optional(),
  secondaryKeywords: z.array(z.string().trim().min(1)).max(10).default([]),
  searchTags: z.array(z.string().trim().min(1)).max(15).default([]),
  highlights: z.array(z.string().trim().min(1)).max(10).default([]),
  inclusions: z.array(z.string().trim().min(1)).max(10).default([]),
  exclusions: z.array(z.string().trim().min(1)).max(10).default([]),
  languages: z.array(z.string().trim().min(2).max(5)).max(6).default(['en', 'id']),
  suitableFor: z.array(z.enum(['KIDS', 'COUPLE', 'FAMILY', 'SOLO', 'GROUP'])).max(5).default([]),
  difficulty: z.enum(['EASY', 'MODERATE', 'CHALLENGING']).default('EASY'),
  imageUrl: z.string().trim().min(1, 'An image URL is required'),
  gallery: z.array(z.string().trim().min(1)).max(20).default([]),
  rating: z.number().min(0).max(5).default(5),
  locationId: z.string().trim().min(1).optional(),
  /**
   * Optional tenant override. When omitted the default tenant is resolved
   * from the database, so the endpoint never depends on a hard-coded id.
   */
  tenantId: z.string().trim().min(1).optional(),
  itinerary: z
    .array(z.object({ time: z.string().trim().min(1), activity: z.string().trim().min(1) }))
    .max(20)
    .default([]),
  essentialInfo: z
    .object({
      perfectFor: z.array(z.string()).default([]),
      whatToBring: z.array(z.string()).default([]),
      knowBeforeYouGo: z.array(z.string()).default([]),
    })
    .default({ perfectFor: [], whatToBring: [], knowBeforeYouGo: [] }),
  faqs: z
    .array(z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1) }))
    .max(20)
    .default([]),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let ventures;
  let source: 'database' | 'fallback' = 'database';

  try {
    const rows = await prisma.venture.findMany({
      include: ventureWithRelations,
      orderBy: [{ rating: 'desc' }, { title: 'asc' }],
    });
    ventures = rows.map(toVentureItem);
  } catch (error) {
    console.error('Failed to load ventures from the database, using fallback:', error);
    ventures = mockExperiences;
    source = 'fallback';
  }

  if (category) {
    ventures = ventures.filter((v) => v.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    ventures = ventures.filter((v) => v.title.toLowerCase().includes(q));
  }

  return NextResponse.json({
    success: true,
    data: ventures,
    error: null,
    meta: { total: ventures.length, source },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = createVentureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The venture payload is invalid',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ---- Product guardrails (AGENTS.md §9) ----
  if (!isAllowedCategory(data.category)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: `"${data.category}" is not one of the 9 adventure mega categories`,
        },
      },
      { status: 400 }
    );
  }

  const titleCheck = validateVentureTitle({
    title: data.title,
    primaryKeyword: data.primaryKeyword,
  });
  if (!titleCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TITLE',
          message: 'The title violates the Product Title Constitution',
          details: titleCheck.errors,
        },
      },
      { status: 400 }
    );
  }

  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  try {
    // Resolve the tenant from the database — never assume a fixed id.
    const tenant = data.tenantId
      ? await prisma.tenant.findFirst({ where: { id: data.tenantId, isActive: true } })
      : await prisma.tenant.findFirst({ where: { domain: DEFAULT_TENANT_DOMAIN, isActive: true } });

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'No active tenant is configured. Run the database seed first.',
          },
        },
        { status: 503 }
      );
    }

    const venture = await prisma.venture.create({
      data: {
        slug,
        title: data.title,
        hook3Sec: data.hook3Sec,
        shortDescription: data.shortDescription ?? null,
        duration: data.duration,
        category: data.category,
        subcategory: data.subcategory ?? null,
        primaryKeyword: data.primaryKeyword ?? null,
        secondaryKeywords: data.secondaryKeywords,
        searchTags: data.searchTags,
        highlights: data.highlights,
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        itinerary: data.itinerary,
        essentialInfo: data.essentialInfo,
        faqs: data.faqs,
        languages: data.languages,
        suitableFor: data.suitableFor,
        difficulty: data.difficulty,
        imageUrl: data.imageUrl,
        gallery: data.gallery,
        rating: data.rating,
        tenantId: tenant.id,
        locationId: data.locationId ?? null,
      },
      include: ventureWithRelations,
    });

    return NextResponse.json(
      { success: true, data: toVentureItem(venture), error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create venture:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create the venture' },
      },
      { status: 500 }
    );
  }
}
