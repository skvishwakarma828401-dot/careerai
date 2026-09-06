import React, { useState, useEffect } from 'react';
import { 
  fetchRoadmaps, 
  generateRoadmap, 
  updateTopicProgress 
} from '../services/roadmapService';
import { fetchResumes } from '../services/resumeService';
import { fetchJobs } from '../services/jobService';
import { 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Target, 
  Layers, 
  FolderGit2, 
  Video, 
  BookOpen, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  Award, 
  Check, 
  X, 
  Loader2,
  TrendingUp,
  Cpu
} from 'lucide-react';

const resourceTypeIconMap = {
  Project: FolderGit2,
  Architecture: Layers,
  Exercise: Cpu,
  Reading: BookOpen,
  'Mock Interview': Video,
  Optimization: Zap,
};

const Roadmaps = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal / Customization State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('Senior Full Stack Software Engineer');
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roadmapsData, resumesData, jobsData] = await Promise.all([
        fetchRoadmaps(),
        fetchResumes(),
        fetchJobs(),
      ]);

      const active = roadmapsData?.activeRoadmap || roadmapsData?.data?.[0] || null;
      setRoadmap(active);
      setResumes(resumesData || []);
      setJobs(jobsData || []);

      if (resumesData?.length > 0) setSelectedResumeId(resumesData[0]._id);
      if (jobsData?.length > 0) setSelectedJobId(jobsData[0]._id);
      if (active?.targetRole) setTargetRole(active.targetRole);
    } catch (err) {
      showMessage(err.message || 'Failed to load roadmap.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    try {
      setGenerating(true);
      const res = await generateRoadmap({
        targetRole,
        resumeId: selectedResumeId || undefined,
        jobId: selectedJobId || undefined,
      });

      if (res?.data) {
        setRoadmap(res.data);
        setIsModalOpen(false);
        showMessage('Personalized 4-Week Learning Roadmap generated successfully!', 'success');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to generate roadmap.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTopic = async (topicId, currentStatus) => {
    if (!roadmap) return;
    const newStatus = !currentStatus;

    // Optimistic UI update
    setRoadmap((prev) => {
      let totalTopics = 0;
      let completedCount = 0;
      const completedList = [];

      const updatedWeeks = prev.weeks.map((week) => ({
        ...week,
        topics: week.topics.map((t) => {
          totalTopics++;
          const isCompleted = t.topicId === topicId ? newStatus : t.isCompleted;
          if (isCompleted) {
            completedCount++;
            completedList.push(t.title);
          }
          return {
            ...t,
            isCompleted,
            completedAt: isCompleted ? new Date() : null,
          };
        }),
      }));

      const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

      return {
        ...prev,
        weeks: updatedWeeks,
        progress,
        completedTopics: completedList,
      };
    });

    try {
      await updateTopicProgress(roadmap._id, {
        topicId,
        isCompleted: newStatus,
      });
    } catch (err) {
      showMessage('Failed to sync topic completion with server.', 'error');
      loadData(); // Revert on failure
    }
  };

  const completedTopicsCount = roadmap?.completedTopics?.length || 0;
  const totalTopicsCount = roadmap?.topics?.length || 0;

  if (loading && !roadmap) {
    return (
      <div className="interview-loading-container">
        <Loader2 size={36} className="spin-icon text-primary" />
        <h3>Loading your Personalized Learning Roadmap...</h3>
      </div>
    );
  }

  return (
    <div className="roadmaps-page">
      {/* Top Banner */}
      <section className="roadmap-header-card">
        <div className="roadmap-header-content">
          <div className="roadmap-pill">
            <Compass size={15} className="text-primary" />
            <span>AI Curriculum Engine</span>
          </div>
          <h1 className="roadmap-title">{roadmap?.targetRole || targetRole} Roadmap</h1>
          <p className="roadmap-desc">
            A structured, personalized 4-week preparation timeline engineered to bridge high-priority containerization, caching, cloud, and distributed system gaps identified in your resume and mock interviews.
          </p>

          {roadmap?.goals?.length > 0 && (
            <div className="roadmap-goals-wrap">
              <span className="goals-label">Strategic Milestones:</span>
              <div className="goals-chips">
                {roadmap.goals.map((goal, idx) => (
                  <span key={idx} className="goal-chip">
                    <Check size={12} className="text-success" />
                    <span>{goal}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Metric Dial */}
        <div className="roadmap-progress-dial-box">
          <div className="progress-dial-circle">
            <span className="dial-percentage">{roadmap?.progress || 0}%</span>
            <span className="dial-sub">COMPLETE</span>
          </div>
          <span className="dial-counter">
            {completedTopicsCount} of {totalTopicsCount} Topics Finished
          </span>
          <button 
            className="btn btn-primary btn-sm btn-full"
            onClick={() => setIsModalOpen(true)}
          >
            <Sparkles size={14} />
            <span>Regenerate Roadmap</span>
          </button>
        </div>
      </section>

      {/* Global Status Toast */}
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

      {/* 4-Week Timeline View */}
      {roadmap ? (
        <div className="weeks-timeline-container">
          {roadmap.weeks.map((week) => {
            const allWeekCompleted = week.topics.every((t) => t.isCompleted);
            const someWeekCompleted = week.topics.some((t) => t.isCompleted);

            return (
              <div key={week.weekNumber} className={`week-timeline-card ${allWeekCompleted ? 'week-complete' : ''}`}>
                <div className="week-card-header">
                  <div className="week-badge-row">
                    <span className="week-number-pill">WEEK {week.weekNumber}</span>
                    {allWeekCompleted ? (
                      <span className="week-status-tag complete">
                        <CheckCircle2 size={13} />
                        <span>Completed</span>
                      </span>
                    ) : someWeekCompleted ? (
                      <span className="week-status-tag in-progress">
                        <Clock size={13} />
                        <span>In Progress</span>
                      </span>
                    ) : (
                      <span className="week-status-tag pending">Upcoming</span>
                    )}
                  </div>
                  <h3 className="week-heading">{week.title}</h3>
                  {week.description && <p className="week-desc">{week.description}</p>}
                </div>

                {/* Topics List */}
                <div className="week-topics-list">
                  {week.topics.map((topic) => {
                    const ResourceIcon = resourceTypeIconMap[topic.resourceType] || Cpu;

                    return (
                      <div 
                        key={topic.topicId} 
                        className={`topic-row-card ${topic.isCompleted ? 'topic-done' : ''}`}
                        onClick={() => handleToggleTopic(topic.topicId, topic.isCompleted)}
                      >
                        <button 
                          type="button"
                          className={`topic-checkbox ${topic.isCompleted ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTopic(topic.topicId, topic.isCompleted);
                          }}
                        >
                          {topic.isCompleted && <Check size={14} />}
                        </button>

                        <div className="topic-content-box">
                          <div className="topic-title-row">
                            <h4 className={`topic-title ${topic.isCompleted ? 'line-through' : ''}`}>
                              {topic.title}
                            </h4>
                            <div className="topic-meta-tags">
                              <span className="resource-tag">
                                <ResourceIcon size={12} />
                                <span>{topic.resourceType}</span>
                              </span>
                              <span className="hours-tag">
                                <Clock size={11} />
                                <span>{topic.estimatedHours}h</span>
                              </span>
                            </div>
                          </div>
                          {topic.description && (
                            <p className="topic-desc">{topic.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="resumes-empty-card">
          <Compass size={48} className="text-muted" />
          <h3 className="empty-title">No Learning Roadmap Found</h3>
          <p className="empty-desc">
            Generate your personalized 4-week learning roadmap to bridge containerization, caching, and system design gaps.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Sparkles size={16} />
            <span>Generate 4-Week Roadmap</span>
          </button>
        </div>
      )}

      {/* Customization & Generation Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container modal-container-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Compass size={18} className="text-primary" />
                <h3 className="modal-title">Generate Personalized Roadmap</h3>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="targetRoleInput">Target Role Title</label>
                <input
                  id="targetRoleInput"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="resumeSelectInput">Link Resume for Baseline Skills</label>
                <select
                  id="resumeSelectInput"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="form-select"
                >
                  <option value="">No Resume Linked (Standard Curriculum)</option>
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>{r.originalFileName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="jobSelectInput">Link Target Job for Requirements</label>
                <select
                  id="jobSelectInput"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="form-select"
                >
                  <option value="">No Job Linked (Standard Industry Targets)</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>{j.title} {j.company ? `(${j.company})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      <span>Generating 4-Week Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Personalized Plan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmaps;
