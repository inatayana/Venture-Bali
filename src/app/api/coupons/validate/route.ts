import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { COUPON_REJECTION_MESSAGES, getCouponRejection } from '@/lib/pricing';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const validateCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(24),
  paxCount: z.number().int().min(1).max(10),
  promoActive: z.boolean().optional(),
});

/**
 * Validate a coupon for the live price preview.
 * The booking transaction re-runs exactly this check, so a tampered client
 * can never get a discount the server does not agree with.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`coupon:${clientIp(request)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many coupon checks. Try again shortly.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const input = validateCouponSchema.parse(await request.json());

    const coupon = await prisma.coupon.findUnique({ where: { code: input.code } });
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_COUPON', message: 'Coupon code not found' } },
        { status: 404 }
      );
    }

    const rejection = getCouponRejection(coupon, input.paxCount, input.promoActive ?? false);
    if (rejection) {
      return NextResponse.json(
        { success: false, error: { code: rejection, message: COUPON_REJECTION_MESSAGES[rejection] } },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        label: coupon.label,
        discountPercent: coupon.discountPercent,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not validate coupon' } },
      { status: 500 }
    );
  }
}
