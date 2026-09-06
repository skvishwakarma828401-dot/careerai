const { generateStructuredAIContent } = require('./ai.service');
const {
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  createResumeAnalysisPrompt,
} = require('../prompts/resumeAnalysisPrompt');
const { resumeAnalysisSchema } = require('../schemas/resumeAnalysisSchema');
const logger = require('../utils/logger');

/**
 * Analyze resume text with LLM and validate output against Zod schema
 * Includes safe retry mechanism if output fails validation
 * @param {Object} params
 * @param {string} params.resumeText
 * @param {string} [params.targetRole]
 * @param {string} [params.candidateName]
 * @param {number} [maxRetries=2]
 * @returns {Promise<Object>} validated structured analysis object
 */
const analyzeResumeText = async (
  { resumeText, targetRole = 'Full Stack Developer', candidateName = '' },
  maxRetries = 2
) => {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('Resume text is empty. Cannot perform AI analysis.');
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    logger.info(`Running AI Resume Analysis (Attempt ${attempt}/${maxRetries + 1})...`);

    try {
      const prompt = createResumeAnalysisPrompt({
        resumeText,
        targetRole,
        candidateName,
      });

      const rawAnalysis = await generateStructuredAIContent({
        systemPrompt: RESUME_ANALYSIS_SYSTEM_PROMPT,
        prompt,
        temperature: attempt === 1 ? 0.2 : 0.1, // lower temperature on retry
      });

      // Strict validation with Zod schema
      const validatedData = resumeAnalysisSchema.parse(rawAnalysis);
      logger.info(`AI Resume Analysis validated successfully on attempt ${attempt}. Score: ${validatedData.score}`);
      return validatedData;
    } catch (err) {
      lastError = err;
      logger.warn(`AI Analysis attempt ${attempt} validation failed: ${err.message}`);

      if (attempt <= maxRetries) {
        logger.info(`Retrying AI Resume Analysis with temperature adjustment...`);
      }
    }
  }

  logger.error(`AI Resume Analysis failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  throw new Error(`Failed to generate a valid structured resume analysis: ${lastError?.message}`);
};

module.exports = {
  analyzeResumeText,
};
