import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWitaDateKey, sendBookingReminder } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Daily H-24 reminder job (Vercel Cron → 01:00 UTC = 09:00 WITA).
 *
 * Sends a WhatsApp message and an email for every PAID booking whose activity
 * date is tomorrow (WITA). Every attempt is logged in NotificationLog and the
 * job is idempotent, so a repeated run never double-messages a guest.
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
    const targetDate = getWitaDateKey(new Date(), 1);

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: targetDate,
        paymentStatus: 'PAID',
      },
      select: { id: true, bookingCode: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    const results: Array<{ bookingCode: string; channels: string[] }> = [];
    for (const booking of bookings) {
      const sent = await sendBookingReminder(booking.id);
      results.push({
        bookingCode: booking.bookingCode,
        channels: sent.filter((item) => item.success).map((item) => item.channel),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        targetDate,
        scanned: bookings.length,
        results,
      },
    });
  } catch (error) {
    console.error('Reminder cron failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Reminder job failed' } },
      { status: 500 },
    );
  }
}
