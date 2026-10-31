import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { addonInputSchema } from '@/lib/adminVentureSchema';

/** Add an optional extra (photography, gear rental, drone, etc.) to a package. */
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
    const input = addonInputSchema.parse(await request.json());

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

    const addon = await prisma.addon.create({
      data: {
        variantId: id,
        name: input.name,
        price: input.price,
        description: input.description ?? null,
        requiresTransfer: input.requiresTransfer,
        isCombo: input.isCombo,
      },
    });

    revalidatePath(`/admin/ventures/${variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: addon, error: null }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Create add-on failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not create the add-on' } },
      { status: 500 },
    );
  }
}
