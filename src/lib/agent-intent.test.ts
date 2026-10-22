import { detectIntent, detectIntentWithModel, extractPaxCount } from './agent-intent';

jest.mock('./gemini', () => ({
  ...jest.requireActual('./gemini'),
  isGeminiConfigured: jest.fn(),
  generateJson: jest.fn(),
}));

import { generateJson, isGeminiConfigured } from './gemini';

const mockedIsConfigured = isGeminiConfigured as jest.Mock;
const mockedGenerateJson = generateJson as jest.Mock;

beforeEach(() => {
  mockedIsConfigured.mockReset();
  mockedGenerateJson.mockReset();
});

describe('detectIntent (keyword matcher)', () => {
  it.each([
    ['halo', 'greeting'],
    ['hello there', 'greeting'],
    ['selamat pagi', 'greeting'],
    ['how much is the ATV ride', 'price_inquiry'],
    ['berapa harganya', 'price_inquiry'],
    ['what slots are available tomorrow', 'availability_inquiry'],
    ['kapan bisa booking', 'availability_inquiry'],
    ['I want to book the rafting', 'booking_request'],
    ['memesan paket combo', 'booking_request'],
    ['what is your refund policy', 'refund_inquiry'],
    ['bisa cancel booking saya', 'refund_inquiry'],
    ['where is the meeting point', 'location_inquiry'],
    ['dimana lokasi activity', 'location_inquiry'],
    ['show me the ATV activities', 'product_inquiry'],
    ['rekomendasi snorkeling dong', 'product_inquiry'],
    ['I want to speak to a human', 'escalation'],
    ['', 'general_question'],
    ['asdkjhasd', 'general_question'],
  ])('classifies "%s" as %s', (message, expected) => {
    expect(detectIntent(message)).toBe(expected);
  });

  it('never returns an intent outside the known list', () => {
    const known = [
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

    [
      'hello',
      'harga',
      'refund',
      'book',
      'where',
      'atv',
      'human',
      'xyz',
    ].forEach((message) => {
      expect(known).toContain(detectIntent(message));
    });
  });
});

describe('extractPaxCount', () => {
  it.each([
    ['berapa harga untuk 2 orang', 2],
    ['harga untuk 4 orang', 4],
    ['price for 3 people', 3],
    ['2 pax please', 2],
    ['book for 6 participants', 6],
    ['how much for 2 travellers', 2],
  ])('extracts %s as %s pax', (message, expected) => {
    expect(extractPaxCount(message)).toBe(expected);
  });

  it('returns undefined when there is no party size', () => {
    expect(extractPaxCount('what activities do you have?')).toBeUndefined();
    expect(extractPaxCount('')).toBeUndefined();
  });

  it('ignores an implausible party size', () => {
    expect(extractPaxCount('0 orang')).toBeUndefined();
    expect(extractPaxCount('999 orang')).toBeUndefined();
  });
});

describe('detectIntentWithModel', () => {
  it('uses the keyword matcher when Gemini is not configured', async () => {
    mockedIsConfigured.mockReturnValue(false);

    expect(await detectIntentWithModel('berapa harganya')).toBe('price_inquiry');
    expect(mockedGenerateJson).not.toHaveBeenCalled();
  });

  it('uses the model answer when Gemini returns a valid intent', async () => {
    mockedIsConfigured.mockReturnValue(true);
    mockedGenerateJson.mockResolvedValue({ intent: 'refund_inquiry' });

    expect(await detectIntentWithModel('apa saja kebijakan pembatalan')).toBe('refund_inquiry');
  });

  it('falls back to the keyword matcher when the model returns an unknown intent', async () => {
    mockedIsConfigured.mockReturnValue(true);
    mockedGenerateJson.mockResolvedValue({ intent: 'not_an_intent' });

    expect(await detectIntentWithModel('berapa harganya')).toBe('price_inquiry');
  });

  it('falls back to the keyword matcher when the model returns nothing', async () => {
    mockedIsConfigured.mockReturnValue(true);
    mockedGenerateJson.mockResolvedValue(null);

    expect(await detectIntentWithModel('berapa harganya')).toBe('price_inquiry');
  });
});
