import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, hasRole, verifySessionToken } from '@/lib/adminSession';

/**
 * Mark a guest as checked in. Used by the venue flow: an operator scans
 * the guest's voucher QR (which opens /voucher/verify/[code]) and taps
 * "Check-in this guest". Redeems the voucher and locks the booking.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || !hasRole(session, 'ADMIN')) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Operator access required' } },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: { paymentStatus: true, lifecycleStatus: true },
      });
      if (!booking) return { kind: 'not_found' as const };
      if (booking.paymentStatus !== 'PAID') {
        return { kind: 'invalid' as const, message: 'Only paid bookings can be checked in' };
      }
      // Idempotent: checking in twice (or after completion) reports ok.
      if (booking.lifecycleStatus === 'COMPLETED') return { kind: 'ok' as const };

      await tx.booking.update({
        where: { id },
        data: { lifecycleStatus: 'CHECKED_IN' as never },
      });
      await tx.voucher.updateMany({
        where: { bookingId: id, status: 'ACTIVE' },
        data: { status: 'REDEEMED', redeemedAt: new Date(), redeemedBy: session.email },
      });
      return { kind: 'ok' as const };
    });

    revalidatePath('/admin/operations');
    revalidatePath('/admin/bookings');
    revalidatePath('/my/bookings');

    if (result.kind === 'not_found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }
    if (result.kind === 'invalid') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: result.message } },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true, data: { id } }, { status: 200 });
  } catch (error) {
    console.error('Check-in failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not check in the guest' } },
      { status: 500 },
    );
  }
}
