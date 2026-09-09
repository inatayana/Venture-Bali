import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentServiceError, processMidtransWebhook } from '@/lib/paymentService';
import type { MidtransWebhookPayload } from '@/lib/midtrans';

const webhookPayloadSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string(),
  status_message: z.string(),
  transaction_status: z.string(),
  payment_type: z.string(),
  fraud_status: z.string().optional(),
  gross_amount: z.string(),
  transaction_time: z.string(),
  transaction_id: z.string(),
  merchant_id: z.string(),
  signature_key: z.string().min(1),
}) satisfies z.ZodType<MidtransWebhookPayload>;

export async function POST(request: NextRequest) {
  try {
    const payload = webhookPayloadSchema.parse(await request.json());
    const result = await processMidtransWebhook(payload);

    console.log('Midtrans webhook processed:', {
      orderId: payload.order_id,
      status: result.paymentStatus,
      voucherIssued: result.voucherIssued,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    if (error instanceof PaymentServiceError) {
      const status = error.code === 'INVALID_SIGNATURE' ? 401 : error.code === 'NOT_FOUND' ? 404 : 400;
      console.error('Midtrans webhook rejected:', error.code, error.message);
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error('Midtrans webhook error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed' } },
      { status: 500 },
    );
  }
}
