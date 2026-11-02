import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWitaDateKey, sendReviewReminder, sendReviewRequest } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Daily review fallback (Vercel Cron → 02:00 UTC = 10:00 WITA).
 *
 * The primary trigger is operations marking a booking COMPLETED. This job is
 * the safety net for failed deliveries and for trips completed while the app
 * was offline:
 *  1. Invite every COMPLETED trip from yesterday or earlier that has no review
 *     and no successful request yet.
 *  2. Send exactly one reminder to trips that are 3+ days old, already got the
 *     first request, and still have no review.
 *
 * Both steps are idempotent through NotificationLog.
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
    const yesterday = getWitaDateKey(new Date(), -1);
    const reminderCutoff = getWitaDateKey(new Date(), -3);

    const [requestCandidates, reminderCandidates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          paymentStatus: 'PAID',
          lifecycleStatus: 'COMPLETED',
          bookingDate: { lte: yesterday },
          review: null,
        },
        select: { id: true, bookingCode: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      prisma.booking.findMany({
        where: {
          paymentStatus: 'PAID',
          lifecycleStatus: 'COMPLETED',
          bookingDate: { lte: reminderCutoff },
          review: null,
        },
        select: { id: true, bookingCode: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
    ]);

    const requested: Array<{ bookingCode: string; channels: string[] }> = [];
    for (const booking of requestCandidates) {
      const sent = await sendReviewRequest(booking.id);
      const channels = sent.filter((item) => item.success).map((item) => item.channel);
      if (channels.length > 0) requested.push({ bookingCode: booking.bookingCode, channels });
    }

    const reminded: Array<{ bookingCode: string; channels: string[] }> = [];
    for (const booking of reminderCandidates) {
      const sent = await sendReviewReminder(booking.id);
      const channels = sent.filter((item) => item.success).map((item) => item.channel);
      if (channels.length > 0) reminded.push({ bookingCode: booking.bookingCode, channels });
    }

    return NextResponse.json({
      success: true,
      data: {
        date: yesterday,
        reminderCutoff,
        requested,
        reminded,
      },
    });
  } catch (error) {
    console.error('Review request cron failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Review request job failed' } },
      { status: 500 }
    );
  }
}
