/**
 * Telegram Webhook Handler
 * Receives incoming Telegram messages and processes them through the AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { telegramClient } from '@/lib/telegram';
import { handleAgentMessage } from '@/lib/agent-service';
import {
  appendHistory,
  loadAgentSession,
  saveAgentSession,
} from '@/lib/agentSessionStore';

export const dynamic = 'force-dynamic';

function formatResponse(data: unknown, nextAction: string): string {
  const payload = data as Record<string, unknown> | null;

  if (!payload) return 'Terima kasih! Ada yang bisa saya bantu?';

  if (typeof payload.error === 'string') {
    return `Maaf, terjadi kesalahan: ${payload.error}`;
  }

  if (typeof payload.reply === 'string' && payload.reply.length > 0) {
    return payload.reply;
  }

  switch (nextAction) {
    case 'confirm_booking':
      return `Harga: Rp ${Number(payload.totalPrice ?? 0).toLocaleString('id-ID')} untuk ${payload.paxCount} orang (${payload.tier}). Konfirmasi booking?`;
    case 'payment_initiated':
      return `Booking Anda dibuat dengan kode: ${payload.bookingCode}. Silakan lakukan pembayaran di: ${payload.paymentLink}`;
    case 'confirmation_sent':
      return 'Konfirmasi booking telah dikirim ke Telegram Anda!';
    case 'policy_shown':
      return typeof payload.policy === 'string'
        ? payload.policy
        : 'Berikut adalah kebijakan refund kami...';
    case 'suggest_alternative_date':
      return 'Maaf, tidak ada slot tersedia untuk tanggal tersebut. Coba tanggal lain?';
    case 'show_menu':
      return typeof payload.message === 'string'
        ? payload.message
        : 'Silakan pilih menu: /start untuk mulai lagi';
    default: {
      const venture = payload.venture as { title?: string; description?: string } | undefined;
      if (venture?.title) {
        return `<b>${venture.title}</b>\n\n${venture.description ?? ''}`;
      }
      if (Array.isArray(payload.slots)) {
        const slots = payload.slots as { time: string; capacity: number; booked: number }[];
        return `Slot tersedia:\n${slots
          .map((slot) => `• ${slot.time} (${slot.capacity - slot.booked} tersisa)`)
          .join('\n')}`;
      }
      if (typeof payload.message === 'string') return payload.message;
      return 'Terima kasih! Ada yang bisa saya bantu?';
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const provided = request.headers.get('x-telegram-bot-api-secret-token');

    if (secret) {
      if (provided !== secret) {
        return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('TELEGRAM_WEBHOOK_SECRET is not configured — refusing webhook calls');
      return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
    }

    const body = await request.json();
    const updates = telegramClient.parseWebhook(body);

    for (const update of updates) {
      if (!update.message?.text) continue;

      const userId = update.message.from.id.toString();
      const sessionKey = `tg_${userId}`;

      const state = await loadAgentSession({
        sessionKey,
        channel: 'telegram',
        language: 'id',
        userId,
      });

      const text = update.message.text;

      // Handle /start as a greeting.
      const input = text === '/start' ? 'halo' : text;

      const result = await handleAgentMessage(input, state);
      const responseText = formatResponse(result.data, result.next_action);

      await appendHistory(state, { role: 'user', text: input });
      await appendHistory(state, { role: 'model', text: responseText });
      await saveAgentSession(state);

      await telegramClient.sendMessage(userId, responseText, { parseMode: 'HTML' });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
