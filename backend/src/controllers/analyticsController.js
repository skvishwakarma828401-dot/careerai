const { getCandidateCareerAnalytics } = require('../services/analytics.service');
const logger = require('../utils/logger');

/**
 * @desc Get comprehensive career analytics, skill matrices, and readiness score
 * @route GET /api/analytics
 * @access Private
 */
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const analytics = await getCandidateCareerAnalytics(req.user._id);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error(`Analytics controller error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview,
};
