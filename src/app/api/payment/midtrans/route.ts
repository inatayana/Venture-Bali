import { NextRequest, NextResponse } from 'next/server';
import { createSnapTransaction } from '@/lib/midtrans';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, orderId, amount, customerName, customerEmail, customerPhone } = body;

    if (!bookingId || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const snapRequest = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName || 'Customer',
        email: customerEmail || 'customer@example.com',
        phone: customerPhone || '',
      },
      item_details: [
        {
          id: bookingId,
          price: amount,
          quantity: 1,
          name: 'Venture Bali Booking',
        },
      ],
      credit_card: {
        secure: true,
      },
    };

    const snapResponse = await createSnapTransaction(snapRequest);

    return NextResponse.json({
      success: true,
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    });
  } catch (error) {
    console.error('Midtrans payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to initialize payment' } },
      { status: 500 }
    );
  }
}