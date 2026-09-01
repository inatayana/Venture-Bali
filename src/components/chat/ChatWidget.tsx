/**
 * Venture Bali Chat Widget
 * Floating chat widget for website web chat
 */

import React, { useEffect, useState } from 'react';

export interface ChatWidgetProps {
  initialMessage?: string;
  language?: 'id' | 'en';
  onMessage?: (message: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ initialMessage, onMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (initialMessage && isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', text: initialMessage }]);
    }
  }, [isOpen, initialMessage, messages.length]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);

    if (onMessage) onMessage(trimmed);
    setMessages((prev) => [...prev, { role: 'assistant', text: 'Sedang memproses...' }]);
    setTimeout(() => {
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (prev[lastIdx]?.role === 'assistant' && prev[lastIdx].text === 'Sedang memproses...') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }, 500);
  };

  return (
    <div style={{ zIndex: 9999 }}>
      <button
        onClick={toggleChat}
        aria-label="Buka chat bantuan"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          backgroundColor: '#0084ff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        💬
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 94,
            right: 24,
            width: 340,
            backgroundColor: 'white',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            fontFamily: 'system-ui, sans-serif',
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Bantuan Venture Bali</h3>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  backgroundColor: msg.role === 'user' ? '#0084ff' : '#f0f2f5',
                  color: msg.role === 'user' ? 'white' : 'black',
                  borderRadius: msg.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  marginLeft: msg.role === 'user' ? 'auto' : 0,
                  marginRight: msg.role === 'user' ? 0 : 'auto',
                  fontSize: 14,
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Ketik pesan..."
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 20, padding: '8px 12px', fontSize: 14 }}
            />
            <button
              onClick={sendMessage}
              style={{ width: 40, height: 40, backgroundColor: '#0084ff', color: 'white', border: 'none', borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const getInitialMessage = (lang: 'id' | 'en'): string => {
  const id = 'Halo! Selamat datang di Venture Bali. Ada yang bisa saya bantu?';
  const en = 'Hello! Welcome to Venture Bali. How can I help you?';
  return lang === 'id' ? id : en;
};

export default ChatWidget;