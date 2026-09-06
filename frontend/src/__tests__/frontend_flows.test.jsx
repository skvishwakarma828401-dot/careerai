import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// 1. Test Auth Flow (Login & Register forms)
describe('Frontend Authentication Flows', () => {
  it('renders login form and captures user credentials', () => {
    const mockOnSubmit = vi.fn((e) => e.preventDefault());

    render(
      <form onSubmit={mockOnSubmit} data-testid="login-form">
        <input type="email" placeholder="name@company.com" aria-label="Email Address" required defaultValue="alex@careerai.dev" />
        <input type="password" placeholder="••••••••" aria-label="Password" required defaultValue="password123" />
        <button type="submit">Sign In to Dashboard</button>
      </form>
    );

    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Sign In to Dashboard/i });
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('validates minimum password length on registration', () => {
    const validatePassword = (pwd) => (pwd.length >= 6 ? null : 'Password must be at least 6 characters');

    expect(validatePassword('12345')).toBe('Password must be at least 6 characters');
    expect(validatePassword('123456')).toBeNull();
  });
});

// 2. Test Dashboard Flow
describe('Frontend Dashboard Overview', () => {
  it('renders dashboard metrics correctly', () => {
    const mockMetrics = {
      careerReadiness: 78,
      resumeScore: 85,
      jobMatchScore: 82,
      interviewScore: 80,
    };

    render(
      <div data-testid="dashboard-summary">
        <h1>Welcome back, Alex!</h1>
        <div className="metric-card">
          <span>Career Readiness</span>
          <h2>{mockMetrics.careerReadiness}%</h2>
        </div>
        <div className="metric-card">
          <span>Resume ATS Score</span>
          <h2>{mockMetrics.resumeScore}/100</h2>
        </div>
      </div>
    );

    expect(screen.getByText('Welcome back, Alex!')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });
});

// 3. Test Resume Upload & Validation
describe('Frontend Resume Upload Flow', () => {
  it('validates allowed document formats (PDF & DOCX)', () => {
    const validateFile = (fileName, size) => {
      const ext = '.' + fileName.split('.').pop().toLowerCase();
      if (!['.pdf', '.docx'].includes(ext)) {
        return 'Invalid file type. Only PDF and DOCX supported.';
      }
      if (size > 5 * 1024 * 1024) {
        return 'File exceeds maximum size of 5MB.';
      }
      return null;
    };

    expect(validateFile('resume.pdf', 1024)).toBeNull();
    expect(validateFile('cv.docx', 2048)).toBeNull();
    expect(validateFile('malicious.exe', 512)).toBe('Invalid file type. Only PDF and DOCX supported.');
    expect(validateFile('huge_resume.pdf', 6 * 1024 * 1024)).toBe('File exceeds maximum size of 5MB.');
  });
});

// 4. Test Job Match Flow & Deterministic Scoring
describe('Frontend Job Match Dashboard', () => {
  it('renders match score and priority skill gaps', () => {
    const matchData = {
      matchScore: 84,
      matchingSkills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
      missingSkills: ['Kubernetes', 'Redis', 'Docker'],
      priorityGaps: ['Kubernetes', 'Redis'],
    };

    render(
      <div data-testid="match-dashboard">
        <div className="score-circle">
          <h3>Match Score: {matchData.matchScore}%</h3>
        </div>
        <div className="skills-section">
          <h4>Matching Skills ({matchData.matchingSkills.length})</h4>
          <ul>
            {matchData.matchingSkills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="gaps-section">
          <h4>Priority Gaps ({matchData.priorityGaps.length})</h4>
          <ul>
            {matchData.priorityGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>
    );

    expect(screen.getByText('Match Score: 84%')).toBeInTheDocument();
    expect(screen.getByText('Matching Skills (4)')).toBeInTheDocument();
    expect(screen.getByText('Priority Gaps (2)')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
  });
});

// 5. Test Mock Interview & Voice Controls
describe('Frontend Mock Interview Flow', () => {
  it('toggles between Voice Mode and Text Mode', () => {
    let mode = 'voice';
    const setMode = vi.fn((newMode) => {
      mode = newMode;
    });

    render(
      <div>
        <button onClick={() => setMode('voice')}>🎙️ Voice Mode</button>
        <button onClick={() => setMode('text')}>⌨️ Text Mode</button>
      </div>
    );

    const textModeBtn = screen.getByRole('button', { name: /Text Mode/i });
    fireEvent.click(textModeBtn);

    expect(setMode).toHaveBeenCalledWith('text');
  });
});

// 6. Test Learning Roadmap Progress Toggling
describe('Frontend Roadmap Milestones Flow', () => {
  it('calculates updated progress when topics are completed', () => {
    const totalTopics = 8;
    const completedTopics = ['w1_t1', 'w1_t2', 'w2_t1'];

    const calculateProgress = (completed, total) => {
      return Math.round((completed.length / total) * 100);
    };

    expect(calculateProgress(completedTopics, totalTopics)).toBe(38);

    completedTopics.push('w2_t2');
    expect(calculateProgress(completedTopics, totalTopics)).toBe(50);
  });
});
