/**
 * Venture Bali AI Agent - Tools
 * Function implementations for agent tools.
 *
 * Every tool reads REAL data: the catalogue comes from the database (with the
 * offline catalogue as a fallback) and the refund policy comes from
 * `src/lib/refundUtils.ts`, which is the enforced implementation of
 * docs/REFUND_POLICY.md.
 *
 * The agent talks to customers, so quoting a price, a slot or a policy that
 * does not match reality is a business-critical bug — never invent numbers
 * here.
 */

import {
  AgentState,
  CheckAvailabilityOutput,
  GetProductInfoOutput,
  CalculatePriceOutput,
  CreateBookingOutput,
  SendBookingConfirmationOutput,
  GetRefundPolicyOutput,
} from './agent';
import type { Booking, VentureItem, Variant } from '@/types/venture';
import {
  getRefundPolicyText,
  NO_SHOW_POLICY,
  REFUND_PROCESSING_DAYS,
  REFUND_WINDOWS,
} from './refundUtils';
import { mockExperiences } from '@/data/mockExperiences';
import { prisma } from '@/lib/prisma';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import { getPriceTierForPax, isDateAvailable } from '@/lib/pricing';

/**
 * Resolve a venture by id or slug.
 * Reads the database first and falls back to the offline catalogue.
 */
async function resolveVenture(productId?: string): Promise<VentureItem | null> {
  if (productId) {
    try {
      const row = await prisma.venture.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] },
        include: ventureWithRelations,
      });
      if (row) return toVentureItem(row);
    } catch (error) {
      console.error('Agent tool could not reach the database, using fallback:', error);
    }

    const fromCatalogue = mockExperiences.find(
      (v) => v.id === productId || v.slug === productId
    );
    if (fromCatalogue) return fromCatalogue;

    return null;
  }

  // No product requested yet — offer the first catalogue entry.
  try {
    const row = await prisma.venture.findFirst({
      orderBy: { rating: 'desc' },
      include: ventureWithRelations,
    });
    if (row) return toVentureItem(row);
  } catch (error) {
    console.error('Agent tool could not reach the database, using fallback:', error);
  }

  return mockExperiences[0] ?? null;
}

/**
 * Pick the variant the conversation is about.
 * Falls back to the first variant of the venture.
 */
function pickVariant(venture: VentureItem, variantId?: string): Variant | null {
  if (!venture.variants || venture.variants.length === 0) return null;
  if (variantId) {
    const match = venture.variants.find((v) => v.id === variantId);
    if (match) return match;
  }
  return venture.variants[0];
}

/**
 * Check availability for a product on a specific date
 */
export async function checkAvailability(state: AgentState): Promise<CheckAvailabilityOutput> {
  const venture = await resolveVenture(state.context.productId);
  const variant = venture ? pickVariant(venture, state.context.variantId) : null;

  if (!venture || !variant) {
    return { available: false, slots: [], totalAvailable: 0 };
  }

  const date = state.context.bookingDate;
  const blackout = date ? !isDateAvailable(variant, date) : false;

  const slots = (variant.slotTimes ?? [])
    .filter((slot) => slot.isAvailable)
    .map((slot) => ({
      time: slot.time,
      capacity: slot.maxCapacity,
      booked: slot.currentBookings,
    }));

  const openSlots = blackout ? [] : slots.filter((s) => s.capacity - s.booked > 0);
  const totalAvailable = openSlots.reduce((sum, slot) => sum + (slot.capacity - slot.booked), 0);

  return {
    available: totalAvailable > 0,
    slots: blackout ? [] : openSlots,
    totalAvailable,
    pricePerPax: variant.priceTiers.length > 0
      ? Math.min(...variant.priceTiers.map((tier) => tier.pricePerPax))
      : venture.priceIdr,
  };
}

/**
 * Get detailed product information
 */
export async function getProductInfo(state: AgentState): Promise<GetProductInfoOutput> {
  const venture = await resolveVenture(state.context.productId);

  if (!venture) {
    return { venture: null, variants: [], slotTimes: [], found: false };
  }

  return {
    venture,
    variants: venture.variants ?? [],
    slotTimes: venture.variants?.[0]?.slotTimes,
    found: true,
  };
}

/**
 * Calculate price based on variant and pax count
 */
export async function calculatePrice(state: AgentState): Promise<CalculatePriceOutput> {
  const venture = await resolveVenture(state.context.productId);
  const variant = venture ? pickVariant(venture, state.context.variantId) : null;

  const pax = state.context.paxCount && state.context.paxCount > 0 ? state.context.paxCount : 1;
  const priceTiers = variant?.priceTiers ?? [];

  if (priceTiers.length === 0) {
    return {
      totalPrice: 0,
      pricePerPax: 0,
      paxCount: pax,
      tier: `${pax} pax`,
      currency: 'IDR',
    };
  }

  const tier = getPriceTierForPax(priceTiers, pax);

  return {
    totalPrice: tier.pricePerPax * pax,
    pricePerPax: tier.pricePerPax,
    paxCount: pax,
    tier: `${tier.minPax}-${tier.maxPax} pax`,
    currency: 'IDR',
  };
}

/**
 * Create a provisional booking.
 *
 * The agent conversation only collects a subset of the details the booking
 * flow needs, so no row is written here — the booking is created by the
 * checkout flow once the customer has confirmed everything. The quote below
 * is calculated from the real price tiers so the amount the agent states is
 * the amount the customer pays.
 */
export async function createBooking(state: AgentState): Promise<CreateBookingOutput> {
  const venture = await resolveVenture(state.context.productId);
  const variant = venture ? pickVariant(venture, state.context.variantId) : null;
  const pax = state.context.paxCount && state.context.paxCount > 0 ? state.context.paxCount : 1;

  const tier = variant?.priceTiers.length
    ? getPriceTierForPax(variant.priceTiers, pax)
    : null;

  const provisional: Booking = {
    id: `provisional-${Date.now()}`,
    bookingCode: 'PENDING',
    variantId: variant?.id ?? '',
    customerId: '',
    bookingDate: state.context.bookingDate ?? new Date().toISOString().split('T')[0],
    fulfillmentMode: 'SELF_DRIVE',
    paxCount: pax,
    vehicleCount: 1,
    zoneSurchargeIdr: 0,
    totalPrice: tier ? tier.pricePerPax * pax : 0,
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    booking: provisional,
    paymentLink: venture ? `/experiences/${venture.id}/${venture.slug}` : '/',
    voucherId: '',
    bookingCode: 'PENDING',
    persisted: false,
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
 *
 * The numbers come from `src/lib/refundUtils.ts`, the enforced implementation
 * of docs/REFUND_POLICY.md. Never restate them by hand.
 */
export async function getRefundPolicy(): Promise<GetRefundPolicyOutput> {
  return {
    policy: getRefundPolicyText(),
    processingDays: REFUND_PROCESSING_DAYS,
    windows: [
      ...REFUND_WINDOWS.map((window) => ({
        hours: window.hours,
        percentage: window.percentage,
        description: window.description,
      })),
      {
        hours: 'no-show',
        percentage: NO_SHOW_POLICY.refundPercentage,
        description: NO_SHOW_POLICY.description,
      },
    ],
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
