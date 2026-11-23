import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant';

/**
 * Get single venture by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
