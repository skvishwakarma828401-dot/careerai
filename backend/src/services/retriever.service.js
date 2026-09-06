const { searchSimilarVectors } = require('./vector.service');
const logger = require('../utils/logger');

/**
 * Retrieve candidate's top-K semantically relevant chunks for a question
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.question - Query text
 * @param {string} [params.sourceType] - Filter by 'resume' | 'job' | 'project' | 'interview'
 * @param {number} [params.topK=4] - Max chunks to retrieve
 * @param {number} [params.minScore=0.50] - Minimum cosine similarity threshold
 * @returns {Promise<Array<Object>>} Formatted context chunks
 */
const retrieveRelevantContext = async ({
  userId,
  question,
  sourceType,
  topK = 4,
  minScore = 0.50,
}) => {
  if (!userId || !question) {
    throw new Error('userId and question are required for context retrieval.');
  }

  logger.info(`Retrieving RAG context for user ${userId} | Query: "${question.substring(0, 60)}..."`);

  // Execute vector search strictly scoped to user
  const vectorResults = await searchSimilarVectors({
    userId,
    queryText: question,
    sourceType: sourceType && sourceType !== 'all' ? sourceType : undefined,
    topK,
    minScore,
  });

  const formattedChunks = vectorResults.map((result, idx) => {
    const title =
      result.metadata?.originalFileName ||
      result.metadata?.fileName ||
      result.metadata?.title ||
      `${result.sourceType} document`;

    return {
      id: idx + 1,
      sourceId: result.sourceId,
      sourceType: result.sourceType,
      chunkIndex: result.chunkIndex,
      title,
      similarityScore: result.similarityScore,
      snippet: result.chunkText.length > 180 ? result.chunkText.substring(0, 180) + '...' : result.chunkText,
      chunkText: result.chunkText,
    };
  });

  logger.info(`Retrieved ${formattedChunks.length} relevant chunks for RAG (minScore: ${minScore}).`);
  return formattedChunks;
};

module.exports = {
  retrieveRelevantContext,
};
