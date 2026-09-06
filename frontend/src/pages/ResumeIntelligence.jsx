import React, { useState, useEffect, useRef } from 'react';
import { 
  uploadResumeFile, 
  uploadResumeFileAsync,
  fetchResumes, 
  fetchResumeDetails, 
  analyzeResume,
  analyzeResumeAsync,
  removeResume 
} from '../services/resumeService';
import { pollJobUntilComplete } from '../services/jobQueueService';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  RefreshCw,
  HardDrive,
  FileCheck,
  Zap,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  Code2,
  Cpu,
  Database,
  Wrench,
  Loader2
} from 'lucide-react';

const ResumeIntelligence = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeJob, setActiveJob] = useState(null); // Background Job state
  const [statusMessage, setStatusMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Selected resume for detail / AI analysis modal view
  const [selectedResume, setSelectedResume] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'text'
  const [copied, setCopied] = useState(false);
  
  // Analysis running state per resume ID
  const [analyzingId, setAnalyzingId] = useState(null);
  
  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await fetchResumes();
      setResumes(data);
    } catch (err) {
      showMessage(err.message || 'Failed to load resumes.', 'error');
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

  const validateFile = (file) => {
    const validExtensions = ['.pdf', '.docx'];
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExt) && !validMimes.includes(file.type)) {
      return 'Invalid file type. Only PDF (.pdf) and Word (.docx) files are supported.';
    }

    if (file.size === 0) {
      return 'Selected file is empty (0 bytes).';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'File exceeds maximum limit of 5MB.';
    }

    return null;
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Enqueue background processing job via ?async=true
      const response = await uploadResumeFileAsync(file, (percent) => {
        setUploadProgress(percent);
      });

      if (response && response.data?.jobId) {
        const jobId = response.data.jobId;
        setActiveJob({
          id: jobId,
          name: 'processResume',
          status: 'active',
          progress: 10,
          currentStep: 'extracting_text',
        });

        showMessage(`"${file.name}" uploaded! Processing background AI analysis & vector embeddings...`, 'success');

        // Poll background job until complete
        pollJobUntilComplete(jobId, (job) => {
          setActiveJob(job);
        })
          .then(async () => {
            showMessage(`"${file.name}" background AI analysis & embeddings generated!`, 'success');
            await loadResumes();
            setTimeout(() => setActiveJob(null), 3000);
          })
          .catch((err) => {
            showMessage(`Background processing error: ${err.message}`, 'error');
            setTimeout(() => setActiveJob(null), 5000);
          });
      } else {
        showMessage(`"${file.name}" uploaded successfully!`, 'success');
        await loadResumes();
      }
    } catch (err) {
      showMessage(err.message || 'Failed to upload resume.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const viewResumeDetails = async (resumeId, defaultTab = 'analysis') => {
    try {
      setModalLoading(true);
      setActiveTab(defaultTab);
      const data = await fetchResumeDetails(resumeId);
      setSelectedResume(data);
    } catch (err) {
      showMessage(err.message || 'Failed to retrieve resume details.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAnalyze = async (resumeId) => {
    try {
      setAnalyzingId(resumeId);
      const response = await analyzeResume(resumeId);
      if (response && response.data) {
        showMessage('AI Resume Analysis completed successfully!', 'success');
        // Update local list
        setResumes((prev) =>
          prev.map((r) => (r._id === resumeId ? { ...r, status: 'analyzed', score: response.data.score } : r))
        );
        // Open details modal directly with analysis report
        setSelectedResume(response.data);
        setActiveTab('analysis');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to analyze resume.', 'error');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (resumeId, fileName) => {
    try {
      setDeletingId(resumeId);
      await removeResume(resumeId);
      setResumes((prev) => prev.filter((r) => r._id !== resumeId));
      if (selectedResume?._id === resumeId) {
        setSelectedResume(null);
      }
      showMessage(`"${fileName}" deleted successfully.`, 'success');
    } catch (err) {
      showMessage(err.message || 'Failed to delete resume.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const copyExtractedText = () => {
    if (selectedResume?.extractedText) {
      navigator.clipboard.writeText(selectedResume.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    return 'score-needs-work';
  };

  return (
    <div className="resume-intelligence-page">
      {/* Header Banner */}
      <section className="resume-header-banner">
        <div className="resume-banner-content">
          <div className="resume-pill">
            <Sparkles size={15} className="text-primary" />
            <span>AI Resume Intelligence & ATS Scoring</span>
          </div>
          <h1 className="resume-page-title">Resume Intelligence</h1>
          <p className="resume-page-desc">
            Upload your technical resume in PDF or DOCX format. Our AI analyzer evaluates skill categories, identifies missing keywords, assesses ATS compliance, and generates actionable career recommendations.
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

      {/* Upload Drop Zone */}
      <section className="upload-section">
        <div 
          className={`dropzone-container ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            disabled={uploading}
          />

          <div className="dropzone-content">
            <div className="upload-icon-wrapper">
              <Upload size={28} className={uploading ? 'spin-icon text-primary' : 'text-primary'} />
            </div>

            {uploading ? (
              <div className="upload-progress-wrapper">
                <h3 className="upload-title">Uploading & Extracting Resume Content...</h3>
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}% complete</span>
              </div>
            ) : (
              <>
                <h3 className="upload-title">
                  Drag & drop your resume here, or <span className="text-primary">browse files</span>
                </h3>
                <p className="upload-subtext">
                  Supports <strong>PDF</strong> and <strong>DOCX</strong> formats (Max size: 5 MB)
                </p>
                <div className="upload-badges">
                  <span className="file-badge">.PDF</span>
                  <span className="file-badge">.DOCX</span>
                  <span className="file-badge-info">Secure In-Memory Parsing & AI Validation</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Background Job Processing Progress Card */}
        {activeJob && (
          <div className="background-job-card">
            <div className="job-card-header">
              <div className="job-title-group">
                <Loader2 size={16} className={`text-primary ${activeJob.status === 'completed' ? '' : 'spin-icon'}`} />
                <h4 className="job-heading">
                  {activeJob.status === 'completed' 
                    ? 'Background Job Completed' 
                    : activeJob.status === 'failed' 
                    ? 'Background Job Failed' 
                    : 'Background AI Processing...'}
                </h4>
              </div>
              <span className={`job-status-chip ${activeJob.status}`}>
                {activeJob.status === 'completed' ? 'Completed' : activeJob.status === 'failed' ? 'Failed' : 'Processing'}
              </span>
            </div>

            <p className="job-step-desc">
              {activeJob.currentStep === 'extracting_text' && 'Extracting text content from uploaded document...'}
              {activeJob.currentStep === 'analyzing_resume' && 'Analyzing technical skills, frameworks & ATS score with AI...'}
              {activeJob.currentStep === 'generating_embeddings' && 'Computing 768-dimensional dense semantic vector embeddings...'}
              {activeJob.currentStep === 'completed' && 'Resume analysis and vector index ready in database!'}
              {activeJob.currentStep === 'failed' && `Error: ${activeJob.error || 'Failed to complete job'}`}
              {!activeJob.currentStep && 'Processing asynchronous job in BullMQ queue...'}
            </p>

            <div className="job-progress-bar-track">
              <div 
                className={`job-progress-fill ${activeJob.status}`}
                style={{ width: `${activeJob.progress || 10}%` }}
              ></div>
            </div>

            <div className="job-progress-footer">
              <span className="job-percent-text">{activeJob.progress || 10}% Complete</span>
              <span className="job-id-tag">Job ID: {activeJob.id}</span>
            </div>
          </div>
        )}
      </section>

      {/* Uploaded Resumes Library */}
      <section className="resumes-library-section">
        <div className="section-title-row">
          <div className="title-with-count">
            <h2 className="section-header-title">Extracted Resumes Library</h2>
            <span className="resumes-count-badge">{resumes.length}</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={loadResumes} 
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loading && resumes.length === 0 ? (
          <div className="resumes-loading-card">
            <RefreshCw size={24} className="spin-icon text-primary" />
            <p>Loading your resume documents...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="resumes-empty-card">
            <FileText size={42} className="text-muted" />
            <h3 className="empty-title">No Resumes Uploaded Yet</h3>
            <p className="empty-desc">
              Upload your first PDF or DOCX resume to view extracted keywords, AI readiness scores, and recommendations.
            </p>
          </div>
        ) : (
          <div className="resumes-grid">
            {resumes.map((resume) => {
              const isAnalyzed = resume.status === 'analyzed';
              const isAnalyzingThis = analyzingId === resume._id;

              return (
                <div key={resume._id} className="resume-card">
                  <div className="resume-card-header">
                    <div className={`filetype-icon-box ${resume.fileType}`}>
                      <FileText size={20} />
                    </div>
                    {isAnalyzed ? (
                      <span className={`resume-score-pill ${getScoreBadgeClass(resume.score)}`}>
                        <Award size={13} />
                        <span>Score: {resume.score}/100</span>
                      </span>
                    ) : (
                      <span className="resume-filetype-tag">{resume.fileType?.toUpperCase()}</span>
                    )}
                  </div>

                  <h3 className="resume-card-filename" title={resume.originalFileName}>
                    {resume.originalFileName}
                  </h3>

                  <div className="resume-card-meta">
                    <div className="meta-item">
                      <HardDrive size={13} />
                      <span>{formatFileSize(resume.fileSize)}</span>
                    </div>
                    <div className="meta-item">
                      <FileCheck size={13} />
                      <span>{resume.wordCount || '--'} words</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={13} />
                      <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="resume-card-status">
                    {isAnalyzed ? (
                      <span className="status-analyzed-pill">
                        <Sparkles size={13} />
                        <span>AI Analysis Complete</span>
                      </span>
                    ) : (
                      <span className="status-extracted-pill">
                        <CheckCircle2 size={13} />
                        <span>Ready for AI Evaluation</span>
                      </span>
                    )}
                  </div>

                  <div className="resume-card-actions">
                    {isAnalyzed ? (
                      <button 
                        className="btn btn-primary btn-sm btn-flex"
                        onClick={() => viewResumeDetails(resume._id, 'analysis')}
                      >
                        <Sparkles size={14} />
                        <span>View AI Report</span>
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm btn-flex"
                        onClick={() => handleAnalyze(resume._id)}
                        disabled={isAnalyzingThis}
                      >
                        {isAnalyzingThis ? (
                          <>
                            <Loader2 size={14} className="spin-icon" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            <span>Analyze with AI</span>
                          </>
                        )}
                      </button>
                    )}

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => viewResumeDetails(resume._id, 'text')}
                      title="View Raw Text"
                    >
                      <Eye size={14} />
                    </button>

                    <button 
                      className="btn-icon-danger"
                      title="Delete Resume"
                      onClick={() => handleDelete(resume._id, resume.originalFileName)}
                      disabled={deletingId === resume._id}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Analysis & Text Inspector Modal */}
      {selectedResume && (
        <div className="modal-backdrop" onClick={() => setSelectedResume(null)}>
          <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className={`filetype-icon-box ${selectedResume.fileType}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="modal-title">{selectedResume.originalFileName}</h3>
                  <span className="modal-subtitle">
                    {formatFileSize(selectedResume.fileSize)} • {selectedResume.wordCount} words • Uploaded {new Date(selectedResume.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="modal-tab-group">
                <button 
                  className={`modal-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  <Sparkles size={14} />
                  <span>AI Analysis Report</span>
                </button>
                <button 
                  className={`modal-tab ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <FileText size={14} />
                  <span>Extracted Text</span>
                </button>
              </div>

              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedResume(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {activeTab === 'analysis' ? (
                selectedResume.analysis && selectedResume.analysis.score !== undefined ? (
                  <div className="ai-report-view">
                    {/* Score & Summary Banner */}
                    <div className="report-score-banner">
                      <div className="score-gauge-box">
                        <div className={`score-gauge-ring ${getScoreBadgeClass(selectedResume.analysis.score)}`}>
                          <span className="score-num">{selectedResume.analysis.score}</span>
                          <span className="score-max">/ 100</span>
                        </div>
                        <span className="score-rating-label">
                          {selectedResume.analysis.score >= 85 ? 'Excellent ATS Alignment' : selectedResume.analysis.score >= 70 ? 'Good Engineering Profile' : 'Needs Optimization'}
                        </span>
                      </div>

                      <div className="score-summary-text">
                        <h4 className="report-section-heading">Executive Candidate Summary</h4>
                        <p className="summary-paragraph">{selectedResume.analysis.summary}</p>
                      </div>
                    </div>

                    {/* Categorized Skills Matrix */}
                    <div className="report-section">
                      <h4 className="report-section-heading">
                        <Code2 size={16} className="text-primary" />
                        <span>Identified Technical Skills</span>
                      </h4>

                      <div className="skills-category-grid">
                        <div className="skill-cat-card">
                          <span className="skill-cat-title">Programming Languages</span>
                          <div className="skills-pill-wrap">
                            {selectedResume.analysis.skills?.programmingLanguages?.map((skill, idx) => (
                              <span key={idx} className="skill-pill lang">{skill}</span>
                            )) || <span className="text-muted">None specified</span>}
                          </div>
                        </div>

                        <div className="skill-cat-card">
                          <span className="skill-cat-title">Frameworks & Libraries</span>
                          <div className="skills-pill-wrap">
                            {selectedResume.analysis.skills?.frameworks?.map((skill, idx) => (
                              <span key={idx} className="skill-pill framework">{skill}</span>
                            )) || <span className="text-muted">None specified</span>}
                          </div>
                        </div>

                        <div className="skill-cat-card">
                          <span className="skill-cat-title">Databases & Storage</span>
                          <div className="skills-pill-wrap">
                            {selectedResume.analysis.skills?.databases?.map((skill, idx) => (
                              <span key={idx} className="skill-pill db">{skill}</span>
                            )) || <span className="text-muted">None specified</span>}
                          </div>
                        </div>

                        <div className="skill-cat-card">
                          <span className="skill-cat-title">Tools, Cloud & DevOps</span>
                          <div className="skills-pill-wrap">
                            {selectedResume.analysis.skills?.toolsAndCloud?.map((skill, idx) => (
                              <span key={idx} className="skill-pill tool">{skill}</span>
                            )) || <span className="text-muted">None specified</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses 2-Column Grid */}
                    <div className="report-grid-2">
                      {/* Strengths */}
                      <div className="sw-panel strengths">
                        <h4 className="sw-title text-success">
                          <CheckCircle2 size={16} />
                          <span>Candidate Strengths ({selectedResume.analysis.strengths?.length || 0})</span>
                        </h4>
                        <ul className="sw-list">
                          {selectedResume.analysis.strengths?.map((str, i) => (
                            <li key={i} className="sw-item">{str}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="sw-panel weaknesses">
                        <h4 className="sw-title text-warning">
                          <AlertTriangle size={16} />
                          <span>Areas for Improvement ({selectedResume.analysis.weaknesses?.length || 0})</span>
                        </h4>
                        <ul className="sw-list">
                          {selectedResume.analysis.weaknesses?.map((wk, i) => (
                            <li key={i} className="sw-item">{wk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Missing Skills Alert */}
                    {selectedResume.analysis.missingSkills?.length > 0 && (
                      <div className="missing-skills-card">
                        <div className="missing-header">
                          <Lightbulb size={18} className="text-primary" />
                          <h4 className="missing-title">Recommended Skills to Target</h4>
                        </div>
                        <p className="missing-desc">
                          In-demand skills for target engineering roles that are not yet highlighted in this resume:
                        </p>
                        <div className="missing-pills">
                          {selectedResume.analysis.missingSkills.map((sk, idx) => (
                            <span key={idx} className="missing-pill">+{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations & ATS Improvements */}
                    <div className="report-section">
                      <h4 className="report-section-heading">
                        <TrendingUp size={16} className="text-primary" />
                        <span>Actionable Career & ATS Recommendations</span>
                      </h4>
                      <div className="recommendations-list">
                        {selectedResume.analysis.recommendations?.map((rec, i) => (
                          <div key={i} className="recommendation-item">
                            <span className="rec-badge">{i + 1}</span>
                            <span className="rec-text">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="unprompted-analysis-card">
                    <Sparkles size={36} className="text-primary" />
                    <h3 className="unprompted-title">Resume Extracted — Ready for AI Evaluation</h3>
                    <p className="unprompted-desc">
                      Click below to run structured AI analysis on this resume and calculate ATS scores, skill matrices, strengths, and recommendations.
                    </p>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => handleAnalyze(selectedResume._id)}
                      disabled={analyzingId === selectedResume._id}
                    >
                      {analyzingId === selectedResume._id ? (
                        <>
                          <Loader2 size={18} className="spin-icon" />
                          <span>Evaluating Resume with AI...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          <span>Generate AI Analysis Now</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                /* Raw Extracted Text View */
                <div className="raw-text-view">
                  <div className="modal-toolbar">
                    <span className="toolbar-label">Raw Text Extracted from Document</span>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={copyExtractedText}
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-success" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Raw Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="extracted-text-viewer">
                    <pre>{selectedResume.extractedText}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <span className="modal-footer-notice">
                <Sparkles size={14} className="text-primary" />
                <span>Validated with Zod Schema • AI Output Verified</span>
              </span>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => setSelectedResume(null)}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeIntelligence;
