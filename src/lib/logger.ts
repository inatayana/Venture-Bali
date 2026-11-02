/**
 * BaliWild — structured logger
 * ---------------------------------
 * Dependency-free JSON logger used by server routes and services.
 *
 * Rules:
 * - One JSON object per line, so Vercel/host log drains can parse it.
 * - Sensitive keys are redacted before serialization. Never log customer PII,
 *   credentials, cookies or tokens.
 * - Stack traces are only included outside production.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 4;

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'email',
  'customeremail',
  'whatsapp',
  'phone',
  'address',
  'hoteladdress',
  'customername',
  'guestname',
]);

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function serializeError(error: Error, includeStack: boolean) {
  return {
    name: error.name,
    message: error.message,
    ...(includeStack && error.stack ? { stack: error.stack } : {}),
    ...('digest' in error && typeof error.digest === 'string'
      ? { digest: error.digest }
      : {}),
  };
}

export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > MAX_DEPTH) return '[Truncated]';
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return serializeError(value, process.env.NODE_ENV !== 'production');
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }
  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = isSensitive(key) ? REDACTED : redact(item, depth + 1, seen);
    }
    return result;
  }
  return value;
}

function write(level: LogLevel, scope: string, message: string, context?: LogContext) {
  const entry = {
    time: new Date().toISOString(),
    level,
    scope,
    message,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(entry);

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else if (level === 'debug') {
    if (process.env.NODE_ENV !== 'production') console.debug(line);
  } else console.log(line);
}

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (scope: string) => Logger;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => write('debug', scope, message, context),
    info: (message, context) => write('info', scope, message, context),
    warn: (message, context) => write('warn', scope, message, context),
    error: (message, context) => write('error', scope, message, context),
    child: (childScope) => createLogger(`${scope}.${childScope}`),
  };
}

/** Root logger; child scopes keep log lines attributable to a service. */
export const logger = createLogger('baliwild');

/**
 * Normalise an unknown thrown value, log it once, and return the safe shape.
 * Callers should pass a request id when they have one.
 */
export function reportError(
  error: unknown,
  context: LogContext = {},
  scope = 'baliwild',
): ReturnType<typeof serializeError> {
  const normalised =
    error instanceof Error
      ? serializeError(error, process.env.NODE_ENV !== 'production')
      : { name: 'UnknownError', message: String(error) };

  createLogger(scope).error('Unhandled error', { ...context, error: normalised });
  return normalised;
}
