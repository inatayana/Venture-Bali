import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyBookingViewToken } from '@/lib/customerLink';

interface WaiverPayload {
  digitalSignature: string;
  signatureMethod: 'draw' | 'type';
  healthDeclaration: {
    noAlcohol: boolean;
    noDrugs: boolean;
    noImpairingMeds: boolean;
    disclosedConditions: string[];
    mobilityOk: boolean;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  idVerified: boolean;
  photoId?: string;
  signedBy: string;
  waiverVersion: string;
}

/**
 * Submit waiver for a booking.
 * Accepts X-Booking-Access header or access query param.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const presented =
      request.headers.get('X-Booking-Access') ??
      request.nextUrl.searchParams.get('access');

    const payload: WaiverPayload = await request.json();

    // Verify access
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        paymentStatus: true,
        lifecycleStatus: true,
        waiverAcceptedAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    if (!verifyBookingViewToken(presented, booking.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Invalid or missing access token',
          },
        },
        { status: 401 }
      );
    }

    // Check if already paid/confirmed
    if (booking.paymentStatus !== 'PAID' || booking.lifecycleStatus !== 'CONFIRMED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Waiver can only be signed for confirmed, paid bookings',
          },
        },
        { status: 400 }
      );
    }

    // Check if already signed
    if (booking.waiverAcceptedAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SIGNED',
            message: 'Waiver has already been accepted for this booking',
          },
        },
        { status: 400 }
      );
    }

    // Update booking with waiver data
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        waiverAcceptedAt: new Date(),
        waiverVersion: payload.waiverVersion,
        waiverDigitalSignature: payload.digitalSignature,
        waiverSignatureMethod: payload.signatureMethod,
        waiverHealthDeclaration: payload.healthDeclaration as any,
        waiverEmergencyContact: payload.emergencyContact as any,
        waiverIdVerified: payload.idVerified,
        waiverPhotoId: payload.photoId,
        waiverSignedAt: new Date(),
        waiverSignedBy: payload.signedBy,
        waiverIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        waiverUserAgent: request.headers.get('user-agent'),
      },
    });

    // TODO: Send vendor copy of waiver (email/PDF)
    // await sendWaiverToVendor(booking.id, payload);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Waiver accepted successfully',
        waiverAcceptedAt: updated.waiverAcceptedAt,
        waiverVersion: updated.waiverVersion,
      },
    });
  } catch (error) {
    console.error('Waiver submission error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit waiver' } },
      { status: 500 }
    );
  }
}