import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, hasRole, verifySessionToken } from '@/lib/adminSession';

const closeJobSchema = z.object({
  status: z.enum(['COMPLETED', 'NO_SHOW']),
});

/**
 * Close a field job order: redeem the voucher or record a no-show.
 * Only paid, confirmed bookings can be closed, and only once.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || !hasRole(session, 'ADMIN')) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Operator access required' } },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const { status } = closeJobSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) return { kind: 'not_found' as const };
      if (booking.paymentStatus !== 'PAID') {
        return { kind: 'invalid' as const, message: 'Only paid bookings can be closed' };
      }
      if (booking.lifecycleStatus !== 'CONFIRMED') {
        return { kind: 'invalid' as const, message: 'This job order is already closed' };
      }

      await tx.booking.update({
        where: { id },
        data: { lifecycleStatus: status },
      });

      if (status === 'COMPLETED') {
        await tx.voucher.updateMany({
          where: { bookingId: id, status: 'ACTIVE' },
          data: {
            status: 'REDEEMED',
            redeemedAt: new Date(),
            redeemedBy: session.email,
          },
        });
      } else {
        await tx.voucher.updateMany({
          where: { bookingId: id },
          data: { status: 'CANCELLED' },
        });
      }

      return { kind: 'ok' as const };
    });

    revalidatePath('/admin/operations');
    revalidatePath('/admin/bookings');

    if (result.kind === 'not_found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }
    if (result.kind === 'invalid') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: result.message } },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, data: { id, status }, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Close job order failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not close the job order' } },
      { status: 500 },
    );
  }
}
