import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createJob, 
  fetchJobs, 
  fetchJobDetails, 
  analyzeJob, 
  removeJob 
} from '../services/jobService';
import { 
  Briefcase, 
  Plus, 
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
  Building2, 
  Layers, 
  Zap, 
  Award, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Code2, 
  Users, 
  Lightbulb, 
  Loader2,
  ChevronRight,
  GitCompare
} from 'lucide-react';

const JobIntelligence = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Create job form modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    autoAnalyze: true,
  });

  // Selected job for detail / analysis modal view
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'description'
  
  // Analyzing state per job ID
  const [analyzingId, setAnalyzingId] = useState(null);
  
  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await fetchJobs();
      setJobs(data);
    } catch (err) {
      showMessage(err.message || 'Failed to load job descriptions.', 'error');
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

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showMessage('Please provide both Job Title and Job Description text.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createJob(formData);
      if (res && res.data) {
        showMessage(`Job "${formData.title}" saved successfully!`, 'success');
        setCreateModalOpen(false);
        setFormData({ title: '', company: '', description: '', autoAnalyze: true });
        await loadJobs();
        if (res.data.status === 'analyzed') {
          setSelectedJob(res.data);
          setActiveTab('analysis');
        }
      }
    } catch (err) {
      showMessage(err.message || 'Failed to create job description.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewJobDetails = async (jobId, defaultTab = 'analysis') => {
    try {
      setModalLoading(true);
      setActiveTab(defaultTab);
      const data = await fetchJobDetails(jobId);
      setSelectedJob(data);
    } catch (err) {
      showMessage(err.message || 'Failed to retrieve job details.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAnalyze = async (jobId) => {
    try {
      setAnalyzingId(jobId);
      const response = await analyzeJob(jobId);
      if (response && response.data) {
        showMessage('Job description analyzed successfully!', 'success');
        setJobs((prev) =>
          prev.map((j) => (j._id === jobId ? response.data : j))
        );
        setSelectedJob(response.data);
        setActiveTab('analysis');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to analyze job description.', 'error');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (jobId, title) => {
    try {
      setDeletingId(jobId);
      await removeJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      if (selectedJob?._id === jobId) {
        setSelectedJob(null);
      }
      showMessage(`"${title}" deleted successfully.`, 'success');
    } catch (err) {
      showMessage(err.message || 'Failed to delete job description.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleNavigateToMatcher = (jobId) => {
    navigate(`/dashboard/match?jobId=${jobId}`);
  };

  return (
    <div className="job-intelligence-page">
      {/* Header Banner */}
      <section className="job-header-banner">
        <div className="job-banner-content">
          <div className="job-pill">
            <Sparkles size={15} className="text-primary" />
            <span>Target Role & Hiring Criteria Intelligence</span>
          </div>
          <h1 className="job-page-title">Job Description Intelligence</h1>
          <p className="job-page-desc">
            Save and analyze job descriptions from top tech companies. Our AI parses required skills, preferred qualifications, tech stacks, experience levels, and responsibilities so you can align your preparation with precision.
          </p>
        </div>
        <div className="job-banner-actions">
          <button 
            className="btn btn-primary btn-lg" 
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={18} />
            <span>Add Target Job</span>
          </button>
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

      {/* Jobs Library Section */}
      <section className="jobs-library-section">
        <div className="section-title-row">
          <div className="title-with-count">
            <h2 className="section-header-title">Target Job Descriptions</h2>
            <span className="jobs-count-badge">{jobs.length}</span>
          </div>
          <div className="section-action-btns">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={loadJobs} 
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={14} />
              <span>New Job</span>
            </button>
          </div>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="jobs-loading-card">
            <RefreshCw size={24} className="spin-icon text-primary" />
            <p>Loading your saved job postings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="jobs-empty-card">
            <Briefcase size={44} className="text-muted" />
            <h3 className="empty-title">No Target Jobs Added Yet</h3>
            <p className="empty-desc">
              Paste job descriptions from LinkedIn, Indeed, or company careers pages to extract structured requirements and prepare systematically.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Add Your First Job Description</span>
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => {
              const isAnalyzed = job.status === 'analyzed';
              const isAnalyzingThis = analyzingId === job._id;

              return (
                <div key={job._id} className="job-card">
                  <div className="job-card-header">
                    <div className="job-icon-box">
                      <Briefcase size={20} />
                    </div>
                    {isAnalyzed ? (
                      <span className="job-status-pill analyzed">
                        <Sparkles size={12} />
                        <span>AI Analyzed</span>
                      </span>
                    ) : (
                      <span className="job-status-pill draft">Draft</span>
                    )}
                  </div>

                  <div className="job-card-info">
                    <h3 className="job-card-title" title={job.title}>
                      {job.title}
                    </h3>
                    {job.company && (
                      <div className="job-card-company">
                        <Building2 size={13} />
                        <span>{job.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Required Skills Chips Preview */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="job-skills-preview">
                      <span className="skills-preview-label">Required Skills:</span>
                      <div className="skills-chips-wrap">
                        {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="skill-chip-sm">{skill}</span>
                        ))}
                        {job.requiredSkills.length > 4 && (
                          <span className="skill-chip-more">+{job.requiredSkills.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="job-card-footer-meta">
                    <div className="meta-item">
                      <Clock size={13} />
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    {job.analysis?.seniorityLevel && (
                      <span className="seniority-tag">{job.analysis.seniorityLevel}</span>
                    )}
                  </div>

                  <div className="job-card-actions">
                    {isAnalyzed ? (
                      <button 
                        className="btn btn-primary btn-sm btn-flex"
                        onClick={() => viewJobDetails(job._id, 'analysis')}
                      >
                        <Sparkles size={14} />
                        <span>View Criteria</span>
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm btn-flex"
                        onClick={() => handleAnalyze(job._id)}
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
                            <span>Analyze Job</span>
                          </>
                        )}
                      </button>
                    )}

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleNavigateToMatcher(job._id)}
                      title="Match Against Resume"
                    >
                      <GitCompare size={14} />
                      <span>Match</span>
                    </button>

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => viewJobDetails(job._id, 'description')}
                      title="View Raw Description"
                    >
                      <Eye size={14} />
                    </button>

                    <button 
                      className="btn-icon-danger"
                      title="Delete Job"
                      onClick={() => handleDelete(job._id, job.title)}
                      disabled={deletingId === job._id}
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

      {/* Add Job Modal Form */}
      {createModalOpen && (
        <div className="modal-backdrop" onClick={() => !submitting && setCreateModalOpen(false)}>
          <div className="modal-container modal-container-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="job-icon-box">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="modal-title">Add Target Job Description</h3>
                  <span className="modal-subtitle">Paste a technical job posting to parse hiring criteria</span>
                </div>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body form-modal-body">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="title">Job Title *</label>
                    <input 
                      id="title"
                      type="text"
                      name="title"
                      placeholder="e.g. Senior Full Stack Engineer"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="company">Company / Organization</label>
                    <input 
                      id="company"
                      type="text"
                      name="company"
                      placeholder="e.g. Stripe, Google, Airbnb"
                      value={formData.company}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Job Description Content *</label>
                  <textarea 
                    id="description"
                    name="description"
                    rows="8"
                    placeholder="Paste the full job description here (requirements, responsibilities, tech stack, qualifications)..."
                    value={formData.description}
                    onChange={handleFormChange}
                    className="form-textarea"
                    required
                  ></textarea>
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      name="autoAnalyze"
                      checked={formData.autoAnalyze}
                      onChange={handleFormChange}
                    />
                    <span>Automatically run AI criteria extraction upon saving</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      <span>Saving & Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Save Job Posting</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Details & Analysis Modal */}
      {selectedJob && (
        <div className="modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="job-icon-box">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="modal-title">{selectedJob.title}</h3>
                  <span className="modal-subtitle">
                    {selectedJob.company ? `${selectedJob.company} • ` : ''}Added {new Date(selectedJob.createdAt).toLocaleDateString()}
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
                  <span>Hiring Criteria</span>
                </button>
                <button 
                  className={`modal-tab ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                >
                  <FileText size={14} />
                  <span>Raw Job Description</span>
                </button>
              </div>

              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedJob(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {activeTab === 'analysis' ? (
                selectedJob.status === 'analyzed' && selectedJob.analysis ? (
                  <div className="job-analysis-view">
                    {/* Summary & Seniority Banner */}
                    <div className="job-summary-banner">
                      <div className="summary-left">
                        <span className="role-seniority-badge">
                          {selectedJob.analysis.seniorityLevel || 'Mid-Level'}
                        </span>
                        <h4 className="job-summary-title">Role Overview</h4>
                        <p className="job-summary-text">{selectedJob.analysis.summary}</p>
                      </div>
                    </div>

                    {/* Required vs Preferred Skills 2-Col Grid */}
                    <div className="report-grid-2">
                      <div className="skills-panel required">
                        <h4 className="panel-subheading text-primary">
                          <CheckCircle2 size={16} />
                          <span>Must-Have Required Skills ({selectedJob.requiredSkills?.length || 0})</span>
                        </h4>
                        <div className="skills-pill-wrap">
                          {selectedJob.requiredSkills?.map((skill, i) => (
                            <span key={i} className="skill-pill required-pill">{skill}</span>
                          )) || <span className="text-muted">None specified</span>}
                        </div>
                      </div>

                      <div className="skills-panel preferred">
                        <h4 className="panel-subheading text-secondary">
                          <Plus size={16} />
                          <span>Nice-to-Have / Preferred ({selectedJob.preferredSkills?.length || 0})</span>
                        </h4>
                        <div className="skills-pill-wrap">
                          {selectedJob.preferredSkills?.map((skill, i) => (
                            <span key={i} className="skill-pill preferred-pill">{skill}</span>
                          )) || <span className="text-muted">None specified</span>}
                        </div>
                      </div>
                    </div>

                    {/* Extracted Technologies Stack */}
                    {selectedJob.analysis.technologies && (
                      <div className="report-section">
                        <h4 className="report-section-heading">
                          <Code2 size={16} className="text-primary" />
                          <span>Extracted Technology Stack</span>
                        </h4>

                        <div className="skills-category-grid">
                          <div className="skill-cat-card">
                            <span className="skill-cat-title">Languages</span>
                            <div className="skills-pill-wrap">
                              {selectedJob.analysis.technologies.languages?.map((s, i) => (
                                <span key={i} className="skill-pill lang">{s}</span>
                              )) || <span className="text-muted">None</span>}
                            </div>
                          </div>

                          <div className="skill-cat-card">
                            <span className="skill-cat-title">Frameworks</span>
                            <div className="skills-pill-wrap">
                              {selectedJob.analysis.technologies.frameworks?.map((s, i) => (
                                <span key={i} className="skill-pill framework">{s}</span>
                              )) || <span className="text-muted">None</span>}
                            </div>
                          </div>

                          <div className="skill-cat-card">
                            <span className="skill-cat-title">Databases</span>
                            <div className="skills-pill-wrap">
                              {selectedJob.analysis.technologies.databases?.map((s, i) => (
                                <span key={i} className="skill-pill db">{s}</span>
                              )) || <span className="text-muted">None</span>}
                            </div>
                          </div>

                          <div className="skill-cat-card">
                            <span className="skill-cat-title">Cloud & Tools</span>
                            <div className="skills-pill-wrap">
                              {selectedJob.analysis.technologies.cloudAndTools?.map((s, i) => (
                                <span key={i} className="skill-pill tool">{s}</span>
                              )) || <span className="text-muted">None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Responsibilities Checklist */}
                    {selectedJob.responsibilities?.length > 0 && (
                      <div className="report-section">
                        <h4 className="report-section-heading">
                          <Layers size={16} className="text-primary" />
                          <span>Key Core Responsibilities</span>
                        </h4>
                        <div className="responsibilities-list">
                          {selectedJob.responsibilities.map((resp, i) => (
                            <div key={i} className="resp-item">
                              <Check size={14} className="text-success resp-icon" />
                              <span className="resp-text">{resp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requirements Strip (Experience, Education, Soft Skills) */}
                    <div className="job-reqs-strip">
                      {selectedJob.experienceRequirements && (
                        <div className="req-card">
                          <div className="req-icon-title">
                            <Clock size={16} className="text-primary" />
                            <span className="req-title">Experience Expectation</span>
                          </div>
                          <p className="req-content">{selectedJob.experienceRequirements}</p>
                        </div>
                      )}

                      {selectedJob.educationRequirements && (
                        <div className="req-card">
                          <div className="req-icon-title">
                            <GraduationCap size={16} className="text-primary" />
                            <span className="req-title">Education Benchmark</span>
                          </div>
                          <p className="req-content">{selectedJob.educationRequirements}</p>
                        </div>
                      )}
                    </div>

                    {/* Soft Skills */}
                    {selectedJob.analysis.softSkills?.length > 0 && (
                      <div className="soft-skills-panel">
                        <span className="soft-skills-label">Soft & Collaborative Skills:</span>
                        <div className="skills-pill-wrap">
                          {selectedJob.analysis.softSkills.map((ss, i) => (
                            <span key={i} className="soft-skill-pill">{ss}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="unprompted-analysis-card">
                    <Sparkles size={36} className="text-primary" />
                    <h3 className="unprompted-title">Job Saved — Ready for AI Extraction</h3>
                    <p className="unprompted-desc">
                      Click below to parse mandatory skills, nice-to-haves, frameworks, responsibilities, and experience criteria.
                    </p>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => handleAnalyze(selectedJob._id)}
                      disabled={analyzingId === selectedJob._id}
                    >
                      {analyzingId === selectedJob._id ? (
                        <>
                          <Loader2 size={18} className="spin-icon" />
                          <span>Extracting Criteria with AI...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          <span>Analyze Job Description Now</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                /* Raw Job Description View */
                <div className="raw-text-view">
                  <div className="extracted-text-viewer">
                    <pre>{selectedJob.description}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleNavigateToMatcher(selectedJob._id)}
              >
                <GitCompare size={14} />
                <span>Match with Resume</span>
              </button>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => setSelectedJob(null)}
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

export default JobIntelligence;
