import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Video, 
  Briefcase,
  GitCompare,
  Bot,
  Compass, 
  Map,
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Users,
  Target,
  Database,
  Cpu,
  Award,
  CheckCircle2,
  Lock,
  Radio
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-blob-1"></div>
        <div className="hero-glow-blob-2"></div>
        
        <div className="container hero-container">
          <div className="hero-tag-pill">
            <Sparkles size={16} className="text-primary animate-pulse" />
            <span>AI Career Intelligence & Live Interview Simulator</span>
          </div>

          <h1 className="hero-heading">
            Master Technical Interviews with <span className="text-gradient">Intelligent AI Systems</span>
          </h1>

          <p className="hero-subtitle">
            The all-in-one AI career intelligence platform. Optimize your resume for ATS, semantically match target job descriptions, practice real-time voice mock interviews with adaptive scoring, and follow personalized learning roadmaps.
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn btn-primary btn-lg">
              <span>Start Free Preparation</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              <span>Open Console</span>
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="hero-stats-strip">
            <div className="stat-card">
              <span className="stat-number">98%</span>
              <span className="stat-label">ATS Match Accuracy</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <span className="stat-number">768-Dim</span>
              <span className="stat-label">Dense Vector Embeddings</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <span className="stat-number">Real-Time</span>
              <span className="stat-label">Voice & WebSocket Engine</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <span className="stat-number">4-Week</span>
              <span className="stat-label">Personalized Roadmaps</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Architecture Strip */}
      <section className="tech-stack-strip">
        <div className="container">
          <p className="tech-stack-label">POWERED BY ENTERPRISE CLOUD ARCHITECTURE & AI</p>
          <div className="tech-logos-row">
            <div className="tech-chip"><Cpu size={16} className="text-primary" /> Google Gemini 1.5</div>
            <div className="tech-chip"><Database size={16} className="text-emerald" /> MongoDB Atlas Vector Search</div>
            <div className="tech-chip"><Radio size={16} className="text-cyan" /> Socket.IO WebSockets</div>
            <div className="tech-chip"><Zap size={16} className="text-amber" /> Redis & BullMQ Queues</div>
            <div className="tech-chip"><Lock size={16} className="text-pink" /> HTTP-Only JWT Security</div>
          </div>
        </div>
      </section>

      {/* Core Platform Modules Section */}
      <section id="features" className="section-features">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-eyebrow">ENTERPRISE INTELLIGENCE SUITE</div>
            <h2 className="section-title">Everything You Need to Get Hired</h2>
            <p className="section-subtitle">
              From automated resume parsing to live spoken mock interviews, CareerAI guides your journey from preparation to job offer.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1: Resume Intelligence */}
            <div className="feature-card saas-card-hover">
              <div className="feature-icon-box bg-indigo">
                <FileText size={24} />
              </div>
              <h3 className="feature-title">Resume Intelligence & ATS</h3>
              <p className="feature-description">
                Upload PDF or Word resumes. Extract textual contents, validate ATS keywords, compute section-by-section scores, and index dense vector embeddings.
              </p>
              <div className="feature-footer">
                <span className="feature-pill">Active Module</span>
              </div>
            </div>

            {/* Feature 2: Job Intelligence */}
            <div className="feature-card saas-card-hover">
              <div className="feature-icon-box bg-emerald">
                <Briefcase size={24} />
              </div>
              <h3 className="feature-title">Job Description Intelligence</h3>
              <p className="feature-description">
                Paste job postings to automatically parse required tech stacks, preferred skills, seniority levels, and core engineering responsibilities.
              </p>
              <div className="feature-footer">
                <span className="feature-pill">Active Module</span>
              </div>
            </div>

            {/* Feature 3: Resume Matcher */}
            <div className="feature-card saas-card-hover">
              <div className="feature-icon-box bg-cyan">
                <GitCompare size={24} />
              </div>
              <h3 className="feature-title">Semantic Resume-to-Job Matcher</h3>
              <p className="feature-description">
                Deterministic 3-tier matching engine (45% skills + 40% dense vector similarity + 15% seniority) identifying exact matches and priority skill gaps.
              </p>
              <div className="feature-footer">
                <span className="feature-pill">Dense Vectors</span>
              </div>
            </div>

            {/* Feature 4: RAG Career Assistant */}
            <div className="feature-card saas-card-hover">
              <div className="feature-icon-box bg-pink">
                <Bot size={24} />
              </div>
              <h3 className="feature-title">Production RAG Assistant</h3>
              <p className="feature-description">
                Grounded conversational assistant querying top-K semantic chunks from your uploaded resumes and target jobs with prompt injection guardrails.
              </p>
              <div className="feature-footer">
                <span className="feature-pill">Grounded AI</span>
              </div>
            </div>

            {/* Feature 5: Voice Mock Interviews */}
            <div className="feature-card saas-card-hover">
              <div className="feature-icon-box bg-amber">
                <Video size={24} />
              </div>
              <h3 className="feature-title">Voice & Real-Time Mock Interviews</h3>
              <p className="feature-description">
                Live interview room over Socket.IO with Web Audio soundwaves, Speech-to-Text, speaking pace analysis (WPM), and spoken AI feedback.
              </p>
              <div className="feature-footer">
                <span className="feature-pill">Live WebSockets</span>
              </div>
            </div>

            {/* Feature 6: Learning Roadmaps */}
            <div className="feature-card saas-card-hover">
              <div className="feature-icon-box bg-indigo">
                <Map size={24} />
              </div>
              <h3 className="feature-title">Personalized Learning Roadmaps</h3>
              <p className="feature-description">
                4-week structured milestones generated from your real skill gaps, target job postings, and interview evaluations with progress tracking.
              </p>
              <div className="feature-footer">
                <span className="feature-pill">4-Week Milestones</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner-box">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Land Your Dream Software Role?</h2>
              <p className="cta-desc">
                Join thousands of developers using CareerAI to analyze resumes, pass tough technical screens, and accelerate their software careers.
              </p>
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
