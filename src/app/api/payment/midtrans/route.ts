import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSnapTransaction } from '@/lib/midtrans';
import { PaymentServiceError } from '@/lib/paymentService';

const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

interface BookingWithCustomer {
  id: string;
  bookingCode: string;
  totalPrice: number;
  paymentStatus: string;
  customer: { name: string; email: string; whatsapp: string };
  variant: { title: string } | null;
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = paymentSchema.parse(await request.json());

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

    const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
    if (existingPayment?.snapToken && existingPayment.status !== 'FAILED') {
      return NextResponse.json({
        success: true,
        snapToken: existingPayment.snapToken,
        redirectUrl: existingPayment.redirectUrl,
      });
    }

    const snapRequest = {
      transaction_details: {
        order_id: booking.bookingCode,
        gross_amount: booking.totalPrice,
      },
      customer_details: {
        first_name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.whatsapp,
      },
      item_details: [
        {
          id: booking.id,
          price: booking.totalPrice,
          quantity: 1,
          name: booking.variant?.title ?? 'Venture Bali Booking',
        },
      ],
      credit_card: {
        secure: true,
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
    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }

    console.error('Midtrans payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to initialize payment' } },
      { status: 500 },
    );
  }
}
