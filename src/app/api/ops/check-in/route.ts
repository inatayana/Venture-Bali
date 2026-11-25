import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { isBookingCode } from '@/lib/bookingCode';
import { verifyCheckInToken } from '@/lib/checkInToken';
import { requireFieldOps } from '@/lib/opsGuard';
import { applyCheckIn, OpsServiceError, type OpsAction } from '@/lib/opsService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const checkInSchema = z.object({
  token: z.string().min(1).optional(),
  bookingCode: z.string().min(1).optional(),
  participantId: z.string().optional(),
  action: z.enum(['DRIVER_ASSIGNED', 'CHECKED_IN', 'NO_SHOW', 'COMPLETED']).default('CHECKED_IN'),
});

export async function POST(request: NextRequest) {
  const user = await requireFieldOps();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Field Ops sign-in required' } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 },
    );
  }

  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.token && !parsed.data.bookingCode)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Scan a QR code or enter a booking code' } },
      { status: 400 },
    );
  }

  let bookingId: string | null = null;
  let participantId = parsed.data.participantId;

  if (parsed.data.token) {
    const payload = verifyCheckInToken(parsed.data.token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_QR', message: 'QR code is invalid or expired' } },
        { status: 400 },
      );
    }
    bookingId = payload.bookingId;
    participantId = participantId ?? payload.participantId;
  } else {
    const code = parsed.data.bookingCode?.trim().toUpperCase();
    if (!code || !isBookingCode(code)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Enter a BW-2026-XXXX or legacy BK code' } },
        { status: 400 },
      );
    }
    const booking = await prisma.booking.findFirst({
      where: { bookingCode: code, tenantId: user.tenantId },
      select: { id: true },
    });
    bookingId = booking?.id ?? null;
  }

  if (!bookingId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
      { status: 404 },
    );
  }

  try {
    const result = await applyCheckIn({
      user,
      bookingId,
      ...(participantId ? { participantId } : {}),
      action: parsed.data.action as OpsAction,
    });
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    if (error instanceof OpsServiceError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 409;
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }
    console.error('Field Ops check-in failed');
    return NextResponse.json(
      { success: false, error: { code: 'CHECKIN_FAILED', message: 'Could not update the booking' } },
      { status: 500 },
    );
  }
}
