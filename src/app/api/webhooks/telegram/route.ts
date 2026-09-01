/**
 * Telegram Webhook Handler
 * Receives incoming Telegram messages and processes them through the AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { telegramClient } from '@/lib/telegram';
import { handleAgentMessage } from '@/lib/agent-service';
import { AgentState } from '@/lib/agent';

// In-memory session store (use Redis in production)
const sessions = new Map<string, AgentState>();

function getOrCreateSession(userId: string): AgentState {
  let session = sessions.get(userId);
  if (!session) {
    session = {
      sessionId: `tg_${userId}`,
      channel: 'telegram',
      userId,
      language: 'id',
      context: { intent: 'greeting' },
      lastAction: 'welcome',
      activeFlow: 'greeting',
    };
    sessions.set(userId, session);
  }
  return session;
}

function formatResponse(data: any, nextAction: string): string {
  if (data?.error) {
    return `Maaf, terjadi kesalahan: ${data.error}`;
  }

  switch (nextAction) {
    case 'confirm_booking':
      return `Harga: Rp ${data.totalPrice?.toLocaleString('id-ID')} untuk ${data.paxCount} orang (${data.tier}). Konfirmasi booking?`;
    case 'payment_initiated':
      return `Booking Anda dibuat dengan kode: ${data.bookingCode}. Silakan lakukan pembayaran di: ${data.paymentLink}`;
    case 'confirmation_sent':
      return 'Konfirmasi booking telah dikirim ke Telegram Anda!';
    case 'policy_shown':
      return data.policy || 'Berikut adalah kebijakan refund kami...';
    case 'suggest_alternative_date':
      return `Maaf, tidak ada slot tersedia untuk tanggal tersebut. Coba tanggal lain?`;
    case 'show_menu':
      return data.message || 'Silakan pilih menu: /start untuk mulai lagi';
    default:
      if (data?.venture) {
        return `<b>${data.venture.name}</b>\n\n${data.venture.description}`;
      }
      if (data?.slots) {
        return `Slot tersedia:\n${data.slots.map((s: { time: string; capacity: number; booked: number }) => `• ${s.time} (${s.capacity - s.booked} tersisa)`).join('\n')}`;
      }
      if (data?.message) {
        return data.message;
      }
      return 'Terima kasih! Ada yang bisa saya bantu?';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse webhook
    const updates = telegramClient.parseWebhook(body);
    
    for (const update of updates) {
      if (update.message?.text) {
        const userId = update.message.from.id.toString();
        const session = getOrCreateSession(userId);
        
        // Handle /start command
        if (update.message.text === '/start') {
          const result = await handleAgentMessage('halo', session);
          const responseText = formatResponse(result.data, result.next_action);
          if (session.userId) {
            await telegramClient.sendMessage(session.userId, responseText, { parseMode: 'HTML' });
          }
          continue;
        }
        
        const result = await handleAgentMessage(update.message.text, session);
        const responseText = formatResponse(result.data, result.next_action);
        if (session.userId) {
          await telegramClient.sendMessage(session.userId, responseText, { parseMode: 'HTML' });
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}