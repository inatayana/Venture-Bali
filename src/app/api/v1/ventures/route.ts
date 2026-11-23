import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant';

/**
 * List ventures with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;
    const isAvailable = searchParams.get('isAvailable') === 'true' ? true : searchParams.get('isAvailable') === 'false' ? false : undefined;
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'recommended';

    const where: {
      tenantId: string;
      category?: string;
      difficulty?: 'EASY' | 'MODERATE' | 'CHALLENGING';
      isAvailable?: boolean;
      priceIdr?: { gte?: number; lte?: number };
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; shortDescription?: { contains: string; mode: 'insensitive' } }>;
    } = {
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
