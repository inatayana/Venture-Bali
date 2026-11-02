import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startedAt = Date.now();

/**
 * Liveness/readiness endpoint for uptime checks and the deploy pipeline.
 * It exposes only service state, never configuration or customer data.
 */
export async function GET() {
  const checkedAt = Date.now();
  let database: 'ok' | 'unavailable' = 'ok';
  let databaseLatencyMs = 0;

  try {
    const dbStartedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatencyMs = Date.now() - dbStartedAt;
  } catch (error) {
    database = 'unavailable';
    logger.error('Health check: database unavailable', { error });
  }

  const healthy = database === 'ok';

  return NextResponse.json(
    {
      success: healthy,
      data: {
        status: healthy ? 'ok' : 'degraded',
        checks: {
          database: { status: database, latencyMs: databaseLatencyMs },
        },
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        version: process.env.npm_package_version ?? 'unknown',
        timestamp: new Date(checkedAt).toISOString(),
      },
      error: healthy
        ? null
        : { code: 'DEGRADED', message: 'One or more dependencies are unavailable' },
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
