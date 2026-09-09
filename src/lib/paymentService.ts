import { Prisma, type Booking, type Payment } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  mapTransactionStatus,
  verifyWebhookSignature,
  type MidtransWebhookPayload,
} from '@/lib/midtrans';

export class PaymentServiceError extends Error {
  constructor(
    public readonly code: 'INVALID_SIGNATURE' | 'NOT_FOUND' | 'AMOUNT_MISMATCH' | 'PROCESSING_ERROR',
    message: string,
  ) {
    super(message);
  }
}

function generateVoucherQrData(booking: Booking): string {
  return JSON.stringify({
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    paxCount: booking.paxCount,
    bookingDate: booking.bookingDate,
  });
}

/**
 * Process a Midtrans webhook notification end-to-end:
 * 1. Verify SHA512 signature against server key
 * 2. Locate the Payment record by midtransOrderId
 * 3. Validate gross_amount matches the stored record
 * 4. Update payment + booking status; issue voucher on PAID
 *
 * Idempotent: repeated notifications for the same state are no-ops.
 */
export async function processMidtransWebhook(
  payload: MidtransWebhookPayload,
): Promise<{ paymentStatus: Payment['status']; voucherIssued: boolean }> {
  if (!(await verifyWebhookSignature(payload))) {
    throw new PaymentServiceError('INVALID_SIGNATURE', 'Webhook signature verification failed');
  }

  const payment = await prisma.payment.findFirst({
    where: { midtransOrderId: payload.order_id },
    include: { booking: true },
  });
  if (!payment) {
    throw new PaymentServiceError('NOT_FOUND', 'No payment record found for this order');
  }

  if (payment.status === 'PAID') {
    return { paymentStatus: 'PAID', voucherIssued: false };
  }

  const payloadAmount = Math.round(Number(payload.gross_amount));
  if (!Number.isFinite(payloadAmount) || payloadAmount !== payment.grossAmount) {
    throw new PaymentServiceError(
      'AMOUNT_MISMATCH',
      `Gross amount mismatch: expected ${payment.grossAmount}, got ${payload.gross_amount}`,
    );
  }

  const paymentStatus = mapTransactionStatus(payload.transaction_status, payload.fraud_status);
  const transactionTime = payload.transaction_time ? new Date(payload.transaction_time) : null;
  const validTransactionTime =
    transactionTime && !Number.isNaN(transactionTime.getTime()) ? transactionTime : null;

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: payment.status },
        data: {
          status: paymentStatus,
          paymentMethod: payload.payment_type,
          transactionTime: validTransactionTime,
          rawResponse: payload as unknown as Prisma.InputJsonValue,
        },
      });
      if (updated.count === 0) {
        // Concurrent webhook already updated the record — treat as processed.
        return { paymentStatus, voucherIssued: false };
      }

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus },
      });

      let voucherIssued = false;
      if (paymentStatus === 'PAID') {
        const existingVoucher = await tx.voucher.findUnique({ where: { bookingId: payment.bookingId } });
        if (!existingVoucher) {
          const voucher = await tx.voucher.create({
            data: {
              bookingId: payment.bookingId,
              qrCodeData: generateVoucherQrData(payment.booking),
              status: 'ACTIVE',
            },
          });
          voucherIssued = Boolean(voucher);
        }
      }

      return { paymentStatus, voucherIssued };
    });
  } catch (error) {
    console.error('Webhook transaction failed:', error);
    throw new PaymentServiceError('PROCESSING_ERROR', 'Failed to process webhook notification');
  }
}
