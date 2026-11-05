/**
 * Server-Sent Events (SSE) utilities
 */

export interface SSEMessage {
  type: string;
  data: unknown;
  id?: string;
  retry?: number;
}

export interface SSEOptions {
  onMessage?: (message: { type: string; data: unknown; id?: string; retry?: number }) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxRetries?: number;
}

/**
 * Create an SSE connection
 */
export interface SSEConnection {
  close: () => void;
  getReadyState: () => number;
}

export function createSSEConnection(url: string, options: SSEOptions = {}): SSEConnection {
  const {
    onMessage,
    onError,
    onOpen,
    reconnect = true,
    reconnectInterval = 5000,
    maxRetries = 10,
  } = options;

  let retries = 0;
  let eventSource: EventSource | null = null;

  const connect = () => {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      retries = 0;
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage?.(message);
      } catch (error) {
        console.warn('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      onError?.(error);

      if (reconnect && retries < (maxRetries ?? Infinity)) {
        retries++;
        console.log(`SSE connection lost. Reconnecting in ${reconnectInterval}ms... (attempt ${retries})`);
        setTimeout(connect, reconnectInterval);
      }
    };
  };

  connect();

  return {
    close: () => {
      eventSource?.close();
      eventSource = null;
    },
    getReadyState: () => eventSource?.readyState ?? EventSource.CLOSED,
  };
}

/**
 * React hook for SSE connection
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseSSEReturn<T> {
  data: T | null;
  error: Error | null;
  isConnected: boolean;
  reconnect: () => void;
}

export function useSSE<T>(url: string | null, options: {
  onMessage?: (data: T) => void;
  onError?: (error: Error) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
} = {}): UseSSEReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setData(data);
        options.onMessage?.(data);
      } catch (error) {
        console.warn('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError(new Error('SSE connection error'));
      options.onError?.(new Error('SSE connection error'));

      // Reconnect logic
      if (options.reconnect !== false) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connect();
          }
        }, options.reconnectInterval || 5000);
      }
    };
  }, [url, options]);

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url, connect]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  return {
    data,
    error,
    isConnected,
    reconnect,
  };
}

/**
 * Parse SSE message
 */
export function parseSSEMessage(data: string): { type: string; data: unknown; id?: string } | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Create SSE response for Next.js API routes
 */
export function createSSEResponse(
  stream: ReadableStream<Uint8Array>,
  options: {
    headers?: Record<string, string>;
  } = {}
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...options.headers,
    },
  });
}

/**
 * Create a readable stream for SSE
 */
export function createSSEStream(
  generator: AsyncGenerator<string, void, unknown>
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Helper to create SSE messages
 */
export function createSSEMessage(type: string, data: unknown, options: { id?: string; retry?: number } = {}): string {
  const message = {
    type,
    data,
    timestamp: Date.now(),
  };

  let output = `data: ${JSON.stringify(message)}\n\n`;

  if (options.id) {
    output = `id: ${options.id}\n${output}`;
  }

  if (options.retry) {
    output = `retry: ${options.retry}\n${output}`;
  }

  return output;
}