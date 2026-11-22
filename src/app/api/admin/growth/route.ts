import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/adminGuard';
import { getGrowthMetrics } from '@/lib/growthMetrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminRole('EDITOR');
  } catch (error) {
    return error as NextResponse;
  }

  try {
    const data = await getGrowthMetrics();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Growth metrics failed:', error);
    return NextResponse.json(
      { success: false, error: 'Growth metrics unavailable' },
      { status: 500 }
    );
  }
}
