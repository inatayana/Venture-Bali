/**
 * @jest-environment node
 */
import { prisma } from '@/lib/prisma';
import { GET } from './route';

jest.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: jest.fn() },
}));

const queryRaw = prisma.$queryRaw as jest.Mock;

describe('GET /api/health', () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports ok when the database responds', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.checks.database.status).toBe('ok');
    expect(body.data.checks.database.latencyMs).toEqual(expect.any(Number));
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL|postgres:\/\/|secret/i);
    expect(body.data.version).toBeUndefined();
  });

  it('reports degraded without leaking the database error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    queryRaw.mockRejectedValue(new Error('password authentication failed'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.data.status).toBe('degraded');
    expect(body.data.checks.database.status).toBe('unavailable');
    expect(body.data.checks.database.latencyMs).toBeNull();
    expect(JSON.stringify(body)).not.toContain('password authentication failed');
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL|postgres:\/\/|secret/i);

    spy.mockRestore();
  });
});
