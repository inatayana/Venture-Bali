/**
 * BaliWild — Field Ops read/write service (SERVER ONLY)
 * -------------------------------------------------------
 * Every return value goes through a DTO allowlist. Supplier identity, contract
 * cost, payment amounts, refunds and commissions are never selected or returned.
 */

import type { BookingLifecycle } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { type FieldOpsUser, isSupervisor } from './opsGuard';
import { toParticipantDto } from './waiverService';

export type OpsAction = 'DRIVER_ASSIGNED' | 'CHECKED_IN' | 'NO_SHOW' | 'COMPLETED';

const ASSIGNABLE: BookingLifecycle[] = [
  'CONFIRMED',
  'DRIVER_ASSIGNED',
  'CHECKED_IN',
  'COMPLETED',
  'NO_SHOW',
];

export class OpsServiceError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'INVALID_STATE' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
  }
}

function manifestInclude() {
  return {
    customer: { select: { name: true } },
    slotTime: { select: { time: true } },
    pickupZone: { select: { name: true } },
    variant: { select: { venture: { select: { title: true } } } },
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
  } as const;
}

async function loadRows(user: FieldOpsUser, date: string) {
  return prisma.booking.findMany({
    where: {
      tenantId: user.tenantId,
      bookingDate: date,
      lifecycleStatus: { in: ASSIGNABLE },
      ...(isSupervisor(user) ? {} : { fieldOpsUserId: user.id }),
    },
    orderBy: [{ slotTime: { time: 'asc' } }, { bookingCode: 'asc' }],
    include: manifestInclude(),
  });
}

export async function listManifest(user: FieldOpsUser, date: string) {
  const rows = await loadRows(user, date);
  return rows.map((row) => ({
    id: row.id,
    bookingCode: row.bookingCode,
    guestName: row.customer.name,
    ventureTitle: row.variant.venture.title,
    paxCount: row.paxCount,
    pickupTime: row.slotTime?.time ?? null,
    pickupPoint: row.isTba ? 'TBA — confirm with guest' : (row.hotelAddress ?? row.pickupZone?.name ?? null),
    lifecycleStatus: row.lifecycleStatus,
    participants: row.participants.map(toParticipantDto),
  }));
}

/** Allowed lifecycle transitions. Repeat calls are no-ops (idempotent). */
function nextStatus(current: BookingLifecycle, action: OpsAction): BookingLifecycle {
  if (action === 'DRIVER_ASSIGNED') {
    if (current === 'CONFIRMED') return 'DRIVER_ASSIGNED';
    if (current === 'DRIVER_ASSIGNED') return current;
    throw new OpsServiceError('INVALID_STATE', 'Booking cannot be assigned from this state');
  }
  if (action === 'CHECKED_IN') {
    if (current === 'CONFIRMED' || current === 'DRIVER_ASSIGNED' || current === 'CHECKED_IN') return 'CHECKED_IN';
    if (current === 'COMPLETED') return current;
    throw new OpsServiceError('INVALID_STATE', 'Booking cannot be checked in from this state');
  }
  if (action === 'NO_SHOW') {
    if (current === 'NO_SHOW') return current;
    if (current === 'CONFIRMED' || current === 'DRIVER_ASSIGNED' || current === 'CHECKED_IN') return 'NO_SHOW';
    throw new OpsServiceError('INVALID_STATE', 'Booking cannot be marked no-show from this state');
  }
  if (current === 'CHECKED_IN' || current === 'COMPLETED') return 'COMPLETED';
  throw new OpsServiceError('INVALID_STATE', 'Only checked-in bookings can be completed');
}

export async function applyCheckIn(input: {
  user: FieldOpsUser;
  bookingId: string;
  participantId?: string;
  action: OpsAction;
}) {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, tenantId: input.user.tenantId },
    select: {
      id: true,
      bookingCode: true,
      customerId: true,
      lifecycleStatus: true,
      fieldOpsUserId: true,
      paymentStatus: true,
      cancelledAt: true,
    },
  });
  if (!booking) throw new OpsServiceError('NOT_FOUND', 'Booking not found');

  if (!isSupervisor(input.user) && booking.fieldOpsUserId && booking.fieldOpsUserId !== input.user.id) {
    throw new OpsServiceError('FORBIDDEN', 'This booking is assigned to another staff member');
  }
  if (booking.cancelledAt || booking.paymentStatus !== 'PAID') {
    throw new OpsServiceError('INVALID_STATE', 'Booking is not active');
  }

  const status = nextStatus(booking.lifecycleStatus, input.action);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        lifecycleStatus: status,
        ...(input.action === 'DRIVER_ASSIGNED' && !booking.fieldOpsUserId
          ? { fieldOpsUserId: input.user.id }
          : {}),
      },
    });

    if (input.participantId) {
      await tx.bookingParticipant.updateMany({
        where: { id: input.participantId, bookingId: booking.id, tenantId: input.user.tenantId },
        data: input.action === 'CHECKED_IN' && status === 'CHECKED_IN' ? { checkedInAt: now } : {},
      });
    }

    if (status === 'CHECKED_IN' && booking.lifecycleStatus !== 'CHECKED_IN') {
      await tx.voucher.updateMany({
        where: { bookingId: booking.id, status: 'ACTIVE' },
        data: { status: 'REDEEMED', redeemedAt: now, redeemedBy: input.user.id },
      });
    }
  });

  const updated = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: manifestInclude(),
  });
  if (!updated) throw new OpsServiceError('NOT_FOUND', 'Booking not found');

  return {
    id: updated.id,
    bookingCode: updated.bookingCode,
    lifecycleStatus: updated.lifecycleStatus,
    participants: updated.participants.map(toParticipantDto),
  };
}

export type ManifestBooking = Awaited<ReturnType<typeof listManifest>>[number];
