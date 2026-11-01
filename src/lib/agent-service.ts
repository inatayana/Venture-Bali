/**
 * Venture Bali — AI Customer Service Agent
 * ------------------------------------------
 * Orchestrates the agent: it detects the intent, runs the matching tool and
 * produces a reply.
 *
 * Two engines work together:
 *
 * 1. **Gemini** classifies the intent and may call one of the agent tools
 *    through function calling. It is the engine that produces the wording.
 * 2. **The tools** are the source of truth. They read the database and the
 *    enforced policy, so the agent can never invent a price, a slot or a
 *    refund rule.
 *
 * When Gemini is not configured the agent falls back to deterministic
 * keyword intent detection and a templated reply, so the chat always works.
 *
 * Docs: Venture_Bali_PRD_PPS.md §10 (AI Agent Specification)
 */

import {
  AgentState,
  AgentToolResult,
  AgentMessageResult,
  Intent,
} from './agent';
import { AGENT_TOOLS } from './tools';
import {
  generateContent,
  isGeminiConfigured,
  type GeminiFunctionDeclaration,
} from './gemini';

export { detectIntent } from './agent-intent';

/**
 * The tool descriptions handed to Gemini for function calling.
 * The parameters mirror the tool inputs declared in src/lib/agent.ts.
 */
export const AGENT_FUNCTION_DECLARATIONS: GeminiFunctionDeclaration[] = [
  {
    name: 'getProductInfo',
    description:
      'Look up a specific adventure product. Use the product slug, for example "ubud-atv-jungle-ride".',
    parameters: {
      type: 'object',
      properties: {
        productSlug: {
          type: 'string',
          description: 'The slug of the product, e.g. "ubud-atv-jungle-ride".',
        },
      },
      required: ['productSlug'],
    },
  },
  {
    name: 'calculatePrice',
    description:
      'Calculate the price for a variant and a number of travellers. Prices are tiered per person.',
    parameters: {
      type: 'object',
      properties: {
        productSlug: {
          type: 'string',
          description: 'The slug of the product, e.g. "ubud-atv-jungle-ride".',
        },
        variantId: {
          type: 'string',
          description: 'The id of the variant, e.g. "Self Drive" or "Private Transfer".',
        },
        paxCount: {
          type: 'integer',
          description: 'How many travellers are taking part.',
        },
      },
      required: ['productSlug', 'paxCount'],
    },
  },
  {
    name: 'checkAvailability',
    description:
      'Check the available time slots for a product on a given date (YYYY-MM-DD).',
    parameters: {
      type: 'object',
      properties: {
        productSlug: {
          type: 'string',
          description: 'The slug of the product, e.g. "ubud-atv-jungle-ride".',
        },
        date: {
          type: 'string',
          description: 'The date in YYYY-MM-DD format.',
        },
      },
      required: ['productSlug', 'date'],
    },
  },
  {
    name: 'getRefundPolicy',
    description:
      'Explain the refund and cancellation policy. Use this whenever the customer asks about refunds, cancellations or rescheduling.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * The system instruction that frames the agent.
 *
 * Persona: senior customer relationship specialist + reseller + growth-minded
 * marketer. Every factual claim still has to come from a tool — the persona
 * changes tone and structure, not the truth.
 */
export const AGENT_SYSTEM_PROMPT = `You are the Venture Bali Assistant, the customer relationship and sales specialist for Venture Bali, a platform that sells adventure activities in Bali: ATV rides, rafting, river tubing, cycling, trekking, water sports, snorkelling, extreme adventures and combo packages.

Voice:
- Warm, energetic, professional and reassuring — an expert who knows Bali.
- Structure answers for mobile: a short opening line, then bullets or bold key facts. No walls of text.
- Always end with the clearest next step (check availability, choose a package, open the booking link, or ask one useful question).
- Never pressure the guest and never invent urgency or scarcity.

Rules you must follow:
- Use the available functions to look up products, prices, availability and the refund policy. Never state a price, a time slot or a policy from memory.
- If a function reports that a product was not found, say so plainly. Never substitute a different activity.
- Prices are Indonesian Rupiah, per person, and depend on the number of travellers.
- Booking modes are "Self Drive" (the customer meets the operator at the activity location) and "Private Transfer" (hotel pickup is included).
- The refund policy is: cancel at least 24 hours before the activity and a 20% cancellation fee applies, so 80% is refunded; cancel less than 24 hours before and the booking cannot be cancelled; no-show without confirming at least a day ahead means a 100% cancellation fee. Refunds are processed within 3 business days.
- Rescheduling is available up to 24 hours before the activity, subject to availability; confirm it with a tool or the operations team rather than promising a slot.
- Never mention a partner or vendor name, and never use the words "Best", "Cheapest" or "Free" to describe a product.
- When a guest hesitates, reassure with verified facts only: licensed local operators, safety briefing, the refund policy above, and reviews/ratings returned by a tool. Never invent a review, rating, reviewer name, location or social-proof statistic.
- After a trip, the platform sends a review request by email and WhatsApp with a direct link and a QR code. Explain that flow if asked; do not claim a specific guest has already received one unless a tool confirms it.
- Answer in the language the customer uses. Keep replies short and friendly, and never invent details you did not receive from a function.`;

const INTENT_TO_TOOL: Record<Intent, keyof typeof AGENT_TOOLS | null> = {
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

function getToolForIntent(intent: Intent) {
  const toolName = INTENT_TO_TOOL[intent];
  return toolName ? AGENT_TOOLS[toolName] : null;
}

/**
 * Run the tool the intent points at, after applying any arguments the model
 * supplied.
 */
async function runTool(
  toolName: keyof typeof AGENT_TOOLS,
  state: AgentState,
  args: Record<string, unknown>
): Promise<AgentToolResult> {
  // Apply the arguments Gemini extracted to the session context.
  if (typeof args.productSlug === 'string' && args.productSlug.length > 0) {
    state.context.productId = args.productSlug;
  }
  if (typeof args.variantId === 'string' && args.variantId.length > 0) {
    state.context.variantId = args.variantId;
  }
  if (typeof args.paxCount === 'number' && args.paxCount > 0) {
    state.context.paxCount = Math.floor(args.paxCount);
  }
  if (typeof args.date === 'string' && args.date.length > 0) {
    state.context.bookingDate = args.date;
  }

  const tool = AGENT_TOOLS[toolName];
  return (await tool(state)) as AgentToolResult;
}

/**
 * Handle one customer message.
 */
export async function handleAgentMessage(
  message: string,
  state: AgentState
): Promise<AgentMessageResult> {
  if (isGeminiConfigured()) {
    const result = await handleWithGemini(message, state);
    if (result) return result;
  }

  return handleDeterministically(message, state);
}

/**
 * Gemini-driven turn: classify the intent, call a tool if needed and let the
 * model write the reply.
 */
async function handleWithGemini(
  message: string,
  state: AgentState
): Promise<AgentMessageResult | null> {
  const history = (state.context.history ?? []).map((turn) => ({
    role: turn.role,
    text: turn.text,
  }));

  const response = await generateContent({
    system: AGENT_SYSTEM_PROMPT,
    prompt: message,
    history,
    tools: AGENT_FUNCTION_DECLARATIONS,
    temperature: 0.4,
  });

  if (!response) return null;

  // The model asked for a tool — run it and hand the result back.
  if (response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    const toolName = call.name as keyof typeof AGENT_TOOLS;

    if (!(toolName in AGENT_TOOLS)) {
      return {
        status: 'error',
        data: { error: `Unknown tool "${call.name}"` },
        next_action: 'escalate_to_human',
      };
    }

    try {
      const toolResult = await runTool(toolName, state, call.args);

      // Let the model turn the tool output into a customer friendly reply.
      const followUp = await generateContent({
        system: AGENT_SYSTEM_PROMPT,
        prompt: `A function returned this result. Answer the customer's question using only these facts:\n${JSON.stringify(
          toolResult
        )}`,
        temperature: 0.4,
      });

      return {
        status: 'success',
        data: {
          ...toolResult,
          reply: followUp?.text ?? null,
          tool: toolName,
        },
        next_action: determineNextAction(toolResult),
      };
    } catch (error) {
      console.error('Agent tool call failed:', error);
      return {
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        next_action: 'escalate_to_human',
      };
    }
  }

  // No tool call — the model answered directly.
  const reply = response.text ?? '';
  return {
    status: 'success',
    data: { reply, message: reply },
    next_action: 'continue_conversation',
  };
}

/**
 * Deterministic turn, used when Gemini is unavailable.
 */
async function handleDeterministically(
  message: string,
  state: AgentState
): Promise<AgentMessageResult> {
  const { detectIntent, extractPaxCount } = await import('./agent-intent');
  const intent = detectIntent(message);

  state.context.intent = intent;
  state.lastAction = mapIntentToAction(intent);
  state.activeFlow = mapIntentToFlow(intent);

  // Pick up the party size from the message so the price is right.
  const paxCount = extractPaxCount(message);
  if (paxCount !== undefined) {
    state.context.paxCount = paxCount;
  }

  const tool = getToolForIntent(intent);
  if (!tool) {
    return handleUnknownIntent();
  }

  try {
    const result = await tool(state);
    return {
      status: 'success',
      data: result,
      next_action: determineNextAction(result),
    };
  } catch (error) {
    console.error('Agent error:', error);
    return {
      status: 'error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      next_action: 'escalate_to_human',
    };
  }
}

/**
 * Determine the next action based on the tool result.
 */
export function determineNextAction(result: AgentToolResult): string {
  if ('available' in result && result.available === false) return 'suggest_alternative_date';
  if ('totalPrice' in result && result.totalPrice && result.paxCount) return 'confirm_booking';
  if ('bookingCode' in result && result.bookingCode) return 'payment_initiated';
  if ('sent' in result && result.sent) return 'confirmation_sent';
  if ('policy' in result && result.policy) return 'policy_shown';
  return 'continue_conversation';
}

/**
 * Fallback reply when the intent does not map to a tool.
 */
export function handleUnknownIntent(): AgentMessageResult {
  return {
    status: 'fallback',
    data: {
      message:
        'Maaf, saya tidak memahami pertanyaan Anda. Bisakah Anda ulangi atau pilih dari menu berikut?',
    },
    next_action: 'show_menu',
  };
}

function mapIntentToAction(intent: Intent): AgentState['lastAction'] {
  switch (intent) {
    case 'greeting':
      return 'welcome';
    case 'booking_request':
      return 'booking';
    case 'refund_inquiry':
      return 'refund';
    default:
      return 'info';
  }
}

function mapIntentToFlow(intent: Intent): AgentState['activeFlow'] {
  switch (intent) {
    case 'greeting':
      return 'greeting';
    case 'product_inquiry':
    case 'location_inquiry':
    case 'availability_inquiry':
      return 'product_search';
    case 'price_inquiry':
      return 'price_check';
    case 'booking_request':
      return 'booking_flow';
    case 'refund_inquiry':
      return 'refund_policy';
    default:
      return 'greeting';
  }
}
