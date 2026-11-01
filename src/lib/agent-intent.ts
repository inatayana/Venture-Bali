/**
 * BaliWild — Intent Detection
 * --------------------------------
 * Classifies what the customer wants.
 *
 * The keyword matcher is deterministic, needs no API key and always works.
 * When Gemini is available it is asked first, and the keyword matcher is
 * the fallback — so a mis-classification never leaves the customer stuck.
 *
 * Docs: BaliWild_PRD_PPS.md §10.6 (Intent Classification)
 */

import type { Intent } from './agent';
import { generateJson, isGeminiConfigured } from './gemini';

const INTENTS: Intent[] = [
  'greeting',
  'product_inquiry',
  'price_inquiry',
  'availability_inquiry',
  'booking_request',
  'refund_inquiry',
  'location_inquiry',
  'general_question',
  'escalation',
];

/**
 * Keyword based intent detection. Always available.
 */
export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase().trim();

  if (lower === '') return 'general_question';

  if (
    ['hello', 'hi', 'hey', 'salam', 'hola', 'halo', 'hai', 'selamat', 'good morning', 'good evening'].some(
      (keyword) => lower.startsWith(keyword) || lower === keyword
    )
  ) {
    return 'greeting';
  }

  if (
    ['refund', 'cancel', 'kembalian', 'batal', 'refund policy', 'cancellation', 'reschedule', 'uang kembali'].some(
      (keyword) => lower.includes(keyword)
    )
  ) {
    return 'refund_inquiry';
  }

  if (
    ['price', 'cost', 'how much', 'harga', 'biaya', 'fee', 'berapa', 'murah'].some((keyword) =>
      lower.includes(keyword)
    )
  ) {
    return 'price_inquiry';
  }

  if (
    ['when', 'time', 'available', 'slot', 'kapan', 'tersedia', 'jam', 'schedule', 'jadwal'].some((keyword) =>
      lower.includes(keyword)
    )
  ) {
    return 'availability_inquiry';
  }

  if (
    [
      'book',
      'reserve',
      'membuat',
      'pesan',
      'memesan',
      'booking',
      'order',
      'checkout',
      'beli',
    ].some((keyword) => lower.includes(keyword))
  ) {
    return 'booking_request';
  }

  if (
    ['address', 'lokasi', 'alamat', 'meeting point', 'pickup', 'where', 'dimana', 'di mana'].some((keyword) =>
      lower.includes(keyword)
    )
  ) {
    return 'location_inquiry';
  }

  if (
    [
      'product',
      'what',
      'which',
      'see',
      'show',
      'activities',
      'atv',
      'rafting',
      'tubing',
      'snorkeling',
      'trek',
      'cycling',
      'water sport',
      'canyoning',
      'combo',
      'rekomendasi',
      'recommend',
    ].some((keyword) => lower.includes(keyword))
  ) {
    return 'product_inquiry';
  }

  if (
    ['human', 'agent', 'manager', 'complain', 'komplain', 'refund agent', 'human please'].some((keyword) =>
      lower.includes(keyword)
    )
  ) {
    return 'escalation';
  }

  return 'general_question';
}

/**
 * Extract the number of travellers from a message.
 * Handles English ("for 2 people") and Indonesian ("untuk 2 orang").
 */
export function extractPaxCount(message: string): number | undefined {
  const patterns = [
    /(\d+)\s*(?:pax|person|persons|people|participant|participants|traveler|travelers|orang|peserta|pelanggan)/i,
    /(?:for|untuk)\s*(\d+)/i,
    /(\d+)\s*(?:orang|people)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value > 0 && value <= 50) {
      return value;
    }
  }

  return undefined;
}

/**
 * Classify the intent with Gemini, falling back to the keyword matcher.
 */
export async function detectIntentWithModel(message: string): Promise<Intent> {
  if (!isGeminiConfigured()) {
    return detectIntent(message);
  }

  const result = await generateJson<{ intent?: string }>(
    `Classify the customer message below into exactly one intent.\n\nIntents: ${INTENTS.join(', ')}\n\nMessage: "${message}"\n\nReply with JSON only: {"intent": "<one of the intents>"}`,
    { temperature: 0 }
  );

  const intent = result?.intent as Intent | undefined;

  if (intent && INTENTS.includes(intent)) {
    return intent;
  }

  return detectIntent(message);
}
