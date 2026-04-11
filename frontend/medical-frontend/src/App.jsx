import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import ChatMessage from './components/ChatMessage';
import Sidebar from './components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const WELCOME_CHIPS = [
  'symptoms of diabetes',
  'side effects of aspirin',
  'drug interaction aspirin ibuprofen',
  'bp 160',
  'covid-19 prevention guidelines',
  'nutrition in pea curry',
];

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [lastHealthCheck, setLastHealthCheck] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medassist-theme') || 'dark';
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medassist-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      setBackendOnline(res.ok);
    } catch {
      setBackendOnline(false);
    } finally {
      setLastHealthCheck(new Date().toLocaleTimeString());
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();

    const timer = setInterval(() => {
      checkBackendHealth();
    }, 15000);

    return () => clearInterval(timer);
  }, [checkBackendHealth]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/history`);
        if (!res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data.history)) return;

        setMessages(
          data.history.map((item) => ({
            user: item.user,
            bot: item.bot,
            role: item.role || 'user',
            createdAt: item.created_at || '',
          })),
        );
      } catch {
        // Ignore history load failures and keep app usable.
      }
    };

    loadHistory();
  }, []);

  const sendQuery = useCallback(async (text) => {
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

      setMessages((prev) => [
        ...prev,
        { user: q, bot: data.response, role, createdAt: new Date().toISOString() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          user: q,
          bot: `⚠️ Connection error: ${err.message}.\n\nMake sure the backend is running:\n  cd RAG\n  python -m uvicorn backend.api:app --reload`,
          role,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [query, loading, role]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  }, [sendQuery]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    try {
      await fetch(`${API_URL}/history`, { method: 'DELETE' });
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        role={role}
        onRoleChange={setRole}
        onPresetClick={(text) => sendQuery(text)}
        onClear={clearChat}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="main-area">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <h2>AI Medical Consultation</h2>
            <p>Hybrid RAG · Multi-Agent · Health Tools</p>
          </div>
          <div className="header-right">
            <div className={`status-badge ${backendOnline ? '' : 'offline'}`}>
              <span className="status-dot"></span>
              {backendOnline ? 'Backend Online' : 'Backend Offline'}
            </div>
          </div>
        </div>

        <div className="status-subline">
          Last health check: {lastHealthCheck || '...'}
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 && !loading ? (
            <div className="welcome-screen">
              <div className="welcome-icon-ring">
                <span className="welcome-icon">🏥</span>
              </div>
              <h3>Welcome to MedAssist AI</h3>
              <p>
                Your intelligent medical assistant powered by hybrid retrieval,
                multi-agent reasoning, and clinical health tools.
              </p>

              <div className="welcome-features">
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">🔍</span>
                  <span className="welcome-feature-text">RAG Search</span>
                </div>
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">💊</span>
                  <span className="welcome-feature-text">Drug Tools</span>
                </div>
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">📊</span>
                  <span className="welcome-feature-text">Health Risk</span>
                </div>
                <div className="welcome-feature">
                  <span className="welcome-feature-icon">🧠</span>
                  <span className="welcome-feature-text">AI Insights</span>
                </div>
              </div>

              <div className="welcome-chips">
                {WELCOME_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    className="welcome-chip"
                    onClick={() => sendQuery(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}

              {loading && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder="Ask a medical question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => sendQuery()}
              disabled={loading || !query.trim()}
              title="Send message"
            >
              ➤
            </button>
          </div>
          <p className="input-hint">
            Press Enter to send · Shift+Enter for new line · Use sidebar for quick queries
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
