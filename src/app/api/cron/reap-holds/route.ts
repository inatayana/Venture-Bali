import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendHoldExpired } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Reap stale inventory holds.
 *
 * NOTE: vercel.json currently runs this once daily (03:00 UTC) to stay within
 * the hosting plan's cron limits. The 10-minute hold itself is enforced live
 * by the checkout page: it blocks payment and shows an expiry countdown, so a
 * guest cannot complete a stale booking. This cron is the eventual DB cleanup,
 * not the real-time guard. Do not change the schedule without checking the
 * hosting plan's cron allowance.
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

    // First, find the bookings to reap (so we can notify them)
    const toReap = await prisma.booking.findMany({
      where: {
        paymentStatus: 'PENDING',
        expiresAt: { lt: now },
      },
      select: { id: true },
    });

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

    // Send hold expired notifications (non-blocking, fire-and-forget)
    for (const booking of toReap) {
      sendHoldExpired(booking.id).catch((err) =>
        console.error(`Hold expired notification failed for ${booking.id}:`, err)
      );
    }

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
