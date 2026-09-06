const VectorDocument = require('../models/VectorDocument');
const { chunkText } = require('./chunking.service');
const { generateEmbedding, cosineSimilarity } = require('./embedding.service');
const logger = require('../utils/logger');

/**
 * Index a document by chunking, generating embeddings, and storing in VectorDocument collection
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.sourceId
 * @param {string} params.sourceType - 'resume' | 'job' | 'project' | 'interview'
 * @param {string} params.text - Raw text to chunk and embed
 * @param {Object} [params.metadata]
 * @returns {Promise<Array>} Stored vector documents
 */
const indexDocument = async ({ userId, sourceId, sourceType, text, metadata = {} }) => {
  if (!userId || !sourceId || !sourceType || !text) {
    throw new Error('userId, sourceId, sourceType, and text are required for indexing.');
  }

  // 1. Clean up any existing vectors for this document
  await VectorDocument.deleteMany({ userId, sourceId });

  // 2. Chunk text
  const chunks = chunkText(text, { chunkSize: 500, overlap: 100 });
  if (chunks.length === 0) {
    logger.warn(`No valid chunks generated for ${sourceType} ${sourceId}`);
    return [];
  }

  logger.info(`Generating embeddings for ${chunks.length} chunks of ${sourceType} ${sourceId}...`);

  // 3. Generate embeddings & construct documents
  const docsToInsert = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.chunkText);
    docsToInsert.push({
      userId,
      sourceId,
      sourceType,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      embedding,
      metadata: {
        ...metadata,
        indexedAt: new Date(),
      },
    });
  }

  // 4. Save to MongoDB
  const savedDocs = await VectorDocument.insertMany(docsToInsert);
  logger.info(`Indexed ${savedDocs.length} vector chunks for user ${userId} (${sourceType})`);
  return savedDocs;
};

/**
 * Search for semantically similar chunks scoped strictly to an authenticated user
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID (strictly required)
 * @param {string} params.queryText - Natural language search query
 * @param {string} [params.sourceType] - Optional filter by source type ('resume', 'job', etc.)
 * @param {string} [params.sourceId] - Optional filter by specific source document
 * @param {number} [params.topK=5] - Number of top results to return
 * @param {number} [params.minScore=0.3] - Minimum similarity threshold
 * @returns {Promise<Array>} Scored and sorted results
 */
const searchSimilarVectors = async ({
  userId,
  queryText,
  sourceType,
  sourceId,
  topK = 5,
  minScore = 0.3,
}) => {
  if (!userId) {
    throw new Error('userId is strictly required for vector search.');
  }

  if (!queryText || queryText.trim().length === 0) {
    throw new Error('queryText is required for semantic search.');
  }

  // 1. Generate embedding for search query
  const queryEmbedding = await generateEmbedding(queryText);

  // 2. Build MongoDB query strictly scoped to authenticated user
  const queryFilter = { userId };
  if (sourceType) {
    queryFilter.sourceType = sourceType;
  }
  if (sourceId) {
    queryFilter.sourceId = sourceId;
  }

  // 3. Fetch candidate vectors for this user
  const candidateVectors = await VectorDocument.find(queryFilter).lean();

  if (!candidateVectors || candidateVectors.length === 0) {
    return [];
  }

  // 4. Compute cosine similarity for each vector
  const scoredResults = candidateVectors
    .map((doc) => {
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      return {
        _id: doc._id,
        sourceId: doc.sourceId,
        sourceType: doc.sourceType,
        chunkIndex: doc.chunkIndex,
        chunkText: doc.chunkText,
        metadata: doc.metadata,
        similarityScore: parseFloat(score.toFixed(4)),
        createdAt: doc.createdAt,
      };
    })
    .filter((item) => item.similarityScore >= minScore)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);

  return scoredResults;
};

/**
 * Delete all vectors associated with a source document
 * @param {string} sourceId 
 * @param {string} userId 
 */
const deleteVectorsBySource = async (sourceId, userId) => {
  const result = await VectorDocument.deleteMany({ sourceId, userId });
  logger.info(`Deleted ${result.deletedCount} vectors for source ${sourceId}`);
  return result;
};

/**
 * Get vector storage statistics for an authenticated user
 * @param {string} userId 
 */
const getVectorStats = async (userId) => {
  const totalCount = await VectorDocument.countDocuments({ userId });
  const byType = await VectorDocument.aggregate([
    { $match: { userId } },
    { $group: { _id: '$sourceType', count: { $sum: 1 } } },
  ]);

  const stats = {
    totalChunks: totalCount,
    bySourceType: {},
  };

  byType.forEach((item) => {
    stats.bySourceType[item._id] = item.count;
  });

  return stats;
};

module.exports = {
  indexDocument,
  searchSimilarVectors,
  deleteVectorsBySource,
  getVectorStats,
};
