/**
 * Venture Bali — Gemini Client
 * ----------------------------
 * A thin client for the Gemini REST API.
 *
 * Uses `fetch` against the public REST endpoint, so no new npm dependency
 * is needed. Every function degrades gracefully: when GEMINI_API_KEY is not
 * configured, the caller receives `null` instead of an exception and can
 * fall back to deterministic behaviour.
 *
 * Docs: docs/TECH_DECISION_LOG.md §1 (AI: Gemini Free Tier)
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * The default Gemini model.
 *
 * Google retired the `gemini-2.0-flash` identifier; the API answers 404
 * with "This model is no longer available" when it is used. Keep this
 * default in sync with the current free-tier model, and override it per
 * environment with the `GEMINI_MODEL` variable when a different model is
 * wanted.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/** Abort a Gemini request after this many milliseconds. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * How many times a transient failure is retried.
 * The free tier regularly answers 429 or 503, and a single retry usually
 * succeeds.
 */
const MAX_ATTEMPTS = 3;

/** Base delay for the exponential backoff between retries. */
const RETRY_BASE_DELAY_MS = 800;

/** HTTP statuses that are worth retrying. */
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * A failed Gemini call, kept so the caller can explain what went wrong
 * instead of showing a generic "could not generate" message.
 */
export interface GeminiFailure {
  status: number | null;
  message: string;
  /** True when the free tier quota is exhausted — retrying will not help. */
  quotaExceeded: boolean;
}

let lastFailure: GeminiFailure | null = null;

/**
 * The reason the most recent Gemini call failed, or null when it succeeded.
 */
export function getLastFailure(): GeminiFailure | null {
  return lastFailure;
}

/**
 * The free tier answers 429 both for a short-lived rate limit and for an
 * exhausted quota. Only the first is worth retrying.
 */
function isQuotaExhausted(status: number, body: string): boolean {
  if (status !== 429) return false;
  return /quota|billing|exceeded your current/i.test(body);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface GeminiContentPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
}

export interface GeminiResponse {
  text: string | null;
  functionCalls: { name: string; args: Record<string, unknown> }[];
  finishReason: string | null;
}

export interface GenerateContentOptions {
  /** System instruction that frames the model's behaviour. */
  system?: string;
  /** The user turn. */
  prompt: string;
  /** Prior conversation turns, oldest first. */
  history?: { role: 'user' | 'model'; text: string }[];
  /** Function declarations the model may call. */
  tools?: GeminiFunctionDeclaration[];
  temperature?: number;
  maxOutputTokens?: number;
  /** Override the model for this call. */
  model?: string;
}

/**
 * True when an API key is available.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return key;
}

function getModel(model?: string): string {
  return model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

/**
 * Call Gemini and return the generated text and any function calls.
 * Returns null when the key is missing or the request keeps failing, so the
 * caller can fall back instead of failing the whole request.
 *
 * Transient failures (429, 503 and friends) are retried with an exponential
 * backoff, because the Gemini free tier throttles and runs out of capacity
 * regularly.
 */
export async function generateContent(
  options: GenerateContentOptions
): Promise<GeminiResponse | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const model = getModel(options.model);
  const url = `${GEMINI_API_BASE}/${model}:generateContent`;

  const contents = [
    ...(options.history ?? []).map((turn) => ({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    })),
    { role: 'user', parts: [{ text: options.prompt }] },
  ];

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  };

  if (options.system) {
    body.systemInstruction = { parts: [{ text: options.system }] };
  }

  if (options.tools && options.tools.length > 0) {
    body.tools = [{ functionDeclarations: options.tools }];
    body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
  }

  let lastError = 'unknown error';
  lastFailure = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': getApiKey(),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        lastError = `HTTP ${response.status}: ${detail.slice(0, 200)}`;

        const quotaExceeded = isQuotaExhausted(response.status, detail);

        lastFailure = {
          status: response.status,
          message: quotaExceeded
            ? 'The Gemini free tier quota is exhausted.'
            : `Gemini request failed with HTTP ${response.status}.`,
          quotaExceeded,
        };

        // An exhausted quota will not recover within a retry window.
        const retryable =
          RETRYABLE_STATUSES.has(response.status) &&
          !quotaExceeded &&
          attempt < MAX_ATTEMPTS;

        if (retryable) {
          const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
          console.warn(
            `Gemini request returned ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS})`
          );
          await sleep(delay);
          continue;
        }

        console.error(`Gemini request failed (${response.status}): ${detail.slice(0, 500)}`);
        return null;
      }

      const payload = (await response.json()) as {
        candidates?: {
          content?: { parts?: GeminiContentPart[] };
          finishReason?: string;
        }[];
      };

      const candidate = payload.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      const text = parts
        .map((part) => part.text)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join('\n')
        .trim();

      const functionCalls = parts
        .filter((part) => part.functionCall)
        .map((part) => ({
          name: part.functionCall!.name,
          args: part.functionCall!.args ?? {},
        }));

      return {
        text: text.length > 0 ? text : null,
        functionCalls,
        finishReason: candidate?.finishReason ?? null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'network error';
      lastFailure = {
        status: null,
        message: `The Gemini request could not be completed (${lastError}).`,
        quotaExceeded: false,
      };

      if (attempt < MAX_ATTEMPTS) {
        const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        console.warn(
          `Gemini request failed (${lastError}), retrying in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS})`
        );
        await sleep(delay);
        continue;
      }

      console.error('Gemini request error:', error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  console.error(`Gemini request failed after ${MAX_ATTEMPTS} attempts: ${lastError}`);
  return null;
}

/**
 * Generate plain text. Returns null when Gemini is unavailable.
 */
export async function generateText(
  prompt: string,
  options: Omit<GenerateContentOptions, 'prompt'> = {}
): Promise<string | null> {
  const result = await generateContent({ ...options, prompt });
  return result?.text ?? null;
}

/**
 * Generate text that must be valid JSON.
 * Returns null when Gemini is unavailable or the answer is not usable JSON.
 */
export async function generateJson<T>(
  prompt: string,
  options: Omit<GenerateContentOptions, 'prompt'> = {}
): Promise<T | null> {
  const result = await generateContent({
    ...options,
    prompt,
    temperature: options.temperature ?? 0.2,
  });

  if (!result?.text) return null;

  const cleaned = result.text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error('Gemini did not return valid JSON');
    return null;
  }
}
