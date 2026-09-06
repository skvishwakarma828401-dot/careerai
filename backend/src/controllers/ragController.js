const { answerUserQuestion } = require('../services/rag.service');
const logger = require('../utils/logger');

/**
 * @desc Query AI Career Assistant using grounded RAG pipeline
 * @route POST /api/ai/rag/query
 * @access Private
 */
const queryRAG = async (req, res, next) => {
  try {
    const { question, query, sourceType } = req.body;
    const userQuestion = question || query;

    if (!userQuestion || typeof userQuestion !== 'string' || userQuestion.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid question to ask the AI Career Assistant.',
      });
    }

    const result = await answerUserQuestion({
      userId: req.user._id,
      question: userQuestion.trim(),
      sourceType,
    });

    res.status(200).json({
      success: true,
      question: userQuestion.trim(),
      answer: result.answer,
      sources: result.sources,
      hasContext: result.hasContext,
    });
  } catch (error) {
    logger.error(`RAG controller error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process RAG question answering query.',
    });
  }
};

module.exports = {
  queryRAG,
};
