/**
 * BaliWild AI Agent - Core Types
 */

import type { VentureItem, Variant, SlotTime, Booking } from '@/types/venture';
import { handleAgentMessage } from './agent-service';

// Tool Result Types
export type AgentToolResult =
  | CheckAvailabilityOutput
  | GetProductInfoOutput
  | GetVariantDetailsOutput
  | CalculatePriceOutput
  | CreateBookingOutput
  | SendBookingConfirmationOutput
  | GetRefundPolicyOutput;

export type AgentMessageResult = {
  status: string;
  data:
    | AgentToolResult
    | { error: string }
    | { message: string }
    | { reply: string | null; message: string; tool?: string }
    | ({ reply?: string | null } & AgentToolResult);
  next_action: string;
};

// AgentService - Main Class
export class AgentService {
  private state: AgentState;

  constructor(state: AgentState) {
    this.state = state;
  }

  async handleMessage(message: string): Promise<AgentMessageResult> {
    return handleAgentMessage(message, this.state);
  }
}

// Agent State
export interface AgentState {
  sessionId: string;
  channel: 'whatsapp' | 'telegram' | 'web';
  userId?: string;
  phone?: string;
  language: 'id' | 'en' | 'ja' | 'zh';
  context: {
    productId?: string;
    variantId?: string;
    paxCount?: number;
    adultsCount?: number;
    kidsCount?: number;
    youthCount?: number;
    bookingDate?: string;
    /** Recent conversation turns, oldest first. */
    history?: { role: 'user' | 'model'; text: string }[];
    intent: 
      | 'greeting' 
      | 'product_inquiry' 
      | 'price_inquiry' 
      | 'availability_inquiry' 
      | 'booking_request'
      | 'refund_inquiry'
      | 'location_inquiry'
      | 'general_question'
      | 'escalation'
      | 'variant_details_inquiry';
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
  | 'escalation'
  | 'variant_details_inquiry';

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
  'getVariantDetails',
  'calculatePrice', 
  'createBooking',
  'sendBookingConfirmation',
  'getRefundPolicy'
] as const;

export type ToolName = typeof AVAILABLE_TOOLS[number];

// Tool Input Types
export interface CheckAvailabilityInput {
  productSlug: string;
  date: string; // YYYY-MM-DD
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
  bookingDate: string; // YYYY-MM-DD
  paxCount: number;
  hotelAddress?: string;
}

export interface SendBookingConfirmationInput {
  bookingId: string;
}

export interface GetRefundPolicyInput {
  // no params needed
}

// ============ NEW TOOL: getVariantDetails ============
export interface GetVariantDetailsInput {
  productSlug: string;
  variantId?: string;
}

export interface GetVariantDetailsOutput {
  found: boolean;
  variant: {
    id: string;
    title: string;
    fulfillmentMode: string;
    duration?: string;
    /** Age-tiered prices */
    priceTiers: Array<{
      minPax: number;
      maxPax: number;
      pricePerPax: number;
      pricingModel?: string;
      kidsPricePerPax?: number | null;
      youthPricePerPax?: number | null;
    }>;
    /** Active promo */
    promo: {
      priceIdr: number | null;
      label: string | null;
      startsAt: string | null;
      endsAt: string | null;
      active: boolean;
    } | null;
    /** Pickup zones for transfer modes */
    pickupZones: Array<{
      id: string;
      name: string;
      areaType: string;
      surchargeIdr: number;        // per vehicle (private transfer)
      surchargePerPaxIdr: number;  // per guest (shared transfer)
      isCustomQuote: boolean;
      vehicleMaxPax: number;
    }> | null;
    /** Vehicle classes for private transfer */
    vehicleClasses: Array<{
      id: string;
      name: string;
      label: string;
      vehicleMaxPax: number;
      deltaIdr: number;
    }> | null;
    /** Add-ons */
    addons: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
      requiresTransfer: boolean;
    }> | null;
    /** Demand signal */
    bookedLast48h?: number;
    infantEnabled?: boolean;
  } | null;
}

// ============ UPDATED: calculatePrice with age breakdown ============
export interface CalculatePriceInput {
  variantId: string;
  paxCount: number;
  adultsCount?: number;
  kidsCount?: number;
  youthCount?: number;
  infantCount?: number;
}
export interface CheckAvailabilityOutput {
  available: boolean;
  slots: Array<{ time: string; capacity: number; booked: number }>;
  totalAvailable: number;
  pricePerPax?: number;
}

export interface GetProductInfoOutput {
  venture: VentureItem | null;
  variants: Variant[];
  slotTimes?: SlotTime[];
  /** False when the requested product does not exist — the agent must say so
   *  instead of describing a different product. */
  found: boolean;
}

export interface CalculatePriceOutput {
  totalPrice: number;
  pricePerPax: number;
  paxCount: number;
  tier: string;
  currency: string;
  /** Age-tiered breakdown (only when variant uses AGE_TIERED) */
  ageBreakdown?: {
    adults: { count: number; pricePerPax: number; subtotal: number };
    kids: { count: number; pricePerPax: number; subtotal: number };
    youth: { count: number; pricePerPax: number; subtotal: number };
  };
}

export interface GetVariantDetailsOutput {
  found: boolean;
  variant: {
    id: string;
    title: string;
    fulfillmentMode: string;
    duration?: string;
    /** Age-tiered prices */
    priceTiers: Array<{
      minPax: number;
      maxPax: number;
      pricePerPax: number;
      pricingModel?: string;
      kidsPricePerPax?: number | null;
      youthPricePerPax?: number | null;
    }>;
    /** Active promo */
    promo: {
      priceIdr: number | null;
      label: string | null;
      startsAt: string | null;
      endsAt: string | null;
      active: boolean;
    } | null;
    /** Pickup zones for transfer modes */
    pickupZones: Array<{
      id: string;
      name: string;
      areaType: string;
      surchargeIdr: number;        // per vehicle (private transfer)
      surchargePerPaxIdr: number;  // per guest (shared transfer)
      isCustomQuote: boolean;
      vehicleMaxPax: number;
    }> | null;
    /** Vehicle classes for private transfer */
    vehicleClasses: Array<{
      id: string;
      name: string;
      label: string;
      vehicleMaxPax: number;
      deltaIdr: number;
    }> | null;
    /** Add-ons */
    addons: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
      requiresTransfer: boolean;
    }> | null;
    /** Demand signal */
    bookedLast48h?: number;
    infantEnabled?: boolean;
  } | null;
}

export interface CreateBookingOutput {
  booking: Booking;
  paymentLink: string;
  voucherId: string;
  bookingCode: string;
  /**
   * False while the agent is still collecting details. The booking row is
   * created by the checkout flow, never by the agent.
   */
  persisted: boolean;
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
    description: string 
  }>;
}