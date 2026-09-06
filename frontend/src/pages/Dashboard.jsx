import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../hooks/useHealth';
import { 
  Sparkles, 
  FileText, 
  Video, 
  Briefcase, 
  GitCompare,
  Bot,
  Compass, 
  Map,
  BarChart2, 
  TrendingUp,
  ArrowRight, 
  Server, 
  Database, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Zap,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Activity
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { health, loading } = useHealth(10000);
  const navigate = useNavigate();

  const isHealthy = health?.status === 'healthy';
  const isDbConnected = health?.database?.state === 'connected';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Mocked/calculated summary metrics
  const readinessScore = 78;
  const resumeATSScore = 85;
  const jobMatchScore = 82;
  const mockInterviewScore = 86;

  return (
    <div className="dashboard-page">
      {/* User Welcome Banner with Authenticated Details */}
      <section className="dashboard-welcome-card saas-card-hover">
        <div className="welcome-content">
          <div className="welcome-pill">
            <Sparkles size={16} className="text-primary" />
            <span>Target Role: {user?.profile?.targetRole || 'Full Stack Engineer'}</span>
          </div>
          <h1 className="welcome-title">
            Welcome back, {user?.name || 'Developer'}!
          </h1>
          <p className="welcome-desc">
            Your personalized AI career engine is active. Track your skill readiness, simulate real-time technical interviews, and match against target job descriptions.
          </p>
          <div className="welcome-actions">
            <Link to="/dashboard/interview" className="btn btn-primary btn-sm">
              <Video size={15} />
              <span>Start Mock Interview</span>
            </Link>
            <Link to="/dashboard/match" className="btn btn-secondary btn-sm">
              <GitCompare size={15} />
              <span>Match Resume to Job</span>
            </Link>
          </div>
        </div>

        <div className="welcome-visual desktop-only">
          <div className="user-profile-badge-card">
            <div className="avatar-circle-lg">
              {getInitials(user?.name)}
            </div>
            <div className="avatar-meta">
              <span className="user-badge-role">{user?.role?.toUpperCase() || 'STUDENT'}</span>
              <span className="user-badge-exp">{user?.profile?.experienceLevel || '1-3 Years'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact Performance Metrics Bar */}
      <section className="dashboard-section">
        <div className="metric-card-grid">
          {/* Career Readiness Index */}
          <div className="panel-card metric-panel saas-card-hover">
            <div className="metric-header-row">
              <span className="metric-label">Career Readiness Index</span>
              <Award size={18} className="text-primary" />
            </div>
            <div className="metric-score-row">
              <h2 className="metric-huge-number">{readinessScore}%</h2>
              <span className="metric-badge-trend text-success">+12% this week</span>
            </div>
            <div className="progress-bar-track mt-2">
              <div className="progress-bar-fill" style={{ width: `${readinessScore}%` }}></div>
            </div>
            <p className="metric-subtext">Synthesized from resume, job match, and interview performance.</p>
          </div>

          {/* Resume ATS Score */}
          <div className="panel-card metric-panel saas-card-hover">
            <div className="metric-header-row">
              <span className="metric-label">Resume ATS Score</span>
              <FileText size={18} className="text-cyan" />
            </div>
            <div className="metric-score-row">
              <h2 className="metric-huge-number">{resumeATSScore}/100</h2>
              <span className="metric-badge-trend text-success">ATS Optimized</span>
            </div>
            <div className="progress-bar-track mt-2">
              <div className="progress-bar-fill" style={{ width: `${resumeATSScore}%`, background: 'var(--accent-cyan)' }}></div>
            </div>
            <p className="metric-subtext">Keywords, formatting, and structural score.</p>
          </div>

          {/* Target Job Match */}
          <div className="panel-card metric-panel saas-card-hover">
            <div className="metric-header-row">
              <span className="metric-label">Target Job Match</span>
              <GitCompare size={18} className="text-pink" />
            </div>
            <div className="metric-score-row">
              <h2 className="metric-huge-number">{jobMatchScore}%</h2>
              <span className="metric-badge-trend text-primary">Strong Alignment</span>
            </div>
            <div className="progress-bar-track mt-2">
              <div className="progress-bar-fill" style={{ width: `${jobMatchScore}%`, background: 'var(--accent-pink)' }}></div>
            </div>
            <p className="metric-subtext">Skill parity against saved Senior Full Stack roles.</p>
          </div>

          {/* Mock Interview Mastery */}
          <div className="panel-card metric-panel saas-card-hover">
            <div className="metric-header-row">
              <span className="metric-label">Mock Interview Avg</span>
              <Video size={18} className="text-emerald" />
            </div>
            <div className="metric-score-row">
              <h2 className="metric-huge-number">{mockInterviewScore}%</h2>
              <span className="metric-badge-trend text-success">Hire Ready</span>
            </div>
            <div className="progress-bar-track mt-2">
              <div className="progress-bar-fill" style={{ width: `${mockInterviewScore}%`, background: 'var(--accent-emerald)' }}></div>
            </div>
            <p className="metric-subtext">Evaluated across 6 technical and communication dimensions.</p>
          </div>
        </div>
      </section>

      {/* Live Intelligence Platform Modules Grid */}
      <section id="quick-modules" className="dashboard-section">
        <div className="section-title-row">
          <div className="title-with-count">
            <h2 className="section-header-title">Active Career Intelligence Suite</h2>
            <span className="resumes-count-badge">8 Modules</span>
          </div>
          <span className="section-subtext">Production AI tools trained on your career data</span>
        </div>

        <div className="modules-grid">
          {/* Module 1: Resume Intelligence */}
          <Link to="/dashboard/resume" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-indigo">
                <FileText size={22} />
              </div>
              <span className="module-badge badge-active">AI Engine</span>
            </div>
            <h3 className="module-title">Resume Intelligence & Parsing</h3>
            <p className="module-desc">
              Upload PDF or DOCX resumes. Extract text, evaluate ATS compliance, and score technical skills with structured Zod AI validation.
            </p>
            <div className="module-footer">
              <span className="module-status text-primary">Open Resume Hub</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 2: Job Intelligence */}
          <Link to="/dashboard/jobs" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-emerald">
                <Briefcase size={22} />
              </div>
              <span className="module-badge">Active</span>
            </div>
            <h3 className="module-title">Job Description Intelligence</h3>
            <p className="module-desc">
              Parse hiring requirements, extract required vs preferred technologies, and isolate core engineering responsibilities.
            </p>
            <div className="module-footer">
              <span className="module-status text-emerald">Manage Target Jobs</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 3: Semantic Resume Matcher */}
          <Link to="/dashboard/match" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-cyan">
                <GitCompare size={22} />
              </div>
              <span className="module-badge badge-active">Dense Vectors</span>
            </div>
            <h3 className="module-title">Resume-to-Job Semantic Matcher</h3>
            <p className="module-desc">
              Deterministic 3-tier matching combining vector cosine similarity, structured skill overlap, and candidate seniority metrics.
            </p>
            <div className="module-footer">
              <span className="module-status text-cyan">Analyze Match</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 4: Production RAG Assistant */}
          <Link to="/dashboard/assistant" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-pink">
                <Bot size={22} />
              </div>
              <span className="module-badge">RAG 2.0</span>
            </div>
            <h3 className="module-title">AI Career Assistant (RAG)</h3>
            <p className="module-desc">
              Ask deep questions about your career trajectory grounded strictly in your uploaded resumes, job postings, and project records.
            </p>
            <div className="module-footer">
              <span className="module-status text-pink">Ask Questions</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 5: AI Mock Interviews */}
          <Link to="/dashboard/interview" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-amber">
                <Video size={22} />
              </div>
              <span className="module-badge badge-active">WebSockets + Voice</span>
            </div>
            <h3 className="module-title">Voice & Real-Time Mock Interviews</h3>
            <p className="module-desc">
              Live AI mock interviews over WebSockets with Web Audio soundwaves, Speech-to-Text, speaking pace analysis, and adaptive difficulty.
            </p>
            <div className="module-footer">
              <span className="module-status text-amber">Enter Studio</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 6: AI Career Mentor */}
          <Link to="/dashboard/mentor" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-indigo">
                <Compass size={22} />
              </div>
              <span className="module-badge">Persistent Memory</span>
            </div>
            <h3 className="module-title">AI Career Mentor with Tools</h3>
            <p className="module-desc">
              Strategic career coaching using 7 safe deterministic tools and persistent memory to track recurring growth areas over time.
            </p>
            <div className="module-footer">
              <span className="module-status text-primary">Chat with Mentor</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 7: Learning Roadmaps */}
          <Link to="/dashboard/roadmaps" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-cyan">
                <Map size={22} />
              </div>
              <span className="module-badge">4-Week Milestones</span>
            </div>
            <h3 className="module-title">Personalized Learning Roadmaps</h3>
            <p className="module-desc">
              4-week structured milestones dynamically generated from your resume gaps, target jobs, and mock interview performance.
            </p>
            <div className="module-footer">
              <span className="module-status text-cyan">View Roadmap</span>
              <ChevronRight size={18} />
            </div>
          </Link>

          {/* Module 8: Career Analytics */}
          <Link to="/dashboard/analytics" className="module-card saas-card-hover">
            <div className="module-header">
              <div className="module-icon bg-emerald">
                <TrendingUp size={22} />
              </div>
              <span className="module-badge">Telemetry</span>
            </div>
            <h3 className="module-title">Career Readiness Analytics</h3>
            <p className="module-desc">
              Deep telemetry tracking score progressions across technical accuracy, problem solving, communication, and roadmap milestones.
            </p>
            <div className="module-footer">
              <span className="module-status text-emerald">View Charts</span>
              <ChevronRight size={18} />
            </div>
          </Link>
        </div>
      </section>

      {/* Live System & Database Telemetry Strip */}
      <section className="dashboard-section">
        <div className="section-title-row">
          <h2 className="section-header-title">Live System Telemetry & Cluster Health</h2>
          <span className="section-header-badge">GET /api/health</span>
        </div>

        <div className="telemetry-grid">
          {/* API Server Card */}
          <div className="telemetry-card saas-card-hover">
            <div className="telemetry-icon-row">
              <div className="telemetry-icon-box bg-indigo">
                <Server size={20} />
              </div>
              <span className={`status-pill ${isHealthy ? 'pill-online' : 'pill-warning'}`}>
                {loading ? 'Polling...' : isHealthy ? 'API Active' : 'Offline'}
              </span>
            </div>
            <div className="telemetry-data">
              <span className="telemetry-label">Express Backend Service</span>
              <h3 className="telemetry-value">{health?.service || 'CareerAI Backend'}</h3>
              <div className="telemetry-meta">
                <span>Node {health?.system?.nodeVersion || 'v26.x'}</span>
                <span>•</span>
                <span>Uptime: {health?.uptime?.formatted || 'Online'}</span>
              </div>
            </div>
          </div>

          {/* Database Card */}
          <div className="telemetry-card saas-card-hover">
            <div className="telemetry-icon-row">
              <div className="telemetry-icon-box bg-emerald">
                <Database size={20} />
              </div>
              <span className={`status-pill ${isDbConnected ? 'pill-online' : 'pill-danger'}`}>
                {loading ? 'Checking...' : isDbConnected ? 'MongoDB Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="telemetry-data">
              <span className="telemetry-label">Primary Database</span>
              <h3 className="telemetry-value">
                {health?.database?.provider || 'MongoDB'} ({health?.database?.name || 'careerai'})
              </h3>
              <div className="telemetry-meta">
                <span>Host: {health?.database?.host || '127.0.0.1'}</span>
                <span>•</span>
                <span>State: {health?.database?.state || 'connected'}</span>
              </div>
            </div>
          </div>

          {/* Authentication Security Card */}
          <div className="telemetry-card saas-card-hover">
            <div className="telemetry-icon-row">
              <div className="telemetry-icon-box bg-cyan">
                <ShieldCheck size={20} />
              </div>
              <span className="status-pill pill-online">Secured (JWT)</span>
            </div>
            <div className="telemetry-data">
              <span className="telemetry-label">Authentication Layer</span>
              <h3 className="telemetry-value">HTTP-Only Cookie + Bcrypt</h3>
              <div className="telemetry-meta">
                <span>User ID: {user?._id?.substring(0, 10)}...</span>
                <span>•</span>
                <span>Role: {user?.role || 'student'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
