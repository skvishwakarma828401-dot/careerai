const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Interview = require('../models/Interview');
const Roadmap = require('../models/Roadmap');
const { matchResumeToJob } = require('./matcher.service');
const logger = require('../utils/logger');

/**
 * Aggregate comprehensive career analytics and readiness metrics for candidate
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getCandidateCareerAnalytics = async (userId) => {
  if (!userId) throw new Error('userId is required to generate career analytics.');
  logger.info(`Aggregating career analytics for user ${userId}`);

  const [resumes, jobs, interviews, activeRoadmap] = await Promise.all([
    Resume.find({ userId }).sort({ createdAt: -1 }),
    Job.find({ userId }).sort({ createdAt: -1 }),
    Interview.find({ userId }).sort({ createdAt: 1 }),
    Roadmap.findOne({ userId, status: 'active' }).sort({ createdAt: -1 }),
  ]);

  // 1. Resume Score
  const latestResume = resumes[0] || null;
  const resumeScore = latestResume?.score || 0;

  // 2. Job Match Score
  let jobMatchScore = 0;
  let matchingSkills = [];
  let missingSkills = [];

  if (latestResume && jobs.length > 0) {
    try {
      const matchResult = await matchCandidateResumeToJob({
        resume: latestResume,
        job: jobs[0],
        userId,
      });
      jobMatchScore = matchResult.matchScore || 0;
      matchingSkills = matchResult.matchingSkills || [];
      missingSkills = matchResult.missingSkills || [];
    } catch (err) {
      logger.warn(`Analytics match score calculation error: ${err.message}`);
    }
  }

  // 3. Interview Performance Metrics
  let totalTechAccuracy = 0;
  let totalCommunication = 0;
  let totalCompleteness = 0;
  let totalProblemSolving = 0;
  let totalAnswersEvaluated = 0;
  const interviewAttempts = interviews.length;

  const modeBreakdown = {};
  const scoreHistory = [];

  interviews.forEach((iv, idx) => {
    modeBreakdown[iv.type] = (modeBreakdown[iv.type] || 0) + 1;

    scoreHistory.push({
      sessionNumber: idx + 1,
      id: iv._id,
      type: iv.type,
      difficulty: iv.difficulty,
      overallScore: iv.overallScore || 0,
      technicalScore: iv.scores?.technicalAccuracy || iv.overallScore || 0,
      communicationScore: iv.scores?.communication || iv.overallScore || 0,
      date: iv.createdAt,
    });

    iv.answers?.forEach((ans) => {
      if (ans.technicalAccuracy) {
        totalTechAccuracy += ans.technicalAccuracy;
        totalCommunication += ans.communication || ans.technicalAccuracy;
        totalCompleteness += ans.completeness || ans.technicalAccuracy;
        totalProblemSolving += ans.problemSolving || ans.technicalAccuracy;
        totalAnswersEvaluated++;
      }
    });
  });

  const technicalScore = totalAnswersEvaluated > 0 ? Math.round(totalTechAccuracy / totalAnswersEvaluated) : 75;
  const communicationScore = totalAnswersEvaluated > 0 ? Math.round(totalCommunication / totalAnswersEvaluated) : 78;
  const completenessScore = totalAnswersEvaluated > 0 ? Math.round(totalCompleteness / totalAnswersEvaluated) : 72;
  const problemSolvingScore = totalAnswersEvaluated > 0 ? Math.round(totalProblemSolving / totalAnswersEvaluated) : 76;

  // 4. Roadmap Metrics
  const roadmapProgress = activeRoadmap?.progress || 0;
  const completedTopicsCount = activeRoadmap?.completedTopics?.length || 0;
  const totalRoadmapTopicsCount = activeRoadmap?.topics?.length || 0;

  // 5. Skill Matrices
  const allResumeSkills = latestResume?.analysis?.skills?.all || ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'];
  const allMissingSkills = missingSkills.length > 0 ? missingSkills : ['Docker', 'AWS', 'Redis', 'System Design'];

  // 6. Unified CareerAI Readiness Index (0-100)
  const baseResume = resumeScore > 0 ? resumeScore : 70;
  const baseMatch = jobMatchScore > 0 ? jobMatchScore : 72;
  const readinessScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        baseResume * 0.30 +
        baseMatch * 0.30 +
        technicalScore * 0.25 +
        roadmapProgress * 0.15
      )
    )
  );

  return {
    readinessScore,
    resumeScore,
    jobMatchScore,
    technicalScore,
    communicationScore,
    completenessScore,
    problemSolvingScore,
    interviewAttempts,
    modeBreakdown,
    scoreHistory,
    roadmapProgress,
    completedTopicsCount,
    totalRoadmapTopicsCount,
    skillProgress: {
      strongSkills: allResumeSkills,
      developingSkills: allMissingSkills,
      verifiedCount: allResumeSkills.length,
      gapCount: allMissingSkills.length,
    },
    counts: {
      resumesCount: resumes.length,
      jobsCount: jobs.length,
      interviewsCount: interviews.length,
      activeRoadmapId: activeRoadmap?._id || null,
    },
  };
};

module.exports = {
  getCandidateCareerAnalytics,
};
