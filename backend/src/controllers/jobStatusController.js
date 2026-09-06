const { getJobStatus } = require('../queues/jobQueue');
const logger = require('../utils/logger');

/**
 * @desc Get background job status by Job ID
 * @route GET /api/jobs/status/:jobId
 * @access Private
 */
const getJobStatusById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'jobId parameter is required.',
      });
    }

    const job = await getJobStatus(jobId, req.user._id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Background job not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        name: job.name,
        status: job.status, // 'queued' | 'active' | 'completed' | 'failed'
        progress: job.progress, // 0 - 100
        currentStep: job.currentStep,
        result: job.result,
        error: job.error,
        attempts: job.attempts,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (error) {
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    logger.error(`Job status lookup error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getJobStatusById,
};
