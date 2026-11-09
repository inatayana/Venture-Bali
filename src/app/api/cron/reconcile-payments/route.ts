import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransactionStatus, mapTransactionStatus } from '@/lib/midtrans';
import { lifecycleForPaymentStatus } from '@/lib/bookingLifecycle';
import { notifyBookingPaid } from '@/lib/notifications';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Reconciliation cron: catches payments where the Midtrans webhook was missed
 * or delayed. Runs every 15 minutes.
 *
 * Strategy:
 * 1. Find PENDING payments older than 10 minutes (past the hold window)
 *    and younger than 24 hours (avoid noise from ancient bookings).
 * 2. For each, query Midtrans `/v2/{order_id}/status`.
 * 3. If Midtrans says PAID/settlement → process exactly like webhook:
 *    - idempotent update via optimistic concurrency (status check)
 *    - issue voucher, send notifications, emit purchase event.
 * 4. If Midtrans says CANCELLED/EXPIRE/DENY → cancel the hold locally.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron token' } },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Payments stuck in PENDING past their hold window, but not ancient
    const stuckPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { gte: twentyFourHoursAgo, lte: tenMinutesAgo },
      },
      include: {
        booking: {
          include: {
            variant: { include: { venture: { select: { title: true } } } },
          },
        },
      },
      take: 50, // batch size
    });

    let reconciled = 0;
    let cancelled = 0;
    let errors = 0;

    for (const payment of stuckPayments) {
      try {
        const midtransStatus = await getTransactionStatus(payment.midtransOrderId);
        if (!midtransStatus) {
          errors++;
          continue;
        }

        const paymentStatus = mapTransactionStatus(
          midtransStatus.transaction_status,
          midtransStatus.fraud_status
        );

        if (paymentStatus === 'PAID') {
          // Process exactly like webhook: optimistic update on payment.status
          const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.payment.updateMany({
              where: { id: payment.id, status: 'PENDING' },
              data: {
                status: 'PAID',
                paymentMethod: midtransStatus.payment_type,
                transactionTime: midtransStatus.transaction_time
                  ? new Date(midtransStatus.transaction_time)
                  : null,
                rawResponse: midtransStatus as unknown as Prisma.InputJsonValue,
              },
            });
            if (updated.count === 0) {
              return { action: 'already_processed' };
            }

            await tx.booking.update({
              where: { id: payment.bookingId },
              data: {
                paymentStatus: 'PAID',
                lifecycleStatus: lifecycleForPaymentStatus('PAID'),
                expiresAt: null,
              },
            });

            // Consume coupon if any (same guard as webhook)
            const booking = await tx.booking.findUnique({
              where: { id: payment.bookingId },
              select: { appliedCouponCode: true },
            });
            if (booking?.appliedCouponCode) {
              await tx.coupon.updateMany({
                where: { code: booking.appliedCouponCode },
                data: { usedCount: { increment: 1 } },
              });
            }

            // Issue voucher if not exists
            const existingVoucher = await tx.voucher.findUnique({
              where: { bookingId: payment.bookingId },
            });
            if (!existingVoucher) {
              const { generateQRCodeData } = await import('@/lib/voucher');
              await tx.voucher.create({
                data: {
                  bookingId: payment.bookingId,
                  qrCodeData: generateQRCodeData(payment.booking.bookingCode),
                  status: 'ACTIVE',
                },
              });
            }

            return { action: 'reconciled' };
          });

          if (result.action === 'reconciled') {
            reconciled++;
            // Fire notifications & analytics (non-blocking)
            try {
              await notifyBookingPaid(payment.bookingId);
            } catch (e) {
              console.error('Reconciliation notification failed:', e);
            }
            // Emit purchase event (server-side analytics)
            try {
              const { emitPurchaseEvent } = await import('@/lib/paymentService');
              emitPurchaseEvent({
                id: payment.booking.id,
                bookingCode: payment.booking.bookingCode,
                totalPrice: payment.booking.totalPrice,
                paxCount: payment.booking.paxCount,
                variantTitle: payment.booking.variant?.title ?? null,
                ventureTitle: payment.booking.variant?.venture?.title ?? null,
              });
            } catch (e) {
              console.error('Reconciliation purchase event failed:', e);
            }
          }
        } else if (['CANCELLED', 'FAILED'].includes(paymentStatus)) {
          // Midtrans says it's dead → cancel our hold
          await prisma.$transaction([
            prisma.payment.updateMany({
              where: { id: payment.id, status: 'PENDING' },
              data: { status: paymentStatus },
            }),
            prisma.booking.updateMany({
              where: { id: payment.bookingId, paymentStatus: 'PENDING' },
              data: {
                paymentStatus: paymentStatus,
                lifecycleStatus: lifecycleForPaymentStatus(paymentStatus),
                expiresAt: new Date(),
              },
            }),
          ]);
          cancelled++;
        }
        // PENDING from Midtrans = still waiting, do nothing
      } catch (error) {
        console.error(`Reconciliation error for payment ${payment.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { reconciled, cancelled, errors, checked: stuckPayments.length, at: now.toISOString() },
    });
  } catch (error) {
    console.error('Reconciliation cron failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Reconciliation failed' } },
      { status: 500 },
    );
  }
}