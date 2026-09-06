const { retrieveRelevantContext } = require('./retriever.service');
const { generateGroundedText } = require('./ai.service');
const { RAG_SYSTEM_PROMPT, createRAGPrompt } = require('../prompts/ragPrompt');
const logger = require('../utils/logger');

/**
 * Execute end-to-end grounded RAG question answering pipeline
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.question - User query
 * @param {string} [params.sourceType='all'] - Optional source type filter
 * @returns {Promise<{ answer: string, sources: Array, hasContext: boolean }>}
 */
const answerUserQuestion = async ({ userId, question, sourceType = 'all' }) => {
  if (!userId) {
    throw new Error('User ID is required for RAG query.');
  }

  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty.');
  }

  const cleanQuestion = question.trim();
  logger.info(`Running RAG pipeline for user ${userId} | Question: "${cleanQuestion}"`);

  // 1. Retrieve top-K relevant context chunks
  const contextChunks = await retrieveRelevantContext({
    userId,
    question: cleanQuestion,
    sourceType,
    topK: 4,
    minScore: 0.35,
  });

  // 2. Build structured grounding prompt
  const userPrompt = createRAGPrompt({
    question: cleanQuestion,
    contextChunks,
  });

  // 3. Generate grounded answer via LLM
  const groundedAnswer = await generateGroundedText({
    systemPrompt: RAG_SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.2, // Low temperature for high factual adherence
  });

  // 4. Extract source citations for the client
  const sources = contextChunks.map((chunk) => ({
    sourceType: chunk.sourceType,
    sourceId: chunk.sourceId,
    title: chunk.title,
    similarityScore: parseFloat((chunk.similarityScore * 100).toFixed(1)),
    snippet: chunk.snippet,
  }));

  logger.info(`RAG pipeline generated response with ${sources.length} cited sources.`);

  return {
    answer: groundedAnswer.trim(),
    sources,
    hasContext: contextChunks.length > 0,
  };
};

module.exports = {
  answerUserQuestion,
};
