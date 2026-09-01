import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockVentures } from '@/data/mockVentures';
import type { VentureItem } from '@/types/venture';

interface VentureWhereInput {
  category?: string;
  title?: { contains: string; mode: 'insensitive' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let ventures: VentureItem[] = [];

  try {
    // Try Prisma
    const where: VentureWhereInput = {};
    if (category) where.category = category;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    // domain not in VentureItem schema, ignore

    const results = await prisma.venture.findMany({ where });
    ventures = results;
  } catch (error) {
    console.error('Prisma query failed, falling back to mock data:', error);
    // Fallback to mock data
    ventures = mockVentures.filter(v => {
      if (category && v.category !== category) return false;
      if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
      // domain not in mock, ignore
      return true;
    });
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

    // Basic validation
    if (!title || !description || !category || !location || priceIdr === undefined || !durationHours || !minParticipants || !maxParticipants || !rating || !reviewCount) {
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

    await prisma.venture.create({
      data: venture,
    });

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

// Helper to slug (could be moved to utils)
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}