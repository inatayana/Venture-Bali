import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleAgentMessage } from '@/lib/agent-service';
import { formatAgentReply } from '@/lib/agentReply';
import {
  appendHistory,
  loadAgentSession,
  saveAgentSession,
} from '@/lib/agentSessionStore';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const chatSchema = z.object({
  message: z.string().trim().min(1, 'A message is required').max(2000),
  sessionId: z.string().trim().min(1).max(120).optional(),
  channel: z.enum(['whatsapp', 'telegram', 'web']).default('web'),
  language: z.enum(['id', 'en', 'ja', 'zh']).default('id'),
});

export async function POST(request: Request) {
  const limit = rateLimit(`chat:${clientIp(request)}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many messages. Please wait a moment.' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The chat payload is invalid',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const { message, channel, language } = parsed.data;
  const sessionKey = parsed.data.sessionId ?? `web_${Date.now()}`;

  try {
    const state = await loadAgentSession({ sessionKey, channel, language });

    const result = await handleAgentMessage(message, state);

    // Keep the context for the next turn.
    await appendHistory(state, { role: 'user', text: message });
    if (typeof result.data === 'object' && result.data !== null && 'reply' in result.data) {
      const reply = (result.data as { reply?: string | null }).reply;
      if (typeof reply === 'string' && reply.length > 0) {
        await appendHistory(state, { role: 'model', text: reply });
      }
    }
    await saveAgentSession(state);

    return NextResponse.json({
      success: true,
      data: { ...result, reply: formatAgentReply(result) },
      sessionId: state.sessionId,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process message' } },
      { status: 500 }
    );
  }
}
