import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWitaDateKey, sendReviewRequest } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Daily review-request job (Vercel Cron → 02:00 UTC = 10:00 WITA).
 *
 * Asks every guest whose trip happened yesterday (WITA) and who has not
 * reviewed it yet. Idempotent through NotificationLog, so a re-run never
 * double-messages anyone.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron token' } },
      { status: 401 }
    );
  }

  try {
    const targetDate = getWitaDateKey(new Date(), -1);

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: targetDate,
        paymentStatus: 'PAID',
        review: null,
      },
      select: { id: true, bookingCode: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    const results: Array<{ bookingCode: string; channels: string[] }> = [];
    for (const booking of bookings) {
      const sent = await sendReviewRequest(booking.id);
      results.push({
        bookingCode: booking.bookingCode,
        channels: sent.filter((item) => item.success).map((item) => item.channel),
      });
    }

    return NextResponse.json({
      success: true,
      data: { date: targetDate, requested: results.length, results },
    });
  } catch (error) {
    console.error('Review request cron failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Review request job failed' } },
      { status: 500 }
    );
  }
}
