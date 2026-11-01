import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSnapTransaction, MidtransConfigError, type SnapTransactionRequest } from '@/lib/midtrans';
import { getHoldMinutes, isHoldActive } from '@/lib/bookingLifecycle';
import { PaymentServiceError } from '@/lib/paymentService';
import type { PaymentStatus } from '@prisma/client';
import { billingAddressSchema } from '@/lib/bookingSchema';
import { buildSnapItems, toSnapBillingAddress } from '@/lib/snapBilling';

const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

interface BookingWithCustomer {
  id: string;
  bookingCode: string;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  expiresAt: Date | null;
  paxCount: number;
  nightSurchargeIdr: number;
  zoneSurchargeIdr: number;
  selectedAddons: unknown;
  billingAddress: unknown;
  customer: { name: string; email: string; whatsapp: string };
  variant: { title: string } | null;
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  try {
    const { bookingId } = paymentSchema.parse(rawBody);

    const booking = (await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { name: true, email: true, whatsapp: true } },
        variant: { select: { title: true } },
      },
    })) as BookingWithCustomer | null;

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PAID', message: 'Booking is already paid' } },
        { status: 409 },
      );
    }

    if (booking.paymentStatus === 'PENDING' && !isHoldActive(booking)) {
      // The inventory hold is gone: the slot may already belong to someone else.
      // Never let a stale session be paid.
      await prisma.booking.updateMany({
        where: { id: bookingId, paymentStatus: 'PENDING' },
        data: { paymentStatus: 'CANCELLED', lifecycleStatus: 'CANCELLED', expiresAt: new Date() },
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HOLD_EXPIRED',
            message: 'Your reservation hold expired. Please choose the date and time again.',
          },
        },
        { status: 410 },
      );
    }

    const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
    if (existingPayment?.snapToken && existingPayment.status !== 'FAILED') {
      return NextResponse.json({
        success: true,
        snapToken: existingPayment.snapToken,
        redirectUrl: existingPayment.redirectUrl,
      });
    }

    const billing = billingAddressSchema.safeParse(booking.billingAddress);
    const addons = Array.isArray(booking.selectedAddons)
      ? booking.selectedAddons.filter(
          (item): item is { id: string; name: string; price: number } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).id === 'string' &&
            typeof (item as Record<string, unknown>).name === 'string' &&
            typeof (item as Record<string, unknown>).price === 'number',
        )
      : [];

    const snapRequest: SnapTransactionRequest = {
      transaction_details: {
        order_id: booking.bookingCode,
        gross_amount: booking.totalPrice,
      },
      customer_details: {
        first_name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.whatsapp,
        ...(billing.success ? { billing_address: toSnapBillingAddress(billing.data) } : {}),
      },
      item_details: buildSnapItems({
        id: booking.id,
        variantTitle: booking.variant?.title ?? 'BaliWild Booking',
        paxCount: booking.paxCount,
        totalPrice: booking.totalPrice,
        nightSurchargeIdr: booking.nightSurchargeIdr,
        zoneSurchargeIdr: booking.zoneSurchargeIdr,
        selectedAddons: addons,
      }),
      credit_card: {
        secure: true,
      },
      expiry: {
        unit: 'minutes',
        duration: getHoldMinutes(),
      },
    };

    const snapResponse = await createSnapTransaction(snapRequest);

    await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        midtransOrderId: booking.bookingCode,
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        grossAmount: booking.totalPrice,
        status: 'PENDING',
      },
      update: {
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        grossAmount: booking.totalPrice,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 },
      );
    }
    if (error instanceof MidtransConfigError) {
      // Deployment/configuration problem, not the guest's fault.
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_CONFIGURED',
            message:
              'Online payment is not available yet. Your slot is still held — contact us on WhatsApp and we will finish the booking for you.',
          },
        },
        { status: 503 },
      );
    }
    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith('Midtrans API error')) {
      // Provider rejection (bad keys, invalid amount, …). Keep the details for the
      // server log, and only expose them outside production.
      console.error('Midtrans rejected the transaction:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_PROVIDER_ERROR',
            message:
              process.env.NODE_ENV === 'production'
                ? 'The payment provider could not start this transaction. Please try again or contact us.'
                : error.message,
          },
        },
        { status: 502 },
      );
    }

    console.error('Midtrans payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to initialize payment' } },
      { status: 500 },
    );
  }
}
