const Roadmap = require('../models/Roadmap');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Interview = require('../models/Interview');
const { roadmapOutputSchema } = require('../schemas/roadmapSchema');
const { ROADMAP_SYSTEM_PROMPT, buildRoadmapUserPrompt } = require('../prompts/roadmapPrompt');
const { generateStructuredAIContent } = require('./ai.service');
const { matchResumeToJob } = require('./matcher.service');
const logger = require('../utils/logger');

/**
 * Generate a personalized 4-Week Learning Roadmap based on resume, job, skill gaps, and interview performance
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.targetRole]
 * @param {string} [params.resumeId]
 * @param {string} [params.jobId]
 * @returns {Promise<Object>} Created Roadmap document
 */
const generatePersonalizedRoadmap = async ({ userId, targetRole, resumeId, jobId }) => {
  if (!userId) throw new Error('userId is required to generate a learning roadmap.');
  logger.info(`Generating personalized learning roadmap for user ${userId}`);

  // 1. Fetch Resume Baseline
  let resume = null;
  if (resumeId) {
    resume = await Resume.findOne({ _id: resumeId, userId });
  } else {
    resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
  }

  const resumeSkills = [];
  if (resume?.analysis?.skills?.all) {
    resumeSkills.push(...resume.analysis.skills.all);
  } else if (resume?.analysis?.skills?.programmingLanguages) {
    resumeSkills.push(...resume.analysis.skills.programmingLanguages);
  }

  // 2. Fetch Target Job
  let job = null;
  if (jobId) {
    job = await Job.findOne({ _id: jobId, userId });
  } else {
    job = await Job.findOne({ userId }).sort({ createdAt: -1 });
  }

  const jobRequirements = [];
  if (job?.requiredSkills) jobRequirements.push(...job.requiredSkills);
  if (job?.preferredSkills) jobRequirements.push(...job.preferredSkills);

  // 3. Compute Matcher Skill Gaps
  let skillGaps = [];
  if (resume && job) {
    try {
      const matchResult = await matchResumeToJob({ resume, job, userId });
      skillGaps = matchResult.missingSkills || [];
    } catch (err) {
      logger.warn(`Could not compute dynamic matcher gaps: ${err.message}`);
    }
  }

  if (skillGaps.length === 0) {
    skillGaps = ['Docker containerization', 'Redis caching', 'AWS deployment', 'System Design trade-offs'];
  }

  // 4. Fetch Past Mock Interview Weaknesses
  const pastInterviews = await Interview.find({ userId }).sort({ createdAt: -1 }).limit(5);
  const interviewWeaknesses = [];
  pastInterviews.forEach((iv) => {
    if (iv.feedback?.weaknesses) {
      interviewWeaknesses.push(...iv.feedback.weaknesses);
    }
    if (iv.feedback?.missingConcepts) {
      interviewWeaknesses.push(...iv.feedback.missingConcepts);
    }
    iv.answers?.forEach((ans) => {
      if (ans.missingConcepts) interviewWeaknesses.push(...ans.missingConcepts);
    });
  });

  const effectiveRole = targetRole || job?.title || 'Senior Full Stack Software Engineer';

  // 5. Build Grounded Prompt
  const userPrompt = buildRoadmapUserPrompt({
    targetRole: effectiveRole,
    resumeSkills,
    jobRequirements,
    skillGaps,
    interviewWeaknesses: Array.from(new Set(interviewWeaknesses)).slice(0, 6),
  });

  // 6. Invoke AI Structured Generator
  const rawGeneratedRoadmap = await generateStructuredAIContent({
    systemPrompt: ROADMAP_SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: roadmapOutputSchema,
    temperature: 0.25,
  });

  // Ensure topicIds are set
  const allTopicTitles = [];
  const processedWeeks = rawGeneratedRoadmap.weeks.map((week, wIdx) => ({
    weekNumber: week.weekNumber || wIdx + 1,
    title: week.title,
    description: week.description || '',
    topics: week.topics.map((t, tIdx) => {
      allTopicTitles.push(t.title);
      return {
        topicId: t.topicId || `w${wIdx + 1}_t${tIdx + 1}`,
        title: t.title,
        description: t.description || '',
        resourceType: t.resourceType || 'Exercise',
        estimatedHours: t.estimatedHours || 4,
        isCompleted: false,
      };
    }),
  }));

  // 7. Deactivate prior active roadmaps
  await Roadmap.updateMany({ userId, status: 'active' }, { status: 'archived' });

  // 8. Save New Active Roadmap
  const newRoadmap = await Roadmap.create({
    userId,
    targetRole: rawGeneratedRoadmap.targetRole || effectiveRole,
    goals: rawGeneratedRoadmap.goals || [],
    weeks: processedWeeks,
    topics: allTopicTitles,
    progress: 0,
    completedTopics: [],
    status: 'active',
    sourceData: {
      resumeId: resume?._id,
      jobId: job?._id,
      skillGapsCount: skillGaps.length,
    },
  });

  logger.info(`Successfully generated 4-Week Learning Roadmap [ID: ${newRoadmap._id}] with ${allTopicTitles.length} topics for user ${userId}`);
  return newRoadmap;
};

/**
 * Toggle or update topic completion progress on a roadmap
 * @param {string} userId
 * @param {string} roadmapId
 * @param {string} topicId
 * @param {boolean} [isCompleted=true]
 */
const updateTopicProgress = async ({ userId, roadmapId, topicId, isCompleted = true }) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) {
    throw new Error('Roadmap not found or you do not have permission to update it.');
  }

  let totalTopics = 0;
  let completedCount = 0;
  const completedList = [];

  roadmap.weeks.forEach((week) => {
    week.topics.forEach((topic) => {
      totalTopics++;
      if (topic.topicId === topicId) {
        topic.isCompleted = isCompleted;
        topic.completedAt = isCompleted ? new Date() : null;
      }
      if (topic.isCompleted) {
        completedCount++;
        completedList.push(topic.title);
      }
    });
  });

  roadmap.progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
  roadmap.completedTopics = completedList;

  if (roadmap.progress === 100) {
    roadmap.status = 'completed';
  } else if (roadmap.status === 'completed') {
    roadmap.status = 'active';
  }

  await roadmap.save();
  return roadmap;
};

module.exports = {
  generatePersonalizedRoadmap,
  updateTopicProgress,
};
