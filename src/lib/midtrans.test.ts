import { createSnapTransaction, mapTransactionStatus, type SnapTransactionRequest } from '@/lib/midtrans';

describe('mapTransactionStatus', () => {
  it('maps settlement to PAID', () => {
    expect(mapTransactionStatus('settlement')).toBe('PAID');
  });

  it('maps capture with accept fraud to PAID', () => {
    expect(mapTransactionStatus('capture', 'accept')).toBe('PAID');
  });

  it('maps capture with challenge fraud to PENDING', () => {
    expect(mapTransactionStatus('capture', 'challenge')).toBe('PENDING');
  });

  it('maps pending to PENDING', () => {
    expect(mapTransactionStatus('pending')).toBe('PENDING');
  });

  it('maps deny, cancel, expire to CANCELLED', () => {
    expect(mapTransactionStatus('deny')).toBe('CANCELLED');
    expect(mapTransactionStatus('cancel')).toBe('CANCELLED');
    expect(mapTransactionStatus('expire')).toBe('CANCELLED');
  });

  it('maps unknown status to FAILED', () => {
    expect(mapTransactionStatus('weird-status')).toBe('FAILED');
  });
});

const SERVER_KEY = 'SB-Mid-server-test-key';
const CLIENT_KEY = 'SB-Mid-client-test-key';

const request: SnapTransactionRequest = {
  transaction_details: { order_id: 'BK-TEST-001', gross_amount: 1500000 },
};

const originalFetch = globalThis.fetch;

function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: jest.fn().mockResolvedValue(body),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('createSnapTransaction', () => {
  beforeAll(() => {
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
    process.env.MIDTRANS_CLIENT_KEY = CLIENT_KEY;
    process.env.MIDTRANS_IS_PRODUCTION = 'false';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns the Snap token and redirect url', async () => {
    mockFetch({
      status_code: '201',
      token: 'snap-token-123',
      redirect_url: 'https://app.sandbox.midtrans.com/snap/v4/redirection/abc',
    });

    await expect(createSnapTransaction(request)).resolves.toEqual({
      token: 'snap-token-123',
      redirect_url: 'https://app.sandbox.midtrans.com/snap/v4/redirection/abc',
    });
  });

  it('posts to the sandbox token endpoint with basic auth', async () => {
    const fetchMock = mockFetch({ token: 'snap-token-123', redirect_url: 'https://example.test/snap' });

    await createSnapTransaction(request);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sandbox.midtrans.com/v2/token',
      expect.objectContaining({ method: 'POST' })
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({
      Authorization: `Basic ${Buffer.from(`${SERVER_KEY}:`).toString('base64')}`,
    });
  });

  it('rejects an HTTP 200 response that carries an error body', async () => {
    // Midtrans answers 200 even for bad credentials; the real code is in the body.
    mockFetch({
      id: '2661f540',
      status_code: '401',
      status_message: 'Transaction cannot be authorized with the current client/server key',
    });

    await expect(createSnapTransaction(request)).rejects.toThrow(
      'Midtrans API error: 401 - Transaction cannot be authorized with the current client/server key'
    );
  });

  it('rejects a successful response without a usable token', async () => {
    mockFetch({ status_code: '200', status_message: 'Success' });

    await expect(createSnapTransaction(request)).rejects.toThrow(/Midtrans API error: 200/);
  });

  it('rejects a non-2xx response with its status and message', async () => {
    mockFetch(
      { status_code: '500', status_message: 'Internal server error' },
      { ok: false, status: 500 }
    );

    await expect(createSnapTransaction(request)).rejects.toThrow(
      'Midtrans API error: 500 - Internal server error'
    );
  });

  it('surfaces field-level validation messages', async () => {
    mockFetch({
      status_code: '400',
      error_messages: ['transaction_details.gross_amount is required', 'order_id is invalid'],
    });

    await expect(createSnapTransaction(request)).rejects.toThrow(
      'Midtrans API error: 400 - transaction_details.gross_amount is required; order_id is invalid'
    );
  });
});
