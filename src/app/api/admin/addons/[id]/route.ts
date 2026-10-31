import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { addonUpdateSchema } from '@/lib/adminVentureSchema';

async function loadAddon(id: string) {
  return prisma.addon.findUnique({
    where: { id },
    select: { id: true, variant: { select: { ventureId: true } } },
  });
}

/** Update price / transfer requirement / combo flag. */
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
    const input = addonUpdateSchema.parse(await request.json());

    const addon = await loadAddon(id);
    if (!addon) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Add-on not found' } },
        { status: 404 },
      );
    }

    const updated = await prisma.addon.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.requiresTransfer !== undefined ? { requiresTransfer: input.requiresTransfer } : {}),
        ...(input.isCombo !== undefined ? { isCombo: input.isCombo } : {}),
      },
    });

    revalidatePath(`/admin/ventures/${addon.variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Update add-on failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not update the add-on' } },
      { status: 500 },
    );
  }
}

/**
 * Delete an add-on. Bookings keep their own JSON snapshot of the selected
 * add-ons, so historical orders are not affected.
 */
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
    const addon = await loadAddon(id);
    if (!addon) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Add-on not found' } },
        { status: 404 },
      );
    }

    await prisma.addon.delete({ where: { id } });

    revalidatePath(`/admin/ventures/${addon.variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (error) {
    console.error('Delete add-on failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not delete the add-on' } },
      { status: 500 },
    );
  }
}
