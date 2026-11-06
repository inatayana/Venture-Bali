import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { adminVentureWriteSchema } from '@/lib/adminVentureSchema';
import { resolveLocationId } from '@/lib/locationResolve';
import { buildVentureSlug, ventureWriteData } from '@/lib/ventureWrite';
import { isVentureSlugValid, validateVentureTitle } from '@/lib/titleValidator';

const DEFAULT_TENANT_DOMAIN = 'baliwild.com';

function validationError(error: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.errors[0]?.message ?? 'Invalid product payload',
        fields: error.flatten().fieldErrors,
      },
    },
    { status: 400 },
  );
}

/** Create a product. Packages (variants) are added from the detail page. */
export async function POST(request: NextRequest) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const parsed = adminVentureWriteSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const titleCheck = validateVentureTitle({
    title: input.title,
    primaryKeyword: input.primaryKeyword,
  });
  if (!titleCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TITLE',
          message: titleCheck.errors.join(' '),
          details: titleCheck.errors,
        },
      },
      { status: 400 },
    );
  }

  const slug = input.slug || buildVentureSlug(input.title);
  if (!isVentureSlugValid(slug)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SLUG', message: 'Slug is not valid' } },
      { status: 400 },
    );
  }

  const duplicate = await prisma.venture.findUnique({ where: { slug }, select: { id: true } });
  if (duplicate) {
    return NextResponse.json(
      { success: false, error: { code: 'SLUG_TAKEN', message: 'That slug is already in use' } },
      { status: 409 },
    );
  }

  const resolvedLocation = await resolveLocationId(input.locationId, input);
  if ('error' in resolvedLocation) {
    return NextResponse.json(
      {
        success: false,
        error: { code: resolvedLocation.error, message: resolvedLocation.message },
      },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: { domain: DEFAULT_TENANT_DOMAIN, isActive: true },
    select: { id: true },
  });
  if (!tenant) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Default tenant is not configured' },
      },
      { status: 503 },
    );
  }

  try {
    const venture = await prisma.venture.create({
      data: {
        ...ventureWriteData({ ...input, locationId: resolvedLocation.id }),
        slug,
        tenantId: tenant.id,
        rating: 5,
      },
      select: { id: true, slug: true, title: true },
    });

    revalidatePath('/');
    revalidatePath('/admin/ventures');
    revalidatePath('/sitemap.xml');

    return NextResponse.json({ success: true, data: venture }, { status: 201 });
  } catch (error) {
    console.error('Create product failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_FAILED', message: 'Could not create the product' } },
      { status: 500 },
    );
  }
}
