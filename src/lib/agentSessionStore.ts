/**
 * BaliWild — Agent Session Store
 * -----------------------------------
 * Persists the customer service agent conversations in the database.
 *
 * The agent used to keep its state in an in-memory Map, which is lost on
 * every serverless cold start and is not shared between instances, so the
 * agent forgot the conversation between two messages. Storing the session
 * in the `AgentSession` table keeps the context across turns and across
 * instances.
 *
 * Docs: BaliWild_PRD_PPS.md §10.3 (Session Management)
 */

import { prisma } from '@/lib/prisma';
import type { AgentState, Intent } from '@/lib/agent';

export type AgentChannel = 'whatsapp' | 'telegram' | 'web';
export type AgentLanguage = 'id' | 'en' | 'ja' | 'zh';

export interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

/** How many turns of context are kept per session. */
export const MAX_HISTORY_TURNS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseHistory(value: unknown): HistoryTurn[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((turn) => {
    if (!isRecord(turn)) return [];
    const role = turn.role === 'model' ? 'model' : 'user';
    const text = typeof turn.text === 'string' ? turn.text : null;
    return text !== null ? [{ role, text }] : [];
  });
}

function truncateHistory(history: HistoryTurn[]): HistoryTurn[] {
  return history.slice(-MAX_HISTORY_TURNS);
}

/**
 * Load a session, creating it when it does not exist yet.
 */
export async function loadAgentSession(params: {
  sessionKey: string;
  channel: AgentChannel;
  language?: AgentLanguage;
  userId?: string;
  phone?: string;
}): Promise<AgentState> {
  const existing = await prisma.agentSession.findUnique({
    where: { sessionKey: params.sessionKey },
  });

  if (!existing) {
    const created = await prisma.agentSession.create({
      data: {
        sessionKey: params.sessionKey,
        channel: params.channel,
        language: params.language ?? 'id',
        userId: params.userId ?? null,
        phone: params.phone ?? null,
        history: [],
      },
    });

    return toAgentState(created);
  }

  return toAgentState(existing);
}

/**
 * Persist the session state.
 */
export async function saveAgentSession(state: AgentState): Promise<void> {
  const history = truncateHistory(state.context.history ?? []);

  await prisma.agentSession.update({
    where: { sessionKey: state.sessionId },
    data: {
      channel: state.channel,
      language: state.language,
      userId: state.userId ?? null,
      phone: state.phone ?? null,
      productId: state.context.productId ?? null,
      variantId: state.context.variantId ?? null,
      paxCount: state.context.paxCount ?? null,
      bookingDate: state.context.bookingDate ?? null,
      intent: state.context.intent,
      history: history as unknown as object,
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Append a turn to the session history and persist it.
 */
export async function appendHistory(
  state: AgentState,
  turn: HistoryTurn
): Promise<void> {
  const history = truncateHistory([...(state.context.history ?? []), turn]);
  state.context.history = history;

  await prisma.agentSession.update({
    where: { sessionKey: state.sessionId },
    data: {
      history: history as unknown as object,
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Remove sessions that have been idle for longer than the given days.
 */
export async function pruneAgentSessions(olderThanDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await prisma.agentSession.deleteMany({
    where: { lastActiveAt: { lt: cutoff } },
  });
  return result.count;
}

// ============ MAPPING ============

type SessionRow = {
  sessionKey: string;
  channel: string;
  language: string;
  userId: string | null;
  phone: string | null;
  productId: string | null;
  variantId: string | null;
  paxCount: number | null;
  bookingDate: string | null;
  intent: string | null;
  history: unknown;
};

function toAgentState(row: SessionRow): AgentState {
  return {
    sessionId: row.sessionKey,
    channel: (row.channel as AgentChannel) ?? 'web',
    userId: row.userId ?? undefined,
    phone: row.phone ?? undefined,
    language: (row.language as AgentLanguage) ?? 'id',
    context: {
      intent: (row.intent as Intent) ?? 'general_question',
      productId: row.productId ?? undefined,
      variantId: row.variantId ?? undefined,
      paxCount: row.paxCount ?? undefined,
      bookingDate: row.bookingDate ?? undefined,
      history: parseHistory(row.history),
    },
    lastAction: 'info',
    activeFlow: 'greeting',
  };
}
