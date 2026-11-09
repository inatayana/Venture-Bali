import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

const vendorSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  activityType: z.string().min(1).max(60),
  meetingPoint: z.string().max(200).optional().nullable(),
  mapsUrl: z.string().url().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdminRole('VIEWER');
  } catch (e) {
    const res = e as NextResponse;
    return res;
  }

  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Vendor API Error:', error);
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
    const parsed = vendorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { code, name, activityType, meetingPoint, mapsUrl, isActive } = parsed.data;

    const vendor = await prisma.vendor.create({
      data: {
        code,
        name,
        activityType,
        meetingPoint: meetingPoint ?? null,
        mapsUrl: mapsUrl ?? null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Vendor Create Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create vendor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}