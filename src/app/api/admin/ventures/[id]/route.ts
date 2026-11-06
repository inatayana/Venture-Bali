import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { adminVentureWriteSchema } from '@/lib/adminVentureSchema';
import { resolveLocationId } from '@/lib/locationResolve';
import { buildVentureSlug, ventureWriteData } from '@/lib/ventureWrite';
import { isVentureSlugValid, validateVentureTitle } from '@/lib/titleValidator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

/** Edit a product's core fields. Packages stay on their own endpoint. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params;
  const existing = await prisma.venture.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
      { status: 404 },
    );
  }

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

  const slug = input.slug || existing.slug || buildVentureSlug(input.title);
  if (!isVentureSlugValid(slug)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SLUG', message: 'Slug is not valid' } },
      { status: 400 },
    );
  }

  const duplicate = await prisma.venture.findFirst({
    where: { slug, id: { not: id } },
    select: { id: true },
  });
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

  try {
    const venture = await prisma.venture.update({
      where: { id },
      data: {
        ...ventureWriteData({ ...input, locationId: resolvedLocation.id }),
        slug,
      },
      select: { id: true, slug: true, title: true },
    });

    revalidatePath('/');
    revalidatePath('/admin/ventures');
    revalidatePath(`/admin/ventures/${id}`);
    revalidatePath('/sitemap.xml');
    revalidatePath(`/experiences/${id}/${existing.slug}`);
    revalidatePath(`/experiences/${id}/${slug}`);

    return NextResponse.json({ success: true, data: venture });
  } catch (error) {
    console.error('Update product failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: 'Could not update the product' } },
      { status: 500 },
    );
  }
}
