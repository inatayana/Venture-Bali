import { prisma } from '@/lib/prisma';
import {
  isWaiverComplete,
  saveParticipants,
  toParticipantDto,
  validateGuardian,
} from './waiverService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    bookingParticipant: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockedTransaction = prisma.$transaction as jest.Mock;
const mockedFindMany = prisma.bookingParticipant.findMany as jest.Mock;
const mockedDelete = prisma.bookingParticipant.deleteMany as jest.Mock;
const mockedUpdate = prisma.bookingParticipant.update as jest.Mock;
const mockedCreate = prisma.bookingParticipant.create as jest.Mock;

const signed = {
  id: 'p1',
  fullName: 'Guest One',
  participantType: 'ADULT' as const,
  waiverVersion: 'v3',
  waiverSignedAt: new Date(),
  waiverDigitalSignature: 'Guest One',
  guardianName: null,
  guardianConsentAt: null,
  checkedInAt: null,
};

describe('waiverService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindMany.mockResolvedValue([]);
    mockedTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        bookingParticipant: {
          deleteMany: mockedDelete,
          update: mockedUpdate,
          create: mockedCreate,
        },
      }),
    );
  });

  it('requires guardian consent for minors only', () => {
    expect(isWaiverComplete(signed)).toBe(true);
    expect(isWaiverComplete({ ...signed, participantType: 'KID' })).toBe(false);
    expect(
      isWaiverComplete({ ...signed, participantType: 'KID', guardianName: 'Parent', guardianConsentAt: new Date() }),
    ).toBe(true);
    expect(validateGuardian({ fullName: 'Child', participantType: 'INFANT' })).toMatch(/guardian/i);
    expect(validateGuardian({ fullName: 'Adult', participantType: 'ADULT' })).toBeNull();
  });

  it('emits a minimal DTO without medical notes or guardian identity', () => {
    const dto = toParticipantDto({
      id: 'p1',
      fullName: 'Guest One',
      participantType: 'ADULT',
      waiverVersion: 'v3',
      waiverSignedAt: new Date(),
      waiverDigitalSignature: 'Guest One',
      guardianName: 'Secret Parent',
      guardianConsentAt: null,
      checkedInAt: null,
    });

    expect(dto).toMatchObject({ id: 'p1', fullName: 'Guest One', waiverComplete: true });
    expect(dto).not.toHaveProperty('medicalNotes');
    expect(dto).not.toHaveProperty('guardianName');
    expect(JSON.stringify(dto)).not.toContain('severe allergy');
  });

  it('replaces the participant set scoped by booking and tenant', async () => {
    await saveParticipants({
      bookingId: 'booking-1',
      tenantId: 'tenant-001',
      participants: [
        { id: 'p1', fullName: 'Guest One', participantType: 'ADULT' },
        { fullName: 'Child One', participantType: 'KID' },
      ],
    });

    expect(mockedDelete).toHaveBeenCalledWith({
      where: { bookingId: 'booking-1', tenantId: 'tenant-001', id: { notIn: ['p1'] } },
    });
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', bookingId: 'booking-1', tenantId: 'tenant-001' } }),
    );
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-001', bookingId: 'booking-1' }) }),
    );
  });
});
