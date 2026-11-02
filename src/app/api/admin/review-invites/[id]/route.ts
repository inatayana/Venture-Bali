import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';

const actionSchema = z.object({
  action: z.enum(['revoke']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Revoke an unused invite. Submitted invites are immutable. */
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
    actionSchema.parse(await request.json());

    const invite = await prisma.reviewInvite.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!invite) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invite not found' } },
        { status: 404 },
      );
    }
    if (invite.status !== 'UNUSED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Only unused invites can be revoked' } },
        { status: 409 },
      );
    }

    await prisma.reviewInvite.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });

    revalidatePath('/admin/reviews/invites');
    revalidatePath('/admin/reviews');

    return NextResponse.json({ success: true, data: { id, status: 'EXPIRED' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Unknown action' } },
        { status: 400 },
      );
    }
    console.error('Revoke review invite failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not revoke the invite' } },
      { status: 500 },
    );
  }
}
