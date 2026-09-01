/**
 * WhatsApp Webhook Handler
 * Receives incoming WhatsApp messages and processes them through the AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp';
import { handleAgentMessage } from '@/lib/agent-service';
import { AgentState } from '@/lib/agent';

// In-memory session store (use Redis in production)
const sessions = new Map<string, AgentState>();

function getOrCreateSession(phoneNumber: string): AgentState {
  let session = sessions.get(phoneNumber);
  if (!session) {
    session = {
      sessionId: `wa_${phoneNumber}`,
      channel: 'whatsapp',
      phone: phoneNumber,
      language: 'id',
      context: { intent: 'greeting' },
      lastAction: 'welcome',
      activeFlow: 'greeting',
    };
    sessions.set(phoneNumber, session);
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
      return 'Konfirmasi booking telah dikirim ke WhatsApp Anda!';
    case 'policy_shown':
      return data.policy || 'Berikut adalah kebijakan refund kami...';
    case 'suggest_alternative_date':
      return `Maaf, tidak ada slot tersedia untuk tanggal tersebut. Coba tanggal lain?`;
    case 'show_menu':
      return data.message || 'Silakan pilih menu: 1. Cari Aktivitas 2. Cek Harga 3. Booking 4. Kebijakan Refund';
    default:
      if (data?.venture) {
        return `${data.venture.name} - ${data.venture.description}`;
      }
      if (data?.slots) {
        return `Slot tersedia: ${data.slots.map((s: { time: string; capacity: number; booked: number }) => `${s.time} (${s.capacity - s.booked} tersisa)`).join(', ')}`;
      }
      if (data?.message) {
        return data.message;
      }
      return 'Terima kasih! Ada yang bisa saya bantu?';
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'venture_bali_verify';

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse webhook
    const entries = whatsappClient.parseWebhook(body);
    
    for (const entry of entries) {
      const messages = whatsappClient.extractMessages(entry);
      
      for (const msg of messages) {
        const session = getOrCreateSession(msg.from);
        const result = await handleAgentMessage(msg.text, session);
        const responseText = formatResponse(result.data, result.next_action);
        
        await whatsappClient.sendTextMessage(msg.from, responseText);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}