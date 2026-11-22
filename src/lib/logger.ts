/**
 * BaliWild — Structured Logger
 *
 * Lightweight wrapper around console with structured JSON output.
 * Compatible with Pino/Winston interfaces for easy migration.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

class Logger {
  private context: string;
  private minLevel: LogLevel;

  private static levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(context: string, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levels[level] >= Logger.levels[this.minLevel];
  }

  private format(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const base = { timestamp, level, context: this.context, message };
    return JSON.stringify(meta ? { ...base, ...meta } : base);
  }

  debug(message: string, meta?: LogMeta): void {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, meta));
  }

  info(message: string, meta?: LogMeta): void {
    if (this.shouldLog('info')) console.info(this.format('info', message, meta));
  }

  warn(message: string, meta?: LogMeta): void {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, meta));
  }

  error(message: string, meta?: LogMeta): void {
    if (this.shouldLog('error')) console.error(this.format('error', message, meta));
  }

  child(meta: LogMeta): Logger {
    const child = new Logger(this.context, this.minLevel);
    const originalDebug = child.debug.bind(child);
    const originalInfo = child.info.bind(child);
    const originalWarn = child.warn.bind(child);
    const originalError = child.error.bind(child);

    child.debug = (msg, m) => originalDebug(msg, { ...meta, ...m });
    child.info = (msg, m) => originalInfo(msg, { ...meta, ...m });
    child.warn = (msg, m) => originalWarn(msg, { ...meta, ...m });
    child.error = (msg, m) => originalError(msg, { ...meta, ...m });

    return child;
  }
}

const loggerCache = new Map<string, Logger>();

export function createServerLogger(context: string): Logger {
  if (!loggerCache.has(context)) {
    loggerCache.set(context, new Logger(context));
  }
  return loggerCache.get(context)!;
}

export function createClientLogger(context: string): Logger {
  // Client-side logger (no-op in production, console in dev)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return new Logger(context, 'debug');
  }
  return new Logger(context, 'error'); // Only log errors in production client
}

// Default logger for backward compatibility
export const logger = createServerLogger('app');