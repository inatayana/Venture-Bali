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

  // Contract & Commercial
  contractType: z.enum(['FIXED_FEE', 'REVENUE_SHARE', 'HYBRID']).optional(),
  fixedFeePerPax: z.number().int().nonnegative().optional().nullable(),
  revenueSharePct: z.number().min(0).max(100).optional().nullable(),
  paymentTerms: z.enum(['NET_7', 'NET_14', 'NET_30', 'NET_60', 'COD']).optional(),
  contractStartDate: z.string().datetime().optional().nullable(),
  contractEndDate: z.string().datetime().optional().nullable(),
  contractDocument: z.string().url().optional().nullable(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  commissionValue: z.number().min(0).optional().nullable(),

  // SLA & Compliance
  slaResponseTimeHours: z.number().int().positive().optional().nullable(),
  slaUptimePct: z.number().min(0).max(100).optional().nullable(),
  insuranceExpiry: z.string().datetime().optional().nullable(),
  licenseExpiry: z.string().datetime().optional().nullable(),
  certifications: z.array(z.string()).optional(),

  // Contact & Operations
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  operationsContact: z.string().optional().nullable(),
  operationsPhone: z.string().optional().nullable(),
  operationsEmail: z.string().email().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),

  // Status & Notes
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ONBOARDING', 'TERMINATED']).optional(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
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
      include: {
        variants: { select: { id: true, title: true } },
        _count: { select: { variants: true, contracts: true, incidents: true } },
      },
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
        { success: false, error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const {
      code,
      name,
      activityType,
      meetingPoint,
      mapsUrl,
      isActive,
      contractType,
      fixedFeePerPax,
      revenueSharePct,
      paymentTerms,
      contractStartDate,
      contractEndDate,
      contractDocument,
      commissionType,
      commissionValue,
      slaResponseTimeHours,
      slaUptimePct,
      insuranceExpiry,
      licenseExpiry,
      certifications,
      contactName,
      contactPhone,
      contactEmail,
      operationsContact,
      operationsPhone,
      operationsEmail,
      bankAccountName,
      bankAccountNumber,
      bankName,
      status,
      notes,
      tags,
    } = data;

    const vendor = await prisma.vendor.create({
      data: {
        code,
        name,
        activityType,
        meetingPoint: meetingPoint ?? null,
        mapsUrl: mapsUrl ?? null,
        isActive: isActive ?? true,
        contractType: contractType ?? 'FIXED_FEE',
        fixedFeePerPax: fixedFeePerPax ?? null,
        revenueSharePct: revenueSharePct ?? null,
        paymentTerms: paymentTerms ?? 'NET_14',
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        contractDocument: contractDocument ?? null,
        commissionType: commissionType ?? 'PERCENTAGE',
        commissionValue: commissionValue ?? null,
        slaResponseTimeHours: slaResponseTimeHours ?? null,
        slaUptimePct: slaUptimePct ?? null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        certifications: certifications ?? [],
        contactName: contactName ?? null,
        contactPhone: contactPhone ?? null,
        contactEmail: contactEmail ?? null,
        operationsContact: operationsContact ?? null,
        operationsPhone: operationsPhone ?? null,
        operationsEmail: operationsEmail ?? null,
        bankAccountName: bankAccountName ?? null,
        bankAccountNumber: bankAccountNumber ?? null,
        bankName: bankName ?? null,
        status: status ?? 'ACTIVE',
        notes: notes ?? null,
        tags: tags ?? [],
      },
    });

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Vendor Create Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create vendor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminRole('EDITOR');
  } catch (e) {
    const res = e as NextResponse;
    return res;
  }

  try {
    const body = await request.json();
    const { id, ...bodyData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required' }, { status: 400 });
    }

    const parsed = vendorSchema.partial().safeParse(bodyData);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const parsedData = parsed.data;
    const { contractStartDate, contractEndDate, insuranceExpiry, licenseExpiry, ...rest } = parsedData;

    // Convert date strings to Date objects
    const updateData: any = {
      ...rest,
      ...(contractStartDate && { contractStartDate: new Date(contractStartDate) }),
      ...(contractEndDate && { contractEndDate: new Date(contractEndDate) }),
      ...(insuranceExpiry && { insuranceExpiry: new Date(insuranceExpiry) }),
      ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
    };

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Vendor Update Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update vendor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminRole('ADMIN');
  } catch (e) {
    const res = e as NextResponse;
    return res;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required' }, { status: 400 });
    }

    // Check if vendor has variants
    const variantCount = await prisma.variant.count({ where: { vendorId: id } });
    if (variantCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete vendor with assigned variants' },
        { status: 400 },
      );
    }

    await prisma.vendor.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Vendor Delete Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete vendor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}