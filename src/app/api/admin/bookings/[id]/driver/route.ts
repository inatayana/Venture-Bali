import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, hasRole, verifySessionToken } from '@/lib/adminSession';

const assignDriverSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(25).regex(/^[\d+()\-\s]+$/u, 'Invalid phone number'),
  vehicleModel: z.string().trim().min(2).max(60),
  plateNumber: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .transform((value) => value.toUpperCase()),
});

/**
 * Record the driver assignment for a transfer booking.
 * Only paid, not-yet-closed transfer bookings can carry a driver.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || !hasRole(session, 'ADMIN')) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Operator access required' } },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const parsed = assignDriverSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        },
        { status: 400 },
      );
    }
    const { name, phone, vehicleModel, plateNumber } = parsed.data;

    const booking = await prisma.booking.findUnique({ where: { id }, select: { paymentStatus: true, lifecycleStatus: true, fulfillmentMode: true } });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }
    if (booking.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Only paid bookings can be assigned a driver' } },
        { status: 409 },
      );
    }
    if (booking.fulfillmentMode === 'SELF_DRIVE') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Driver assignment only applies to transfer bookings' } },
        { status: 409 },
      );
    }
    if (!['CONFIRMED', 'DRIVER_ASSIGNED', 'CHECKED_IN'].includes(booking.lifecycleStatus)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'This job order is already closed' } },
        { status: 409 },
      );
    }

    // NOTE: casts are removed once `prisma generate` picks up the new enum value
    // and the driverInfo column (blocked on node processes holding the client DLL).
    await prisma.booking.update({
      where: { id },
      data: {
        lifecycleStatus: 'DRIVER_ASSIGNED' as never,
        driverInfo: {
          name,
          phone: phone.replace(/\s/g, ''),
          vehicle_model: vehicleModel,
          plate_number: plateNumber,
          assigned_at: new Date().toISOString(),
        } as never,
      },
    });

    revalidatePath('/admin/operations');
    revalidatePath('/admin/bookings');
    revalidatePath('/my/bookings');

    return NextResponse.json({ success: true, data: { id } }, { status: 200 });
  } catch (error) {
    console.error('Driver assignment failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not assign the driver' } },
      { status: 500 },
    );
  }
}
