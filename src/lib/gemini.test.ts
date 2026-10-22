import {
  DEFAULT_GEMINI_MODEL,
  generateContent,
  generateJson,
  generateText,
  isGeminiConfigured,
} from './gemini';

const ORIGINAL_KEY = process.env.GEMINI_API_KEY;

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  delete process.env.GEMINI_MODEL;
  global.fetch = jest.fn() as unknown as typeof fetch;
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = ORIGINAL_KEY;
  }
});

/** Queue a successful Gemini response with the given payload. */
function mockGemini(payload: unknown) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });
}

/** Queue a failed Gemini response. */
function mockGeminiError(status: number, body = 'error') {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => body,
  });
}

/** Build a Gemini payload with the given parts. */
function geminiPayload(parts: unknown[]) {
  return { candidates: [{ content: { parts } }] };
}

describe('isGeminiConfigured', () => {
  it('is false without an API key', () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
  });

  it('is true with an API key', () => {
    expect(isGeminiConfigured()).toBe(true);
  });
});

describe('generateContent', () => {
  it('returns null without an API key and never calls the network', async () => {
    delete process.env.GEMINI_API_KEY;

    expect(await generateContent({ prompt: 'hello' })).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends the prompt, the system instruction and the tools', async () => {
    mockGemini(geminiPayload([{ text: 'Hi' }]));

    await generateContent({
      system: 'Be helpful',
      prompt: 'What is the price?',
      tools: [
        {
          name: 'calculatePrice',
          description: 'Calculate a price',
          parameters: { type: 'object', properties: {} },
        },
      ],
    });

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const init = call[1];

    expect(init.method).toBe('POST');
    expect(init.headers['x-goog-api-key']).toBe('test-key');

    const body = JSON.parse(init.body);
    expect(body.systemInstruction.parts[0].text).toBe('Be helpful');
    expect(body.contents[0].parts[0].text).toBe('What is the price?');
    expect(body.tools[0].functionDeclarations[0].name).toBe('calculatePrice');
  });

  it('sends the conversation history before the new prompt', async () => {
    mockGemini(geminiPayload([{ text: 'Sure' }]));

    await generateContent({
      prompt: 'And tomorrow?',
      history: [
        { role: 'user', text: 'What slots are free?' },
        { role: 'model', text: 'These ones.' },
      ],
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.contents).toHaveLength(3);
    expect(body.contents[0].parts[0].text).toBe('What slots are free?');
    expect(body.contents[1].role).toBe('model');
    expect(body.contents[2].parts[0].text).toBe('And tomorrow?');
  });

  it('uses the default model and honours an override', async () => {
    mockGemini(geminiPayload([{ text: 'x' }]));

    await generateContent({ prompt: 'a' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(DEFAULT_GEMINI_MODEL);

    await generateContent({ prompt: 'a', model: 'gemini-custom' });
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('gemini-custom');
  });

  it('collects the text parts', async () => {
    mockGemini(geminiPayload([{ text: 'Hello ' }, { text: 'world' }]));

    const result = await generateContent({ prompt: 'a' });
    // Multiple parts are joined with a newline so markdown keeps its shape.
    expect(result?.text).toBe('Hello \nworld');
    expect(result?.functionCalls).toEqual([]);
  });

  it('collects the function calls', async () => {
    mockGemini(
      geminiPayload([{ functionCall: { name: 'calculatePrice', args: { paxCount: 2 } } }])
    );

    const result = await generateContent({ prompt: 'a' });
    expect(result?.functionCalls).toEqual([{ name: 'calculatePrice', args: { paxCount: 2 } }]);
    expect(result?.text).toBeNull();
  });

  it('returns null when the API responds with an error', async () => {
    mockGeminiError(429, 'rate limited');

    expect(await generateContent({ prompt: 'a' })).toBeNull();
  });

  it('returns null when the request throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    expect(await generateContent({ prompt: 'a' })).toBeNull();
  });
});

describe('generateText', () => {
  it('returns the generated text', async () => {
    mockGemini(geminiPayload([{ text: 'Answer' }]));

    expect(await generateText('a')).toBe('Answer');
  });

  it('returns null when the model produces nothing', async () => {
    mockGemini(geminiPayload([]));

    expect(await generateText('a')).toBeNull();
  });
});

describe('generateJson', () => {
  it('parses plain JSON', async () => {
    mockGemini(geminiPayload([{ text: '{"intent":"greeting"}' }]));

    expect(await generateJson<{ intent: string }>('a')).toEqual({ intent: 'greeting' });
  });

  it('strips a markdown code fence', async () => {
    mockGemini(geminiPayload([{ text: '```json\n{"intent":"greeting"}\n```' }]));

    expect(await generateJson<{ intent: string }>('a')).toEqual({ intent: 'greeting' });
  });

  it('returns null when the answer is not JSON', async () => {
    mockGemini(geminiPayload([{ text: 'not json at all' }]));

    expect(await generateJson('a')).toBeNull();
  });
});
