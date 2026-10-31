import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { blackoutInputSchema } from '@/lib/adminVentureSchema';

function asStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

async function loadVariant(id: string) {
  return prisma.variant.findUnique({
    where: { id },
    select: { id: true, ventureId: true, blackoutDates: true },
  });
}

/** Add a blackout date (public holiday, seasonal closure, weather closure). */
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
    const { date } = blackoutInputSchema.parse(await request.json());

    const variant = await loadVariant(id);
    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 },
      );
    }

    const existing = asStringArray(variant.blackoutDates);
    const next = existing.includes(date) ? existing : [...existing, date].sort();

    await prisma.variant.update({
      where: { id },
      data: { blackoutDates: next as unknown as Prisma.InputJsonValue },
    });

    revalidatePath(`/admin/ventures/${variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: { blackoutDates: next }, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Add blackout failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not add the blackout date' } },
      { status: 500 },
    );
  }
}

/** Remove a blackout date (query: ?date=YYYY-MM-DD). */
export async function DELETE(
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
    const parsed = blackoutInputSchema.parse({ date: request.nextUrl.searchParams.get('date') });

    const variant = await loadVariant(id);
    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 },
      );
    }

    const next = asStringArray(variant.blackoutDates).filter((item) => item !== parsed.date);

    await prisma.variant.update({
      where: { id },
      data: { blackoutDates: next as unknown as Prisma.InputJsonValue },
    });

    revalidatePath(`/admin/ventures/${variant.ventureId}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, data: { blackoutDates: next }, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Use YYYY-MM-DD' } },
        { status: 400 },
      );
    }
    console.error('Remove blackout failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not remove the blackout date' } },
      { status: 500 },
    );
  }
}
