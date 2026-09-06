const { processMentorChat } = require('../services/mentor.service');
const { getAllUserMemories } = require('../services/memory.service');
const logger = require('../utils/logger');

/**
 * @desc Interactive conversation with AI Career Mentor using safe tool calling and memory
 * @route POST /api/mentor/chat
 * @access Private
 */
const chatWithMentor = async (req, res, next) => {
  try {
    const { message, query, conversationHistory = [] } = req.body;
    const userMessage = message || query;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid question or message for your career mentor.',
      });
    }

    const result = await processMentorChat({
      userId: req.user._id,
      message: userMessage.trim(),
      conversationHistory,
    });

    res.status(200).json({
      success: true,
      message: userMessage.trim(),
      response: result.response,
      toolsCalled: result.toolsCalled,
      memoriesUsed: result.memoriesUsed,
      memoriesUpdated: result.memoriesUpdated,
    });
  } catch (error) {
    logger.error(`Mentor chat controller error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc Get all persistent career memories stored for authenticated candidate
 * @route GET /api/mentor/memories
 * @access Private
 */
const getMentorMemories = async (req, res, next) => {
  try {
    const memories = await getAllUserMemories(req.user._id);

    res.status(200).json({
      success: true,
      count: memories.length,
      data: memories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithMentor,
  getMentorMemories,
};
