import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { isDateAvailable, isSlotBookable } from '@/lib/pricing';
import { hoursBeforeActivity } from '@/lib/refundUtils';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const rescheduleSchema = z.object({
  token: z.string().min(10, 'Missing access token'),
  date: dateSchema,
  slotTimeId: z.string().min(1, 'Pick a departure time'),
});

function blackoutDates(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

async function loadBooking(id: string, customerId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      slotTime: { select: { time: true } },
      variant: { select: { id: true, fulfillmentMode: true, blackoutDates: true } },
    },
  });
  return booking && booking.customerId === customerId ? booking : null;
}

function rescheduleBlocked(booking: { bookingDate: string; slotTime: { time: string } | null }) {
  return hoursBeforeActivity(booking.bookingDate, booking.slotTime?.time) < 24;
}

/** Available slots for a replacement date. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(`reschedule-get:${clientIp(request)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const token = request.nextUrl.searchParams.get('token');
  const date = request.nextUrl.searchParams.get('date');
  const session = verifyCustomerLinkToken(token);
  if (!session) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid link' } }, { status: 401 });
  }
  if (!date || !dateSchema.safeParse(date).success) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid date' } }, { status: 400 });
  }

  const { id } = await params;
  const booking = await loadBooking(id, session.customerId);
  if (!booking) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, { status: 404 });
  }
  if (booking.paymentStatus !== 'PAID' || booking.lifecycleStatus !== 'CONFIRMED') {
    return NextResponse.json({ success: false, error: { code: 'INVALID_STATE', message: 'Booking cannot be changed' } }, { status: 409 });
  }
  if (rescheduleBlocked(booking)) {
    return NextResponse.json(
      { success: false, error: { code: 'CUT_OFF', message: 'Changes close 24 hours before the activity' } },
      { status: 409 }
    );
  }

  const availableDate = isDateAvailable(
    { blackoutDates: blackoutDates(booking.variant.blackoutDates) },
    date
  );
  if (!availableDate) {
    return NextResponse.json({ success: true, data: { date, slots: [] } });
  }

  const slots = await prisma.slotTime.findMany({
    where: { variantId: booking.variant.id, isAvailable: true },
    orderBy: { time: 'asc' },
  });

  const reserved = await prisma.booking.groupBy({
    by: ['slotTimeId'],
    where: {
      variantId: booking.variant.id,
      bookingDate: date,
      id: { not: booking.id },
      OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'PENDING', expiresAt: { gt: new Date() } }],
    },
    _sum: { paxCount: true },
  });
  const reservedMap = new Map(reserved.map((row) => [row.slotTimeId, row._sum.paxCount ?? 0]));

  return NextResponse.json({
    success: true,
    data: {
      date,
      slots: slots.map((slot) => {
        const left = Math.max(0, slot.maxCapacity - (reservedMap.get(slot.id) ?? 0));
        return {
          id: slot.id,
          time: slot.time,
          spotsLeft: left,
          enabled:
            left >= booking.paxCount &&
            isSlotBookable(date, slot.time, booking.variant.fulfillmentMode) &&
            hoursBeforeActivity(date, slot.time) >= 24,
        };
      }),
    },
  });
}

/** Move a paid booking to another date/slot without changing its price. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(`reschedule:${clientIp(request)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = rescheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 }
    );
  }

  const session = verifyCustomerLinkToken(parsed.data.token);
  if (!session) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid link' } }, { status: 401 });
  }

  const { id } = await params;
  const booking = await loadBooking(id, session.customerId);
  if (!booking) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } }, { status: 404 });
  }
  if (booking.paymentStatus !== 'PAID' || booking.lifecycleStatus !== 'CONFIRMED') {
    return NextResponse.json({ success: false, error: { code: 'INVALID_STATE', message: 'Booking cannot be changed' } }, { status: 409 });
  }
  if (rescheduleBlocked(booking)) {
    return NextResponse.json(
      { success: false, error: { code: 'CUT_OFF', message: 'Changes close 24 hours before the activity' } },
      { status: 409 }
    );
  }
  if (
    !isDateAvailable(
      { blackoutDates: blackoutDates(booking.variant.blackoutDates) },
      parsed.data.date
    )
  ) {
    return NextResponse.json({ success: false, error: { code: 'UNAVAILABLE', message: 'That date is not available' } }, { status: 409 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "SlotTime" WHERE "id" = ${parsed.data.slotTimeId} FOR UPDATE`;
      const slot = await tx.slotTime.findUnique({ where: { id: parsed.data.slotTimeId } });
      if (!slot || slot.variantId !== booking.variant.id || !slot.isAvailable) {
        return { kind: 'invalid' as const, message: 'That departure is not available' };
      }
      if (!isSlotBookable(parsed.data.date, slot.time, booking.variant.fulfillmentMode)) {
        return { kind: 'invalid' as const, message: 'That departure is inside the booking cut-off' };
      }
      if (hoursBeforeActivity(parsed.data.date, slot.time) < 24) {
        return { kind: 'invalid' as const, message: 'The new trip must start at least 24 hours from now' };
      }

      const reserved = await tx.booking.aggregate({
        where: {
          slotTimeId: slot.id,
          bookingDate: parsed.data.date,
          id: { not: booking.id },
          OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'PENDING', expiresAt: { gt: new Date() } }],
        },
        _sum: { paxCount: true },
      });
      if ((reserved._sum.paxCount ?? 0) + booking.paxCount > slot.maxCapacity) {
        return { kind: 'invalid' as const, message: 'That departure no longer has enough seats' };
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { bookingDate: parsed.data.date, slotTimeId: slot.id },
      });
      await tx.bookingChange.create({
        data: {
          bookingId: booking.id,
          fromDate: booking.bookingDate,
          fromSlot: booking.slotTime?.time ?? null,
          toDate: parsed.data.date,
          toSlot: slot.time,
          changedBy: 'customer',
        },
      });

      return { kind: 'ok' as const, slotTime: slot.time };
    });

    if (result.kind === 'invalid') {
      return NextResponse.json({ success: false, error: { code: 'UNAVAILABLE', message: result.message } }, { status: 409 });
    }

    revalidatePath('/my/bookings');
    revalidatePath('/admin/bookings');
    return NextResponse.json({
      success: true,
      data: { date: parsed.data.date, slotTime: result.slotTime },
    });
  } catch (error) {
    console.error('Reschedule failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not reschedule this booking' } },
      { status: 500 }
    );
  }
}
