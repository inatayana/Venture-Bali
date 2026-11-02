import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(['approve', 'delete']),
});

/** Approve or delete up to 100 reviews in one action. */
export async function POST(request: NextRequest) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 }
    );
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json());

    const reviews = await prisma.review.findMany({
      where: { id: { in: ids } },
      select: { id: true, venture: { select: { id: true, slug: true } } },
    });
    if (reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No matching reviews' } },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      await prisma.review.updateMany({
        where: { id: { in: reviews.map((review) => review.id) } },
        data: { isApproved: true },
      });
    } else {
      await prisma.review.deleteMany({
        where: { id: { in: reviews.map((review) => review.id) } },
      });
    }

    revalidatePath('/admin/reviews');
    for (const venture of new Map(reviews.map((review) => [review.venture.id, review.venture])).values()) {
      revalidatePath(`/experiences/${venture.id}/${venture.slug}`);
    }

    return NextResponse.json({
      success: true,
      data: { updated: reviews.length, action },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    console.error('Bulk review action failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not update reviews' } },
      { status: 500 }
    );
  }
}
