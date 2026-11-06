import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { pickupZoneUpdateSchema } from '@/lib/adminPickupZoneSchema';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Update a pickup zone (surcharge, labels, active flag). */
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
    const input = pickupZoneUpdateSchema.parse(await request.json());

    const existing = await prisma.pickupZone.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Zone not found' } },
        { status: 404 },
      );
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.pickupZone.findFirst({
        where: { name: input.name, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_NAME', message: 'A zone with that name already exists' } },
          { status: 409 },
        );
      }
    }

    const zone = await prisma.pickupZone.update({ where: { id }, data: input });
    return NextResponse.json({ success: true, data: zone });
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        { success: false, error: (error as { errors: Array<{ message: string }> }).errors[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }
    console.error('Pickup zone update failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not update the zone' } },
      { status: 500 },
    );
  }
}

/**
 * Delete a pickup zone. Refused while bookings or packages still reference it
 * — hide it from guests with the active toggle instead.
 */
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
    const zone = await prisma.pickupZone.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { bookings: true, variants: true } } },
    });
    if (!zone) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Zone not found' } },
        { status: 404 },
      );
    }

    if (zone._count.bookings > 0 || zone._count.variants > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'IN_USE',
            message: `${zone.name} is used by ${zone._count.bookings} booking(s) and ${zone._count.variants} package(s) — deactivate it instead`,
          },
        },
        { status: 409 },
      );
    }

    await prisma.pickupZone.delete({ where: { id } });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Pickup zone delete failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not delete the zone' } },
      { status: 500 },
    );
  }
}
