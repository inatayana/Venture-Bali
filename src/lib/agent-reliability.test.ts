import { determineNextAction, AGENT_SYSTEM_PROMPT } from './agent-service';
import { formatAgentReply } from './agentReply';
import { createBooking, sendBookingConfirmation } from './tools';
import type { AgentToolResult } from './agent';
import { prisma } from '@/lib/prisma';
import type { AgentState } from './agent';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    venture: { findFirst: jest.fn() },
  },
}));

const mockedFindFirst = prisma.venture.findFirst as jest.Mock;

function state(): AgentState {
  return {
    sessionId: 'session-1',
    channel: 'web',
    language: 'en',
    context: { intent: 'booking_request', productId: 'v1', paxCount: 2 },
    lastAction: 'info',
    activeFlow: 'booking_flow',
  };
}

function asResult(value: Record<string, unknown>): AgentToolResult {
  return value as unknown as AgentToolResult;
}

beforeEach(() => {
  mockedFindFirst.mockReset().mockResolvedValue(null);
});

describe('agent booking honesty', () => {
  it('returns a quote with no booking code and no persistence claim', async () => {
    const result = await createBooking(state());
    expect(result.persisted).toBe(false);
    expect(result.status).toBe('quote_only');
    expect(result.bookingCode).toBe('');
    expect(result.paymentLink).toContain('/');
  });

  it('never fabricates a sent confirmation or message id', async () => {
    const result = await sendBookingConfirmation();
    expect(result.sent).toBe(false);
    expect(result.messageId).toBe('');
    expect(result.reason).toBeTruthy();
  });

  it('instructs the model not to claim bookings or confirmations', () => {
    expect(AGENT_SYSTEM_PROMPT).toContain('QUOTE ONLY');
    expect(AGENT_SYSTEM_PROMPT).toContain('Never say a booking was created');
    expect(AGENT_SYSTEM_PROMPT).toContain('Never claim one was sent');
  });
});

describe('determineNextAction', () => {
  it('maps a quote-only tool result to quote_prepared', () => {
    const result = determineNextAction(asResult({
      status: 'quote_only',
      bookingCode: '',
      persisted: false,
      totalPrice: 900000,
      paxCount: 2,
    }));
    expect(result).toBe('quote_prepared');
  });

  it('does not treat a PENDING code as a real booking', () => {
    const result = determineNextAction(asResult({
      bookingCode: 'PENDING',
      persisted: false,
      paymentLink: '/experiences/x/y',
    }));
    expect(result).not.toBe('payment_initiated');
  });

  it('allows payment_initiated only for a persisted booking', () => {
    const result = determineNextAction(asResult({
      bookingCode: 'BW-2026-1',
      persisted: true,
      paymentLink: '/checkout/abc',
    }));
    expect(result).toBe('payment_initiated');
  });

  it('maps an unsent confirmation to confirmation_unavailable', () => {
    const result = determineNextAction(asResult({
      sent: false,
      messageId: '',
      timestamp: new Date().toISOString(),
    }));
    expect(result).toBe('confirmation_unavailable');
  });

  it('keeps confirmation_sent for a real provider result', () => {
    const result = determineNextAction(asResult({
      sent: true,
      messageId: 'real-id',
      timestamp: new Date().toISOString(),
    }));
    expect(result).toBe('confirmation_sent');
  });
});

describe('deterministic reply copy', () => {
  it('says no booking exists yet for a quote', () => {
    const reply = formatAgentReply({
      data: { status: 'quote_only', totalPrice: 900000, paxCount: 2, paymentLink: '/experiences/v/s' },
      next_action: 'quote_prepared',
    });
    expect(reply).toContain('No booking has been made yet');
    expect(reply).not.toContain('has been sent');
  });

  it('does not claim a confirmation was sent when none was', () => {
    const reply = formatAgentReply({
      data: { sent: false, messageId: '' },
      next_action: 'confirmation_unavailable',
    });
    expect(reply).toContain('No message has been sent yet');
  });
});
