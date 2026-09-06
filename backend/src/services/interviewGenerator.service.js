const { generateStructuredAIContent } = require('./ai.service');
const {
  INTERVIEW_GENERATION_SYSTEM_PROMPT,
  createInterviewPrompt,
} = require('../prompts/interviewPrompt');
const { interviewGenerationOutputSchema } = require('../schemas/interviewSchema');
const logger = require('../utils/logger');

/**
 * Generate personalized mock interview questions using Gemini LLM and Zod validation
 * @param {Object} params
 * @param {string} [params.type='technical']
 * @param {string} [params.difficulty='medium']
 * @param {string} [params.targetRole='Full Stack Engineer']
 * @param {number} [params.questionCount=5]
 * @param {Object} [params.resume] - Resume document
 * @param {Object} [params.job] - Job document
 * @param {number} [maxRetries=2]
 * @returns {Promise<Object>} Validated interview generation result
 */
const generateInterviewSession = async (
  {
    type = 'technical',
    difficulty = 'medium',
    targetRole = 'Full Stack Engineer',
    questionCount = 5,
    resume = null,
    job = null,
  },
  maxRetries = 2
) => {
  let attempt = 0;
  let lastError = null;

  const candidateResumeText = resume?.extractedText || '';
  const jobDescriptionText = job?.description || '';

  logger.info(
    `Generating AI Interview | Mode: ${type} | Difficulty: ${difficulty} | Role: ${targetRole} | Questions: ${questionCount}`
  );

  while (attempt <= maxRetries) {
    attempt++;
    try {
      const prompt = createInterviewPrompt({
        type,
        difficulty,
        targetRole,
        questionCount,
        candidateResumeText,
        jobDescriptionText,
      });

      const rawResult = await generateStructuredAIContent({
        systemPrompt: INTERVIEW_GENERATION_SYSTEM_PROMPT,
        prompt,
        temperature: attempt === 1 ? 0.3 : 0.15,
      });

      // Strict validation with Zod schema
      const validatedOutput = interviewGenerationOutputSchema.parse(rawResult);
      logger.info(
        `AI Interview generated successfully on attempt ${attempt} with ${validatedOutput.questions.length} questions.`
      );
      return validatedOutput;
    } catch (err) {
      lastError = err;
      logger.warn(`AI Interview generation attempt ${attempt} validation failed: ${err.message}`);
    }
  }

  logger.error(`AI Interview generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  throw new Error(`Failed to generate a valid structured interview session: ${lastError?.message}`);
};

module.exports = {
  generateInterviewSession,
};
