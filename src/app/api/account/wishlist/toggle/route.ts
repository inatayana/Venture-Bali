import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '@/lib/customerGuard';
import { setWishlistItem } from '@/lib/wishlistService';

export const dynamic = 'force-dynamic';

const toggleSchema = z.object({
  ventureId: z.string().min(1).max(64),
  save: z.boolean(),
});

/** Persist a heart toggle for a signed-in customer. */
export async function POST(request: NextRequest) {
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

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid wishlist toggle' } },
      { status: 400 },
    );
  }

  try {
    const saved = await setWishlistItem(
      user.accountId,
      user.tenantId,
      parsed.data.ventureId,
      parsed.data.save,
    );
    if (!saved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Adventure not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: { saved: parsed.data.save }, error: null });
  } catch {
    console.error('Wishlist toggle failed');
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: 'Could not update your wishlist' } },
      { status: 500 },
    );
  }
}
