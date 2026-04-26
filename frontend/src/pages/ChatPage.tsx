import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Loader2 } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import ChatSidebar from '../components/ChatSidebar';
import TypingIndicator from '../components/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

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

interface ChatHistoryRow {
  query: string;
  response: string;
  created_at: string | null;
}

export default function ChatPage() {
  const { user, profile, authError } = useAuth();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasFetched = useRef(false);
  const isSendingRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const loadHistory = useCallback(async (currentSession: any) => {
    if (!currentSession) {
      setHistoryLoading(false);
      return;
    }

    console.log("Fetching chats...");
    setHistoryLoading(true);
    setChatError('');

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true });

      console.log("Chats:", data);
      console.log("Error:", error);

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42501') {
          const msg = 'Unable to load history due to missing permissions. Check chat_history RLS policies.';
          setChatError(msg);
          setToastMessage(msg);
        } else {
          const msg = `Unable to load history: ${error.message}`;
          setChatError(msg);
          setToastMessage(msg);
        }
        setHistoryLoading(false);
        return;
      }

      const rows = (data as ChatHistoryRow[] | null) ?? [];
      setMessages(rows.map((row) => ({
        user: row.query,
        bot: row.response,
        role: 'user',
        createdAt: row.created_at ?? '',
      })));
    } catch (err: any) {
      console.error("Raw error loading history:", err);
      const msg = `Exception loading history: ${err.message || 'Unknown error'}`;
      setChatError(msg);
      setToastMessage(msg);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      loadHistory(user);
    }
  }, [user, loadHistory]);

  const sendQuery = useCallback(async (text?: string) => {
    if (isSendingRef.current) {
      console.log("Blocked duplicate send");
      return;
    }

    const q = (text || query).trim();
    if (!q) return;

    isSendingRef.current = true;
    setChatError('');
    setLoading(true);
    setQuery('');

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, role }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const rawResponse = data?.response;
      if (typeof rawResponse !== 'string' || !rawResponse.trim()) {
        throw new Error('Fetch failed: server returned no response.');
      }

      const createdAt = new Date().toISOString();
      const responseText = rawResponse;

      setSaveLoading(true);
      console.log("Inserting chat...");
      
      // Safety timeout in case Postgres is deadlocked (e.g. uncommitted transaction in SQL editor)
      const insertPromise = supabase.from('chat_history').insert({
        query: q,
        response: responseText,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase insert timed out after 10 seconds. Check for Postgres locks!")), 10000)
      );

      const { error: insertError } = await Promise.race([insertPromise, timeoutPromise]) as any;
      
      console.log("Insert finished. Error:", insertError);
      setSaveLoading(false);

      if (insertError) {
        if (insertError.code === '42501') {
          const msg = 'Response shown, but save failed: chat_history RLS policy is blocking inserts for this user.';
          setChatError(msg);
          setToastMessage(msg);
        } else {
          const msg = `Response shown, but save failed: ${insertError.message}`;
          setChatError(msg);
          setToastMessage(msg);
        }
      }

      setMessages((prev) => [
        ...prev,
        { user: q, bot: responseText, role, createdAt },
      ]);
    } catch (err: any) {
      setSaveLoading(false);
      const message = String(err?.message || 'Unknown fetch error');
      const fetchFailed = message.toLowerCase().includes('no response') || message.toLowerCase().includes('fetch failed');
      const botMessage = fetchFailed
        ? 'Fetch failed: the server did not return a response. Please try again.'
        : `Connection error: ${message}. Make sure backend is running.`;
      const bannerMessage = fetchFailed
        ? 'Fetch failed: server returned no response.'
        : `Connection error: ${message}`;

      setChatError(bannerMessage);
      setToastMessage(bannerMessage);
      setMessages((prev) => [
        ...prev,
        {
          user: q,
          bot: botMessage,
          role,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [query, role]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendingRef.current) {
        sendQuery();
      }
    }
  };

  const clearChat = useCallback(async () => {
    setMessages([]);
    setChatError('');

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's chats (RLS protects others)

    if (error) {
      const msg = `Unable to clear history: ${error.message}`;
      setChatError(msg);
      setToastMessage(msg);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10"
    >
      <ChatSidebar role={role} onRoleChange={setRole} onPresetClick={(t) => sendQuery(t)} onClear={clearChat} />

      <div className="flex-1 flex flex-col glass-strong rounded-2xl overflow-hidden">
        {toastMessage && (
          <div className="absolute right-6 top-6 z-20 max-w-sm rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger shadow-lg">
            {toastMessage}
          </div>
        )}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <img src="/medical-logo.png" alt="MedAssist logo" className="w-6 h-6 rounded-md object-cover border border-border" />
              <h2 className="text-foreground font-bold text-base">AI Medical Consultation</h2>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">Hybrid RAG | Multi-Agent | Health Tools</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-[11px] font-semibold">Online</span>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-foreground max-w-[200px] truncate">
              {profile?.name?.trim() || 'Authenticated User'}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[200px] truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {(authError || chatError || historyLoading || saveLoading) && (
          <div className="px-6 py-3 border-b border-border text-xs">
            {historyLoading && (
              <span className="inline-flex items-center gap-2 text-muted-foreground mr-4">
                <Loader2 size={12} className="animate-spin" />
                Loading history...
              </span>
            )}
            {saveLoading && (
              <span className="inline-flex items-center gap-2 text-muted-foreground mr-4">
                <Loader2 size={12} className="animate-spin" />
                Saving chat...
              </span>
            )}
            {authError && <span className="text-danger mr-4">{authError}</span>}
            {chatError && <span className="text-danger">{chatError}</span>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {messages.length === 0 && !loading && !historyLoading ? (
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
              <h3 className="text-foreground text-xl font-bold mb-2">
                Welcome, {profile?.name?.trim() || 'there'}
              </h3>
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

        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading || historyLoading}
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
              disabled={loading || historyLoading || !query.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </motion.button>
            <button
              onClick={clearChat}
              disabled={loading || historyLoading || saveLoading || messages.length === 0}
              className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Clear Chat
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Enter to send | Shift+Enter for new line
          </p>
        </div>
      </div>
    </motion.div>
  );
}
