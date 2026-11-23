import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { getTenantContext } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getBookableSlots } from '@/lib/api/availability';

export const dynamic = 'force-dynamic';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/v1/availability
 *
 * Public availability lookup: which slots can a party of `paxCount` still book
 * for `ventureId` on `date`? Used by the public booking flow before a hold is created.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(`api-v1-availability:${clientIp(request)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many availability requests. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const tenant = await getTenantContext();
    const searchParams = request.nextUrl.searchParams;

    const ventureId = searchParams.get('ventureId');
    const variantId = searchParams.get('variantId');
    const date = searchParams.get('date');
    const fulfillmentModeParam = searchParams.get('fulfillmentMode');
    const paxCountParam = Number(searchParams.get('paxCount') ?? '1');

    if (!ventureId || !date) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ventureId and date are required' } },
        { status: 400 }
      );
    }
    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'date must be YYYY-MM-DD' } },
        { status: 400 }
      );
    }
    if (!['SELF_DRIVE', 'SHARED_TRANSFER', 'PRIVATE_TRANSFER'].includes(fulfillmentModeParam ?? '')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'fulfillmentMode is invalid' } },
        { status: 400 }
      );
    }

    const fulfillmentMode = (fulfillmentModeParam ?? 'SELF_DRIVE') as
      | 'SELF_DRIVE'
      | 'SHARED_TRANSFER'
      | 'PRIVATE_TRANSFER';
    const paxCount = Number.isFinite(paxCountParam) && paxCountParam > 0 ? Math.min(Math.floor(paxCountParam), 10) : 1;

    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, tenantId: tenant.id },
      include: {
        variants: variantId
          ? { where: { id: variantId }, include: { slotTimes: true } }
          : { include: { slotTimes: true } },
      },
    });

    const variant = venture?.variants[0] ?? null;
    const slots = getBookableSlots(variant, { bookingDate: date, fulfillmentMode, paxCount });

    return NextResponse.json({ success: true, data: { items: slots } });
  } catch (error) {
    console.error('GET /api/v1/availability error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch availability' } },
      { status: 500 }
    );
  }
}
