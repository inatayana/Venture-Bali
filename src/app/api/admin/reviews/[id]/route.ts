import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Approve a guest review (publish) or reject it (delete). */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const { action } = actionSchema.parse(await request.json());

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, venture: { select: { id: true, slug: true } } },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      await prisma.review.update({ where: { id }, data: { isApproved: true } });
    } else {
      await prisma.review.delete({ where: { id } });
    }

    revalidatePath('/admin/reviews');
    revalidatePath(`/experiences/${review.venture.id}/${review.venture.slug}`);

    return NextResponse.json({ success: true, data: { id, action } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Unknown action' } },
        { status: 400 }
      );
    }
    console.error('Admin review moderation failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not update the review' } },
      { status: 500 }
    );
  }
}
