/**
 * Plain-text rendering of an agent result, shared by the web chat and channel
 * adapters. Keeps the widget dumb: the API returns a ready-to-show string.
 */

export interface AgentResultLike {
  data: unknown;
  next_action: string;
}

/** The deterministic agent replies use Markdown bold; keep them readable in plain text channels. */
function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
}

export function formatAgentReply(result: AgentResultLike): string {
  const payload = (result.data as Record<string, unknown> | null) ?? {};

  if (typeof payload.reply === 'string' && payload.reply.length > 0) return stripMarkdown(payload.reply);
  if (typeof payload.message === 'string' && payload.message.length > 0) return stripMarkdown(payload.message);

  switch (result.next_action) {
    case 'confirm_booking':
      return `Price: Rp ${Number(payload.totalPrice ?? 0).toLocaleString('id-ID')} for ${payload.paxCount} guest(s). Shall I confirm the booking?`;
    case 'payment_initiated':
      return `Your booking ${payload.bookingCode} is ready. Continue the payment here: ${payload.paymentLink}`;
    case 'confirmation_sent':
      return 'The booking confirmation has been sent.';
    case 'policy_shown':
      return typeof payload.policy === 'string'
        ? stripMarkdown(payload.policy)
        : 'Here is our refund policy.';
    case 'suggest_alternative_date':
      return 'That date has no slots left. Would you like to try another date?';
    case 'show_menu':
      return 'You can ask me about products, prices, availability, pickup or the refund policy.';
    case 'escalate_to_human':
      return 'I could not answer that one. Please contact our team on WhatsApp and a human will help.';
    default: {
      const venture = payload.venture as { title?: string; description?: string } | undefined;
      if (venture?.title) return `${venture.title}\n\n${stripMarkdown(venture.description ?? '')}`;
      if (Array.isArray(payload.slots)) {
        const slots = payload.slots as Array<{ time: string; capacity: number; booked: number }>;
        return `Available slots:\n${slots
          .map((slot) => `• ${slot.time} (${slot.capacity - slot.booked} left)`)
          .join('\n')}`;
      }
      return 'Thanks! How can I help with your Bali adventure?';
    }
  }
}
