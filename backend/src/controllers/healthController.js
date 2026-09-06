const { getSystemHealth } = require('../services/healthService');

/**
 * @desc Get backend API and database health status
 * @route GET /api/health
 * @access Public
 */
const checkHealth = (req, res) => {
  const healthData = getSystemHealth();
  const statusCode = healthData.status === 'healthy' ? 200 : 200; // Return 200 with degraded state so frontend can inspect
  
  res.status(statusCode).json({
    success: true,
    data: healthData,
  });
};

module.exports = {
  checkHealth,
};
