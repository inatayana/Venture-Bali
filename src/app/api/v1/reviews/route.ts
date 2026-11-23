import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant';

/**
 * List reviews for a venture
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const searchParams = request.nextUrl.searchParams;

    const ventureId = searchParams.get('ventureId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const isApproved = searchParams.get('isApproved') === 'true' ? true : searchParams.get('isApproved') === 'false' ? false : undefined;

    const where: { tenantId: string; ventureId?: string; isApproved?: boolean } = { tenantId: tenant.id };
    if (ventureId) where.ventureId = ventureId;
    if (isApproved !== undefined) where.isApproved = isApproved;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { customer: { select: { name: true } } },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: reviews,
        pagination: {
          page: 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/reviews error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' } },
      { status: 500 }
    );
  }
}

/**
 * Create review
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const body = await request.json();

    if (!body.ventureId || !body.rating || !body.comment) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const venture = await prisma.venture.findFirst({
      where: { id: body.ventureId, tenantId: tenant.id },
    });

    if (!venture) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Venture not found' } },
        { status: 404 }
      );
    }

    let customerId: string | undefined;
    if (body.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: body.bookingId, variant: { ventureId: body.ventureId }, tenantId: tenant.id },
      });
      if (!booking) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found or does not match venture' } },
          { status: 404 }
        );
      }
      customerId = booking.customerId;
    }

    const review = await prisma.review.create({
      data: {
        ventureId: body.ventureId,
        customerId,
        bookingId: body.bookingId,
        rating: body.rating,
        comment: body.comment,
        guestName: body.guestName,
        guestLocation: body.guestLocation,
        photos: body.photos || [],
        source: body.bookingId ? 'VERIFIED_BOOKING' : 'FOUNDING_GUEST',
        isApproved: false, // Requires moderation
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/reviews error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create review' } },
      { status: 500 }
    );
  }
}
