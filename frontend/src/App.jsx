import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { Send, Bot, User, Sparkles, BookOpen, Zap, Brain } from 'lucide-react';
import './App.css';
import logger from './utils/logger';

// Initialize mermaid with custom theme matching our app's palette
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    background: '#1a1a2e',      // --bg-card
    primaryColor: '#222240',    // --bg-elevated
    primaryTextColor: '#f0f0f5', // --text-primary
    primaryBorderColor: '#6c5ce7', // --accent-start
    lineColor: '#a0a0b8',       // --text-secondary
    secondaryColor: '#12121e',  // --bg-secondary
    tertiaryColor: '#0a0a12',   // --bg-primary
    textColor: '#f0f0f5',
    nodeTextColor: '#f0f0f5',
    mainBkg: '#222240',
    nodeBorder: '#6c5ce7',
    clusterBkg: '#12121e',
    clusterBorder: '#a29bfe',
    edgeLabelBackground: '#1a1a2e',
  },
  securityLevel: 'strict',
});

// Custom Mermaid Component
const Mermaid = ({ chart }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      const renderChart = async () => {
        try {
          const id = `mermaid-svg-${Math.random().toString(36).substring(7)}`;
          const { svg } = await mermaid.render(id, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          logger.error('Mermaid rendering failed', error);
          containerRef.current.innerHTML = `<div class="error-toast" style="position:relative; transform:none; bottom:0;">Failed to render diagram</div>`;
        }
      };
      renderChart();
    }
  }, [chart]);

  return <div className="mermaid-diagram" ref={containerRef} role="img" aria-label="AI generated diagram" />;
};


const API_URL = '';

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
  
  // Generate a unique session ID for this browser tab
  const [sessionId] = useState(() => crypto.randomUUID());

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

      logger.info('Sending to API', { historyLength: history.length });

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      logger.debug('Received response', { length: data.reply?.length });

      const aiMessage = { role: 'assistant', content: data.reply };
      setMessages([...updatedMessages, aiMessage]);
    } catch (err) {
      logger.error('Chat error', err);
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
        <div className="header-tokens">
          <span className="header-badge">Gemini AI</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="chat-container" role="main">
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
                  type="button"
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
          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`message message--${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match && match[1] === 'mermaid') {
                            return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
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
      </main>

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
            aria-label="Message input"
          />
          <button
            type="button"
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
