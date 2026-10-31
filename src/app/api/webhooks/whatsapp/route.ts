/**
 * WhatsApp Webhook Handler
 * Receives incoming WhatsApp messages and processes them through the AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp';
import { verifyMetaSignature } from '@/lib/webhookSignature';
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
      return 'Konfirmasi booking telah dikirim ke WhatsApp Anda!';
    case 'policy_shown':
      return typeof payload.policy === 'string'
        ? payload.policy
        : 'Berikut adalah kebijakan refund kami...';
    case 'suggest_alternative_date':
      return 'Maaf, tidak ada slot tersedia untuk tanggal tersebut. Coba tanggal lain?';
    case 'show_menu':
      return typeof payload.message === 'string'
        ? payload.message
        : 'Silakan pilih menu: 1. Cari Aktivitas 2. Cek Harga 3. Booking 4. Kebijakan Refund';
    default: {
      const venture = payload.venture as { title?: string; description?: string } | undefined;
      if (venture?.title) {
        return `${venture.title} - ${venture.description ?? ''}`;
      }
      if (Array.isArray(payload.slots)) {
        const slots = payload.slots as { time: string; capacity: number; booked: number }[];
        return `Slot tersedia: ${slots
          .map((slot) => `${slot.time} (${slot.capacity - slot.booked} tersisa)`)
          .join(', ')}`;
      }
      if (typeof payload.message === 'string') return payload.message;
      return 'Terima kasih! Ada yang bisa saya bantu?';
    }
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Fail closed: without a configured token nobody can complete the handshake.
  if (!verifyToken) {
    console.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured');
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get('x-hub-signature-256');
    if (!verifyMetaSignature(rawBody, signature, appSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Fail closed: an unsigned endpoint would let anyone forge guest messages.
    console.error('WHATSAPP_APP_SECRET is not configured — refusing webhook calls');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }

  try {
    const body = JSON.parse(rawBody);
    const entries = whatsappClient.parseWebhook(body);

    for (const entry of entries) {
      const messages = whatsappClient.extractMessages(entry);

      for (const msg of messages) {
        const sessionKey = `wa_${msg.from}`;

        const state = await loadAgentSession({
          sessionKey,
          channel: 'whatsapp',
          language: 'id',
          phone: msg.from,
        });

        const result = await handleAgentMessage(msg.text, state);
        const responseText = formatResponse(result.data, result.next_action);

        await appendHistory(state, { role: 'user', text: msg.text });
        await appendHistory(state, { role: 'model', text: responseText });
        await saveAgentSession(state);

        await whatsappClient.sendTextMessage(msg.from, responseText);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
