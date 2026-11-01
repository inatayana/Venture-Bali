'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, Send, X } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const SESSION_KEY = 'baliwild_chat_session';

const QUICK_REPLIES = [
  'Show me river tubing',
  'What is the refund policy?',
  'Can you pick me up in Seminyak?',
];

const GREETING =
  'Hi! I am the BaliWild assistant. Ask me about activities, prices, availability, pickup or the refund policy.';

function createSessionId(): string {
  return `web_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Web chat widget backed by the real AI agent (`/api/ai/chat`).
 * The conversation id is persisted so the agent keeps context between visits.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      let id = window.localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = createSessionId();
        window.localStorage.setItem(SESSION_KEY, id);
      }
      setSessionId(id);
    } catch {
      setSessionId(createSessionId());
    }
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', text: GREETING }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  if (pathname.startsWith('/admin')) return null;

  const send = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setSending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || undefined,
          channel: 'web',
          language: 'en',
        }),
      });

      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error?.message ?? 'Chat is unavailable');

      if (typeof payload.sessionId === 'string' && payload.sessionId) {
        setSessionId(payload.sessionId);
        try {
          window.localStorage.setItem(SESSION_KEY, payload.sessionId);
        } catch {
          /* storage unavailable */
        }
      }

      const reply =
        typeof payload.data?.reply === 'string' && payload.data.reply.length > 0
          ? payload.data.reply
          : 'Sorry, I could not answer that. Please try again or contact our team on WhatsApp.';

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            error instanceof Error
              ? `Sorry — ${error.message}. Please try again in a moment.`
              : 'Chat is unavailable right now. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-xl transition-transform hover:scale-105 lg:bottom-6"
          aria-label="Open chat with the BaliWild assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[45] flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-96 lg:bottom-6">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">BaliWild assistant</p>
              <p className="text-xs text-neutral-500">Activities · prices · pickup · refunds</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-neutral-900 px-3 py-2 text-sm text-white'
                    : 'mr-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm text-neutral-800'
                }
              >
                {message.text}
              </div>
            ))}

            {sending && (
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm text-neutral-500">
                Typing…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 1 && !sending && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => void send(reply)}
                  className="min-h-[44px] rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-700 hover:border-neutral-400"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-neutral-100 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your adventure…"
              aria-label="Chat message"
              className="min-h-[44px] flex-1 rounded-full border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white disabled:bg-neutral-300"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
