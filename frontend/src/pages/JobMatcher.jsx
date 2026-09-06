import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchJobs, matchResumeToJob } from '../services/jobService';
import { fetchResumes } from '../services/resumeService';
import { 
  Sparkles, 
  Briefcase, 
  FileText, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  Award, 
  Layers, 
  ArrowRight, 
  Check, 
  Loader2, 
  RefreshCw,
  X,
  Target,
  Sliders,
  ChevronRight
} from 'lucide-react';

const JobMatcher = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  // Form selections
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  
  // Match Result
  const [matchResult, setMatchResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, resumesData] = await Promise.all([
        fetchJobs(),
        fetchResumes(),
      ]);

      setJobs(jobsData);
      setResumes(resumesData);

      if (jobsData.length > 0 && !selectedJobId) {
        setSelectedJobId(jobsData[0]._id);
      }
      if (resumesData.length > 0 && !selectedResumeId) {
        setSelectedResumeId(resumesData[0]._id);
      }
    } catch (err) {
      showMessage(err.message || 'Failed to load jobs or resumes.', 'error');
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

  const handleRunMatch = async (e) => {
    if (e) e.preventDefault();
    if (!selectedJobId || !selectedResumeId) {
      showMessage('Please select both a target job and a resume to match.', 'error');
      return;
    }

    try {
      setMatching(true);
      const res = await matchResumeToJob(selectedJobId, selectedResumeId);
      if (res && res.data) {
        setMatchResult(res.data);
        showMessage('Resume-to-Job match analysis calculated successfully!', 'success');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to compute semantic match.', 'error');
    } finally {
      setMatching(false);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-needs-work';
  };

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'High') return 'priority-high';
    if (priority === 'Medium') return 'priority-medium';
    return 'priority-low';
  };

  return (
    <div className="matcher-page">
      {/* Header Banner */}
      <section className="matcher-header-banner">
        <div className="matcher-banner-content">
          <div className="matcher-pill">
            <Sparkles size={15} className="text-primary" />
            <span>Hybrid Semantic & Deterministic Matching</span>
          </div>
          <h1 className="matcher-page-title">Resume-to-Job Matcher</h1>
          <p className="matcher-page-desc">
            Compare your resume against any target job description. Our hybrid engine evaluates vector semantic similarity, verifies mandatory and preferred skills, scores candidate relevance, and generates prioritized gap mitigation steps.
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

      {/* Matching Controls Bar */}
      <section className="matcher-controls-card">
        {loading ? (
          <div className="matcher-loading-row">
            <RefreshCw size={20} className="spin-icon text-primary" />
            <span>Loading target jobs and uploaded resumes...</span>
          </div>
        ) : jobs.length === 0 || resumes.length === 0 ? (
          <div className="matcher-prereq-alert">
            <AlertTriangle size={20} className="text-warning" />
            <div className="prereq-text">
              <h4>Setup Required</h4>
              <p>
                To perform semantic matching, you need at least one uploaded resume and one target job description.
              </p>
              <div className="prereq-links">
                {resumes.length === 0 && (
                  <Link to="/dashboard/resume" className="btn btn-secondary btn-sm">
                    <FileText size={14} />
                    <span>Upload a Resume</span>
                  </Link>
                )}
                {jobs.length === 0 && (
                  <Link to="/dashboard/jobs" className="btn btn-secondary btn-sm">
                    <Briefcase size={14} />
                    <span>Add a Target Job</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRunMatch} className="matcher-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="jobSelect">
                <Briefcase size={14} className="text-primary" />
                <span>Target Job Description</span>
              </label>
              <select
                id="jobSelect"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="form-select"
                disabled={matching}
              >
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} {job.company ? `(${job.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="resumeSelect">
                <FileText size={14} className="text-primary" />
                <span>Candidate Resume</span>
              </label>
              <select
                id="resumeSelect"
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="form-select"
                disabled={matching}
              >
                {resumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.originalFileName} ({resume.wordCount || 0} words)
                  </option>
                ))}
              </select>
            </div>

            <div className="matcher-submit-group">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-match-cta"
                disabled={matching || !selectedJobId || !selectedResumeId}
              >
                {matching ? (
                  <>
                    <Loader2 size={18} className="spin-icon" />
                    <span>Calculating Semantic Match...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Run Semantic Match</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Match Results View */}
      {matchResult && (
        <section className="match-results-section">
          {/* Main Score & Summary Card */}
          <div className="match-overview-card">
            <div className="score-gauge-box">
              <div className={`score-gauge-ring score-gauge-lg ${getScoreBadgeClass(matchResult.matchScore)}`}>
                <span className="score-num">{matchResult.matchScore}%</span>
                <span className="score-max">OVERALL FIT</span>
              </div>
              <span className={`match-rating-badge ${getScoreBadgeClass(matchResult.matchScore)}`}>
                {matchResult.matchScore >= 80 ? 'Strong Candidate Fit' : matchResult.matchScore >= 60 ? 'Moderate Fit with Gaps' : 'Significant Skill Gap'}
              </span>
            </div>

            <div className="match-summary-info">
              <div className="match-pair-tags">
                <span className="pair-tag job-tag">
                  <Briefcase size={13} />
                  <span>{matchResult.jobTitle} {matchResult.company ? `@ ${matchResult.company}` : ''}</span>
                </span>
                <ChevronRight size={14} className="text-muted" />
                <span className="pair-tag resume-tag">
                  <FileText size={13} />
                  <span>{matchResult.resumeFileName}</span>
                </span>
              </div>

              <p className="match-executive-summary">{matchResult.summary}</p>

              {/* Progress Breakdown Bars */}
              <div className="match-progress-bars">
                <div className="progress-metric-item">
                  <div className="metric-header">
                    <span>Skills Requirement Coverage</span>
                    <span className="metric-val">{matchResult.skillsMatchPercentage}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill fill-primary" 
                      style={{ width: `${matchResult.skillsMatchPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-metric-item">
                  <div className="metric-header">
                    <span>Vector Semantic Similarity</span>
                    <span className="metric-val">{matchResult.semanticSimilarityScore}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill fill-cyan" 
                      style={{ width: `${matchResult.semanticSimilarityScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Comparison 2-Col Grid */}
          <div className="report-grid-2">
            {/* Matching Skills */}
            <div className="match-panel matching-panel">
              <h3 className="panel-subheading text-success">
                <CheckCircle2 size={17} />
                <span>Matching Verified Skills ({matchResult.matchingSkills?.length || 0})</span>
              </h3>
              {matchResult.matchingSkills?.length > 0 ? (
                <div className="skills-pill-wrap">
                  {matchResult.matchingSkills.map((skill, i) => (
                    <span key={i} className="skill-pill matching-pill">
                      <Check size={12} />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No direct skill matches found in resume text.</p>
              )}

              {matchResult.strongMatches?.length > 0 && (
                <div className="match-highlights-box">
                  <span className="highlight-label">Strengths:</span>
                  <ul className="highlight-list">
                    {matchResult.strongMatches.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Missing Skills */}
            <div className="match-panel missing-panel">
              <h3 className="panel-subheading text-danger">
                <AlertTriangle size={17} />
                <span>Identified Skill Gaps ({matchResult.missingSkills?.length || 0})</span>
              </h3>
              {matchResult.missingSkills?.length > 0 ? (
                <div className="skills-pill-wrap">
                  {matchResult.missingSkills.map((skill, i) => (
                    <span key={i} className="skill-pill missing-pill">
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-success text-sm font-semibold">100% of required and preferred skills covered!</p>
              )}

              {matchResult.weakMatches?.length > 0 && (
                <div className="match-highlights-box warning-box">
                  <span className="highlight-label">Areas to Bridge:</span>
                  <ul className="highlight-list">
                    {matchResult.weakMatches.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Prioritized Skill Gaps Table */}
          {matchResult.priorityGaps?.length > 0 && (
            <div className="priority-gaps-section">
              <div className="section-title-row">
                <h3 className="section-header-title">
                  <Target size={18} className="text-primary" />
                  <span>Prioritized Skill Gaps</span>
                </h3>
                <span className="resumes-count-badge">{matchResult.priorityGaps.length} Gaps</span>
              </div>

              <div className="priority-gaps-grid">
                {matchResult.priorityGaps.map((gap, idx) => (
                  <div key={idx} className="priority-gap-card">
                    <div className="gap-card-header">
                      <span className="gap-skill-name">{gap.skill}</span>
                      <span className={`priority-badge ${getPriorityBadgeClass(gap.priority)}`}>
                        {gap.priority} Priority
                      </span>
                    </div>
                    <p className="gap-reason-text">{gap.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Resume Tailoring Recommendations */}
          {matchResult.recommendations?.length > 0 && (
            <div className="match-recommendations-section">
              <h3 className="section-header-title">
                <TrendingUp size={18} className="text-primary" />
                <span>Actionable Resume Tailoring Strategy</span>
              </h3>
              <div className="recommendations-list">
                {matchResult.recommendations.map((rec, i) => (
                  <div key={i} className="recommendation-item">
                    <span className="rec-badge">{i + 1}</span>
                    <span className="rec-text">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default JobMatcher;
