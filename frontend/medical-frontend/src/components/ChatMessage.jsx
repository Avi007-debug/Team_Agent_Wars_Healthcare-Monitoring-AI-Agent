import React from 'react';

export default function ChatMessage({ message }) {
  const { user, bot, role, createdAt } = message;

  const ts = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {/* User message */}
      <div className="message-row user">
        <div className="message-bubble">
          <span className="message-role-tag">
            {role === 'doctor' ? '🩺 Doctor' : '👤 You'}
          </span>
          {user}
          {ts && <span className="message-time">{ts}</span>}
        </div>
        <div className="message-avatar">
          {role === 'doctor' ? '🩺' : '👤'}
        </div>
      </div>

      {/* Bot response */}
      <div className="message-row bot">
        <div className="message-avatar">🤖</div>
        <div className="message-bubble">
          <span className="message-role-tag">AI Assistant</span>
          {bot}
          {ts && <span className="message-time">{ts}</span>}
        </div>
      </div>
    </>
  );
}
