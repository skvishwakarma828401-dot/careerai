import React, { useState, useRef, useEffect } from 'react';
import { queryRAG } from '../services/ragService';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Briefcase, 
  Database, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Lightbulb, 
  Compass, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "What are my biggest skill gaps for my target jobs?",
  "Summarize my core technical strengths based on my resume.",
  "What projects should I build next to level up my engineering profile?",
  "How well does my experience align with senior technical roles?",
];

const CareerAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "Hello! I am your **AI Career & Profile Intelligence Assistant**.\n\nI answer questions grounded strictly in your uploaded resumes, saved target job descriptions, and technical records. Ask me anything about your skill readiness, gaps, strengths, or resume tailoring strategies.",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSourceExpand = (messageId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend || textToSend.trim().length === 0 || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: 'user',
        text: textToSend.trim(),
        sources: [],
        timestamp: currentTime,
      },
    ];

    setMessages(newMessages);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await queryRAG({
        question: textToSend.trim(),
        sourceType: sourceFilter,
      });

      if (response) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            sender: 'assistant',
            text: response.answer,
            sources: response.sources || [],
            hasContext: response.hasContext,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        // Auto-expand sources if available
        if (response.sources && response.sources.length > 0) {
          setExpandedSources((prev) => ({ ...prev, [assistantMessageId]: true }));
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: `⚠️ An error occurred while retrieving your records: ${err.message || 'Please try again.'}`,
          sources: [],
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="assistant-page">
      {/* Assistant Header */}
      <section className="assistant-header-card">
        <div className="assistant-header-left">
          <div className="assistant-avatar-box">
            <Bot size={24} />
          </div>
          <div>
            <div className="assistant-status-pill">
              <span className="live-dot"></span>
              <span>Grounded in Your Profile Records</span>
            </div>
            <h1 className="assistant-title">AI Career Assistant (RAG)</h1>
          </div>
        </div>

        {/* Source Filter Selector */}
        <div className="assistant-filter-box">
          <label htmlFor="sourceFilterSelect" className="filter-label">Filter Context:</label>
          <select 
            id="sourceFilterSelect"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="filter-select"
            disabled={loading}
          >
            <option value="all">All Profile Documents</option>
            <option value="resume">Resumes Only</option>
            <option value="job">Target Jobs Only</option>
          </select>
        </div>
      </section>

      {/* Main Chat Thread */}
      <div className="chat-thread-container">
        <div className="chat-messages-scroll">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSourcesExpanded = expandedSources[msg.id];

            return (
              <div key={msg.id} className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
                <div className="message-avatar">
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                  <div className="message-text-content">
                    {msg.text.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} className="message-paragraph">
                        {para.split('\n').map((line, lIdx) => (
                          <React.Fragment key={lIdx}>
                            {line.startsWith('- ') || line.startsWith('* ') ? (
                              <span className="bullet-line">{line}</span>
                            ) : line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') ? (
                              <span className="numbered-line">{line}</span>
                            ) : (
                              line
                            )}
                            {lIdx < para.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    ))}
                  </div>

                  {/* Sources Citation Bar for Assistant Messages */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="message-sources-wrapper">
                      <button 
                        className="sources-toggle-btn"
                        onClick={() => toggleSourceExpand(msg.id)}
                      >
                        <ShieldCheck size={14} className="text-success" />
                        <span>{msg.sources.length} Grounded Source{msg.sources.length > 1 ? 's' : ''} Cited</span>
                        {isSourcesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isSourcesExpanded && (
                        <div className="sources-list-drawer">
                          {msg.sources.map((src, sIdx) => (
                            <div key={sIdx} className="source-citation-card">
                              <div className="source-card-header">
                                <span className={`source-type-pill ${src.sourceType}`}>
                                  {src.sourceType === 'resume' ? <FileText size={12} /> : <Briefcase size={12} />}
                                  <span>{src.sourceType?.toUpperCase()}</span>
                                </span>
                                <span className="source-title-text" title={src.title}>
                                  {src.title}
                                </span>
                                <span className="source-relevance-tag">
                                  {src.similarityScore}% Match
                                </span>
                              </div>
                              <p className="source-snippet-text">"{src.snippet}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="message-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {/* Loading Typing Indicator */}
          {loading && (
            <div className="chat-message-row assistant-row">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
              <div className="message-bubble assistant-bubble loading-bubble">
                <div className="typing-dots-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="loading-caption-text">Retrieving vectors & synthesizing grounded answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="suggested-prompts-bar">
          <div className="prompts-label">
            <Lightbulb size={14} className="text-primary" />
            <span>Suggested Questions:</span>
          </div>
          <div className="prompt-chips-wrap">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                className="prompt-chip-btn"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              rows="1"
              placeholder="Ask a question grounded in your resume and target jobs (e.g. 'What are my biggest skill gaps?')..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="chat-textarea"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || loading}
              className="chat-send-btn"
              title="Send Message (Enter)"
            >
              {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
            </button>
          </div>
          <span className="chat-input-footnote">
            <ShieldCheck size={12} className="text-success" />
            <span>Answers are strictly grounded in your own uploaded documents. Press <strong>Enter</strong> to send.</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CareerAssistant;
