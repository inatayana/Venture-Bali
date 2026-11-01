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
    billing_address?: {
      first_name?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country_code?: string;
    };
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
  /** Snap closes the payment session after this window. */
  expiry?: {
    unit: 'minutes' | 'hours' | 'days';
    duration: number;
  };
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

/** Shape Midtrans returns when a token request is rejected. */
interface SnapErrorPayload {
  status_code?: unknown;
  status_message?: unknown;
  error_messages?: unknown;
  [key: string]: unknown;
}

function describeSnapError(body: unknown, httpStatus: number): string {
  const payload = (body ?? {}) as SnapErrorPayload;
  const statusCode =
    typeof payload.status_code === 'string' && payload.status_code.length > 0
      ? payload.status_code
      : String(httpStatus);

  let message = 'Unexpected response from Midtrans';
  if (typeof payload.status_message === 'string' && payload.status_message.length > 0) {
    message = payload.status_message;
  } else if (Array.isArray(payload.error_messages) && payload.error_messages.length > 0) {
    message = payload.error_messages.map(String).join('; ');
  }

  return `Midtrans API error: ${statusCode} - ${message}`;
}

/**
 * Midtrans answers token requests with HTTP 200 even when the request was
 * rejected (invalid keys, bad amount, …) and the real status code lives in the
 * JSON body. Only a payload carrying both `token` and `redirect_url` is usable,
 * so anything else must throw — otherwise the caller would store an empty token
 * and the Snap popup would fail with a meaningless error.
 */
function parseSnapResponse(body: unknown, httpStatus: number, httpOk: boolean): SnapResponse {
  const payload = (body ?? {}) as SnapErrorPayload;
  const token = typeof payload.token === 'string' ? payload.token : '';
  const redirectUrl = typeof payload.redirect_url === 'string' ? payload.redirect_url : '';

  if (!httpOk || !token || !redirectUrl) {
    throw new Error(describeSnapError(body, httpStatus));
  }

  return { token, redirect_url: redirectUrl };
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

/** Raised when the server keys are missing so callers can return a clear 503. */
export class MidtransConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MidtransConfigError';
  }
}

export function getMidtransConfig(): MidtransConfig {
  if (config) return config;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey || !clientKey) {
    throw new MidtransConfigError(
      'Midtrans credentials not configured. Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY'
    );
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

  const body: unknown = await response.json().catch(() => null);

  return parseSnapResponse(body, response.status, response.ok);
}

export async function verifyWebhookSignature(payload: MidtransWebhookPayload): Promise<boolean> {
  // Webhook verification only needs the server key. Using getMidtransConfig()
  // here made the endpoint require the client key too, which a headless
  // deployment does not need.
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const { createHash, timingSafeEqual } = await import('crypto');

  // Midtrans signature key verification
  // signature_key = SHA512(order_id + status_code + gross_amount + server_key)
  const signatureString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const expected = Buffer.from(createHash('sha512').update(signatureString).digest('hex'));
  const provided = Buffer.from(payload.signature_key ?? '');
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
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