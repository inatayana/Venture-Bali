import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '@/lib/customerGuard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const profileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
    whatsapp: z.string().trim().min(10, 'WhatsApp number required').max(32).optional(),
    countryCode: z.string().trim().regex(/^[A-Z]{2}$/, 'Country code must be two letters').optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'No changes supplied',
  });

/** Update editable customer profile fields. Email requires verification and is read-only. */
export async function PATCH(request: NextRequest) {
  const user = await requireCustomer();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Customer sign-in required' } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 },
    );
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Check the information you entered',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.customer.update({
      where: { id: user.customerId },
      data: parsed.data,
      select: { name: true, whatsapp: true, countryCode: true },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch {
    console.error('Customer profile update failed');
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: 'Could not save your profile' } },
      { status: 500 },
    );
  }
}
