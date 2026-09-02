/**
 * Venture Bali — Midtrans Snap Integration
 * Handles payment token generation and webhook processing
 */

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

export interface SnapTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name: string;
    email: string;
    phone: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  credit_card?: {
    secure: boolean;
  };
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransWebhookPayload {
  transaction_status: string;
  order_id: string;
  payment_type: string;
  fraud_status?: string;
  gross_amount: string;
  transaction_time: string;
  signature_key: string;
  status_code: string;
  transaction_id: string;
  status_message: string;
  merchant_id: string;
  masked_card?: string;
  bank?: string;
  eci?: string;
  currency?: string;
  [key: string]: unknown;
}

let config: MidtransConfig | null = null;

export function getMidtransConfig(): MidtransConfig {
  if (config) return config;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey || !clientKey) {
    throw new Error('Midtrans credentials not configured. Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY');
  }

  config = { serverKey, clientKey, isProduction };
  return config;
}

export function getMidtransBaseUrl(): string {
  const { isProduction } = getMidtransConfig();
  return isProduction
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com';
}

export async function createSnapTransaction(
  request: SnapTransactionRequest
): Promise<SnapResponse> {
  const { serverKey } = getMidtransConfig();
  const baseUrl = getMidtransBaseUrl();

  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  const response = await fetch(`${baseUrl}/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Midtrans API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function verifyWebhookSignature(payload: MidtransWebhookPayload): Promise<boolean> {
  const { serverKey } = getMidtransConfig();
  const { createHash } = await import('crypto');

  // Midtrans signature key verification
  // signature_key = SHA512(order_id + status_code + gross_amount + server_key)
  const signatureString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const expectedSignature = createHash('sha512').update(signatureString).digest('hex');

  return expectedSignature === payload.signature_key;
}

export function mapTransactionStatus(status: string, fraudStatus?: string): 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' {
  switch (status) {
    case 'capture':
    case 'settlement':
      // For card payments, check fraud status
      if (fraudStatus === 'accept') return 'PAID';
      if (fraudStatus === 'challenge') return 'PENDING';
      return 'PAID';
    case 'pending':
      return 'PENDING';
    case 'deny':
    case 'cancel':
    case 'expire':
      return 'CANCELLED';
    default:
      return 'FAILED';
  }
}