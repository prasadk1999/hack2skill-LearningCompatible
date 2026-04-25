import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, BookOpen, Zap, Brain } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:3001';

// ─── Suggestion chips for the welcome screen ─────────
const SUGGESTIONS = [
  { icon: <Zap size={14} />, text: 'Teach me JavaScript basics' },
  { icon: <Brain size={14} />, text: 'Explain how neural networks work' },
  { icon: <BookOpen size={14} />, text: 'Help me learn Python' },
  { icon: <Sparkles size={14} />, text: 'What is machine learning?' },
];

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clear error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // ─── Send message ──────────────────────────────────
  const sendMessage = useCallback(async (overrideMessage) => {
    const text = (overrideMessage || input).trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Build history for API (exclude the current message)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      console.log('📤 Sending to API:', { message: text, historyLength: history.length });

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log('📥 Received:', data.reply?.substring(0, 80));

      const aiMessage = { role: 'assistant', content: data.reply };
      setMessages([...updatedMessages, aiMessage]);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  // Handle enter key (shift+enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle suggestion chip click
  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-icon">
          <Bot size={22} />
        </div>
        <div className="header-info">
          <h1>Learning Companion</h1>
          <p>AI-powered adaptive tutor</p>
        </div>
        <span className="header-badge">Gemini AI</span>
      </header>

      {/* Chat Area */}
      <div className="chat-container">
        {messages.length === 0 && !isLoading ? (
          /* Welcome Screen */
          <div className="welcome">
            <div className="welcome-icon">
              <Sparkles />
            </div>
            <h2>Ready to learn something new?</h2>
            <p>
              I'm your adaptive learning companion. Tell me what you'd like to learn
              and I'll guide you step-by-step, adjusting to your pace.
            </p>
            <div className="welcome-chips">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="welcome-chip"
                  onClick={() => handleSuggestion(s.text)}
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message message--${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="loading-message">
                <div className="message-avatar" style={{
                  background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                  boxShadow: '0 2px 10px var(--accent-glow)',
                }}>
                  <Bot size={16} color="white" />
                </div>
                <div className="loading-bubble">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything you want to learn..."
            rows={1}
            disabled={isLoading}
            id="chat-input"
          />
          <button
            className="send-button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            id="send-button"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="error-toast" role="alert">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default App;
