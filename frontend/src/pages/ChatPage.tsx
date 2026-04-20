import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, LogOut, Loader2, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import ChatMessage from '../components/ChatMessage';
import ChatSidebar from '../components/ChatSidebar';
import TypingIndicator from '../components/TypingIndicator';
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
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [role, setRole] = useState('user');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [chatError, setChatError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthError(error.message);
        return;
      }
      setUser(data.session?.user ?? null);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setMessages([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadHistory = useCallback(async (userId: string) => {
    setHistoryLoading(true);
    setChatError('');

    const { data, error } = await supabase
      .from('chat_history')
      .select('query, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      setChatError(`Unable to load history: ${error.message}`);
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

    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadHistory(user.id);
    }
  }, [user, loadHistory]);

  const handleSignup = useCallback(async () => {
    setAuthLoading(true);
    setAuthError('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setUser(data.user ?? null);
    }

    setAuthLoading(false);
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    setAuthLoading(true);
    setAuthError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setUser(data.user ?? null);
    }

    setAuthLoading(false);
  }, [email, password]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessages([]);
    setQuery('');
    setChatError('');
  }, []);

  const sendQuery = useCallback(async (text?: string) => {
    const q = (text || query).trim();
    if (!q || loading || !user) return;

    setChatError('');
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
      const createdAt = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        { user: q, bot: data.response, role, createdAt },
      ]);

      setSaveLoading(true);
      const { error: insertError } = await supabase.from('chat_history').insert([
        {
          user_id: user.id,
          query: q,
          response: data.response,
        },
      ]);
      setSaveLoading(false);

      if (insertError) {
        setChatError(`Response shown, but save failed: ${insertError.message}`);
      }
    } catch (err: any) {
      setSaveLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          user: q,
          bot: `Connection error: ${err.message}. Make sure backend is running.`,
          role,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [query, loading, role, user]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const clearChat = useCallback(async () => {
    setMessages([]);
    setChatError('');

    if (!user) return;

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setChatError(`Unable to clear history: ${error.message}`);
    }
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10"
    >
      <ChatSidebar role={role} onRoleChange={setRole} onPresetClick={(t) => sendQuery(t)} onClear={clearChat} />

      <div className="flex-1 flex flex-col glass-strong rounded-2xl overflow-hidden">
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md glass rounded-2xl border border-border p-6">
              <h2 className="text-foreground text-xl font-bold">Sign in to continue</h2>
              <p className="text-muted-foreground text-sm mt-2 mb-5">
                Login or create an account to save chat history securely in Supabase.
              </p>

              <div className="space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:glow-input"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:glow-input"
                />
              </div>

              {authError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  <AlertCircle size={14} className="mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={handleLogin}
                  disabled={authLoading || !email.trim() || !password}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Please wait...' : 'Login'}
                </button>
                <button
                  onClick={handleSignup}
                  disabled={authLoading || !email.trim() || !password}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Please wait...' : 'Signup'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground max-w-[180px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 text-[11px]"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            </div>

            {(chatError || historyLoading || saveLoading) && (
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
          </>
        )}
      </div>
    </motion.div>
  );
}
