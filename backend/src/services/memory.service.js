const Memory = require('../models/Memory');
const logger = require('../utils/logger');

/**
 * Retrieve relevant long-term career memories for user
 * @param {string} userId 
 * @param {string} [queryText='']
 * @returns {Promise<Array<Object>>}
 */
const getRelevantMemories = async (userId, queryText = '') => {
  if (!userId) throw new Error('userId is required to fetch memories.');
  logger.info(`Fetching persistent career memory for user ${userId}`);

  const memories = await Memory.find({ userId })
    .sort({ importance: -1, updatedAt: -1 })
    .limit(10);

  return memories;
};

/**
 * Upsert or store a single career memory
 * @param {string} userId
 * @param {Object} memoryData
 * @param {string} memoryData.type
 * @param {string} memoryData.key
 * @param {any} memoryData.value
 * @param {number} [memoryData.importance=5]
 */
const saveOrUpdateMemory = async (userId, { type, key, value, importance = 5 }) => {
  if (!userId || !type || !key || value === undefined) {
    throw new Error('userId, type, key, and value are required to store memory.');
  }

  const updated = await Memory.findOneAndUpdate(
    { userId, key },
    {
      userId,
      type,
      key,
      value,
      importance: Math.min(10, Math.max(1, parseInt(importance, 10) || 5)),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info(`Stored persistent memory [${type}] for user ${userId}: "${key}"`);
  return updated;
};

/**
 * Automatically analyze tools data and user interactions to extract persistent career memories
 * @param {string} userId
 * @param {Object} params
 * @param {string} params.userMessage
 * @param {Object} params.toolsData
 */
const autoExtractAndSaveMemories = async (userId, { userMessage = '', toolsData = {} }) => {
  const lowerMsg = userMessage.toLowerCase();
  const memoriesCreated = [];

  const ivHistory = toolsData.getInterviewHistory || toolsData.interviewHistory;
  const skillGaps = toolsData.getSkillGaps || toolsData.skillGaps;
  const jobDesc = toolsData.getJobDescription || toolsData.jobDescription;
  const github = toolsData.getGitHubProfile || toolsData.githubProfile;

  try {
    // 1. Goal / Target Role extraction
    if (lowerMsg.includes('goal') || lowerMsg.includes('target role') || lowerMsg.includes('want to be') || lowerMsg.includes('aiming for') || lowerMsg.includes('job')) {
      const targetRole = jobDesc?.title || github?.targetRole || 'Senior Full Stack Engineer';
      const mem = await saveOrUpdateMemory(userId, {
        type: 'goal',
        key: 'primary_career_goal',
        value: `Aiming for ${targetRole} role with focus on high-scale full-stack architecture.`,
        importance: 8,
      });
      memoriesCreated.push(mem);
    }

    // 2. Track Interview Progressions & Skill Improvements
    if (ivHistory?.topicProgression) {
      const progression = ivHistory.topicProgression;
      for (const [topic, scores] of Object.entries(progression)) {
        if (scores.length >= 2) {
          const firstScore = scores[0].score;
          const latestScore = scores[scores.length - 1].score;
          if (latestScore > firstScore) {
            const mem = await saveOrUpdateMemory(userId, {
              type: 'skill_improvement',
              key: `${topic.toLowerCase()}_score_progression`,
              value: {
                topic,
                previousScore: firstScore,
                latestScore,
                improvement: latestScore - firstScore,
                note: `Demonstrated measurable progress from ${firstScore}% to ${latestScore}% in ${topic}.`,
              },
              importance: 9,
            });
            memoriesCreated.push(mem);
          }
        }
      }
    }

    // 3. Track Recurring Skill Gaps
    if (skillGaps?.priorityGaps && skillGaps.priorityGaps.length > 0) {
      const topGaps = skillGaps.priorityGaps.map((g) => g.skill);
      const mem = await saveOrUpdateMemory(userId, {
        type: 'weakness',
        key: 'active_priority_skill_gaps',
        value: topGaps,
        importance: 7,
      });
      memoriesCreated.push(mem);
    }
  } catch (err) {
    logger.warn(`Error auto-extracting memories: ${err.message}`);
  }

  return memoriesCreated;
};

/**
 * Fetch all memories for authenticated user
 */
const getAllUserMemories = async (userId) => {
  return await Memory.find({ userId }).sort({ importance: -1, updatedAt: -1 });
};

module.exports = {
  getRelevantMemories,
  saveOrUpdateMemory,
  autoExtractAndSaveMemories,
  getAllUserMemories,
};
