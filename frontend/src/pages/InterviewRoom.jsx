import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import socketService from '../services/socketService';
import voiceService from '../services/voiceService';
import { 
  fetchInterviewReport, 
  fetchInterviewDetails 
} from '../services/interviewService';
import { 
  Sparkles, 
  Video, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft, 
  HelpCircle, 
  Send, 
  Award, 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  Layers, 
  RefreshCw, 
  Check, 
  ShieldCheck, 
  BarChart3,
  Loader2,
  ThumbsUp,
  AlertTriangle,
  Pause,
  Play,
  Square,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Edit3,
  MessageSquare
} from 'lucide-react';

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Mode Selection: 'voice' | 'text'
  const [inputMode, setInputMode] = useState('voice');
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);

  // Live Real-Time & Evaluation State
  const [userAnswer, setUserAnswer] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [streamedFeedback, setStreamedFeedback] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [voiceSignals, setVoiceSignals] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [spokenDuration, setSpokenDuration] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Timer & Pause State
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const timerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Check browser voice support
    const support = voiceService.getSupport();
    if (!support.isSTTSupported) {
      setVoiceSupported(false);
      setInputMode('text');
    }

    loadSession();

    // Establish WebSocket Connection
    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socketService.joinInterview(id);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    // Real-Time Event Handlers
    socketService.on('joinedRoom', (data) => {
      setConnectionStatus('connected');
      if (data.status === 'completed') {
        setIsCompleted(true);
        setFinalReport(data.feedback);
      }
    });

    socketService.on('interviewStarted', (data) => {
      setInterview((prev) => ({
        ...prev,
        status: data.status,
        currentQuestionIndex: data.questionIndex,
      }));
      showMessage('Interview started! Good luck.', 'success');
      
      // Auto-speak first question in voice mode
      if (inputMode === 'voice' && data.question?.question) {
        handlePlayQuestionVoice(data.question.question);
      }
    });

    socketService.on('aiThinking', (data) => {
      setIsThinking(true);
      setThinkingMessage(data.message || 'AI Interviewer evaluating response...');
      setStreamedFeedback('');
    });

    socketService.on('aiResponseChunk', (data) => {
      setStreamedFeedback(data.textSoFar);
    });

    socketService.on('answerEvaluated', (data) => {
      setIsThinking(false);
      setCurrentEvaluation(data.evaluation);
      setVoiceSignals(data.voiceSignals || data.evaluation?.voiceSignals || null);
      setStreamedFeedback(data.evaluation.feedback || '');
      setInterview((prev) => ({
        ...prev,
        scores: data.cumulativeScores || prev?.scores,
        overallScore: data.overallScore || prev?.overallScore,
      }));

      // Speak evaluation coaching feedback in voice mode
      if (inputMode === 'voice' && data.evaluation?.feedback) {
        voiceService.speakText(data.evaluation.feedback, {
          onStart: () => setIsSpeakingAI(true),
          onEnd: () => setIsSpeakingAI(false),
        });
      }
    });

    socketService.on('scoreUpdated', (data) => {
      setInterview((prev) => ({
        ...prev,
        scores: data.scores || prev?.scores,
        overallScore: data.overallScore || prev?.overallScore,
      }));
    });

    socketService.on('interviewCompleted', (data) => {
      setIsThinking(false);
      setIsCompleted(true);
      setFinalReport(data.finalReport);
      setInterview((prev) => ({
        ...prev,
        status: 'completed',
        overallScore: data.overallScore,
        scores: data.scores,
        feedback: data.finalReport,
      }));
      showMessage('Mock interview session completed! Final performance report generated.', 'success');
    });

    socketService.on('interviewPaused', (data) => {
      setIsPaused(true);
      if (data.elapsedSeconds) setElapsedSeconds(data.elapsedSeconds);
      if (isRecording) handleStopRecording();
    });

    socketService.on('interviewResumed', () => {
      setIsPaused(false);
    });

    socketService.on('error', (err) => {
      setIsThinking(false);
      showMessage(err.message || 'Real-time WebSocket error occurred.', 'error');
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      voiceService.stopListening();
      voiceService.stopSpeaking();
      socketService.disconnect();
    };
  }, [id]);

  // Timer Tick
  useEffect(() => {
    if (interview && interview.status === 'in-progress' && !isCompleted && !isPaused) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [interview?.status, isCompleted, isPaused]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await fetchInterviewDetails(id);
      if (data && data.data) {
        const session = data.data;
        setInterview(session);

        if (session.status === 'completed') {
          setIsCompleted(true);
          const reportRes = await fetchInterviewReport(id);
          setFinalReport(reportRes?.data?.feedback || session.feedback);
        } else if (session.status === 'pending') {
          socketService.startInterview(id);
        }
      }
    } catch (err) {
      showMessage(err.message || 'Failed to load interview session.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQIndex = interview?.currentQuestionIndex || 0;
  const currentQuestion = interview?.questions ? interview.questions[currentQIndex] : null;
  const totalQuestions = interview?.questions?.length || 0;

  // Text-to-Speech: Play Question Voice
  const handlePlayQuestionVoice = (textToSpeak) => {
    const text = textToSpeak || currentQuestion?.question;
    if (!text) return;

    setIsSpeakingAI(true);
    voiceService.speakText(text, {
      rate: 1.0,
      onStart: () => setIsSpeakingAI(true),
      onEnd: () => setIsSpeakingAI(false),
    });
  };

  const handleStopQuestionVoice = () => {
    voiceService.stopSpeaking();
    setIsSpeakingAI(false);
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    if (isPaused || isThinking) return;

    try {
      voiceService.stopSpeaking();
      setIsSpeakingAI(false);

      // Initialize microphone stream and audio visualizer
      await voiceService.initMicrophone(canvasRef.current);

      setSpeechTranscript('');
      setInterimTranscript('');
      setSpokenDuration(0);
      setIsRecording(true);

      // Start recording duration timer
      recordingTimerRef.current = setInterval(() => {
        setSpokenDuration((prev) => prev + 1);
      }, 1000);

      // Start Speech Recognition
      voiceService.startListening({
        onTranscript: ({ fullTranscript, interimTranscript }) => {
          setSpeechTranscript(fullTranscript);
          setInterimTranscript(interimTranscript);
        },
        onError: (err) => {
          showMessage(err.message, 'error');
          handleStopRecording();
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });
    } catch (err) {
      showMessage(err.message || 'Could not start microphone recording.', 'error');
      setIsRecording(false);
    }
  };

  // Stop Voice Recording & Submit
  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    voiceService.stopListening();
  };

  const handleSubmitVoiceAnswer = () => {
    const finalAnswer = (speechTranscript + ' ' + interimTranscript).trim();
    if (!finalAnswer) {
      showMessage('Please speak your answer before submitting.', 'error');
      return;
    }

    handleStopRecording();

    // Emit real-time WebSocket voice answer submission
    socketService.submitVoiceAnswer({
      interviewId: id,
      questionId: currentQuestion?.questionId,
      transcript: finalAnswer,
      durationSeconds: spokenDuration || 10,
    });
  };

  // Standard Text Submission
  const handleSubmitTextAnswer = (e) => {
    e.preventDefault();
    if (!userAnswer || userAnswer.trim().length === 0 || isThinking) return;

    socketService.submitAnswer({
      interviewId: id,
      questionId: currentQuestion?.questionId,
      userAnswer: userAnswer.trim(),
    });
  };

  const handleNextQuestion = () => {
    voiceService.stopSpeaking();
    setIsSpeakingAI(false);
    setCurrentEvaluation(null);
    setVoiceSignals(null);
    setStreamedFeedback('');
    setUserAnswer('');
    setSpeechTranscript('');
    setInterimTranscript('');
    setSpokenDuration(0);

    const nextIdx = (interview?.currentQuestionIndex || 0) + 1;
    setInterview((prev) => ({
      ...prev,
      currentQuestionIndex: nextIdx,
    }));

    if (inputMode === 'voice' && interview?.questions && interview.questions[nextIdx]) {
      setTimeout(() => {
        handlePlayQuestionVoice(interview.questions[nextIdx].question);
      }, 500);
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      socketService.resumeInterview(id);
    } else {
      socketService.pauseInterview(id, elapsedSeconds);
    }
  };

  const handleEndInterviewEarly = () => {
    if (window.confirm('Are you sure you want to end this mock interview session and view your final performance report?')) {
      voiceService.stopSpeaking();
      socketService.endInterview(id);
    }
  };

  const getDifficultyBadgeClass = (diff) => {
    if (diff === 'easy') return 'diff-easy';
    if (diff === 'medium') return 'diff-medium';
    return 'diff-hard';
  };

  if (loading) {
    return (
      <div className="interview-loading-container">
        <Loader2 size={36} className="spin-icon text-primary" />
        <h3>Connecting to Live Real-Time Mock Interview Room...</h3>
      </div>
    );
  }

  return (
    <div className="interview-room-page">
      {/* Top Real-Time Header */}
      <header className="interview-live-header">
        <div className="header-left-col">
          <Link to="/dashboard/interview" className="btn-back-link">
            <ArrowLeft size={16} />
            <span>Setup Hub</span>
          </Link>
          <div className="header-title-group">
            <h1 className="live-session-title">{interview?.targetRole} Live Mock Interview</h1>
            <div className="header-tags-row">
              <span className={`diff-tag ${getDifficultyBadgeClass(interview?.difficulty)}`}>
                {interview?.difficulty?.toUpperCase()}
              </span>
              <span className="mode-pill-tag">
                {interview?.type?.toUpperCase()}
              </span>

              {/* WebSocket Connection Status */}
              <span className={`socket-status-pill ${connectionStatus}`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi size={11} className="text-success" />
                    <span>Real-Time WebSocket Active</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={11} className="text-warning" />
                    <span>Reconnecting...</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="header-right-col">
          {!isCompleted && (
            <div className="live-controls-row">
              {/* Pause/Resume Toggle */}
              <button 
                type="button"
                className={`btn-pause-toggle ${isPaused ? 'paused' : ''}`}
                onClick={handleTogglePause}
                title={isPaused ? 'Resume Session' : 'Pause Session'}
              >
                {isPaused ? <Play size={13} /> : <Pause size={13} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              {/* Live Timer */}
              <div className="live-timer-chip">
                <Clock size={15} className={isPaused ? 'text-warning' : 'text-primary'} />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>

              {/* End Interview Button */}
              <button
                type="button"
                className="btn-end-session"
                onClick={handleEndInterviewEarly}
                title="End Session & Finalize Report"
              >
                <Square size={12} />
                <span>End</span>
              </button>
            </div>
          )}

          <div className="progress-badge">
            {isCompleted ? (
              <span className="status-badge completed">
                <CheckCircle2 size={14} />
                <span>Session Completed</span>
              </span>
            ) : (
              <span className="status-badge active">
                Question {currentQIndex + 1} of {totalQuestions}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Progress Track Bar */}
      {!isCompleted && (
        <div className="interview-progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      )}

      {/* Global Status Toast */}
      {statusMessage && (
        <div className={`status-toast ${statusMessage.type}`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Mode Selector Toggle (Voice Mode vs Text Fallback) */}
      {!isCompleted && (
        <div className="interview-mode-selector">
          <button
            type="button"
            className={`mode-tab ${inputMode === 'voice' ? 'active' : ''}`}
            onClick={() => {
              if (!voiceSupported) {
                showMessage('Voice mode is not supported on this browser. Using text mode.', 'error');
                return;
              }
              setInputMode('voice');
            }}
          >
            <Mic size={15} />
            <span>Voice Interview Mode</span>
            <span className="mode-tag-pill">AI Audio</span>
          </button>

          <button
            type="button"
            className={`mode-tab ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => {
              voiceService.stopSpeaking();
              voiceService.stopListening();
              setIsRecording(false);
              setInputMode('text');
            }}
          >
            <MessageSquare size={15} />
            <span>Text Keyboard Mode</span>
            <span className="mode-tag-pill">Fallback</span>
          </button>
        </div>
      )}

      {/* VIEW A: FINAL PERFORMANCE REPORT (WHEN COMPLETED) */}
      {isCompleted ? (
        <div className="final-report-dashboard">
          {/* Executive Summary Card */}
          <section className="report-hero-card">
            <div className="score-dial-box">
              <div className="score-dial-number">
                {finalReport?.overallScore || interview?.overallScore || 0}
              </div>
              <span className="score-dial-label">OVERALL SCORE</span>
              <span className="rating-pill-tag">
                {finalReport?.rating || 'Ready for Hire'}
              </span>
            </div>

            <div className="report-hero-text">
              <div className="hero-pill">
                <Sparkles size={14} className="text-primary" />
                <span>Hiring Committee Real-Time Report</span>
              </div>
              <h2 className="report-hero-heading">Final Interview Evaluation</h2>
              <p className="report-hero-summary">
                {finalReport?.summary || 'Candidate demonstrated solid technical fundamentals and structured reasoning throughout the mock interview.'}
              </p>
            </div>
          </section>

          {/* 5-Dimension Category Breakdown Matrix */}
          {finalReport?.categoryScores && (
            <section className="category-scores-section">
              <h3 className="section-subtitle">
                <BarChart3 size={18} className="text-primary" />
                <span>Multi-Dimensional Competency Breakdown</span>
              </h3>

              <div className="scores-metrics-grid">
                {Object.entries(finalReport.categoryScores).map(([metric, score]) => (
                  <div key={metric} className="metric-score-card">
                    <div className="metric-header-row">
                      <span className="metric-name">{metric}</span>
                      <span className="metric-val-tag">{score}/100</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Strengths & Weaknesses 2-Col Grid */}
          <div className="report-grid-2">
            <div className="evaluation-panel strengths">
              <h4 className="eval-panel-title text-success">
                <ThumbsUp size={16} />
                <span>Demonstrated Strengths</span>
              </h4>
              <ul className="eval-bullet-list">
                {finalReport?.strengths?.map((s, idx) => (
                  <li key={idx}>
                    <Check size={14} className="text-success flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="evaluation-panel weaknesses">
              <h4 className="eval-panel-title text-warning">
                <AlertTriangle size={16} />
                <span>Areas for Development</span>
              </h4>
              <ul className="eval-bullet-list">
                {finalReport?.weaknesses?.map((w, idx) => (
                  <li key={idx}>
                    <AlertCircle size={14} className="text-warning flex-shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Concepts Pill Grid */}
          {finalReport?.missingConcepts?.length > 0 && (
            <section className="missing-concepts-section">
              <h4 className="section-subtitle">
                <Lightbulb size={16} className="text-primary" />
                <span>Technical Concepts & Edge Cases to Review</span>
              </h4>
              <div className="concepts-pill-wrap">
                {finalReport.missingConcepts.map((concept, idx) => (
                  <span key={idx} className="concept-pill">{concept}</span>
                ))}
              </div>
            </section>
          )}

          {/* Actionable Recommendations */}
          {finalReport?.recommendations?.length > 0 && (
            <section className="recommendations-section">
              <h4 className="section-subtitle">
                <TrendingUp size={16} className="text-primary" />
                <span>Targeted Preparation Roadmap</span>
              </h4>
              <div className="recommendations-list">
                {finalReport.recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-card">
                    <span className="rec-step-num">{idx + 1}</span>
                    <p className="rec-text">{rec}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Report Footer Actions */}
          <div className="report-footer-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/interview')}
            >
              Start New Mock Interview
            </button>
          </div>
        </div>
      ) : (
        /* VIEW B: ACTIVE INTERVIEW (VOICE OR TEXT) */
        <div className="live-interview-workspace">
          {/* Question Card with Audio Speaker */}
          {currentQuestion && (
            <section className="live-question-card">
              <div className="question-header-strip">
                <div className="q-badge-group">
                  <span className="q-badge-num">Question {currentQIndex + 1}</span>
                  <span className="q-category-tag">{currentQuestion.category}</span>
                </div>
                
                <div className="q-header-actions">
                  {/* TTS Voice Speaker */}
                  <button
                    type="button"
                    className={`btn-speaker-toggle ${isSpeakingAI ? 'speaking' : ''}`}
                    onClick={() => {
                      if (isSpeakingAI) handleStopQuestionVoice();
                      else handlePlayQuestionVoice();
                    }}
                    title={isSpeakingAI ? 'Mute AI Voice' : 'Play Question Audio Aloud'}
                  >
                    {isSpeakingAI ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeakingAI ? 'Stop Audio' : 'Play Question Audio'}</span>
                  </button>

                  <span className={`diff-tag ${getDifficultyBadgeClass(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty?.toUpperCase()}
                  </span>
                </div>
              </div>

              <h2 className="live-question-prompt">
                {currentQuestion.question}
              </h2>

              {currentQuestion.context && (
                <div className="q-context-callout">
                  <Sparkles size={15} className="text-primary flex-shrink-0" />
                  <span><strong>Evaluation Context:</strong> {currentQuestion.context}</span>
                </div>
              )}
            </section>
          )}

          {/* INPUT FORM: VOICE MODE OR TEXT MODE */}
          {!currentEvaluation ? (
            inputMode === 'voice' ? (
              /* VOICE INTERVIEW CONSOLE */
              <div className="voice-interview-workspace">
                <div className="voice-mic-station">
                  {/* Big Pulsing Mic Button */}
                  <div className="mic-button-wrapper">
                    <button
                      type="button"
                      className={`mic-record-btn ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      disabled={isThinking || isPaused}
                      title={isRecording ? 'Click to Stop Speaking' : 'Click to Speak Answer'}
                    >
                      {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
                    </button>
                    {isRecording && <div className="mic-pulsing-rings"></div>}
                  </div>

                  <div className="mic-status-text">
                    {isRecording ? (
                      <span className="status-recording-text">
                        <Radio size={14} className="text-danger spin-pulse" />
                        Listening to your response... ({spokenDuration}s)
                      </span>
                    ) : (
                      <span className="status-idle-text">
                        Click the microphone and speak your technical explanation aloud.
                      </span>
                    )}
                  </div>

                  {/* Web Audio Waveform Canvas */}
                  <div className="waveform-canvas-container">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={46}
                      className={`audio-visualizer-canvas ${isRecording ? 'active' : ''}`}
                    />
                  </div>
                </div>

                {/* Real-time Interim & Final Transcript Display */}
                <div className="live-transcript-card">
                  <div className="transcript-header-row">
                    <div className="transcript-label">
                      <Edit3 size={14} className="text-primary" />
                      <span>Live Speech Transcript:</span>
                    </div>
                    {speechTranscript && (
                      <span className="transcript-word-count">
                        {speechTranscript.split(/\s+/).filter(Boolean).length} words
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={4}
                    value={speechTranscript + (interimTranscript ? ` (${interimTranscript})` : '')}
                    onChange={(e) => setSpeechTranscript(e.target.value)}
                    placeholder="Your spoken transcript will appear here in real-time as you speak. You can also edit it before submitting..."
                    className="live-transcript-textarea"
                    disabled={isThinking}
                  />
                </div>

                {/* Spoken Communication Delivery Signals Notice */}
                <div className="voice-signals-notice">
                  <ShieldCheck size={14} className="text-success flex-shrink-0" />
                  <span>
                    Voice analysis strictly evaluates pacing, clarity, and filler frequency for professional communication coaching.
                  </span>
                </div>

                {/* Voice Submit Controls */}
                <div className="voice-action-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setInputMode('text')}
                  >
                    Switch to Text Mode
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmitVoiceAnswer}
                    disabled={(!speechTranscript.trim() && !interimTranscript.trim()) || isThinking}
                  >
                    {isThinking ? (
                      <>
                        <Loader2 size={18} className="spin-icon" />
                        <span>{thinkingMessage || 'AI Evaluating Voice Answer...'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Submit Spoken Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* TEXT MODE FALLBACK */
              <form onSubmit={handleSubmitTextAnswer} className="live-answer-form">
                <div className="answer-input-container">
                  <div className="answer-editor-header">
                    <label htmlFor="userAnswerText" className="editor-label">Your Technical Response:</label>
                    <span className="char-count">{userAnswer.length} characters</span>
                  </div>

                  <textarea
                    id="userAnswerText"
                    ref={textareaRef}
                    rows="9"
                    placeholder="Explain your approach, architecture, syntax mechanics, and edge cases clearly..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="live-answer-textarea"
                    disabled={isThinking || isPaused}
                    autoFocus
                  />
                </div>

                <div className="live-form-footer">
                  <span className="editor-hint">
                    <ShieldCheck size={14} className="text-success" />
                    <span>Real-time evaluation across accuracy, completeness, problem solving, and clarity.</span>
                  </span>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={!userAnswer.trim() || isThinking || isPaused}
                  >
                    {isThinking ? (
                      <>
                        <Loader2 size={18} className="spin-icon" />
                        <span>{thinkingMessage || 'AI Interviewer Evaluating...'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Submit Real-Time Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* EVALUATION FEEDBACK DRAWER */
            <div className="answer-feedback-drawer">
              <div className="drawer-header">
                <div className="drawer-title-group">
                  <div className="eval-score-pill">
                    <span>SCORE: {currentEvaluation.overall}/100</span>
                  </div>
                  <h3 className="drawer-title">Real-Time Interviewer Assessment</h3>
                </div>
                <div className="drawer-mini-metrics">
                  <span>Accuracy: <strong>{currentEvaluation.technicalAccuracy}%</strong></span>
                  <span>Completeness: <strong>{currentEvaluation.completeness}%</strong></span>
                  <span>Problem Solving: <strong>{currentEvaluation.problemSolving}%</strong></span>
                </div>
              </div>

              {/* Voice Communication Delivery Signals Bar (If Spoken) */}
              {voiceSignals && (
                <div className="voice-signals-pill-bar">
                  <div className="signal-badge">
                    <Clock size={13} className="text-primary" />
                    <span>Pacing: <strong>{voiceSignals.wordsPerMinute} WPM ({voiceSignals.pacingAssessment})</strong></span>
                  </div>
                  <div className="signal-badge">
                    <AlertTriangle size={13} className={voiceSignals.fillerCount > 3 ? 'text-warning' : 'text-success'} />
                    <span>Filler Words: <strong>{voiceSignals.fillerCount} detected</strong></span>
                  </div>
                  <div className="signal-badge">
                    <Award size={13} className="text-success" />
                    <span>Spoken Delivery: <strong>{voiceSignals.communicationScore}%</strong></span>
                  </div>
                </div>
              )}

              {/* Streaming Coaching Feedback Note */}
              <div className="feedback-coaching-box">
                <BookOpen size={16} className="text-primary flex-shrink-0" />
                <p className="streaming-feedback-text">
                  {streamedFeedback || currentEvaluation.feedback}
                  {isThinking && <span className="typing-cursor">|</span>}
                </p>
              </div>

              {/* Strengths & Missing Concepts Grid */}
              <div className="feedback-details-grid">
                {currentEvaluation.strengths?.length > 0 && (
                  <div className="feedback-sub-card strengths">
                    <span className="sub-card-title text-success">Key Strengths Mentioned:</span>
                    <ul className="feedback-bullet-list">
                      {currentEvaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentEvaluation.missingConcepts?.length > 0 && (
                  <div className="feedback-sub-card missing">
                    <span className="sub-card-title text-warning">Opportunities to Expand:</span>
                    <ul className="feedback-bullet-list">
                      {currentEvaluation.missingConcepts.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="drawer-footer-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleNextQuestion}
                >
                  <span>{currentQIndex + 1 >= totalQuestions ? 'View Final Performance Report' : 'Proceed to Next Question'}</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
