import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { slotUpdateSchema } from '@/lib/adminVentureSchema';

async function loadSlot(id: string) {
  return prisma.slotTime.findUnique({
    where: { id },
    select: {
      id: true,
      time: true,
      variantId: true,
      variant: { select: { ventureId: true } },
      _count: { select: { bookings: true } },
    },
  });
}

/** Update capacity, availability or departure time. */
export async function PATCH(
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
    const input = slotUpdateSchema.parse(await request.json());

    const slot = await loadSlot(id);
    if (!slot) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Slot not found' } },
        { status: 404 },
      );
    }

    if (input.time && input.time !== slot.time) {
      const duplicate = await prisma.slotTime.findFirst({
        where: { variantId: slot.variantId, time: input.time, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: `A ${input.time} departure already exists` } },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.slotTime.update({ where: { id }, data: input });

    revalidatePath(`/admin/ventures/${slot.variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Update slot failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not update the slot' } },
      { status: 500 },
    );
  }
}

/** Delete a slot — refused when bookings already reference it. */
export async function DELETE(
  _request: NextRequest,
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
    const slot = await loadSlot(id);
    if (!slot) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Slot not found' } },
        { status: 404 },
      );
    }

    if (slot._count.bookings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_BOOKINGS',
            message: 'This slot already has bookings. Disable it instead of deleting it.',
          },
        },
        { status: 409 },
      );
    }

    await prisma.slotTime.delete({ where: { id } });

    revalidatePath(`/admin/ventures/${slot.variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (error) {
    console.error('Delete slot failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not delete the slot' } },
      { status: 500 },
    );
  }
}
