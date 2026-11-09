import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isSlotBookable } from '@/lib/pricing';
import { hoursBeforeActivity } from '@/lib/refundUtils';
import type { FulfillmentMode } from '@prisma/client';

const availabilitySchema = z.object({
  variantId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

/**
 * Centralized availability API.
 *
 * Returns real-time capacity for all slot times of a variant on a given date.
 * Uses authoritative aggregation: PAID + active PENDING bookings per slot.
 * This replaces client-side capacity calculations in TimeSlotPill / Calendar.
 *
 * Response includes:
 * - per-slot spotsLeft, enabled (respects cut-off, capacity, 24h rule)
 * - daily heatmap: totalAvailable (sum of spotsLeft across slots)
 * - isFullyBooked flag for quick UI decisions
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const parsed = availabilitySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  const { variantId, date } = parsed.data;
  const now = new Date();

  try {
    // Load variant with its slot times and fulfillment mode
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        slotTimes: {
          where: { isAvailable: true },
          orderBy: { time: 'asc' },
          select: {
            id: true,
            time: true,
            maxCapacity: true,
            cutoffHours: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 },
      );
    }

    const fulfillmentMode = variant.fulfillmentMode as FulfillmentMode;

    // Aggregate current bookings per slot (PAID + active PENDING)
    const booked = await prisma.booking.groupBy({
      by: ['slotTimeId'],
      where: {
        variantId,
        bookingDate: date,
        OR: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'PENDING', expiresAt: { gt: now } },
        ],
      },
      _sum: { paxCount: true },
    });

    const bookedMap = new Map<string, number>(
      booked
        .filter((row): row is typeof row & { slotTimeId: string } => row.slotTimeId !== null)
        .map((row) => [row.slotTimeId, row._sum.paxCount ?? 0]),
    );

    // Build slot availability
    const slots = variant.slotTimes.map((slot: { id: string; time: string; maxCapacity: number; cutoffHours: number | null }) => {
      const reserved = bookedMap.get(slot.id) ?? 0;
      const spotsLeft = Math.max(0, slot.maxCapacity - reserved);

      const enabled =
        spotsLeft > 0 &&
        isSlotBookable(date, slot.time, fulfillmentMode, now, slot.cutoffHours) &&
        hoursBeforeActivity(date, slot.time) >= 24;

      return {
        id: slot.id,
        time: slot.time,
        maxCapacity: slot.maxCapacity,
        spotsLeft,
        enabled,
        cutoffHours: slot.cutoffHours,
      };
    });

    const totalAvailable = slots.reduce((sum: number, s: typeof slots[0]) => sum + s.spotsLeft, 0);
    const hasAnyEnabled = slots.some((s: typeof slots[0]) => s.enabled);
    const isFullyBooked = totalAvailable === 0 || !hasAnyEnabled;

    return NextResponse.json({
      success: true,
      data: {
        variantId,
        date,
        slots,
        summary: {
          totalAvailable,
          slotCount: slots.length,
          isFullyBooked,
          hasAnyEnabled,
        },
      },
    });
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not fetch availability' } },
      { status: 500 },
    );
  }
}