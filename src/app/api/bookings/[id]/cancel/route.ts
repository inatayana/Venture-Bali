import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { quoteCancellation } from '@/lib/refundUtils';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const cancelSchema = z.object({
  token: z.string().min(10, 'Missing access token'),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Customer-initiated cancellation.
 *
 * Creates the refund request and cancels the voucher atomically; the money is
 * moved by an admin from /admin/refunds (Midtrans or manual transfer). The
 * payment status stays PAID until the refund is actually processed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(`cancel:${clientIp(request)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = cancelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 }
    );
  }

  const session = verifyCustomerLinkToken(parsed.data.token);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'This link is invalid or expired.' } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      slotTime: { select: { time: true } },
      variant: { select: { ventureId: true, venture: { select: { id: true, slug: true } } } },
      refund: { select: { id: true } },
      payment: { select: { id: true } },
    },
  });

  if (!booking || booking.customerId !== session.customerId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
      { status: 404 }
    );
  }

  if (booking.paymentStatus !== 'PAID' || booking.lifecycleStatus !== 'CONFIRMED') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only a paid, confirmed booking can be cancelled.' },
      },
      { status: 409 }
    );
  }

  if (booking.refund || booking.cancelledAt) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_CANCELLED', message: 'This booking is already cancelled.' } },
      { status: 409 }
    );
  }

  const quote = quoteCancellation({
    bookingDate: booking.bookingDate,
    slotTime: booking.slotTime?.time,
    totalPrice: booking.totalPrice,
  });

  if (!quote.eligible) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CUT_OFF',
          message:
            'Cancellation is closed because the activity starts in less than 24 hours. Contact support for an emergency change.',
        },
      },
      { status: 409 }
    );
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refund.create({
      data: {
        bookingId: booking.id,
        amountIdr: quote.refundAmount,
        feeIdr: quote.feeAmount,
        reason: parsed.data.reason || null,
        method: booking.payment ? 'MIDTRANS' : 'MANUAL',
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        lifecycleStatus: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: parsed.data.reason || null,
      },
    });

    await tx.voucher.updateMany({
      where: { bookingId: booking.id },
      data: { status: 'CANCELLED' },
    });

    return created;
  });

  revalidatePath('/my/bookings');
  revalidatePath('/admin/refunds');
  revalidatePath(`/experiences/${booking.variant.venture.id}/${booking.variant.venture.slug}`);

  return NextResponse.json({
    success: true,
    data: {
      refundId: refund.id,
      amountIdr: refund.amountIdr,
      feeIdr: refund.feeIdr,
      status: refund.status,
      message: `Cancellation confirmed. ${quote.percentage}% will be refunded within 3 business days.`,
    },
  });
}
