import { NextRequest, NextResponse } from 'next/server';
import {
  getMidtransConfig,
  verifyWebhookSignature,
  mapTransactionStatus,
  type MidtransWebhookPayload,
} from '@/lib/midtrans';

export async function POST(request: NextRequest) {
  try {
    const payload: MidtransWebhookPayload = await request.json();

    // Verify webhook signature
    if (!verifyWebhookSignature(payload)) {
      console.error('Midtrans webhook: Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { order_id, transaction_status, fraud_status, gross_amount, transaction_time, payment_type } = payload;

    // Map transaction status
    const paymentStatus = mapTransactionStatus(transaction_status, fraud_status);

    console.log('Midtrans webhook received:', {
      orderId: order_id,
      status: paymentStatus,
      amount: gross_amount,
      paymentType: payment_type,
      time: transaction_time,
    });

    // In real implementation:
    // 1. Find booking by order_id
    // 2. Update booking payment status
    // 3. Generate voucher if payment successful
    // 4. Send confirmation notification

    // Example:
    // const booking = await prisma.booking.findUnique({ where: { bookingCode: order_id } });
    // if (booking) {
    //   await prisma.booking.update({
    //     where: { id: booking.id },
    //     data: {
    //       paymentStatus,
    //       payment: {
    //         upsert: {
    //           where: { bookingId: booking.id },
    //           create: {
    //             bookingId: booking.id,
    //             midtransOrderId: order_id,
    //             snapToken: '', // would be stored during booking creation
    //             grossAmount: parseInt(gross_amount),
    //             paymentMethod: payment_type,
    //             rawResponse: payload,
    //             status: paymentStatus,
    //           },
    //           update: {
    //             status: paymentStatus,
    //             rawResponse: payload,
    //             transactionTime: new Date(transaction_time),
    //           },
    //         },
    //       },
    //     },
    //   });
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}