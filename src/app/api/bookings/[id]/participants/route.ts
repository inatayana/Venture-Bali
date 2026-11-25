import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { WAIVER_VERSION } from '@/lib/legal';
import { authorizeBookingRead } from '@/lib/bookingAccess';
import { prisma } from '@/lib/prisma';
import {
  ensureDraftParticipants,
  saveParticipants,
  toParticipantDto,
  validateGuardian,
  type ParticipantInput,
} from '@/lib/waiverService';

export const dynamic = 'force-dynamic';

const participantSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().trim().min(2).max(120),
  participantType: z.enum(['ADULT', 'YOUTH', 'KID', 'INFANT']),
  dateOfBirth: z.string().datetime().nullable().optional(),
  email: z.string().trim().email().max(320).nullable().optional(),
  whatsapp: z.string().trim().max(32).nullable().optional(),
  waiverVersion: z.string().max(32).nullable().optional(),
  waiverSignedAt: z.string().datetime().nullable().optional(),
  waiverDigitalSignature: z.string().min(1).max(200).nullable().optional(),
  waiverSignatureMethod: z.string().max(32).nullable().optional(),
  waiverIpAddress: z.string().max(64).nullable().optional(),
  emergencyContactName: z.string().trim().max(120).nullable().optional(),
  emergencyContactPhone: z.string().trim().max(32).nullable().optional(),
  dietaryNotes: z.string().max(500).nullable().optional(),
  medicalNotes: z.string().max(500).nullable().optional(),
  guardianName: z.string().trim().max(120).nullable().optional(),
  guardianRelationship: z.string().trim().max(60).nullable().optional(),
  guardianConsentAt: z.string().datetime().nullable().optional(),
});

const bodySchema = z.object({ participants: z.array(participantSchema).min(1).max(20) });

async function loadBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      customerId: true,
      tenantId: true,
      adultsCount: true,
      kidsCount: true,
      youthCount: true,
      infantCount: true,
      customer: { select: { name: true } },
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await loadBooking(id);
  if (!booking || !(await authorizeBookingRead(request, booking))) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign-in or a valid link is required' } },
      { status: 401 },
    );
  }

  try {
    const participants = await ensureDraftParticipants({
      bookingId: booking.id,
      tenantId: booking.tenantId,
      defaultName: booking.customer.name,
      adults: booking.adultsCount,
      kids: booking.kidsCount,
      youth: booking.youthCount,
      infants: booking.infantCount,
    });
    return NextResponse.json({
      success: true,
      data: { waiverVersion: WAIVER_VERSION, participants: participants.map(toParticipantDto) },
      error: null,
    });
  } catch {
    console.error('Participant lookup failed');
    return NextResponse.json(
      { success: false, error: { code: 'LOOKUP_FAILED', message: 'Could not load participants' } },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await loadBooking(id);
  if (!booking || !(await authorizeBookingRead(request, booking))) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign-in or a valid link is required' } },
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Check participant details' } },
      { status: 400 },
    );
  }

  const participants = parsed.data.participants as ParticipantInput[];
  for (const participant of participants) {
    const guardianError = validateGuardian(participant);
    if (guardianError) {
      return NextResponse.json(
        { success: false, error: { code: 'GUARDIAN_REQUIRED', message: guardianError } },
        { status: 400 },
      );
    }
  }

  try {
    const saved = await saveParticipants({
      bookingId: booking.id,
      tenantId: booking.tenantId,
      participants,
    });
    return NextResponse.json({
      success: true,
      data: { participants: saved.map(toParticipantDto) },
      error: null,
    });
  } catch {
    console.error('Participant save failed');
    return NextResponse.json(
      { success: false, error: { code: 'SAVE_FAILED', message: 'Could not save participants' } },
      { status: 500 },
    );
  }
}
