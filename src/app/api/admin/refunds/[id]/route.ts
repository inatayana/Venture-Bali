import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, hasRole, verifySessionToken } from '@/lib/adminSession';
import { refundMidtransTransaction } from '@/lib/midtrans';

const bodySchema = z.object({
  method: z.enum(['MIDTRANS', 'MANUAL']),
});

/** Process a customer refund, either through Midtrans or a manual transfer. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || !hasRole(session, 'ADMIN')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Operator access required' } }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid refund method' } }, { status: 400 });
  }

  const { id } = await params;
  const refund = await prisma.refund.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          payment: { select: { midtransOrderId: true } },
        },
      },
    },
  });

  if (!refund) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Refund not found' } }, { status: 404 });
  }
  if (refund.status === 'PROCESSED') {
    return NextResponse.json({ success: true, data: { id, status: refund.status } });
  }

  let providerRef: string | null = null;
  if (parsed.data.method === 'MIDTRANS') {
    const orderId = refund.booking.payment?.midtransOrderId;
    if (!orderId) {
      return NextResponse.json({ success: false, error: { code: 'NO_PAYMENT', message: 'No Midtrans order for this booking' } }, { status: 409 });
    }
    try {
      const result = await refundMidtransTransaction({
        orderId,
        amount: refund.amountIdr,
        reason: refund.reason ?? `Cancellation ${refund.booking.bookingCode}`,
      });
      providerRef = result.refundKey ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Midtrans refund failed';
      await prisma.refund.update({ where: { id }, data: { status: 'FAILED', notes: message } });
      revalidatePath('/admin/refunds');
      return NextResponse.json({ success: false, error: { code: 'PROVIDER_ERROR', message } }, { status: 502 });
    }
  }

  await prisma.$transaction([
    prisma.refund.update({
      where: { id },
      data: {
        status: 'PROCESSED',
        method: parsed.data.method,
        providerRef,
        processedAt: new Date(),
        processedBy: session.email,
      },
    }),
    prisma.booking.update({
      where: { id: refund.bookingId },
      data: {
        paymentStatus:
          refund.amountIdr >= refund.booking.totalPrice ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    }),
  ]);

  revalidatePath('/admin/refunds');
  revalidatePath('/admin/bookings');
  revalidatePath('/my/bookings');

  return NextResponse.json({ success: true, data: { id, status: 'PROCESSED' } });
}
