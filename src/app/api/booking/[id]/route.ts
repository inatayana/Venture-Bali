import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQRCodeDataURL } from '@/lib/voucher';
import { verifyBookingReadAccess } from '@/lib/customerLink';

/**
 * Booking detail (contains PII plus voucher QR material). Read is restricted to
 * the holder of the booking-scoped `access`/`token` key issued at booking
 * creation, or an account magic link owned by the same customer.
 *
 * Accepted in priority order: `access` query param, `token` query param
 * (account link), or the `X-Booking-Access` header.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const presented =
      request.nextUrl.searchParams.get('access') ??
      request.nextUrl.searchParams.get('token') ??
      request.headers.get('X-Booking-Access');

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        variant: { include: { priceTiers: true, slotTimes: true, addons: true } },
        slotTime: true,
        pickupZone: true,
        vehicleClass: true,
        vouchers: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }

    if (!verifyBookingReadAccess(presented, booking)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'This booking link is missing or has expired its access key.',
          },
        },
        { status: 401 },
      );
    }

    // The QR is only rendered for a settled booking that already has a voucher.
    const voucher = booking.vouchers ?? null;
    const qrCodeDataUrl =
      booking.paymentStatus === 'PAID' && voucher
        ? await generateQRCodeDataURL(voucher.qrCodeData, { width: 384 })
        : null;

    return NextResponse.json({
      success: true,
      data: { ...booking, voucher, qrCodeDataUrl },
    });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch booking' } },
      { status: 500 },
    );
  }
}
