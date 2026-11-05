import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { pickupZoneCreateSchema } from '@/lib/adminPickupZoneSchema';

export const dynamic = 'force-dynamic';

function validationError(error: { errors: Array<{ message: string }> }) {
  return NextResponse.json(
    { success: false, error: error.errors[0]?.message ?? 'Invalid zone payload' },
    { status: 400 },
  );
}

/** List every pickup zone (active and inactive) for the admin manager. */
export async function GET() {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  const zones = await prisma.pickupZone.findMany({
    orderBy: [{ areaType: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ success: true, data: zones });
}

/** Create a pickup zone. */
export async function POST(request: NextRequest) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  try {
    const input = pickupZoneCreateSchema.parse(await request.json());

    const duplicate = await prisma.pickupZone.findUnique({ where: { name: input.name } });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_NAME', message: 'A zone with that name already exists' } },
        { status: 409 },
      );
    }

    const zone = await prisma.pickupZone.create({ data: input });
    return NextResponse.json({ success: true, data: zone }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      return validationError(error as { errors: Array<{ message: string }> });
    }
    console.error('Pickup zone create failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not create the zone' } },
      { status: 500 },
    );
  }
}
