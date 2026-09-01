/**
 * Venture Bali AI Agent - Core Service
 */

import { AgentState, Intent } from './agent';
import { AGENT_TOOLS } from './tools';

/**
 * Main entry point for handling user messages
 */
export async function handleAgentMessage(
  message: string, 
  state: AgentState
): Promise<{ status: string; data: any; next_action: string }> {
  const intent = detectIntent(message);
  updateSessionState(state, intent);
  const tool = getToolForIntent(intent);

  if (!tool) {
    return handleUnknownIntent();
  }

  try {
    const result = await tool(state);
    const nextAction = determineNextAction(result);
    return { status: 'success', data: result, nextAction };
  } catch (error) {
    console.error('Agent error:', error);
    return { 
      status: 'error', 
      data: { error: error instanceof Error ? error.message : 'Unknown error' }, 
      next_action: 'escalate_to_human' 
    };
  }
}

/**
 * Detect user intent from message using keyword matching
 */
function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  
  if (['hello', 'hi', 'hey', 'salam', 'hola', 'halo', 'hai', 'selamat'].some(k => lower.includes(k))) {
    return 'greeting';
  }
  
  if (['product', 'what', 'which', 'see', 'show', 'activities', 'atv', 'rafting', 'tubing', 'snorkeling', 'trek'].some(k => lower.includes(k))) {
    return 'product_inquiry';
  }
  
  if (['price', 'cost', 'how much', 'harga', 'biaya', 'fee', 'berapa'].some(k => lower.includes(k))) {
    return 'price_inquiry';
  }
  
  if (['when', 'time', 'available', 'slot', 'kapan', 'tersedia', 'jam', 'schedule'].some(k => lower.includes(k))) {
    return 'availability_inquiry';
  }
  
  if (['book', 'reserve', 'membuat', ' pesan', 'booking', 'order'].some(k => lower.includes(k))) {
    return 'booking_request';
  }
  
  if (['refund', 'cancel', 'kembalian', 'batal', 'refund policy', 'cancellation'].some(k => lower.includes(k))) {
    return 'refund_inquiry';
  }
  
  if (['address', 'lokasi', 'alamat', 'meeting point', 'pickup', 'where'].some(k => lower.includes(k))) {
    return 'location_inquiry';
  }
  
  return 'general_question';
}

/**
 * Update agent session state
 */
function updateSessionState(state: AgentState, intent: Intent): void {
  state.context = { ...state.context, intent };
  state.lastAction = mapIntentToAction(intent);
  state.activeFlow = mapIntentToFlow(intent);
}

/**
 * Map intent to action
 */
function mapIntentToAction(intent: Intent): AgentState['lastAction'] {
  switch (intent) {
    case 'greeting': return 'welcome';
    case 'product_inquiry':
    case 'price_inquiry':
    case 'availability_inquiry': return 'info';
    case 'booking_request': return 'booking';
    case 'refund_inquiry': return 'refund';
    case 'location_inquiry': return 'info';
    default: return 'info';
  }
}

/**
 * Map intent to flow
 */
function mapIntentToFlow(intent: Intent): AgentState['activeFlow'] {
  switch (intent) {
    case 'greeting': return 'greeting';
    case 'product_inquiry': return 'product_search';
    case 'price_inquiry': return 'price_check';
    case 'availability_inquiry': return 'product_search';
    case 'booking_request': return 'booking_flow';
    case 'refund_inquiry': return 'refund_policy';
    case 'location_inquiry': return 'product_search';
    default: return 'greeting';
  }
}

/**
 * Get tool for intent
 */
function getToolForIntent(intent: Intent): ((state: AgentState) => Promise<any>) | null {
  const toolMap: Record<Intent, keyof typeof AGENT_TOOLS | null> = {
    greeting: null,
    product_inquiry: 'getProductInfo',
    price_inquiry: 'calculatePrice',
    availability_inquiry: 'checkAvailability',
    booking_request: 'createBooking',
    refund_inquiry: 'getRefundPolicy',
    location_inquiry: 'getProductInfo',
    general_question: null,
    escalation: null,
  };
  
  const toolName = toolMap[intent];
  return toolName ? AGENT_TOOLS[toolName] : null;
}

/**
 * Determine next action based on result
 */
function determineNextAction(result: any): string {
  if (result?.available === false) return 'suggest_alternative_date';
  if (result?.totalPrice && result.paxCount) return 'confirm_booking';
  if (result?.bookingCode) return 'payment_initiated';
  if (result?.sent) return 'confirmation_sent';
  if (result?.policy) return 'policy_shown';
  return 'continue_conversation';
}

/**
 * Handle unknown intents
 */
function handleUnknownIntent(): { status: string; data: any; next_action: string } {
  return {
    status: 'fallback',
    data: {
      message: 'Maaf, saya tidak memahami pertanyaan Anda. Bisakah Anda ulangi atau pilih dari menu berikut?'
    },
    next_action: 'show_menu',
  };
}
