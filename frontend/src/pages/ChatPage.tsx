import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import ChatSidebar from '../components/ChatSidebar';
import TypingIndicator from '../components/TypingIndicator';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const SUGGESTIONS = [
  'symptoms of gestational cholestasis',
  'side effects of oxycodone hydrochloride',
  'nutrition in pea curry (matar ki sabzi)',
  'covid-19 prevention guidelines',
  'drug interaction aspirin ibuprofen',
  'bp 160',
];

interface Msg {
  user: string;
  bot: string;
  role: string;
  createdAt: string;
}

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load history
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/history`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setMessages(data.history.map((h: any) => ({
            user: h.user, bot: h.bot, role: h.role || 'user', createdAt: h.created_at || '',
          })));
        }
      } catch {}
    })();
  }, []);

  const sendQuery = useCallback(async (text?: string) => {
    const q = (text || query).trim();
    if (!q || loading) return;
    setLoading(true);
    setQuery('');

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, role }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { user: q, bot: data.response, role, createdAt: new Date().toISOString() }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        user: q,
        bot: `⚠️ Connection error: ${err.message}.\n\nMake sure the backend is running:\n\`\`\`\ncd RAG && python -m uvicorn backend.api:app --reload\n\`\`\``,
        role,
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [query, loading, role]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const clearChat = async () => {
    setMessages([]);
    try { await fetch(`${API_URL}/history`, { method: 'DELETE' }); } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10"
    >
      <ChatSidebar role={role} onRoleChange={setRole} onPresetClick={(t) => sendQuery(t)} onClear={clearChat} />

      {/* Main chat */}
      <div className="flex-1 flex flex-col glass-strong rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img src="/medical-logo.png" alt="MedAssist logo" className="w-6 h-6 rounded-md object-cover border border-border" />
              <h2 className="text-foreground font-bold text-base">AI Medical Consultation</h2>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">Hybrid RAG · Multi-Agent · Health Tools</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-[11px] font-semibold">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {messages.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-1 mb-6 shadow-xl shadow-primary/20"
              >
                <img src="/medical-logo.png" alt="MedAssist logo" className="w-full h-full rounded-xl object-cover" />
              </motion.div>
              <h3 className="text-foreground text-xl font-bold mb-2">Welcome to MedAssist AI</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
                Your intelligent medical assistant. Ask about symptoms, drugs, nutrition, or health risks.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ y: -2, borderColor: 'hsl(160 70% 40% / 0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendQuery(s)}
                    className="px-4 py-2 rounded-xl glass text-muted-foreground text-xs font-medium hover:text-foreground hover:bg-primary/10 transition-all"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {loading && <TypingIndicator />}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder="Ask a medical question..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/30 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:glow-input transition-all resize-none"
                autoFocus
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title="Voice input (coming soon)"
              >
                <Mic size={16} />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendQuery()}
              disabled={loading || !query.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </motion.button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </motion.div>
  );
}
