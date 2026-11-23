import { POST as createMidtransPayment } from '@/app/api/payment/midtrans/route';

/**
 * POST /api/v1/payments
 *
 * Public alias of the internal Midtrans payment creation handler so API
 * consumers use the versioned namespace. Behaviour (holds, idempotency,
 * error mapping) stays in one place.
 */
export const POST = createMidtransPayment;
