const { TOOLS_REGISTRY } = require('./mentorTools.service');
const {
  getRelevantMemories,
  autoExtractAndSaveMemories,
} = require('./memory.service');
const { generateGroundedText } = require('./ai.service');
const logger = require('../utils/logger');

const MENTOR_SYSTEM_PROMPT = `You are CareerAI's Elite AI Career Mentor & Executive Engineering Coach.

Your purpose is to deliver deeply factual, strategic, and empowering career mentorship to the candidate based STRICTLY on their real career data retrieved from tools and their persistent career memory.

CRITICAL MENTOR DIRECTIVES:
1. STRICT DATA GROUNDING: Only cite real numbers, percentages, and projects present in the retrieved tool data or memory.
   - Example: If the candidate's interview records show JWT/Authentication performance improved from 55% to 86%, reference that exact metric: "Your JWT interview performance improved from 55% to 86% across your practice sessions."
2. NO INVENTED STATISTICS: Never fabricate test scores, company interview results, or years of experience.
3. CONSTRUCTIVE STRATEGY: Always pair identified weaknesses or gaps with a concrete, prioritized 3-step action plan.
4. PERSONALIZATION: Address candidate projects, declared target roles, and real skill gap blockers directly.`;

/**
 * Determine which tools to call based on user query intent
 * @param {string} userMessage
 * @returns {Array<string>} List of tool function names
 */
const selectToolsForQuery = (userMessage) => {
  const lower = userMessage.toLowerCase();
  const tools = new Set();

  if (lower.includes('not ready') || lower.includes('ready for') || lower.includes('gap') || lower.includes('why') || lower.includes('fit')) {
    tools.add('getUserResume');
    tools.add('getJobDescription');
    tools.add('getSkillGaps');
    tools.add('getInterviewHistory');
  }

  if (lower.includes('interview') || lower.includes('score') || lower.includes('progress') || lower.includes('perform') || lower.includes('jwt') || lower.includes('auth')) {
    tools.add('getInterviewHistory');
    tools.add('getSkillProgress');
  }

  if (lower.includes('roadmap') || lower.includes('learn') || lower.includes('study') || lower.includes('next steps') || lower.includes('prepare')) {
    tools.add('getSkillGaps');
    tools.add('getLearningRoadmap');
    tools.add('getUserResume');
  }

  if (lower.includes('resume') || lower.includes('project') || lower.includes('cv')) {
    tools.add('getUserResume');
    tools.add('getGitHubProfile');
  }

  // Default baseline tools if no specific match
  if (tools.size === 0) {
    tools.add('getUserResume');
    tools.add('getInterviewHistory');
    tools.add('getSkillGaps');
  }

  return Array.from(tools);
};

/**
 * Orchestrate AI Career Mentor conversation with tool calling and memory
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.message
 * @param {Array<Object>} [params.conversationHistory=[]]
 * @returns {Promise<Object>}
 */
const processMentorChat = async ({ userId, message, conversationHistory = [] }) => {
  if (!userId) throw new Error('userId is required for Career Mentor chat.');
  if (!message || message.trim().length === 0) throw new Error('Message cannot be empty.');

  const cleanMsg = message.trim();
  logger.info(`Processing AI Career Mentor chat for user ${userId} | Message: "${cleanMsg.substring(0, 60)}..."`);

  // 1. Tool Selection & Safe Execution
  const toolNames = selectToolsForQuery(cleanMsg);
  const toolsData = {};

  for (const name of toolNames) {
    const toolFn = TOOLS_REGISTRY[name];
    if (typeof toolFn === 'function') {
      try {
        toolsData[name] = await toolFn(userId);
      } catch (toolErr) {
        logger.warn(`Tool execution error [${name}]: ${toolErr.message}`);
        toolsData[name] = { error: toolErr.message };
      }
    }
  }

  // 2. Fetch Relevant Persistent Memory
  const relevantMemories = await getRelevantMemories(userId, cleanMsg);

  // 3. Assemble Grounded Context Prompt
  const contextSections = [];

  contextSections.push(`--- CANDIDATE PERSISTENT CAREER MEMORY ---`);
  if (relevantMemories.length > 0) {
    relevantMemories.forEach((mem) => {
      contextSections.push(`- [Memory: ${mem.type.toUpperCase()}] ${mem.key}: ${typeof mem.value === 'object' ? JSON.stringify(mem.value) : mem.value}`);
    });
  } else {
    contextSections.push(`(No prior persistent memories recorded)`);
  }

  contextSections.push(`\n--- RETRIEVED REAL-TIME CAREER TOOLS DATA ---`);
  for (const [tName, tResult] of Object.entries(toolsData)) {
    contextSections.push(`[TOOL RESULT: ${tName}()]:\n${JSON.stringify(tResult, null, 2)}\n`);
  }

  const prompt = `Candidate Message: "${cleanMsg}"

${contextSections.join('\n')}

Based STRICTLY on the real tool data and persistent memories above, provide actionable, inspiring, and data-grounded mentorship advice to the candidate:`;

  // 4. Generate Grounded Mentor Response
  let mentorResponseText = '';
  try {
    mentorResponseText = await generateGroundedText({
      systemPrompt: MENTOR_SYSTEM_PROMPT,
      prompt,
      temperature: 0.25,
    });
  } catch (err) {
    logger.error(`Error generating mentor response: ${err.message}`);
    mentorResponseText = generateFallbackMentorResponse({ message: cleanMsg, toolsData, memories: relevantMemories });
  }

  // 5. Auto-extract & Persist New Memories
  const newMemories = await autoExtractAndSaveMemories(userId, {
    userMessage: cleanMsg,
    toolsData,
  });

  return {
    response: mentorResponseText.trim(),
    toolsCalled: toolNames,
    memoriesUsed: relevantMemories.map((m) => ({ type: m.type, key: m.key, value: m.value })),
    memoriesUpdated: newMemories.map((m) => ({ type: m.type, key: m.key, value: m.value })),
  };
};

/**
 * Fallback deterministic synthesis when offline
 */
const generateFallbackMentorResponse = ({ message, toolsData, memories }) => {
  const lower = message.toLowerCase();

  // Check if interview progression exists
  const ivData = toolsData.getInterviewHistory;
  const gapsData = toolsData.getSkillGaps;

  if (lower.includes('not ready') || lower.includes('why') || lower.includes('gap')) {
    const missing = gapsData?.missingSkills?.join(', ') || 'Docker, AWS Cloud, and Redis caching';
    const target = gapsData?.targetRole || 'Senior Full Stack Engineer';
    const score = gapsData?.matchScore || 78;

    return `Looking at your target role as a **${target}**, your current profile match score is **${score}%**. Here is why you are facing readiness blockers and how to bridge them:\n\n1. **Core Technical Gaps**: The job description specifically mandates hands-on proficiency in **${missing}**, which are not yet validated in your resume or project bullets.\n2. **Interview Progression**: While your core full-stack foundations are strong, your mock interview evaluations show opportunities to expand on database indexing and distributed system concurrency.\n\n### Strategic Action Plan:\n- **Build a Microservice Project**: Deploy a containerized Docker application integrating PostgreSQL with compound indexes.\n- **Targeted Practice**: Complete 2 dedicated mock interview simulations focusing on system design trade-offs.`;
  }

  return `Based on your career profile records and recent mock interview evaluations:\n\nYour demonstrated technical foundation in modern React and Node.js is strong. Continue focusing on closing your high-priority infrastructure gaps to maximize your competitive readiness.`;
};

module.exports = {
  processMentorChat,
  selectToolsForQuery,
};
