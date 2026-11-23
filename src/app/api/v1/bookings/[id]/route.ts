import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant';

/**
 * Get booking by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getTenantContext();
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        variant: { include: { venture: true, priceTiers: true } },
        customer: true,
        slotTime: true,
        pickupZone: true,
        vehicleClass: true,
        payment: true,
        vouchers: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('GET /api/v1/bookings/:id error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch booking' } },
      { status: 500 }
    );
  }
}
