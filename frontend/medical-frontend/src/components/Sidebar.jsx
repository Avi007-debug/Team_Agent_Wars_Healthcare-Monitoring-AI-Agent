import React from 'react';

const PRESETS = [
  { icon: '🫀', text: 'symptoms of diabetes' },
  { icon: '💊', text: 'side effects of aspirin' },
  { icon: '🥗', text: 'nutrition in rice' },
  { icon: '⚠️', text: 'drug interaction aspirin ibuprofen' },
  { icon: '🩸', text: 'bp 160' },
  { icon: '🧬', text: 'risk age 55 bp 160' },
  { icon: '🤰', text: 'symptoms of gestational cholestasis' },
  { icon: '💉', text: 'side effects of oxycodone hydrochloride' },
  { icon: '🍛', text: 'nutrition in pea curry (matar ki sabzi)' },
  { icon: '🦠', text: 'covid-19 prevention guidelines' },
  { icon: '⏰', text: 'remind me to take aspirin at 8am' },
  { icon: '👋', text: 'hi' },
];

export default function Sidebar({ role, onRoleChange, onPresetClick, onClear, theme, onThemeToggle }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">🏥</div>
          <div className="brand-text">
            <h1>MedAssist AI</h1>
            <span>Healthcare Agent v2.0</span>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="theme-toggle-section">
        <div className="theme-toggle" onClick={onThemeToggle} role="button" tabIndex={0}>
          <span className="theme-toggle-label">
            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </span>
          <div className="theme-switch" />
        </div>
      </div>

      {/* Role */}
      <div className="role-section">
        <label className="section-label">Your Role</label>
        <select
          className="role-select"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="user">👤  Patient / User</option>
          <option value="doctor">🩺  Doctor / Clinician</option>
        </select>
      </div>

      {/* Quick Queries */}
      <div className="presets-section">
        <h3 className="section-label">Quick Queries</h3>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className="preset-btn"
            onClick={() => onPresetClick(p.text)}
          >
            <span className="preset-icon">{p.icon}</span>
            {p.text}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="clear-btn" onClick={onClear}>
          🗑️ Clear Conversation
        </button>
      </div>
    </aside>
  );
}
