import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './FloatingAIAssistant.css';

const QUICK_PROMPTS = [
  'Summarize recent threats',
  'What needs attention?',
  'Explain the latest anomaly',
  'Show critical alerts',
];

export default function FloatingAIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `### 🛡️ SOC Security Assistant Ready\n\nConnected to live system telemetry (Alerts, Anomalous Logs, Website Scans). How can I assist with your triage?`,
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Strictly for Admin users
  if (user?.role !== 'admin') {
    return null;
  }

  // Scroll to bottom when new messages arrive or loading
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSendMessage = async (queryText) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    setErrorMsg(null);
    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = updated
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const res = await api.post('/api/ai-assistant/chat', {
        message: textToSend,
        history: historyPayload,
      });

      if (res.data?.success) {
        const aiMsg = {
          id: 'ai-' + Date.now(),
          sender: 'assistant',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: res.data.metadata,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(res.data?.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('Floating AI assistant error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to AI Assistant. Please try again.';
      setErrorMsg(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ **Service Alert**: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = (e) => {
    e.stopPropagation();
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `### 🧹 Chat History Cleared\n\nAsk any question about current threats, anomalies, or alerts.`,
      },
    ]);
    setErrorMsg(null);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe markdown text formatting
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="soc-float-h4">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('#### ')) {
        return <h5 key={idx} className="soc-float-h5">{line.replace('#### ', '')}</h5>;
      }

      // Inline parser for bold and code
      const formatSpans = (text) => {
        const parts = [];
        let remaining = text;
        let pKey = 0;

        while (remaining.length > 0) {
          const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
          const codeMatch = remaining.match(/`([^`]+)`/);

          let firstMatch = null;
          let matchType = null;

          if (boldMatch && (!codeMatch || boldMatch.index < codeMatch.index)) {
            firstMatch = boldMatch;
            matchType = 'bold';
          } else if (codeMatch) {
            firstMatch = codeMatch;
            matchType = 'code';
          }

          if (firstMatch) {
            if (firstMatch.index > 0) {
              parts.push(<span key={pKey++}>{remaining.slice(0, firstMatch.index)}</span>);
            }
            if (matchType === 'bold') {
              parts.push(<strong key={pKey++} className="soc-float-bold">{firstMatch[1]}</strong>);
            } else {
              parts.push(<code key={pKey++} className="soc-float-code">{firstMatch[1]}</code>);
            }
            remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
          } else {
            parts.push(<span key={pKey++}>{remaining}</span>);
            break;
          }
        }
        return parts;
      };

      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const cleanBullet = line.trim().replace(/^[•\-]\s*/, '');
        return (
          <div key={idx} className="soc-float-bullet-row">
            <span className="soc-float-bullet-dot">▸</span>
            <div className="soc-float-bullet-content">{formatSpans(cleanBullet)}</div>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="soc-float-spacer" />;
      }

      return (
        <p key={idx} className="soc-float-p">
          {formatSpans(line)}
        </p>
      );
    });
  };

  return (
    <div className="soc-float-widget-root">
      {/* Compact Chat Panel directly above button */}
      {isOpen && (
        <div className="soc-float-panel" role="dialog" aria-label="AI Security Assistant">
          {/* Header */}
          <div className="soc-float-header">
            <div className="soc-float-header-title-wrap">
              <div className="soc-float-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="11" r="3" fill="#00d68f" />
                </svg>
              </div>
              <div>
                <h3 className="soc-float-title">AI Security Assistant</h3>
                <span className="soc-float-subtitle">
                  <span className="soc-float-pulse-dot" /> Live SOC Telemetry
                </span>
              </div>
            </div>

            <div className="soc-float-header-actions">
              <button
                className="soc-float-header-btn"
                onClick={handleClearChat}
                title="Clear conversation"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                className="soc-float-header-btn close-btn"
                onClick={handleToggle}
                title="Close Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="soc-float-quick-bar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                className="soc-float-quick-chip"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="soc-float-error-alert">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}>✕</button>
            </div>
          )}

          {/* Chat Messages Area */}
          <div className="soc-float-messages-body">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`soc-float-msg-row ${isUser ? 'user-side' : 'ai-side'} ${
                    msg.isError ? 'error-side' : ''
                  }`}
                >
                  <div className="soc-float-bubble">
                    <div className="soc-float-bubble-top">
                      <span className="soc-float-sender-label">
                        {isUser ? 'Administrator' : 'SOC Analyst AI'}
                      </span>
                      <span className="soc-float-time">{msg.timestamp}</span>

                      {!isUser && !msg.isError && (
                        <button
                          className="soc-float-copy-btn"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? '✓' : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="soc-float-bubble-text">
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="soc-float-msg-row ai-side">
                <div className="soc-float-bubble loading-bubble">
                  <div className="soc-float-loading-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="soc-float-loading-text">Analyzing live SOC telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Send Form */}
          <form
            className="soc-float-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="soc-float-input"
              placeholder="Ask about threats, alerts, anomalies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="submit"
              className="soc-float-send-btn"
              disabled={!input.trim() || loading}
              title="Send question"
            >
              {loading ? (
                <span className="soc-float-spinner" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular Trigger Button (Fixed Bottom-Right) */}
      <button
        className={`soc-float-circle-btn ${isOpen ? 'active-open' : ''}`}
        onClick={handleToggle}
        aria-label="Toggle AI Security Assistant"
        title={isOpen ? 'Close AI Assistant' : 'AI Security Assistant (Admin Only)'}
      >
        {isOpen ? (
          <span className="soc-float-close-icon">✕</span>
        ) : (
          <div className="soc-float-btn-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="soc-float-btn-badge" />
          </div>
        )}
      </button>
    </div>
  );
}
