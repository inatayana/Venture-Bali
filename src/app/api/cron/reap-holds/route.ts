import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Reap stale inventory holds (Vercel Cron every 10 minutes).
 * A PENDING booking whose `expiresAt` has passed no longer owns capacity, so
 * it is cancelled here — before it can shadow a real booking in the manifest.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron token' } },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const result = await prisma.booking.updateMany({
      where: {
        paymentStatus: 'PENDING',
        expiresAt: { lt: now },
      },
      data: {
        paymentStatus: 'CANCELLED',
        lifecycleStatus: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      data: { reaped: result.count, at: now.toISOString() },
    });
  } catch (error) {
    console.error('Hold reaper failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not reap holds' } },
      { status: 500 },
    );
  }
}
