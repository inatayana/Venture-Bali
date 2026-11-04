import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
    const body = await request.json();
    const { code, name, activityType, meetingPoint, mapsUrl, isActive } = body;

    if (!code || !name || !activityType) {
      return NextResponse.json({ success: false, error: 'Code, name, and activityType are required' }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        code,
        name,
        activityType,
        meetingPoint: meetingPoint || null,
        mapsUrl: mapsUrl || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Vendor Create Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vendor' }, { status: 500 });
  }
}
