import { NextRequest, NextResponse } from 'next/server';
import { mockVentures } from '@/data/mockVentures';
import type { VentureItem } from '@/types/venture';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let ventures: VentureItem[] = mockVentures;

  if (category) {
    ventures = ventures.filter((v) => v.category === category);
  }
  if (search) {
    ventures = ventures.filter((v) =>
      v.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  return NextResponse.json({
    success: true,
    data: ventures,
    error: null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      location,
      priceIdr,
      durationHours,
      minParticipants,
      maxParticipants,
      rating,
      reviewCount,
      imageUrl,
      isAvailable,
    } = body;

    if (!title || !description || !category || !location || priceIdr === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const venture: VentureItem = {
      id: `venture-${Date.now()}`,
      slug: toSlug(title),
      tenantId: 'tenant-001',
      title,
      hook3Sec: description,
      shortDescription: description.slice(0, 160),
      duration: `${durationHours} hours`,
      highlights: [],
      inclusions: [],
      exclusions: [],
      itinerary: [],
      essentialInfo: {
        perfectFor: [],
        whatToBring: [],
        knowBeforeYouGo: [],
      },
      languages: ['en'],
      category,
      difficulty: 'EASY',
      imageUrl: imageUrl || '',
      gallery: [],
      rating,
      variants: [],
      description,
      location,
      priceIdr,
      durationHours,
      minParticipants,
      maxParticipants,
      reviewCount,
      isAvailable: isAvailable ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: venture, message: 'Created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create venture:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create venture' },
      { status: 500 }
    );
  }
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}
