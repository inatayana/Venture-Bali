import { POST as handleMidtransWebhook } from '@/app/api/webhooks/midtrans/route';

/**
 * POST /api/v1/webhooks/midtrans
 *
 * Public alias of the internal Midtrans webhook handler. Signature
 * verification and settlement live in `@/lib/paymentService`.
 */
export const POST = handleMidtransWebhook;
