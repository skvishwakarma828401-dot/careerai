import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  generateInterview, 
  fetchInterviews, 
  fetchInterviewDetails 
} from '../services/interviewService';
import { fetchResumes } from '../services/resumeService';
import { fetchJobs } from '../services/jobService';
import { 
  Sparkles, 
  Video, 
  Code, 
  Users, 
  FolderGit2, 
  Layers, 
  Briefcase, 
  FileText, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  HelpCircle, 
  X, 
  ChevronRight, 
  RefreshCw, 
  Sliders, 
  Target, 
  Award, 
  Loader2,
  BookOpen
} from 'lucide-react';

const INTERVIEW_MODES = [
  {
    id: 'mern',
    title: 'MERN Stack Focus',
    icon: Layers,
    description: 'Specialized deep-dive into MongoDB, Express, React 18, and Node.js architectures.',
    badge: 'Popular',
  },
  {
    id: 'technical',
    title: 'Core Technical',
    icon: Code,
    description: 'Data Structures, JavaScript runtime mechanics, REST APIs, and System Design fundamentals.',
    badge: 'Standard',
  },
  {
    id: 'project-based',
    title: 'Project-Based Deep Dive',
    icon: FolderGit2,
    description: 'Probing questions personalized to the real projects on your uploaded resume.',
    badge: 'Personalized',
  },
  {
    id: 'behavioral',
    title: 'HR & Behavioral',
    icon: Users,
    description: 'STAR methodology questions assessing conflict resolution, leadership, and collaboration.',
    badge: 'HR',
  },
  {
    id: 'fullstack',
    title: 'Full Stack Engineering',
    icon: Video,
    description: 'Comprehensive evaluation covering frontend, backend, databases, cloud, and DevOps.',
    badge: 'Comprehensive',
  },
  {
    id: 'custom-job',
    title: 'Custom Job Interview',
    icon: Briefcase,
    description: 'Tailored questions aligned directly with a specific saved target job posting.',
    badge: 'Tailored',
  },
];

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form State
  const [selectedMode, setSelectedMode] = useState('mern');
  const [difficulty, setDifficulty] = useState('medium');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  // Selected interview for details/questions modal inspection
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [interviewsData, resumesData, jobsData] = await Promise.all([
        fetchInterviews(),
        fetchResumes(),
        fetchJobs(),
      ]);

      const list = interviewsData?.data || interviewsData || [];
      setInterviews(list);
      setResumes(resumesData || []);
      setJobs(jobsData || []);

      if (resumesData && resumesData.length > 0) {
        setSelectedResumeId(resumesData[0]._id);
      }
      if (jobsData && jobsData.length > 0) {
        setSelectedJobId(jobsData[0]._id);
      }
    } catch (err) {
      showMessage(err.message || 'Failed to load setup data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const newInterview = await generateInterview({
        type: selectedMode,
        difficulty,
        targetRole,
        questionCount,
        resumeId: selectedResumeId || undefined,
        jobId: selectedMode === 'custom-job' ? selectedJobId || undefined : undefined,
      });

      if (newInterview && newInterview.data) {
        showMessage(`AI Interview session with ${newInterview.data.questions?.length} personalized questions generated!`, 'success');
        setInterviews((prev) => [newInterview.data, ...prev]);
        setSelectedInterview(newInterview.data);
      }
    } catch (err) {
      showMessage(err.message || 'Failed to generate mock interview.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const viewInterviewDetails = async (interviewId) => {
    try {
      setModalLoading(true);
      const data = await fetchInterviewDetails(interviewId);
      setSelectedInterview(data?.data || data);
    } catch (err) {
      showMessage(err.message || 'Failed to retrieve interview details.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const startLiveInterview = (interviewId) => {
    navigate(`/dashboard/interview/${interviewId}`);
  };

  const getDifficultyBadgeClass = (diff) => {
    if (diff === 'easy') return 'diff-easy';
    if (diff === 'medium') return 'diff-medium';
    return 'diff-hard';
  };

  return (
    <div className="interview-setup-page">
      {/* Header Banner */}
      <section className="interview-header-banner">
        <div className="interview-banner-content">
          <div className="interview-pill">
            <Sparkles size={15} className="text-primary" />
            <span>AI Mock Interview Simulator</span>
          </div>
          <h1 className="interview-page-title">AI Interview Generator</h1>
          <p className="interview-page-desc">
            Generate realistic, highly personalized mock interview sessions. Our AI analyzes your uploaded resume projects, target job requirements, and difficulty tier to create role-specific technical, behavioral, and system design challenges.
          </p>
        </div>
      </section>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div className={`status-toast ${statusMessage.type}`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{statusMessage.text}</span>
          <button 
            className="toast-close-btn" 
            onClick={() => setStatusMessage(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Interview Setup Form */}
      <form onSubmit={handleGenerate} className="setup-form-container">
        {/* Step 1: Mode Selection */}
        <div className="setup-section-card">
          <div className="section-step-header">
            <span className="step-num">1</span>
            <div>
              <h3 className="step-title">Select Interview Mode</h3>
              <p className="step-desc">Choose the primary focus of your mock interview session</p>
            </div>
          </div>

          <div className="modes-selection-grid">
            {INTERVIEW_MODES.map((mode) => {
              const IconComp = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <div
                  key={mode.id}
                  className={`mode-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className="mode-card-top">
                    <div className="mode-icon-box">
                      <IconComp size={20} />
                    </div>
                    <span className="mode-badge-tag">{mode.badge}</span>
                  </div>
                  <h4 className="mode-title">{mode.title}</h4>
                  <p className="mode-description">{mode.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Difficulty & Parameters */}
        <div className="setup-section-card">
          <div className="section-step-header">
            <span className="step-num">2</span>
            <div>
              <h3 className="step-title">Configure Parameters & Personalization</h3>
              <p className="step-desc">Select difficulty, questions count, and link your resume for project personalization</p>
            </div>
          </div>

          <div className="params-form-grid">
            {/* Difficulty Selector */}
            <div className="form-group">
              <label className="form-label">Difficulty Tier</label>
              <div className="difficulty-pills-row">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`diff-pill-btn ${difficulty === d ? 'active ' + getDifficultyBadgeClass(d) : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="roleInput">Target Role Title</label>
              <input
                id="roleInput"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="form-input"
                required
              />
            </div>

            {/* Question Count */}
            <div className="form-group">
              <label className="form-label" htmlFor="questionCountSelect">Number of Questions</label>
              <select
                id="questionCountSelect"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                className="form-select"
              >
                <option value={3}>3 Questions (Express Mini-Session)</option>
                <option value={5}>5 Questions (Standard Practice)</option>
                <option value={8}>8 Questions (Full Comprehensive)</option>
                <option value={10}>10 Questions (Intensive Simulation)</option>
              </select>
            </div>

            {/* Resume Linker for Personalization */}
            <div className="form-group">
              <label className="form-label" htmlFor="resumeSelect">
                <FileText size={14} className="text-primary" />
                <span>Link Candidate Resume (For Project Questions)</span>
              </label>
              <select
                id="resumeSelect"
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="form-select"
              >
                <option value="">No Resume Linked (Standard Questions)</option>
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.originalFileName} ({r.wordCount || 0} words)
                  </option>
                ))}
              </select>
            </div>

            {/* Job Linker for Custom Job Mode */}
            {selectedMode === 'custom-job' && (
              <div className="form-group">
                <label className="form-label" htmlFor="jobSelect">
                  <Briefcase size={14} className="text-primary" />
                  <span>Target Job Description (Required for Custom Job Mode)</span>
                </label>
                <select
                  id="jobSelect"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select a saved job description...</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} {j.company ? `(${j.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="setup-actions-row">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Generating Personalized AI Questions...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Generate AI Mock Interview Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Generated / Past Interviews Section */}
      <section className="past-interviews-section">
        <div className="section-title-row">
          <div className="title-with-count">
            <h2 className="section-header-title">Generated Interview Sessions</h2>
            <span className="resumes-count-badge">{interviews.length}</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={loadInitialData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && interviews.length === 0 ? (
          <div className="resumes-loading-card">
            <RefreshCw size={24} className="spin-icon text-primary" />
            <p>Loading generated interview sessions...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="resumes-empty-card">
            <Video size={42} className="text-muted" />
            <h3 className="empty-title">No Mock Interviews Generated Yet</h3>
            <p className="empty-desc">
              Choose a mode and difficulty above to generate your first personalized AI mock interview session.
            </p>
          </div>
        ) : (
          <div className="interviews-grid">
            {interviews.map((item) => (
              <div key={item._id} className="interview-history-card">
                <div className="interview-card-top">
                  <span className={`diff-tag ${getDifficultyBadgeClass(item.difficulty)}`}>
                    {item.difficulty?.toUpperCase()}
                  </span>
                  <span className="interview-mode-tag">
                    {item.type?.toUpperCase()}
                  </span>
                </div>

                <h3 className="interview-card-title">{item.targetRole}</h3>

                <div className="interview-card-meta">
                  <div className="meta-item">
                    <HelpCircle size={13} />
                    <span>{item.questions?.length || 0} Questions</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={13} />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {item.feedback?.overview && (
                  <p className="interview-card-overview">{item.feedback.overview}</p>
                )}

                <div className="interview-card-actions">
                  <button
                    className="btn btn-primary btn-sm btn-flex"
                    onClick={() => startLiveInterview(item._id)}
                  >
                    <Play size={14} />
                    <span>{item.status === 'completed' ? 'View Final Report' : 'Start Live Interview'}</span>
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => viewInterviewDetails(item._id)}
                    title="Inspect Question Bank"
                  >
                    <BookOpen size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interview Inspection Modal */}
      {selectedInterview && (
        <div className="modal-backdrop" onClick={() => setSelectedInterview(null)}>
          <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="mode-icon-box">
                  <Video size={18} />
                </div>
                <div>
                  <h3 className="modal-title">{selectedInterview.targetRole} Mock Interview</h3>
                  <span className="modal-subtitle">
                    Mode: {selectedInterview.type?.toUpperCase()} • Difficulty: {selectedInterview.difficulty?.toUpperCase()} • {selectedInterview.questions?.length} Questions
                  </span>
                </div>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedInterview(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {selectedInterview.feedback?.overview && (
                <div className="interview-overview-banner">
                  <Sparkles size={18} className="text-primary flex-shrink-0" />
                  <p>{selectedInterview.feedback.overview}</p>
                </div>
              )}

              <div className="interview-questions-list">
                {selectedInterview.questions?.map((q, idx) => (
                  <div key={idx} className="interview-question-card">
                    <div className="question-card-header">
                      <div className="q-badge-group">
                        <span className="q-number-pill">Question {q.questionId || idx + 1}</span>
                        <span className="q-category-pill">{q.category}</span>
                      </div>
                      <span className={`diff-tag ${getDifficultyBadgeClass(q.difficulty)}`}>
                        {q.difficulty?.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="q-title-text">{q.question}</h4>

                    {q.context && (
                      <div className="q-context-box">
                        <Lightbulb size={14} className="text-primary flex-shrink-0" />
                        <span><strong>Context:</strong> {q.context}</span>
                      </div>
                    )}

                    {q.expectedKeywords?.length > 0 && (
                      <div className="q-keywords-row">
                        <span className="keywords-label">Target Concepts:</span>
                        <div className="keywords-pills-wrap">
                          {q.expectedKeywords.map((kw, kIdx) => (
                            <span key={kIdx} className="keyword-pill">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => startLiveInterview(selectedInterview._id)}
              >
                <Play size={15} />
                <span>Launch Live Mock Interview</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedInterview(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSetup;
