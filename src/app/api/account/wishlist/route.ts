import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCustomer } from '@/lib/customerGuard';
import { listWishlist, syncWishlist } from '@/lib/wishlistService';

export const dynamic = 'force-dynamic';

const syncSchema = z.object({
  items: z
    .array(
      z.object({
        ventureId: z.string().min(1).max(64),
        savedAt: z.string().datetime().optional(),
      }),
    )
    .max(200),
});

const unauthorized = () =>
  NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Customer sign-in required' } },
    { status: 401 },
  );

/** Current server-side wishlist for a signed-in customer. */
export async function GET() {
  const user = await requireCustomer();
  if (!user) return unauthorized();

  try {
    const items = await listWishlist(user.accountId, user.tenantId);
    return NextResponse.json({ success: true, data: { items }, error: null });
  } catch {
    console.error('Wishlist lookup failed');
    return NextResponse.json(
      { success: false, error: { code: 'LOOKUP_FAILED', message: 'Could not load your wishlist' } },
      { status: 500 },
    );
  }
}

/** Merge localStorage items after sign-in. Never deletes local data client-side first. */
export async function POST(request: NextRequest) {
  const user = await requireCustomer();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 },
    );
  }

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid wishlist payload' } },
      { status: 400 },
    );
  }

  try {
    const items = await syncWishlist(user.accountId, user.tenantId, parsed.data.items);
    return NextResponse.json({ success: true, data: { items }, error: null });
  } catch {
    console.error('Wishlist sync failed');
    return NextResponse.json(
      { success: false, error: { code: 'SYNC_FAILED', message: 'Could not sync your wishlist' } },
      { status: 500 },
    );
  }
}
