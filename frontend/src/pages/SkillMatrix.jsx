import React, { useState, useEffect } from 'react';
import { fetchAnalyticsOverview } from '../services/analyticsService';
import { 
  BarChart2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Code, 
  Database, 
  Cloud, 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';

const SKILL_CATEGORIES = [
  {
    id: 'languages',
    title: 'Languages & Core Runtimes',
    icon: Code,
    skills: [
      { name: 'JavaScript (ES6+)', status: 'mastered', level: 90 },
      { name: 'TypeScript', status: 'mastered', level: 85 },
      { name: 'Node.js Runtime & Event Loop', status: 'mastered', level: 88 },
      { name: 'HTML5 & Modern CSS', status: 'mastered', level: 92 },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend & Frameworks',
    icon: Layers,
    skills: [
      { name: 'React 18 & Concurrent Rendering', status: 'mastered', level: 86 },
      { name: 'State Architecture & Context API', status: 'mastered', level: 84 },
      { name: 'Component Lifecycle & Custom Hooks', status: 'mastered', level: 88 },
      { name: 'Next.js & Server Components', status: 'developing', level: 60 },
    ],
  },
  {
    id: 'backend',
    title: 'Databases & Caching',
    icon: Database,
    skills: [
      { name: 'MongoDB Schema Design & Mongoose', status: 'mastered', level: 85 },
      { name: 'Compound Index Equality-Sort-Range', status: 'developing', level: 55 },
      { name: 'Redis Cache-Aside Pattern', status: 'gap', level: 30 },
      { name: 'PostgreSQL Relational Modelling', status: 'developing', level: 50 },
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud, DevOps & Architecture',
    icon: Cloud,
    skills: [
      { name: 'RESTful API Engineering & JWT', status: 'mastered', level: 88 },
      { name: 'Docker Containerization & Compose', status: 'gap', level: 35 },
      { name: 'AWS ECS Fargate & Cloud Infrastructure', status: 'gap', level: 25 },
      { name: 'Distributed System Design & Rate Limiting', status: 'developing', level: 58 },
    ],
  },
];

const SkillMatrix = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalyticsOverview();
      setAnalytics(res?.data || null);
    } catch (err) {
      console.error('Failed to load skill analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'mastered') {
      return (
        <span className="skill-status-tag mastered">
          <CheckCircle2 size={12} />
          <span>Mastered</span>
        </span>
      );
    }
    if (status === 'developing') {
      return (
        <span className="skill-status-tag developing">
          <TrendingUp size={12} />
          <span>Developing</span>
        </span>
      );
    }
    return (
      <span className="skill-status-tag gap">
        <AlertTriangle size={12} />
        <span>Priority Gap</span>
      </span>
    );
  };

  return (
    <div className="skill-matrix-page">
      {/* Header */}
      <section className="matrix-header-card">
        <div className="matrix-header-left">
          <div className="matrix-pill">
            <BarChart2 size={15} className="text-primary" />
            <span>Competency Gap Matrix</span>
          </div>
          <h1 className="matrix-title">Technical Skill Gap Matrix</h1>
          <p className="matrix-desc">
            A granular competency matrix analyzing your verified resume skills against high-tier engineering job requirements and mock interview evaluations.
          </p>
        </div>

        <div className="matrix-header-stats">
          <div className="matrix-stat-box">
            <span className="stat-num text-success">
              {analytics?.skillProgress?.verifiedCount || 5}
            </span>
            <span className="stat-label">Verified Masteries</span>
          </div>
          <div className="matrix-stat-box">
            <span className="stat-num text-warning">
              {analytics?.skillProgress?.gapCount || 4}
            </span>
            <span className="stat-label">High-Priority Gaps</span>
          </div>
        </div>
      </section>

      {/* Cloud 2-Column Summary */}
      <div className="matrix-summary-grid">
        <div className="summary-card strengths">
          <div className="summary-card-header">
            <CheckCircle2 size={16} className="text-success" />
            <h3 className="summary-title text-success">Verified Core Competencies</h3>
          </div>
          <div className="skills-pill-cloud">
            {(analytics?.skillProgress?.strongSkills || ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'TypeScript']).map((skill, idx) => (
              <span key={idx} className="skill-bubble mastered">
                <CheckCircle2 size={12} />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="summary-card gaps">
          <div className="summary-card-header">
            <AlertTriangle size={16} className="text-warning" />
            <h3 className="summary-title text-warning">High-Priority Skill Gaps to Bridge</h3>
          </div>
          <div className="skills-pill-cloud">
            {(analytics?.skillProgress?.developingSkills || ['Docker', 'AWS Cloud', 'Redis Caching', 'System Design']).map((skill, idx) => (
              <span key={idx} className="skill-bubble gap">
                <AlertTriangle size={12} />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Granular Categories Grid */}
      <div className="categories-matrix-grid">
        {SKILL_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;

          return (
            <div key={cat.id} className="category-matrix-card">
              <div className="cat-card-header">
                <div className="cat-icon-box">
                  <CatIcon size={18} />
                </div>
                <h3 className="cat-title">{cat.title}</h3>
              </div>

              <div className="cat-skills-list">
                {cat.skills.map((s, idx) => (
                  <div key={idx} className="skill-item-row">
                    <div className="skill-name-row">
                      <span className="skill-name">{s.name}</span>
                      {getStatusBadge(s.status)}
                    </div>
                    <div className="skill-level-track">
                      <div 
                        className={`skill-level-fill ${s.status}`} 
                        style={{ width: `${s.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillMatrix;
