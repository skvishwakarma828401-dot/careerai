const Roadmap = require('../models/Roadmap');
const {
  generatePersonalizedRoadmap,
  updateTopicProgress,
} = require('../services/roadmapGenerator.service');
const logger = require('../utils/logger');

/**
 * @desc Generate a personalized learning roadmap
 * @route POST /api/roadmaps/generate
 * @access Private
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const { targetRole, resumeId, jobId } = req.body;

    const roadmap = await generatePersonalizedRoadmap({
      userId: req.user._id,
      targetRole,
      resumeId,
      jobId,
    });

    res.status(201).json({
      success: true,
      message: 'Personalized 4-Week Learning Roadmap generated successfully.',
      data: roadmap,
    });
  } catch (error) {
    logger.error(`Roadmap generation controller error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc Fetch all saved / active roadmaps for authenticated candidate
 * @route GET /api/roadmaps
 * @access Private
 */
const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const activeRoadmap = roadmaps.find((r) => r.status === 'active') || roadmaps[0] || null;

    res.status(200).json({
      success: true,
      count: roadmaps.length,
      activeRoadmap,
      data: roadmaps,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update completion progress for a specific topic in a roadmap
 * @route PATCH /api/roadmaps/:id/progress
 * @access Private
 */
const updateProgress = async (req, res, next) => {
  try {
    const { topicId, isCompleted } = req.body;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: 'topicId is required to update progress.',
      });
    }

    const updatedRoadmap = await updateTopicProgress({
      userId: req.user._id,
      roadmapId: req.params.id,
      topicId,
      isCompleted: isCompleted !== undefined ? isCompleted : true,
    });

    res.status(200).json({
      success: true,
      message: `Topic progress updated. Overall roadmap is now ${updatedRoadmap.progress}% complete.`,
      data: updatedRoadmap,
    });
  } catch (error) {
    logger.error(`Roadmap progress update error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  generateRoadmap,
  getRoadmaps,
  updateProgress,
};
