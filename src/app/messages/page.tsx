'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, LifeBuoy, MessageSquare, Mail } from 'lucide-react';
import { AppShellHeader } from '@/components/layout/AppShellHeader';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';
import { DesktopBreadcrumb } from '@/components/layout/DesktopBreadcrumb';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const SESSION_KEY = 'baliwild_chat_session';

const GREETING =
  'Hi! I am the BaliWild assistant. Ask me about activities, prices, availability, pickup or the refund policy.';

const TOPICS = [
  'Show me river tubing',
  'What is the refund policy?',
  'Can you pick me up in Seminyak?',
  'How much is ATV for 2 people?',
];

function createSessionId(): string {
  return `web_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Message center — a full-page conversation with the same AI agent that powers
 * the floating widget. The session id is shared, so a guest can continue a
 * conversation started in the widget (and vice versa).
 */
export default function MessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', text: GREETING }]);
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
    // jsdom (tests) has no scrollIntoView; the guard keeps the page testable.
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, sending]);

  async function send(textArg?: string) {
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
          text: error instanceof Error
            ? `Sorry — ${error.message}. Please try again in a moment.`
            : 'Chat is unavailable right now. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <GlobalDesktopHeader />
      <DesktopBreadcrumb label="Messages" />
      <AppShellHeader title="Messages" mobileOnly />
      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_280px]">
        <section className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4 dark:border-white/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand-ink dark:text-brand">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-heading text-lg font-bold text-neutral-900 dark:text-white">
                BaliWild Assistant
              </h1>
              <p className="text-xs text-neutral-500">Typically replies instantly</p>
            </div>
          </div>

          <div role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-brand-ink text-white'
                      : 'rounded-bl-sm bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-neutral-100'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {sending ? (
              <p className="text-xs text-neutral-500" role="status">Typing…</p>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-neutral-100 p-3 dark:border-white/10"
          >
            <label htmlFor="message-input" className="sr-only">Your message</label>
            <input
              id="message-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a trip, price or pickup…"
              className="min-h-[44px] flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 focus:border-brand focus:outline-none dark:border-white/10 dark:bg-neutral-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-ink text-white transition-colors hover:bg-neutral-900 disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-neutral-900 dark:text-white">
              <MessageSquare className="h-4 w-4 text-brand" aria-hidden="true" />
              Suggested questions
            </h2>
            <div className="mt-3 space-y-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => void send(topic)}
                  disabled={sending}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:border-brand hover:bg-brand/5 disabled:opacity-40 dark:border-white/10 dark:text-neutral-300"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-neutral-900 dark:text-white">
              <LifeBuoy className="h-4 w-4 text-brand" aria-hidden="true" />
              Need a human?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              For disputes, refunds or on-trip help, our team is on WhatsApp during operating hours.
            </p>
            <a
              href="https://wa.me/6285117321388"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-ink"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Chat on WhatsApp
            </a>
            <Link
              href="/refund"
              className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-300"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Refund & cancellation policy
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
