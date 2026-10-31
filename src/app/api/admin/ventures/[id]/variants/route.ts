import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { adminVariantSchema } from '@/lib/adminVentureSchema';
import { DEFAULT_SLOTS } from '@/data/catalogue';

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

/**
 * Create a package (variant) under a venture.
 *
 * New packages start with the standard departure slots and no bookings, so the
 * operations editor can take over immediately.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  try {
    const { id: ventureId } = await params;
    const input = adminVariantSchema.parse(await request.json());

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      select: { id: true },
    });
    if (!venture) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Venture not found' } },
        { status: 404 },
      );
    }

    if (input.pickupZoneId) {
      const zone = await prisma.pickupZone.findUnique({
        where: { id: input.pickupZoneId },
        select: { id: true },
      });
      if (!zone) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ZONE', message: 'Pickup zone not found' } },
          { status: 400 },
        );
      }
    }

    const duplicate = await prisma.variant.findFirst({
      where: { ventureId, title: input.title },
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

    const created = await prisma.variant.create({
      data: {
        ventureId,
        title: input.title,
        shortDescription: input.shortDescription,
        fulfillmentMode: input.fulfillmentMode,
        pickupZoneId: input.pickupZoneId ?? null,
        duration: input.duration ?? null,
        badge: input.badge ?? null,
        transportBadge: input.transportBadge ?? null,
        minimumSpendIdr: input.minimumSpendIdr ?? null,
        sortOrder: input.sortOrder ?? 0,
        blackoutDates: [],
        inclusions: [],
        exclusions: [],
        priceTiers: { create: input.priceTiers },
        slotTimes: { create: DEFAULT_SLOTS.map((slot) => ({ ...slot })) },
      },
      select: { id: true },
    });

    revalidatePath(`/admin/ventures/${ventureId}`);
    revalidatePath('/admin/ventures');
    revalidatePath('/experiences', 'layout');

    return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return validationError(error);

    console.error('Admin variant create failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not create the package' } },
      { status: 500 },
    );
  }
}
