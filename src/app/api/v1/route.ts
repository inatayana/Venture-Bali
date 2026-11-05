/**
 * API v1 Route Handlers
 * 
 * This module provides the route handlers for API v1 endpoints.
 * Each endpoint follows OpenAPI 3.1 specification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant';

/**
 * Health check endpoint
 */
export async function GET_health() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * List ventures with filtering and pagination
 */
export async function GET_ventures(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;
    const isAvailable = searchParams.get('isAvailable') === 'true' ? true : 
                        searchParams.get('isAvailable') === 'false' ? false : undefined;
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'recommended';

    const where: { tenantId: string; category?: string; difficulty?: 'EASY' | 'MODERATE' | 'CHALLENGING'; isAvailable?: boolean; priceIdr?: { gte?: number; lte?: number }; OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; shortDescription?: { contains: string; mode: 'insensitive' } }> } = {
      tenantId: tenant.id,
    };

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty as 'EASY' | 'MODERATE' | 'CHALLENGING';
    if (isAvailable !== undefined) where.isAvailable = isAvailable;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceIdr = {};
      if (minPrice !== undefined) where.priceIdr.gte = minPrice;
      if (maxPrice !== undefined) where.priceIdr.lte = maxPrice;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: { createdAt?: 'desc' | 'asc'; bookedThisMonth?: 'desc'; priceIdr?: 'asc' | 'desc'; rating?: 'desc'; durationHours?: 'asc' } = { createdAt: 'desc' };
    switch (sort) {
      case 'popular':
        orderBy = { bookedThisMonth: 'desc' };
        break;
      case 'price-low':
        orderBy = { priceIdr: 'asc' };
        break;
      case 'price-high':
        orderBy = { priceIdr: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'duration':
        orderBy = { durationHours: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [ventures, total] = await Promise.all([
      prisma.venture.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          variants: {
            select: {
              id: true,
              title: true,
              fulfillmentMode: true,
              priceTiers: true,
              promoPriceIdr: true,
            },
          },
        },
      }),
      prisma.venture.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: ventures,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/ventures error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ventures' } },
      { status: 500 }
    );
  }
}

/**
 * Get single venture by ID
 */
export async function GET_venture_by_id(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext();
    const { id } = await params;

    const venture = await prisma.venture.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        variants: {
          include: {
            priceTiers: true,
            slotTimes: { where: { isAvailable: true }, orderBy: { time: 'asc' } },
            addons: true,
            pickupZone: true,
            vendor: { select: { id: true, name: true, activityType: true } },
          },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { customer: { select: { name: true } } },
        },
        articles: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!venture) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Venture not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: venture });
  } catch (error) {
    console.error('GET /api/v1/ventures/:id error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch venture' } },
      { status: 500 }
    );
  }
}

/**
 * Create booking
 */
export async function POST_bookings(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['variantId', 'bookingDate', 'slotTimeId', 'fulfillmentMode', 'paxCount', 'customer'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Missing required field: ${field}` } },
          { status: 400 }
        );
      }
    }

    // Verify variant exists and belongs to tenant
    const variant = await prisma.variant.findFirst({
      where: { id: body.variantId, venture: { tenantId: tenant.id } },
      include: { priceTiers: true, slotTimes: true },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 }
      );
    }

    // Verify slot exists and is available
    const slot = variant.slotTimes.find(s => s.id === body.slotTimeId && s.isAvailable);
    if (!slot) {
      return NextResponse.json(
        { success: false, error: { code: 'SLOT_UNAVAILABLE', message: 'Selected time slot is not available' } },
        { status: 409 }
      );
    }

    // Check capacity
    if (slot.currentBookings + body.paxCount > slot.maxCapacity) {
      return NextResponse.json(
        { success: false, error: { code: 'CAPACITY_EXCEEDED', message: 'Not enough capacity for this booking' } },
        { status: 409 }
      );
    }

    // Calculate price
    const priceTier = variant.priceTiers.find(t => t.minPax <= body.paxCount && t.maxPax >= body.paxCount);
    if (!priceTier) {
      return NextResponse.json(
        { success: false, error: { code: 'PRICE_TIER_NOT_FOUND', message: 'No pricing tier matches the passenger count' } },
        { status: 400 }
      );
    }

    const basePrice = variant.promoPriceIdr && variant.promoPriceIdr < priceTier.pricePerPax
      ? variant.promoPriceIdr
      : priceTier.pricePerPax;
    const totalPrice = basePrice * body.paxCount;

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: { email: body.customer.email, bookings: { some: { variant: { venture: { tenantId: tenant.id } } } } },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          ...body.customer,
          tenantId: tenant.id,
        },
      });
    }

    // Generate booking code
    const bookingCode = `BW-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        variantId: body.variantId,
        customerId: customer.id,
        bookingDate: body.bookingDate,
        slotTimeId: body.slotTimeId,
        fulfillmentMode: body.fulfillmentMode,
        pickupZoneId: body.pickupZoneId,
        vehicleClassId: body.vehicleClassId,
        hotelAddress: body.hotelAddress,
        paxCount: body.paxCount,
        adultsCount: body.adultsCount || body.paxCount,
        kidsCount: body.kidsCount || 0,
        youthCount: body.youthCount || 0,
        totalPrice,
        discountIdr: 0,
        paymentStatus: 'PENDING',
        lifecycleStatus: 'AWAITING_PAYMENT',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min hold
        tenantId: tenant.id,
        selectedAddons: body.selectedAddons || [],
      },
    });

    // Increment slot bookings
    await prisma.slotTime.update({
      where: { id: body.slotTimeId },
      data: { currentBookings: { increment: body.paxCount } },
    });

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        midtransOrderId: `ORDER-${booking.id}-${Date.now()}`,
        grossAmount: totalPrice,
        status: 'PENDING',
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { booking, payment },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/bookings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking' } },
      { status: 500 }
    );
  }
}

/**
 * Get booking by ID
 */
export async function GET_booking_by_id(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

/**
 * Create review
 */
export async function POST_reviews(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const body = await request.json();

    // Validate required fields
    if (!body.ventureId || !body.rating || !body.comment) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Verify venture exists
    const venture = await prisma.venture.findFirst({
      where: { id: body.ventureId, tenantId: tenant.id },
    });

    if (!venture) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Venture not found' } },
        { status: 404 }
      );
    }

    // If bookingId provided, verify it belongs to customer and venture
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

    // Create review
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

/**
 * List reviews for a venture
 */
export async function GET_reviews(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const searchParams = request.nextUrl.searchParams;
    
    const ventureId = searchParams.get('ventureId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const isApproved = searchParams.get('isApproved') === 'true' ? true :
                       searchParams.get('isApproved') === 'false' ? false : undefined;

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