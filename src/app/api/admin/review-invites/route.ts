import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';
import { createInviteToken } from '@/lib/reviewInvite';
import { COUNTRIES } from '@/lib/countries';

const COUNTRY_CODES = new Set(COUNTRIES.map((country) => country.code));

const createSchema = z.object({
  ventureId: z.string().min(1, 'Choose a product'),
  count: z.number().int().min(1).max(10).default(10),
  expiresInDays: z.number().int().min(1).max(90).default(30),
  guestName: z.string().trim().max(60).optional(),
  guestCountryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((code) => COUNTRY_CODES.has(code), 'Choose a valid country')
    .optional(),
});

const MAX_ACTIVE_INVITES = 10;

/** Create up to 10 single-use founding-guest invites for one product. */
export async function POST(request: NextRequest) {
  const session = await requireAdminRole('EDITOR');
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Editor access required' } },
      { status: 403 },
    );
  }

  try {
    const parsed = createSchema.parse(await request.json());

    if (!createInviteToken('probe', new Date(Date.now() + 60_000))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_CONFIGURED', message: 'CUSTOMER_LINK_SECRET is not configured' },
        },
        { status: 500 },
      );
    }

    const venture = await prisma.venture.findUnique({
      where: { id: parsed.ventureId },
      select: { id: true, title: true },
    });
    if (!venture) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 },
      );
    }

    const active = await prisma.reviewInvite.count({
      where: {
        ventureId: venture.id,
        status: 'UNUSED',
        expiresAt: { gt: new Date() },
      },
    });
    const remaining = Math.max(0, MAX_ACTIVE_INVITES - active);
    if (parsed.count > remaining) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVITE_LIMIT',
            message:
              remaining === 0
                ? 'This product already has 10 active invites. Revoke or wait for them to expire.'
                : `Only ${remaining} active invite slot${remaining === 1 ? '' : 's'} left for this product.`,
          },
        },
        { status: 409 },
      );
    }

    const expiresAt = new Date(Date.now() + parsed.expiresInDays * 24 * 60 * 60 * 1000);
    const invites = await prisma.$transaction(
      Array.from({ length: parsed.count }, () =>
        prisma.reviewInvite.create({
          data: {
            ventureId: venture.id,
            guestName: parsed.guestName || null,
            guestCountryCode: parsed.guestCountryCode || null,
            expiresAt,
            createdBy: session.email,
          },
          select: { id: true, expiresAt: true, status: true },
        }),
      ),
    );

    revalidatePath('/admin/reviews/invites');
    revalidatePath('/admin/reviews');

    return NextResponse.json(
      {
        success: true,
        data: {
          venture: { id: venture.id, title: venture.title },
          created: invites.length,
          invites,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    console.error('Create review invites failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not create invites' } },
      { status: 500 },
    );
  }
}
