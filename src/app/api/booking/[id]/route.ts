import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQRCodeDataURL } from '@/lib/voucher';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // The QR is only rendered for a settled booking that already has a voucher.
    const voucher = booking.vouchers[0] ?? null;
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
