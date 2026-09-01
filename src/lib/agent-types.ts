/**
 * Venture Bali AI Agent - Core Types
 */

import type { VentureItem, Variant, SlotTime, Booking } from '@/types/venture';

// Agent State
export interface AgentState {
  sessionId: string;
  channel: 'whatsapp' | 'telegram' | 'web';
  userId?: string;
  phone?: string;
  language: 'id' | 'en' | 'ja' | 'zh';
  context: {
    productId?: string;
    paxCount?: number;
    intent:
      | 'greeting'
      | 'product_inquiry'
      | 'price_inquiry'
      | 'availability_inquiry'
      | 'booking_request'
      | 'refund_inquiry'
      | 'location_inquiry'
      | 'general_question'
      | 'escalation';
  };
  lastAction: 'welcome' | 'info' | 'booking' | 'refund' | 'reminder' | 'goodbye';
  activeFlow: 'greeting' | 'product_search' | 'price_check' | 'booking_flow' | 'refund_policy' | 'noise';
}

// Intent Types
export type Intent =
  | 'greeting'
  | 'product_inquiry'
  | 'price_inquiry'
  | 'availability_inquiry'
  | 'booking_request'
  | 'refund_inquiry'
  | 'location_inquiry'
  | 'general_question'
  | 'escalation';

// Tool Call Types
export interface ToolCall<T> {
  name: string;
  args: T;
  result?: unknown;
  error?: string;
}

// API Response Type
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { total: number; page: number; pageSize: number };
}

// Available Tools
export const AVAILABLE_TOOLS = [
  'checkAvailability',
  'getProductInfo',
  'calculatePrice',
  'createBooking',
  'sendBookingConfirmation',
  'getRefundPolicy'
] as const;

export type ToolName = typeof AVAILABLE_TOOLS[number];

// Tool Input Types
export interface CheckAvailabilityInput {
  productSlug: string;
  date: string;
}

export interface GetProductInfoInput {
  productSlug: string;
}

export interface CalculatePriceInput {
  variantId: string;
  paxCount: number;
}

export interface CreateBookingInput {
  customerName: string;
  customerEmail: string;
  customerWhatsApp: string;
  productSlug: string;
  variantId: string;
  bookingDate: string;
  paxCount: number;
  hotelAddress?: string;
}

export interface SendBookingConfirmationInput {
  bookingId: string;
}

export interface GetRefundPolicyInput {
  // no params needed
}

// Tool Output Types
export interface CheckAvailabilityOutput {
  available: boolean;
  slots: Array<{ time: string; capacity: number; booked: number }>;
  totalAvailable: number;
  pricePerPax?: number;
}

export interface GetProductInfoOutput {
  venture: VentureItem;
  variants: Variant[];
  slotTimes?: SlotTime[];
}

export interface CalculatePriceOutput {
  totalPrice: number;
  pricePerPax: number;
  paxCount: number;
  tier: string;
  currency: string;
}

export interface CreateBookingOutput {
  booking: Booking;
  paymentLink: string;
  voucherId: string;
  bookingCode: string;
}

export interface SendBookingConfirmationOutput {
  sent: boolean;
  messageId: string;
  timestamp: string;
}

export interface GetRefundPolicyOutput {
  policy: string;
  processingDays: number;
  windows: Array<{
    hours: string;
    percentage: number;
    description: string;
  }>;
}
