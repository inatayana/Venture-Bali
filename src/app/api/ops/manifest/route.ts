import { NextResponse, type NextRequest } from 'next/server';
import { requireFieldOps } from '@/lib/opsGuard';
import { listManifest } from '@/lib/opsService';

export const dynamic = 'force-dynamic';

/** Allowlisted Field Ops manifest — no supplier, payment or payout fields. */
export async function GET(request: NextRequest) {
  const user = await requireFieldOps();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Field Ops sign-in required' } },
      { status: 401 },
    );
  }

  const raw = request.nextUrl.searchParams.get('date') ?? '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw
    : new Date(Date.now() + 8 * 60 * 60_000).toISOString().split('T')[0];

  try {
    const bookings = await listManifest(user, date);
    return NextResponse.json(
      { success: true, data: { date, bookings, role: user.role }, error: null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    console.error('Field Ops manifest failed');
    return NextResponse.json(
      { success: false, error: { code: 'LOOKUP_FAILED', message: 'Could not load the manifest' } },
      { status: 500 },
    );
  }
}
