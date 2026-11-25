import { NextResponse, type NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { authorizeBookingRead } from '@/lib/bookingAccess';
import { createCheckInToken } from '@/lib/checkInToken';
import { prisma } from '@/lib/prisma';
import { toParticipantDto } from '@/lib/waiverService';

export const dynamic = 'force-dynamic';

/** Signed, expiring QR boarding pass. Never includes supplier or finance data. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        bookingCode: true,
        bookingDate: true,
        lifecycleStatus: true,
        slotTime: { select: { time: true } },
        participants: {
          select: {
            id: true,
            fullName: true,
            participantType: true,
            waiverSignedAt: true,
            waiverDigitalSignature: true,
            waiverVersion: true,
            guardianName: true,
            guardianConsentAt: true,
            checkedInAt: true,
          },
        },
      },
    });

    if (!booking || !(await authorizeBookingRead(request, booking))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign-in or a valid link is required' } },
        { status: 401 },
      );
    }

    const departure = new Date(`${booking.bookingDate}T${booking.slotTime?.time ?? '00:00'}:00+08:00`);
    const expiresAt = new Date(
      Number.isNaN(departure.getTime()) ? Date.now() + 12 * 60 * 60_000 : departure.getTime() + 12 * 60 * 60_000,
    );
    const token = createCheckInToken({ bookingId: booking.id, expiresAt });
    // Raster generated in Node; the browser only receives an image data URL.
    const dataUrl = token ? await QRCode.toDataURL(token, { width: 240, margin: 1 }) : null;
    return NextResponse.json({
      success: true,
      data: {
        token,
        dataUrl,
        bookingCode: booking.bookingCode,
        expiresAt: expiresAt.toISOString(),
        lifecycleStatus: booking.lifecycleStatus,
        participants: booking.participants.map(toParticipantDto),
      },
      error: null,
    });
  } catch {
    console.error('Boarding pass generation failed');
    return NextResponse.json(
      { success: false, error: { code: 'QR_FAILED', message: 'Could not create a boarding pass' } },
      { status: 500 },
    );
  }
}
