/**
 * Venture Bali AI Agent - Tools
 * Function implementations for agent tools
 */

import { AgentState, CheckAvailabilityOutput, GetProductInfoOutput, CalculatePriceOutput, CreateBookingOutput, SendBookingConfirmationOutput, GetRefundPolicyOutput } from './agent';
import type { Booking } from '@/types/venture';
import { getRefundPolicyText } from './refundUtils';
import { mockVentures } from '@/data/mockVentures';

/**
 * Check availability for a product on a specific date
 */
export async function checkAvailability(): Promise<CheckAvailabilityOutput> {
  const slots = [
    { time: '08:00', capacity: 10, booked: 3 },
    { time: '10:00', capacity: 10, booked: 7 },
    { time: '13:00', capacity: 10, booked: 2 },
    { time: '15:00', capacity: 10, booked: 0 },
  ];
  
  const totalAvailable = slots.reduce((sum, slot) => sum + (slot.capacity - slot.booked), 0);
  
  return {
    available: totalAvailable > 0,
    slots,
    totalAvailable,
    pricePerPax: 650000,
  };
}

/**
 * Get detailed product information
 */
export async function getProductInfo(
  state: AgentState
): Promise<GetProductInfoOutput> {
  const { productId } = state.context;
  
  const venture = mockVentures.find(v => v.id === productId || v.slug === productId);
  
  if (!venture) {
    const fallback = mockVentures[0];
    return {
      venture: fallback,
      variants: fallback.variants || [],
      slotTimes: fallback.variants?.[0]?.slotTimes,
    };
  }
  
  return {
    venture,
    variants: venture.variants || [],
    slotTimes: venture.variants?.[0]?.slotTimes,
  };
}

/**
 * Calculate price based on variant and pax count
 */
export async function calculatePrice(
  state: AgentState
): Promise<CalculatePriceOutput> {
  const { paxCount } = state.context;
  
  const variant = mockVentures[0]?.variants?.[0];
  const priceTiers = variant?.priceTiers || [
    { minPax: 1, maxPax: 1, pricePerPax: 750000 },
    { minPax: 2, maxPax: 2, pricePerPax: 650000 },
    { minPax: 3, maxPax: 5, pricePerPax: 550000 },
    { minPax: 6, maxPax: 10, pricePerPax: 500000 },
  ];
  
  const pax = paxCount || 2;
  const tier = priceTiers.find(t => pax >= t.minPax && pax <= t.maxPax) || priceTiers[priceTiers.length - 1];
  
  return {
    totalPrice: tier.pricePerPax * pax,
    pricePerPax: tier.pricePerPax,
    paxCount: pax,
    tier: `${tier.minPax}-${tier.maxPax} pax`,
    currency: 'IDR',
  };
}

/**
 * Create a provisional booking
 */
export async function createBooking(): Promise<CreateBookingOutput> {
  const bookingCode = `VB${Date.now().toString(36).toUpperCase()}`;

  const mockBooking: Booking = {
    id: `booking_${Date.now()}`,
    bookingCode,
    variantId: '',
    customerId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    fulfillmentMode: 'SELF_DRIVE',
    paxCount: 1,
    vehicleCount: 1,
    zoneSurchargeIdr: 0,
    totalPrice: 0,
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return {
    booking: mockBooking,
    paymentLink: `https://venture-bali.com/pay/${bookingCode}`,
    voucherId: `voucher_${Date.now()}`,
    bookingCode,
  };
}

/**
 * Send booking confirmation via WhatsApp
 */
export async function sendBookingConfirmation(): Promise<SendBookingConfirmationOutput> {
  return {
    sent: true,
    messageId: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get refund policy information
 */
export async function getRefundPolicy(): Promise<GetRefundPolicyOutput> {
  const policyText = getRefundPolicyText();
  
  return {
    policy: policyText,
    processingDays: 3,
    windows: [
      {
        hours: '≥72 hours',
        percentage: 100,
        description: 'Full refund'
      },
      {
        hours: '48-72 hours',
        percentage: 70,
        description: 'Partial refund 70%'
      },
      {
        hours: '24-48 hours',
        percentage: 30,
        description: 'Partial refund 30%'
      },
      {
        hours: '<24 hours',
        percentage: 0,
        description: 'No refund'
      }
    ]
  };
}

// Export all tools as a map for easy access
export const AGENT_TOOLS = {
  checkAvailability,
  getProductInfo,
  calculatePrice,
  createBooking,
  sendBookingConfirmation,
  getRefundPolicy,
};
