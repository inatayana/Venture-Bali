/**
 * BaliWild — per-participant waiver records (SERVER ONLY)
 * ---------------------------------------------------------
 * DTOs are explicit allowlists: Field Ops never receives medical/free-text PII
 * beyond the waiver-completion flag, and never receives supplier data.
 */

import { prisma } from '@/lib/prisma';
import type { ParticipantType } from '@/generated/prisma';

export interface ParticipantInput {
  id?: string;
  fullName: string;
  participantType: ParticipantType;
  dateOfBirth?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  waiverVersion?: string | null;
  waiverSignedAt?: string | null;
  waiverDigitalSignature?: string | null;
  waiverSignatureMethod?: string | null;
  waiverIpAddress?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  dietaryNotes?: string | null;
  medicalNotes?: string | null;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianConsentAt?: string | null;
}

export function isMinor(type: ParticipantType): boolean {
  return type === 'KID' || type === 'INFANT';
}

export interface WaiverDtoInput {
  id: string;
  fullName: string;
  participantType: ParticipantType;
  waiverSignedAt: Date | null;
  waiverDigitalSignature: string | null;
  waiverVersion: string | null;
  guardianName: string | null;
  guardianConsentAt: Date | null;
  checkedInAt: Date | null;
}

export function isWaiverComplete(participant: WaiverDtoInput): boolean {
  const signed =
    participant.waiverSignedAt !== null &&
    Boolean(participant.waiverDigitalSignature) &&
    Boolean(participant.waiverVersion);
  if (!signed) return false;
  if (!isMinor(participant.participantType)) return true;
  return Boolean(participant.guardianName) && participant.guardianConsentAt !== null;
}

export function validateGuardian(input: ParticipantInput): string | null {
  if (!isMinor(input.participantType)) return null;
  if (!input.guardianName?.trim() || !input.guardianRelationship?.trim() || !input.guardianConsentAt) {
    return 'A guardian name, relationship and consent are required for minors';
  }
  return null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listParticipants(bookingId: string, tenantId: string) {
  return prisma.bookingParticipant.findMany({
    where: { bookingId, tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

/** Replace the participant set for a booking, preserving ids for existing rows. */
export async function saveParticipants(input: {
  bookingId: string;
  tenantId: string;
  participants: ParticipantInput[];
}) {
  const keepIds = input.participants.flatMap((item) => (item.id ? [item.id] : []));

  await prisma.$transaction(async (tx) => {
    await tx.bookingParticipant.deleteMany({
      where: { bookingId: input.bookingId, tenantId: input.tenantId, id: { notIn: keepIds } },
    });

    for (const item of input.participants) {
      const data = {
        fullName: item.fullName.trim(),
        participantType: item.participantType,
        dateOfBirth: toDate(item.dateOfBirth),
        email: item.email?.trim() || null,
        whatsapp: item.whatsapp?.trim() || null,
        waiverVersion: item.waiverVersion?.trim() || null,
        waiverSignedAt: toDate(item.waiverSignedAt),
        waiverDigitalSignature: item.waiverDigitalSignature?.trim() || null,
        waiverSignatureMethod: item.waiverSignatureMethod?.trim() || null,
        waiverIpAddress: item.waiverIpAddress?.trim() || null,
        emergencyContactName: item.emergencyContactName?.trim() || null,
        emergencyContactPhone: item.emergencyContactPhone?.trim() || null,
        dietaryNotes: item.dietaryNotes?.trim() || null,
        medicalNotes: item.medicalNotes?.trim() || null,
        guardianName: item.guardianName?.trim() || null,
        guardianRelationship: item.guardianRelationship?.trim() || null,
        guardianConsentAt: toDate(item.guardianConsentAt),
      };

      if (item.id) {
        await tx.bookingParticipant.update({
          where: { id: item.id, bookingId: input.bookingId, tenantId: input.tenantId },
          data,
        });
      } else {
        await tx.bookingParticipant.create({
          data: { ...data, bookingId: input.bookingId, tenantId: input.tenantId },
        });
      }
    }
  });

  return listParticipants(input.bookingId, input.tenantId);
}

/** Lazy-creates one draft row per pax so /trips can show a signing modal. */
export async function ensureDraftParticipants(input: {
  bookingId: string;
  tenantId: string;
  defaultName: string;
  adults: number;
  kids: number;
  youth: number;
  infants: number;
}) {
  const existing = await listParticipants(input.bookingId, input.tenantId);
  if (existing.length > 0) return existing;

  const drafts: ParticipantInput[] = [];
  const append = (type: ParticipantType, count: number, prefix: string) => {
    for (let index = 0; index < count; index += 1) {
      drafts.push({
        fullName: index === 0 && type === 'ADULT' ? input.defaultName : `${prefix} ${index + 1}`,
        participantType: type,
      });
    }
  };
  append('ADULT', Math.max(1, input.adults), 'Guest');
  append('YOUTH', input.youth, 'Youth');
  append('KID', input.kids, 'Child');
  append('INFANT', input.infants, 'Infant');

  return saveParticipants({ bookingId: input.bookingId, tenantId: input.tenantId, participants: drafts });
}

/** Field Ops / Customer safe DTO. No medical notes, no supplier/finance data. */
export function toParticipantDto(participant: WaiverDtoInput) {
  return {
    id: participant.id,
    fullName: participant.fullName,
    participantType: participant.participantType,
    isMinor: isMinor(participant.participantType),
    waiverComplete: isWaiverComplete(participant),
    waiverSignedAt: participant.waiverSignedAt?.toISOString() ?? null,
    checkedInAt: participant.checkedInAt?.toISOString() ?? null,
  };
}
