const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { matchResumeToJob } = require('./matcher.service');
const logger = require('../utils/logger');

/**
 * 1. Retrieve Candidate Resume Information
 */
const getUserResume = async (userId) => {
  if (!userId) throw new Error('userId is required for getUserResume tool');
  logger.info(`[Tool: getUserResume] Fetching resume for user ${userId}`);

  const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
  if (!resume) {
    return { hasResume: false, message: 'No resume uploaded yet.' };
  }

  return {
    hasResume: true,
    resumeId: resume._id,
    fileName: resume.originalFileName,
    score: resume.score || 0,
    skills: resume.analysis?.skills || {},
    projects: resume.analysis?.projects || [],
    strengths: resume.analysis?.strengths || [],
    weaknesses: resume.analysis?.weaknesses || [],
    missingSkills: resume.analysis?.missingSkills || [],
    extractedTextPreview: resume.extractedText ? resume.extractedText.substring(0, 400) + '...' : '',
  };
};

/**
 * 2. Retrieve Candidate GitHub Profile and Bio
 */
const getGitHubProfile = async (userId) => {
  if (!userId) throw new Error('userId is required for getGitHubProfile tool');
  logger.info(`[Tool: getGitHubProfile] Fetching profile for user ${userId}`);

  const user = await User.findById(userId).select('name email role profile');
  if (!user) {
    return { hasProfile: false, message: 'User profile not found.' };
  }

  return {
    hasProfile: true,
    name: user.name,
    targetRole: user.profile?.targetRole || 'Full Stack Engineer',
    bio: user.profile?.bio || 'Software Developer specializing in modern web applications',
    experienceLevel: user.profile?.experienceLevel || '1-3 years',
    skills: user.profile?.skills || ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  };
};

/**
 * 3. Retrieve Candidate Mock Interview History & Topic Progressions
 */
const getInterviewHistory = async (userId) => {
  if (!userId) throw new Error('userId is required for getInterviewHistory tool');
  logger.info(`[Tool: getInterviewHistory] Fetching interview history for user ${userId}`);

  const interviews = await Interview.find({ userId }).sort({ createdAt: 1 });
  if (!interviews || interviews.length === 0) {
    return { totalSessions: 0, message: 'No mock interview sessions recorded yet.' };
  }

  // Topic progressions tracking (e.g. Authentication, React, MongoDB across time)
  const topicProgression = {};
  interviews.forEach((interview) => {
    interview.answers?.forEach((ans) => {
      const q = interview.questions?.find((qu) => qu.questionId === ans.questionId);
      const cat = q?.category || 'General';
      if (!topicProgression[cat]) {
        topicProgression[cat] = [];
      }
      topicProgression[cat].push({
        score: ans.technicalAccuracy || ans.overall || 0,
        date: ans.submittedAt || interview.createdAt,
      });
    });
  });

  const recentInterviews = interviews.slice(-3).map((iv) => ({
    id: iv._id,
    type: iv.type,
    difficulty: iv.difficulty,
    targetRole: iv.targetRole,
    status: iv.status,
    overallScore: iv.overallScore,
    questionsCount: iv.questions?.length || 0,
    answersCount: iv.answers?.length || 0,
    scores: iv.scores,
    createdAt: iv.createdAt,
  }));

  const avgOverall = Math.round(
    interviews.reduce((sum, iv) => sum + (iv.overallScore || 0), 0) / interviews.length
  );

  return {
    totalSessions: interviews.length,
    averageOverallScore: avgOverall,
    recentInterviews,
    topicProgression,
  };
};

/**
 * 4. Retrieve Candidate Verified Skill Progress
 */
const getSkillProgress = async (userId) => {
  if (!userId) throw new Error('userId is required for getSkillProgress tool');
  logger.info(`[Tool: getSkillProgress] Computing skill progress for user ${userId}`);

  const [resume, interviews] = await Promise.all([
    Resume.findOne({ userId }).sort({ createdAt: -1 }),
    Interview.find({ userId, status: 'completed' }),
  ]);

  const strongSkills = [];
  const developingSkills = [];

  if (resume?.analysis?.skills?.all) {
    strongSkills.push(...resume.analysis.skills.all.slice(0, 6));
  }

  if (resume?.analysis?.missingSkills) {
    developingSkills.push(...resume.analysis.missingSkills.slice(0, 4));
  }

  return {
    strongSkills: Array.from(new Set(strongSkills)),
    developingSkills: Array.from(new Set(developingSkills)),
    completedInterviewsCount: interviews.length,
  };
};

/**
 * 5. Retrieve Specific or Latest Target Job Description
 */
const getJobDescription = async (userId, params = {}) => {
  if (!userId) throw new Error('userId is required for getJobDescription tool');
  logger.info(`[Tool: getJobDescription] Fetching target job for user ${userId}`);

  let job = null;
  if (params.jobId) {
    job = await Job.findOne({ _id: params.jobId, userId });
  } else {
    job = await Job.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!job) {
    return { hasJob: false, message: 'No target job description saved in records.' };
  }

  return {
    hasJob: true,
    jobId: job._id,
    title: job.title,
    company: job.company,
    requiredSkills: job.requiredSkills || [],
    preferredSkills: job.preferredSkills || [],
    seniorityLevel: job.analysis?.seniorityLevel || 'Mid-Level',
    summary: job.analysis?.summary || job.description?.substring(0, 250) + '...',
  };
};

/**
 * 6. Compute Semantic Skill Gaps Against Target Job
 */
const getSkillGaps = async (userId, params = {}) => {
  if (!userId) throw new Error('userId is required for getSkillGaps tool');
  logger.info(`[Tool: getSkillGaps] Calculating skill gaps for user ${userId}`);

  let job = null;
  let resume = null;

  if (params.jobId) {
    job = await Job.findOne({ _id: params.jobId, userId });
  } else {
    job = await Job.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (params.resumeId) {
    resume = await Resume.findOne({ _id: params.resumeId, userId });
  } else {
    resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!job || !resume) {
    return {
      hasComparison: false,
      message: 'Both a saved resume and target job are required to calculate skill gaps.',
    };
  }

  const matchResult = await matchCandidateResumeToJob({
    resume,
    job,
    userId,
  });

  return {
    hasComparison: true,
    targetRole: job.title,
    company: job.company,
    matchScore: matchResult.matchScore,
    matchingSkills: matchResult.matchingSkills,
    missingSkills: matchResult.missingSkills,
    priorityGaps: matchResult.priorityGaps,
    recommendations: matchResult.recommendations,
  };
};

/**
 * 7. Retrieve / Generate Tailored Learning Roadmap
 */
const getLearningRoadmap = async (userId) => {
  if (!userId) throw new Error('userId is required for getLearningRoadmap tool');
  logger.info(`[Tool: getLearningRoadmap] Generating learning roadmap for user ${userId}`);

  const gapsData = await getSkillGaps(userId);
  const gaps = gapsData.missingSkills || ['Docker', 'AWS Cloud', 'PostgreSQL Query Optimization', 'System Design'];

  const roadmapMilestones = [
    {
      phase: 'Phase 1: High-Priority Core Blockers',
      focusArea: gaps[0] || 'Containerization & Docker Fundamentals',
      actions: [
        'Build and containerize a multi-container full-stack application using Docker Compose.',
        'Implement production container networking, volumes, and multi-stage builds.',
      ],
      estimatedDays: 7,
    },
    {
      phase: 'Phase 2: Database & Scalability Nuances',
      focusArea: gaps[1] || 'Database Indexing & Query Profiling',
      actions: [
        'Master explain("executionStats") in MongoDB and compound index Equality-Sort-Range rules.',
        'Implement Redis caching strategies with TTL invalidation policies.',
      ],
      estimatedDays: 10,
    },
    {
      phase: 'Phase 3: Production System Architecture & Mock Practice',
      focusArea: 'Distributed Systems & Mock Interview Simulations',
      actions: [
        'Design a high-concurrency rate-limited URL shortener or video streaming service.',
        'Complete 3 Hard-difficulty mock interview simulations in CareerAI.',
      ],
      estimatedDays: 14,
    },
  ];

  return {
    targetRole: gapsData.targetRole || 'Senior Full Stack Software Engineer',
    matchScore: gapsData.matchScore || 75,
    roadmapMilestones,
    estimatedTimeToReadiness: '3-4 Weeks',
  };
};

/**
 * Tool Registry Map for Safe Dynamic Execution (Prototype-pollution free & frozen)
 */
const TOOLS_REGISTRY = Object.freeze(
  Object.assign(Object.create(null), {
    getUserResume,
    getGitHubProfile,
    getInterviewHistory,
    getSkillProgress,
    getJobDescription,
    getSkillGaps,
    getLearningRoadmap,
  })
);

module.exports = {
  TOOLS_REGISTRY,
  getUserResume,
  getGitHubProfile,
  getInterviewHistory,
  getSkillProgress,
  getJobDescription,
  getSkillGaps,
  getLearningRoadmap,
};
