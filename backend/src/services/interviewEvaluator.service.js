const { generateStructuredAIContent } = require('./ai.service');
const {
  ANSWER_EVALUATION_SYSTEM_PROMPT,
  createAnswerEvaluationPrompt,
  FINAL_REPORT_SYSTEM_PROMPT,
  createFinalReportPrompt,
} = require('../prompts/evaluationPrompt');
const {
  answerEvaluationSchema,
  finalReportSchema,
} = require('../schemas/evaluationSchema');
const logger = require('../utils/logger');

/**
 * Evaluate a single candidate answer against a question across 6 dimensions
 * @param {Object} params
 * @param {string} params.question
 * @param {string} params.userAnswer
 * @param {string} [params.difficulty='medium']
 * @param {string} [params.category='General']
 * @param {Array<string>} [params.expectedKeywords=[]]
 * @returns {Promise<Object>} Validated evaluation output
 */
const evaluateAnswer = async ({
  question,
  userAnswer,
  difficulty = 'medium',
  category = 'General',
  expectedKeywords = [],
}) => {
  if (!userAnswer || userAnswer.trim().length === 0) {
    throw new Error('User answer cannot be empty.');
  }

  logger.info(`Evaluating answer for question category "${category}" (${difficulty})`);

  const prompt = createAnswerEvaluationPrompt({
    question,
    userAnswer: userAnswer.trim(),
    difficulty,
    category,
    expectedKeywords,
  });

  const rawEvaluation = await generateStructuredAIContent({
    systemPrompt: ANSWER_EVALUATION_SYSTEM_PROMPT,
    prompt,
    temperature: 0.15,
  });

  const validatedEvaluation = answerEvaluationSchema.parse(rawEvaluation);
  logger.info(`Answer evaluated successfully with overall score ${validatedEvaluation.overall}/100.`);
  return validatedEvaluation;
};

/**
 * Synthesize final comprehensive interview report across all Q&As
 * @param {Object} params
 * @param {string} params.targetRole
 * @param {string} params.difficulty
 * @param {string} params.type
 * @param {Array<Object>} params.questionsAndAnswers
 * @returns {Promise<Object>} Validated final report
 */
const synthesizeFinalReport = async ({
  targetRole,
  difficulty,
  type,
  questionsAndAnswers = [],
}) => {
  logger.info(`Synthesizing final interview report for ${questionsAndAnswers.length} Q&As`);

  const prompt = createFinalReportPrompt({
    targetRole,
    difficulty,
    type,
    questionsAndAnswers,
  });

  const rawReport = await generateStructuredAIContent({
    systemPrompt: FINAL_REPORT_SYSTEM_PROMPT,
    prompt,
    temperature: 0.2,
  });

  const validatedReport = finalReportSchema.parse(rawReport);
  logger.info(`Final interview report generated with overall score ${validatedReport.overallScore}/100.`);
  return validatedReport;
};

module.exports = {
  evaluateAnswer,
  synthesizeFinalReport,
};
