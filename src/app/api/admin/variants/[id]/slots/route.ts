import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { slotInputSchema } from '@/lib/adminVentureSchema';

/** Add a departure slot to a variant. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const input = slotInputSchema.parse(await request.json());

    const variant = await prisma.variant.findUnique({
      where: { id },
      select: { id: true, ventureId: true },
    });
    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 },
      );
    }

    const duplicate = await prisma.slotTime.findFirst({
      where: { variantId: id, time: input.time },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: `A ${input.time} departure already exists` } },
        { status: 409 },
      );
    }

    const slot = await prisma.slotTime.create({
      data: {
        variantId: id,
        time: input.time,
        maxCapacity: input.maxCapacity,
        isAvailable: input.isAvailable,
      },
    });

    revalidatePath(`/admin/ventures/${variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: slot, error: null }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Create slot failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not create the slot' } },
      { status: 500 },
    );
  }
}
