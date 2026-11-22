import { NextRequest, NextResponse } from 'next/server';
import { runContentQueue } from '@/lib/contentQueue';

export const dynamic = 'force-dynamic';

/**
 * Daily autonomous content run. Caps at 15 articles so the Gemini free tier
 * (20 requests/day/model) still has headroom for the customer-service agent.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron token' } },
      { status: 401 }
    );
  }

  try {
    const result = await runContentQueue();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Content queue failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CONTENT_QUEUE_FAILED', message: 'Content queue failed' } },
      { status: 500 }
    );
  }
}
