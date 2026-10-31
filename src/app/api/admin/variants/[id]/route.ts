import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { adminVariantUpdateSchema } from '@/lib/adminVentureSchema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function validationError(error: z.ZodError) {
  const issue = error.errors[0];
  const field = issue.path.join('.');
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: field ? `${field}: ${issue.message}` : issue.message,
      },
    },
    { status: 400 },
  );
}

async function loadVariant(id: string) {
  return prisma.variant.findUnique({
    where: { id },
    select: {
      id: true,
      ventureId: true,
      title: true,
      fulfillmentMode: true,
      pickupZoneId: true,
      _count: { select: { bookings: true } },
    },
  });
}

/** Update a package: copy, pricing, fulfilment mode and locked pickup zone. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const input = adminVariantUpdateSchema.parse(await request.json());

    const variant = await loadVariant(id);
    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } },
        { status: 404 },
      );
    }

    const nextMode = input.fulfillmentMode ?? variant.fulfillmentMode;
    const nextZoneId =
      input.pickupZoneId !== undefined ? input.pickupZoneId : variant.pickupZoneId;

    if (nextMode === 'SELF_DRIVE' && nextZoneId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ZONE',
            message: 'Self-drive packages do not use a pickup zone',
          },
        },
        { status: 400 },
      );
    }

    if (nextZoneId) {
      const zone = await prisma.pickupZone.findUnique({
        where: { id: nextZoneId },
        select: { id: true },
      });
      if (!zone) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ZONE', message: 'Pickup zone not found' } },
          { status: 400 },
        );
      }
    }

    if (input.title && input.title !== variant.title) {
      const duplicate = await prisma.variant.findFirst({
        where: { ventureId: variant.ventureId, title: input.title, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'DUPLICATE_TITLE', message: 'A package with that title already exists' },
          },
          { status: 409 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.variant.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.shortDescription !== undefined
            ? { shortDescription: input.shortDescription }
            : {}),
          ...(input.fulfillmentMode !== undefined
            ? { fulfillmentMode: input.fulfillmentMode }
            : {}),
          ...(input.duration !== undefined ? { duration: input.duration || null } : {}),
          ...(input.badge !== undefined ? { badge: input.badge || null } : {}),
          ...(input.transportBadge !== undefined
            ? { transportBadge: input.transportBadge || null }
            : {}),
          ...(input.minimumSpendIdr !== undefined
            ? { minimumSpendIdr: input.minimumSpendIdr }
            : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          // Always keep the stored zone consistent with the saved mode.
          pickupZoneId: nextMode === 'SELF_DRIVE' ? null : nextZoneId ?? null,
        },
      });

      if (input.priceTiers) {
        await tx.priceTier.deleteMany({ where: { variantId: id } });
        await tx.priceTier.createMany({
          data: input.priceTiers.map((tier) => ({
            variantId: id,
            minPax: tier.minPax,
            maxPax: tier.maxPax,
            pricePerPax: tier.pricePerPax,
          })),
        });
      }
    });

    revalidatePath(`/admin/ventures/${variant.ventureId}`);
    revalidatePath('/admin/ventures');

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof z.ZodError) return validationError(error);

    console.error('Admin variant update failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not update the package' } },
      { status: 500 },
    );
  }
}

/** Delete a package. Refused once it has bookings — history must stay intact. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminRole('ADMIN');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const variant = await loadVariant(id);
    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } },
        { status: 404 },
      );
    }

    if (variant._count.bookings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_BOOKINGS',
            message: `This package has ${variant._count.bookings} booking(s) and cannot be deleted`,
          },
        },
        { status: 409 },
      );
    }

    await prisma.variant.delete({ where: { id } });

    revalidatePath(`/admin/ventures/${variant.ventureId}`);
    revalidatePath('/admin/ventures');

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Admin variant delete failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not delete the package' } },
      { status: 500 },
    );
  }
}
