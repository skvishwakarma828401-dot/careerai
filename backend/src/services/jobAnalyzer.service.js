const { generateStructuredAIContent } = require('./ai.service');
const {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  createJobAnalysisPrompt,
} = require('../prompts/jobAnalysisPrompt');
const { jobAnalysisSchema } = require('../schemas/jobAnalysisSchema');
const logger = require('../utils/logger');

/**
 * Analyze job description with LLM and validate against Zod schema
 * @param {Object} params
 * @param {string} params.jobTitle
 * @param {string} params.company
 * @param {string} params.descriptionText
 * @param {number} [maxRetries=2]
 * @returns {Promise<Object>} validated structured job analysis
 */
const analyzeJobDescription = async (
  { jobTitle = '', company = '', descriptionText = '' },
  maxRetries = 2
) => {
  if (!descriptionText || descriptionText.trim().length === 0) {
    throw new Error('Job description text is empty. Cannot perform AI analysis.');
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    logger.info(`Running AI Job Description Analysis (Attempt ${attempt}/${maxRetries + 1})...`);

    try {
      const prompt = createJobAnalysisPrompt({
        jobTitle,
        company,
        descriptionText,
      });

      const rawAnalysis = await generateStructuredAIContent({
        systemPrompt: JOB_ANALYSIS_SYSTEM_PROMPT,
        prompt,
        temperature: attempt === 1 ? 0.2 : 0.1,
      });

      // Validate with Zod schema
      const validatedData = jobAnalysisSchema.parse(rawAnalysis);
      logger.info(`AI Job Description Analysis validated successfully. Title: ${validatedData.jobTitle}`);
      return validatedData;
    } catch (err) {
      lastError = err;
      logger.warn(`AI Job Analysis attempt ${attempt} validation failed: ${err.message}`);

      if (attempt <= maxRetries) {
        logger.info(`Retrying AI Job Description Analysis...`);
      }
    }
  }

  logger.error(`AI Job Analysis failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  throw new Error(`Failed to generate a valid structured job description analysis: ${lastError?.message}`);
};

module.exports = {
  analyzeJobDescription,
};
