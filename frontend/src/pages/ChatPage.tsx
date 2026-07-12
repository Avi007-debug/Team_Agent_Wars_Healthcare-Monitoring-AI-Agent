import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Loader2, Sparkles, Bell, BellRing, Settings, Info, Volume2, AlertCircle, Clock, Edit2 } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import ChatSidebar, { Reminder } from '../components/ChatSidebar';
import TypingIndicator from '../components/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const SUGGESTIONS = [
  'symptoms of gestational cholestasis',
  'side effects of oxycodone hydrochloride',
  'what is lipitor used for',
  'warnings for fingolimod',
  'treatment for eczema',
  'drug interaction aspirin ibuprofen',
  'nutrition in pea curry',
  'what are the side effects of non_existent_medicine',
  'remind me to take aspirin at 8am',
  'set alarm for lipitor at 2 30 pm',
  'bp 160',
  'risk age 55 bp 160',
  'covid-19 prevention guidelines',
  'hi'
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

// Web Audio API Synthesized alarm chime
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Ascending major chord (C5 -> E5 -> G5 -> C6)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); 
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); 
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); 
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.warn("AudioContext chime failed:", e);
  }
}

// Convert string like "8am", "9:30pm", "14:20" to minutes past midnight
function parseReminderTimeToMinutes(timeStr: string): number | null {
  const clean = timeStr.trim().toLowerCase();
  
  // HH:MM 24hr match
  const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hrs = parseInt(hhmmMatch[1], 10);
    const mins = parseInt(hhmmMatch[2], 10);
    if (hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60) {
      return hrs * 60 + mins;
    }
  }

  // 12hr AM/PM match (e.g. 8am, 9:30pm, 12:00 am, or 1 05 pm)
  const ampmMatch = clean.match(/^(\d{1,2})(?::| )?(\d{2})?\s*(am|pm)$/);
  if (ampmMatch) {
    let hrs = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3];
    
    if (period === 'pm' && hrs < 12) hrs += 12;
    if (period === 'am' && hrs === 12) hrs = 0;
    
    if (hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60) {
      return hrs * 60 + mins;
    }
  }

  // Pure digits hour match (e.g. "8", "20")
  const hourMatch = clean.match(/^(\d{1,2})$/);
  if (hourMatch) {
    const hrs = parseInt(hourMatch[1], 10);
    if (hrs >= 0 && hrs < 24) {
      return hrs * 60;
    }
  }

  return null;
}

export default function ChatPage() {
  const { user, profile, authError } = useAuth();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [customNames, setCustomNames] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('chat_session_names');
    return saved ? JSON.parse(saved) : {};
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar_width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Group chats by session_id to show in the sidebar
  const chatSessions = useMemo(() => {
    const map: { [key: string]: { id: string; name: string; time: number } } = {};
    allMessages.forEach((m) => {
      const sId = m.sessionId || '00000000-0000-0000-0000-000000000000';
      if (!map[sId]) {
        const isNewLoading = !m.bot;
        const baseName = m.sessionName || m.user.substring(0, 24) + (m.user.length > 24 ? '...' : '');
        map[sId] = {
          id: sId,
          name: customNames[sId] || (isNewLoading ? "New Chat..." : baseName),
          time: new Date(m.createdAt || 0).getTime()
        };
      }
    });
    return Object.values(map).sort((a, b) => b.time - a.time);
  }, [allMessages, customNames]);

  // Load or generate session ID
  useEffect(() => {
    let activeSession = localStorage.getItem('chat_session_id');
    if (!activeSession) {
      activeSession = self.crypto.randomUUID();
      localStorage.setItem('chat_session_id', activeSession);
    }
    setSessionId(activeSession);
  }, []);

  // Sync displayed messages to the active session ID
  useEffect(() => {
    if (!sessionId) return;
    const filtered = allMessages.filter(m => m.sessionId === sessionId);
    setMessages(filtered);
  }, [sessionId, allMessages]);
  
  // Reminders / Alarm states
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notificationPref, setNotificationPref] = useState('in_app');
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasFetched = useRef(false);
  const isSendingRef = useRef(false);
  const lastTriggeredReminderRef = useRef<string>('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Request browser push permission
  const requestBrowserPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setBrowserPermission(permission);
        if (permission === 'granted') {
          setToastMessage('🔔 Browser notifications enabled successfully!');
          new Notification("MedAssist AI", {
            body: "Notifications are now active.",
            icon: "/medical-logo.png"
          });
        }
      });
    }
  };

  // Fetch reminders list
  const loadReminders = useCallback(async (currentUser: any) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading reminders:", error);
        return;
      }
      setReminders(data as Reminder[] || []);
    } catch (err) {
      console.error("Exception loading reminders:", err);
    }
  }, []);

  // Fetch chat history
  const loadHistory = useCallback(async (currentSession: any) => {
    if (!currentSession) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    setChatError('');

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true });

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
      setAllMessages(rows.map((row: any) => ({
        user: row.query,
        bot: row.response,
        role: 'user',
        createdAt: row.created_at ?? '',
        sessionId: row.session_id || '00000000-0000-0000-0000-000000000000'
      })));
    } catch (err: any) {
      console.error("Exception loading history:", err);
      const msg = `Exception loading history: ${err.message || 'Unknown error'}`;
      setChatError(msg);
      setToastMessage(msg);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initialize data on user login
  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      loadHistory(user);
      loadReminders(user);
    }
  }, [user, loadHistory, loadReminders]);

  // Background reminder/alarm checker loop (runs every 10 seconds)
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const todayTimestamp = now.getTime();

      reminders.forEach((r) => {
        if (r.status !== 'active') return;
        const targetMin = parseReminderTimeToMinutes(r.reminder_time);
        
        let shouldTrigger = false;
        const lastTriggered = r.last_triggered_at ? new Date(r.last_triggered_at).getTime() : null;

        if (r.frequency === "every_8_hours") {
          // Trigger if not triggered yet, or if 8 hours have passed (8 * 60 * 60 * 1000 ms)
          shouldTrigger = !lastTriggered || (todayTimestamp - lastTriggered) >= 8 * 60 * 60 * 1000;
        } else if (targetMin !== null && targetMin === currentMin) {
          if (r.frequency === "once") {
            shouldTrigger = !lastTriggered;
          } else if (r.frequency === "daily") {
            // Trigger if not triggered today (at least 20 hours ago to avoid double trigger in same minute)
            shouldTrigger = !lastTriggered || (todayTimestamp - lastTriggered) >= 20 * 60 * 60 * 1000;
          } else if (r.frequency === "weekly") {
            // Trigger if weekly (at least 6 days ago)
            shouldTrigger = !lastTriggered || (todayTimestamp - lastTriggered) >= 6 * 24 * 60 * 60 * 1000;
          }
        }

        if (shouldTrigger) {
          const runKey = `${r.id}-${currentMin}`;
          if (lastTriggeredReminderRef.current !== runKey) {
            lastTriggeredReminderRef.current = runKey;
            
            const prefStr = r.notification_pref || 'in_app';

            // 1. Trigger In-App Alarm Modal & Chime Sound
            if (prefStr.includes('in_app')) {
              setActiveAlarm(r);
              playChime();
            }
            
            // 2. Deliver Browser Push Alert
            if (Notification.permission === 'granted' && prefStr.includes('browser')) {
              new Notification("🏥 Medication Alarm!", {
                body: `Time to take ${r.medicine}! Scheduled at ${r.reminder_time}.`,
                icon: "/medical-logo.png"
              });
              
              if (!prefStr.includes('in_app')) {
                setToastMessage(`🔔 Push Notification triggered for ${r.medicine}`);
              }
            }
            
            // 3. Simulate Email alert via API
            if (prefStr.includes('email')) {
              setToastMessage(`📧 Medication email alert dispatched to ${user.email}`);
            }

            // If the reminder is not in-app, update last_triggered_at immediately so it doesn't double fire in this minute
            if (!prefStr.includes('in_app')) {
              supabase.from('reminders')
                .update({ last_triggered_at: new Date().toISOString() })
                .eq('id', r.id)
                .then(() => loadReminders(user));
            }
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders, user]);

  // Send Query to AI
  const sendQuery = useCallback(async (text?: string) => {
    if (isSendingRef.current) return;

    const q = (text || query).trim();
    if (!q) return;

    isSendingRef.current = true;
    setChatError('');
    setLoading(true);
    setQuery('');

    // Pre-append user message to chat UI immediately
    const tempUserMessage: any = {
      user: q,
      bot: '',
      role,
      createdAt: new Date().toISOString(),
      sessionId: sessionId || '00000000-0000-0000-0000-000000000000'
    };
    
    // We update local state first
    setAllMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Build context history payload (last 12 turns) to send to backend
      const historyPayload = messages.map(m => ({
        user: m.user,
        assistant: m.bot
      }));

      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: q, 
          role, 
          user_id: user?.id,
          session_id: sessionId || '00000000-0000-0000-0000-000000000000',
          history: historyPayload
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const rawResponse = data?.response;
      if (typeof rawResponse !== 'string' || !rawResponse.trim()) {
        throw new Error('Fetch failed: server returned no response.');
      }

      // Update the last message in state with the bot response
      setAllMessages((prev) => {
        const copy = [...prev];
        const lastMsg = copy[copy.length - 1];
        if (lastMsg && lastMsg.user === q && lastMsg.sessionId === sessionId) {
          lastMsg.bot = rawResponse;
        }
        return copy;
      });

      // If response mentions reminder creation, refresh reminders from database
      if (rawResponse.toLowerCase().includes('remind') || rawResponse.toLowerCase().includes('schedule')) {
        setTimeout(() => loadReminders(user), 1500);
      }

    } catch (err: any) {
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
      
      setAllMessages((prev) => {
        const copy = [...prev];
        const lastMsg = copy[copy.length - 1];
        if (lastMsg && lastMsg.user === q && lastMsg.sessionId === sessionId) {
          lastMsg.bot = botMessage;
        }
        return copy;
      });
    } finally {
      isSendingRef.current = false;
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [query, role, messages, user, loadReminders, sessionId, allMessages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendingRef.current) {
        sendQuery();
      }
    }
  };

  const clearChat = useCallback(async () => {
    setAllMessages([]);
    setChatError('');
    localStorage.removeItem('chat_session_id');
    const newId = self.crypto.randomUUID();
    localStorage.setItem('chat_session_id', newId);
    setSessionId(newId);

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (error) {
      const msg = `Unable to clear history: ${error.message}`;
      setChatError(msg);
      setToastMessage(msg);
    }
  }, []);

  const startNewChat = useCallback(() => {
    const newId = self.crypto.randomUUID();
    localStorage.setItem('chat_session_id', newId);
    setSessionId(newId);
    setChatError('');
    setToastMessage('✨ Started a new chat session.');
  }, []);

  // Delete/dismiss medication reminder
  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);
    
    if (error) {
      setToastMessage(`Error deleting reminder: ${error.message}`);
    } else {
      setToastMessage('⏰ Reminder deleted successfully.');
      loadReminders(user);
    }
  };

  // Add medication reminder manually
  const addReminder = async (medicine: string, time: string, pref: string, freq: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        medicine,
        reminder_time: time,
        status: 'active',
        notification_pref: pref,
        frequency: freq
      });

    if (error) {
      setToastMessage(`Error scheduling reminder: ${error.message}`);
      throw error;
    } else {
      setToastMessage('⏰ Medication reminder set successfully!');
      loadReminders(user);
    }
  };

  // Update/Edit medication reminder
  const updateReminder = async (id: string, medicine: string, time: string, pref: string, freq: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('reminders')
      .update({
        medicine,
        reminder_time: time,
        notification_pref: pref,
        frequency: freq,
        status: 'active'
      })
      .eq('id', id);

    if (error) {
      setToastMessage(`Error updating reminder: ${error.message}`);
      throw error;
    } else {
      setToastMessage('⏰ Medication reminder updated successfully!');
      loadReminders(user);
    }
  };

  // Alarm modal dismissal
  const dismissAlarm = async () => {
    if (!activeAlarm) return;
    
    // For once-off, mark status as completed. For recurring, just update last_triggered_at.
    const updates: any = { last_triggered_at: new Date().toISOString() };
    if ((activeAlarm.frequency || 'once') === 'once') {
      updates.status = 'completed';
    }

    const { error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', activeAlarm.id);

    if (error) {
      console.error(error);
    }
    
    setActiveAlarm(null);
    loadReminders(user);
  };

  const snoozeAlarm = () => {
    if (!activeAlarm) return;
    setActiveAlarm(null);
    setToastMessage('⏰ Snoozed medication reminder for 5 minutes.');
  };

  const handleSelectSession = (sId: string) => {
    setSessionId(sId);
    localStorage.setItem('chat_session_id', sId);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10 h-[calc(100vh-64px)]"
    >
      <ChatSidebar
        role={role}
        onRoleChange={setRole}
        onPresetClick={(t) => sendQuery(t)}
        onClear={clearChat}
        onNewChat={startNewChat}
        sessions={chatSessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        reminders={reminders}
        onDeleteReminder={deleteReminder}
        onAddReminder={addReminder}
        onUpdateReminder={updateReminder}
        notificationPref={notificationPref}
        onNotificationPrefChange={setNotificationPref}
        browserPermission={browserPermission}
        onRequestBrowserPermission={requestBrowserPermission}
      />

      <div className="flex-1 flex flex-col glass-strong rounded-2xl overflow-hidden shadow-2xl border border-border/50 relative">
        
        {/* Active Alarm Modal Overlay */}
        <AnimatePresence>
          {activeAlarm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md z-40 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card border-2 border-primary/45 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-6 glow-neon-strong"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary relative">
                    <BellRing size={28} className="animate-bounce" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Medication Reminder!</h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    Time to take your scheduled dose:
                  </p>
                  <p className="text-2xl font-black text-neon mt-3 tracking-wide">
                    {activeAlarm.medicine}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                    <Clock size={12} className="text-primary/70" />
                    Scheduled for {activeAlarm.reminder_time}
                  </p>
                </div>
                
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={snoozeAlarm}
                    className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-foreground text-sm font-semibold transition-all"
                  >
                    Snooze
                  </button>
                  <button
                    onClick={dismissAlarm}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/95 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Volume2 size={16} /> Take Dose
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Toast messages */}
        {toastMessage && (
          <div className="absolute right-6 top-6 z-30 max-w-sm rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-foreground shadow-xl backdrop-blur-md flex items-center gap-2 glow-neon">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Chat header area */}
        <div className="px-6 py-4 border-b border-border/40 bg-card/10 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary p-0.5 shadow-md shadow-primary/10">
                <img src="/medical-logo.png" alt="MedAssist logo" className="w-full h-full rounded-md object-cover bg-background" />
              </div>
              <div>
                <h2 className="text-foreground font-black text-base flex items-center gap-1.5">
                  MedAssist AI
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">v2.0</span>
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Agent RAG Active</span>
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground truncate max-w-[150px]">
                {profile?.name?.trim() || 'Patient'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Inline alerts/loading indicators */}
        {(authError || chatError || historyLoading) && (
          <div className="px-6 py-2.5 border-b border-border/30 text-xs bg-card/5 flex items-center gap-4">
            {historyLoading && (
              <span className="inline-flex items-center gap-2 text-muted-foreground mr-4">
                <Loader2 size={12} className="animate-spin text-primary" />
                Retrieving consultation archives...
              </span>
            )}
            {authError && <span className="text-danger flex items-center gap-1"><AlertCircle size={12} /> {authError}</span>}
            {chatError && <span className="text-danger flex items-center gap-1"><AlertCircle size={12} /> {chatError}</span>}
          </div>
        )}

        {/* Message scroll lane */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col gap-6">
            {messages.length === 0 && !loading && !historyLoading ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-10"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary p-1 mb-8 shadow-2xl shadow-primary/25 relative glow-neon"
                >
                  <img src="/medical-logo.png" alt="MedAssist logo" className="w-full h-full rounded-[20px] object-cover bg-background" />
                </motion.div>
                
                <h3 className="text-foreground text-3xl font-black mb-3 tracking-tight">
                  Welcome to <span className="text-gradient">MedAssist AI</span>
                </h3>
                <p className="text-muted-foreground text-sm max-w-lg mb-10 leading-relaxed font-medium">
                  Your secure clinical assistant. Query drug interactions, medical profiles, nutrition data, or schedule medication alarms directly here or in the sidebar.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => sendQuery(s)}
                      className="p-4 rounded-2xl glass hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-semibold text-muted-foreground hover:text-foreground flex flex-col justify-between h-20 border border-border/60 hover:glow-primary"
                    >
                      <span className="line-clamp-2">{s}</span>
                      <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider self-end mt-2">Try query →</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col gap-6">
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                  ))}
                </div>
                {loading && (
                  <div className="flex justify-start items-center gap-3">
                    <TypingIndicator />
                  </div>
                )}
              </>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input Form container */}
        <div className="p-4 bg-gradient-to-t from-card/30 to-transparent border-t border-border/40">
          <div className="max-w-3xl mx-auto w-full relative flex flex-col gap-2">
            
            <div className="flex gap-3 items-end relative glass rounded-2xl border border-border/80 p-2 focus-within:border-primary focus-within:glow-neon transition-all bg-card/45 shadow-lg">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading || historyLoading}
                placeholder="Message MedAssist... (e.g. remind me to take Lipitor at 9 PM)"
                rows={1}
                className="flex-1 max-h-[160px] min-h-[36px] py-2 px-3 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              
              <div className="flex items-center gap-2 pb-1.5 pr-1">
                <button
                  type="button"
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  title="Voice dictation (Coming soon)"
                >
                  <Mic size={16} />
                </button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendQuery()}
                  disabled={loading || historyLoading || !query.trim()}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Send message"
                >
                  <Send size={14} />
                </motion.button>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-2 text-[10px] text-muted-foreground">
              <span>Shift + Enter for line break | Enter to send</span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary/80">
                <Info size={10} /> Disclaimers: General medical guidance only
              </span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
