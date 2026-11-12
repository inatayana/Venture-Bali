/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

jest.mock('@/lib/adminGuard', () => ({
  requireAdminRole: jest.fn().mockResolvedValue(null),
}));

describe('POST /api/experiences', () => {
  it('rejects anonymous venture creation before reading the body', async () => {
    const request = new NextRequest('http://localhost/api/experiences', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
