import React, { useState, useEffect, useRef } from 'react';
import { sendMentorMessage, fetchMemories } from '../services/mentorService';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Wrench, 
  Brain, 
  Compass, 
  TrendingUp, 
  Award, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Target, 
  FileText, 
  Briefcase, 
  Video, 
  X, 
  Loader2,
  Bookmark
} from 'lucide-react';

const SUGGESTED_MENTOR_PROMPTS = [
  "Why am I not ready for this job?",
  "How has my mock interview performance progressed over time?",
  "What are my recurring technical weaknesses across practice sessions?",
  "Generate a 3-week personalized learning roadmap for Senior Full Stack Engineer",
];

const toolIconMap = {
  getUserResume: FileText,
  getGitHubProfile: User,
  getInterviewHistory: Video,
  getSkillProgress: TrendingUp,
  getJobDescription: Briefcase,
  getSkillGaps: Target,
  getLearningRoadmap: Compass,
};

const CareerMentor = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'mentor',
      text: "Greetings! I am your **AI Career Mentor & Strategic Engineering Coach**.\n\nI combine real-time tool calling (`getUserResume`, `getJobDescription`, `getInterviewHistory`, `getSkillGaps`) with your **Persistent Career Memory Vault** to give you factual, non-hallucinated career guidance. How can I help you level up your engineering career today?",
      toolsCalled: ['getUserResume', 'getInterviewHistory'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMemories = async () => {
    try {
      const data = await fetchMemories();
      setMemories(data?.data || data || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  const handleSendMessage = async (text) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || messageToSend.trim().length === 0 || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const mentorMessageId = `mentor-${Date.now()}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: 'user',
        text: messageToSend.trim(),
        timestamp: currentTime,
      },
    ];

    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await sendMentorMessage({
        message: messageToSend.trim(),
      });

      if (response) {
        setMessages((prev) => [
          ...prev,
          {
            id: mentorMessageId,
            sender: 'mentor',
            text: response.response,
            toolsCalled: response.toolsCalled || [],
            memoriesUsed: response.memoriesUsed || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (response.memoriesUpdated && response.memoriesUpdated.length > 0) {
          await loadMemories();
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: mentorMessageId,
          sender: 'mentor',
          text: `⚠️ An error occurred while consulting your career records: ${err.message || 'Please try again.'}`,
          toolsCalled: [],
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

  const getMemoryTypeBadgeClass = (type) => {
    if (type === 'skill_improvement') return 'mem-improvement';
    if (type === 'goal') return 'mem-goal';
    if (type === 'weakness') return 'mem-weakness';
    return 'mem-default';
  };

  return (
    <div className="mentor-page">
      {/* Mentor Header */}
      <section className="mentor-header-card">
        <div className="mentor-header-left">
          <div className="mentor-avatar-box">
            <Compass size={24} />
          </div>
          <div>
            <div className="mentor-status-pill">
              <span className="live-dot"></span>
              <span>Tool-Calling Active • Persistent Memory Synced</span>
            </div>
            <h1 className="mentor-title">AI Career Mentor & Strategic Coach</h1>
          </div>
        </div>

        {/* Memory Vault Toggle Button */}
        <div className="mentor-header-actions">
          <button 
            className={`btn-memory-vault ${memoryDrawerOpen ? 'active' : ''}`}
            onClick={() => setMemoryDrawerOpen(!memoryDrawerOpen)}
          >
            <Brain size={16} />
            <span>Memory Vault ({memories.length})</span>
            {memoryDrawerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </section>

      {/* Main Workspace (Split / Chat Thread + Memory Drawer) */}
      <div className="mentor-workspace-container">
        {/* Chat Thread */}
        <div className="mentor-chat-thread">
          <div className="chat-messages-scroll">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div key={msg.id} className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
                  <div className="message-avatar">
                    {isUser ? <User size={16} /> : <Compass size={16} />}
                  </div>

                  <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                    {/* Tool Calling Execution Badge for Mentor Messages */}
                    {!isUser && msg.toolsCalled && msg.toolsCalled.length > 0 && (
                      <div className="tools-executed-banner">
                        <div className="tools-banner-header">
                          <Wrench size={13} className="text-primary" />
                          <span>Safe Tools Executed ({msg.toolsCalled.length}):</span>
                        </div>
                        <div className="tool-chips-row">
                          {msg.toolsCalled.map((toolName, idx) => {
                            const ToolIcon = toolIconMap[toolName] || Wrench;
                            return (
                              <span key={idx} className="tool-chip">
                                <ToolIcon size={11} />
                                <span>{toolName}()</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="message-text-content">
                      {msg.text.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx} className="message-paragraph">
                          {para.split('\n').map((line, lIdx) => (
                            <React.Fragment key={lIdx}>
                              {line.startsWith('### ') ? (
                                <strong className="heading-line">{line.replace('### ', '')}</strong>
                              ) : line.startsWith('- ') || line.startsWith('* ') ? (
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

                    <span className="message-timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {/* Loading Typing Indicator */}
            {loading && (
              <div className="chat-message-row assistant-row">
                <div className="message-avatar">
                  <Compass size={16} />
                </div>
                <div className="message-bubble assistant-bubble loading-bubble">
                  <div className="typing-dots-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="loading-caption-text">Executing safe career tools & synthesizing grounded advice...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="suggested-prompts-bar">
            <div className="prompts-label">
              <Lightbulb size={14} className="text-primary" />
              <span>Ask Mentor:</span>
            </div>
            <div className="prompt-chips-wrap">
              {SUGGESTED_MENTOR_PROMPTS.map((prompt, idx) => (
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
                placeholder="Ask your mentor anything (e.g. 'Why am I not ready for this job?', 'How has my interview score progressed?')..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="chat-textarea"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="chat-send-btn"
                title="Send Message (Enter)"
              >
                {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Persistent Memory Vault Drawer */}
        {memoryDrawerOpen && (
          <aside className="memory-vault-sidebar">
            <div className="vault-header">
              <div className="vault-title-group">
                <Brain size={18} className="text-primary" />
                <h3 className="vault-title">Persistent Career Memory</h3>
              </div>
              <button 
                className="vault-close-btn"
                onClick={() => setMemoryDrawerOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="vault-desc">
              Long-term career facts, verified score improvements, and goals remembered across sessions.
            </p>

            <div className="memories-list">
              {memories.length === 0 ? (
                <div className="vault-empty-box">
                  <Bookmark size={24} className="text-muted" />
                  <p>No persistent memories stored yet. As you complete interviews and chat with your mentor, important career milestones will be stored here.</p>
                </div>
              ) : (
                memories.map((mem) => (
                  <div key={mem._id || mem.key} className="memory-card">
                    <div className="mem-card-top">
                      <span className={`mem-type-badge ${getMemoryTypeBadgeClass(mem.type)}`}>
                        {mem.type?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="mem-importance-tag">Priority: {mem.importance || 5}/10</span>
                    </div>

                    <span className="mem-key-text">{mem.key}</span>

                    <div className="mem-value-box">
                      {typeof mem.value === 'object' ? (
                        <div className="mem-obj-view">
                          {mem.value.topic && <p><strong>Topic:</strong> {mem.value.topic}</p>}
                          {mem.value.previousScore !== undefined && (
                            <p><strong>Progression:</strong> {mem.value.previousScore}% ➔ {mem.value.latestScore}% (+{mem.value.improvement}%)</p>
                          )}
                          {mem.value.note && <p className="mem-note">{mem.value.note}</p>}
                          {Array.isArray(mem.value) && (
                            <p><strong>Gaps:</strong> {mem.value.join(', ')}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mem-text-value">{mem.value}</p>
                      )}
                    </div>

                    <span className="mem-updated-time">
                      Updated: {new Date(mem.updatedAt || mem.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CareerMentor;
