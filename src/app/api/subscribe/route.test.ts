/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { subscribeToNewsletter } from '@/lib/subscribers';
import { sendEmail } from '@/lib/notifications';
import { resetRateLimits } from '@/lib/rateLimit.distributed';

jest.mock('@/lib/subscribers', () => ({
  subscribeToNewsletter: jest.fn(),
}));

jest.mock('@/lib/notifications', () => ({
  sendEmail: jest.fn(),
}));

const subscribeMock = subscribeToNewsletter as jest.Mock;
const sendEmailMock = sendEmail as jest.Mock;

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscribe', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await resetRateLimits();
    subscribeMock.mockResolvedValue({ ok: true, email: 'guest@example.com' });
    sendEmailMock.mockResolvedValue({ success: true });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores the trimmed, lowercased address and sends a welcome note', async () => {
    const response = await POST(postRequest({ email: '  Guest@Example.COM ' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, data: { email: 'guest@example.com' } });
    expect(subscribeMock).toHaveBeenCalledWith('guest@example.com', 'HOMEPAGE');
    expect(sendEmailMock).toHaveBeenCalledWith(
      'guest@example.com',
      expect.any(String),
      expect.any(String)
    );
  });

  it('records the capture source when provided', async () => {
    const response = await POST(postRequest({ email: 'guest@example.com', source: 'CHECKOUT' }));

    expect(response.status).toBe(200);
    expect(subscribeMock).toHaveBeenCalledWith('guest@example.com', 'CHECKOUT');
  });

  it('rejects an invalid email with 400', async () => {
    const response = await POST(postRequest({ email: 'not-an-email' }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('rejects a missing email with 400', async () => {
    const response = await POST(postRequest({}));

    expect(response.status).toBe(400);
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('answers 502 when the address cannot be saved', async () => {
    subscribeMock.mockResolvedValue({ ok: false, error: 'db down' });

    const response = await POST(postRequest({ email: 'guest@example.com' }));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error.code).toBe('SUBSCRIBE_FAILED');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the welcome email fails', async () => {
    sendEmailMock.mockResolvedValue({ success: false, error: 'RESEND_API_KEY is not configured' });

    const response = await POST(postRequest({ email: 'guest@example.com' }));

    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
  });

  it('rate-limits a burst of attempts from one IP', async () => {
    for (let i = 0; i < 5; i += 1) {
      await POST(postRequest({ email: `guest${i}@example.com` }));
    }

    const response = await POST(postRequest({ email: 'burst@example.com' }));

    expect(response.status).toBe(429);
    expect(subscribeMock).toHaveBeenCalledTimes(5);
  });
});
