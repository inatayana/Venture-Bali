import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auditCatalogueSeo, suggestOrganicKeywords, planBacklinkStrategy, requestIndexing } from '@/lib/seo-agent';
import { requireAdminRole } from '@/lib/adminGuard';

const seoGetSchema = z.object({
  action: z.enum(['audit', 'keywords']),
  category: z.string().max(60).optional(),
});

const seoPostSchema = z.object({
  action: z.enum(['backlinks', 'index']),
  payload: z.object({
    topic: z.string().min(1).max(120).optional(),
    url: z.string().url().max(500).optional(),
  }).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdminRole('EDITOR');
  } catch (e) {
    const res = e as NextResponse;
    return res;
  }

  const { searchParams } = new URL(request.url);
  const parsed = seoGetSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    if (parsed.data.action === 'audit') {
      const data = await auditCatalogueSeo();
      return NextResponse.json({ success: true, data });
    }

    if (parsed.data.action === 'keywords') {
      const data = await suggestOrganicKeywords(parsed.data.category);
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
    await requireAdminRole('EDITOR');
  } catch (e) {
    const res = e as NextResponse;
    return res;
  }

  try {
    const body = await request.json();
    const parsed = seoPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    if (parsed.data.action === 'backlinks') {
      const topic = parsed.data.payload?.topic ?? '';
      const data = await planBacklinkStrategy(topic);
      return NextResponse.json({ success: true, data });
    }

    if (parsed.data.action === 'index') {
      const url = (parsed.data.payload?.url as string | undefined) ?? '';
      const data = await requestIndexing(url);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('SEO Agent API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}