import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Github, Twitter, Linkedin } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../utils/constants';

const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-brand">
              <Sparkles size={22} className="text-primary" />
              <span className="footer-brand-title">{APP_NAME}</span>
            </div>
            <p className="footer-description">
              {APP_TAGLINE}. Designed to empower students, freshers, and software engineers with intelligent interview readiness.
            </p>
            <div className="footer-social-links">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Platform Columns */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/#features">AI Interviewer</Link></li>
              <li><Link to="/#features">Resume Intelligence</Link></li>
              <li><Link to="/#features">Skill Gap Matrix</Link></li>
              <li><Link to="/#tracks">Career Roadmaps</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/dashboard">Interactive Demo</Link></li>
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#api">API Reference</a></li>
              <li><a href="#guides">Tech Interview Guide</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Architecture</h4>
            <div className="footer-tech-stack">
              <span className="tech-badge">MongoDB</span>
              <span className="tech-badge">Express.js</span>
              <span className="tech-badge">React 18</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">Vite</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p className="footer-credit">
            Built with modern MERN Architecture for aspiring engineers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
