import { NextResponse } from 'next/server';
import { auditCatalogueSeo, suggestOrganicKeywords, planBacklinkStrategy, requestIndexing } from '@/lib/seo-agent';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'audit') {
      const data = await auditCatalogueSeo();
      return NextResponse.json({ success: true, data });
    }

    if (action === 'keywords') {
      const category = searchParams.get('category') || undefined;
      const data = await suggestOrganicKeywords(category);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('SEO Agent API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'backlinks') {
      const data = await planBacklinkStrategy(payload.topic);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'index') {
      const data = await requestIndexing(payload.url);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('SEO Agent API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
