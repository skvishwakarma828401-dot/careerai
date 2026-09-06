const { EventEmitter } = require('events');
const logger = require('../utils/logger');

// Local Job State Cache for instant multi-tenant tracking & fallbacks
const localJobStore = new Map();
const queueEvents = new EventEmitter();

/**
 * Standard retry and backoff configuration
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};

/**
 * Add a resume processing job
 * @param {Object} data
 * @param {string} data.userId
 * @param {string} data.resumeId
 * @param {string} data.filePath
 * @param {string} data.fileType
 * @param {string} data.fileName
 */
const addResumeProcessingJob = async (data) => {
  const jobId = `resume_${data.resumeId}_${Date.now()}`;

  const jobRecord = {
    id: jobId,
    name: 'processResume',
    userId: data.userId.toString(),
    status: 'queued',
    progress: 0,
    currentStep: 'enqueued',
    data,
    result: null,
    error: null,
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  localJobStore.set(jobId, jobRecord);
  logger.info(`[JobQueue] Enqueued resume processing job: ${jobId} for user ${data.userId}`);

  // Emit event to background worker dispatcher
  setImmediate(() => {
    queueEvents.emit('processResume', { jobId, data });
  });

  return { jobId, status: 'queued' };
};

/**
 * Add an embedding ingestion job
 * @param {Object} data
 */
const addEmbeddingJob = async (data) => {
  const jobId = `embed_${data.sourceId || Date.now()}_${Date.now()}`;

  const jobRecord = {
    id: jobId,
    name: 'generateEmbeddings',
    userId: data.userId.toString(),
    status: 'queued',
    progress: 0,
    currentStep: 'enqueued',
    data,
    result: null,
    error: null,
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  localJobStore.set(jobId, jobRecord);
  logger.info(`[JobQueue] Enqueued embedding job: ${jobId}`);

  setImmediate(() => {
    queueEvents.emit('generateEmbeddings', { jobId, data });
  });

  return { jobId, status: 'queued' };
};

/**
 * Add a roadmap generation job
 * @param {Object} data
 */
const addRoadmapJob = async (data) => {
  const jobId = `roadmap_${data.userId}_${Date.now()}`;

  const jobRecord = {
    id: jobId,
    name: 'generateRoadmap',
    userId: data.userId.toString(),
    status: 'queued',
    progress: 0,
    currentStep: 'enqueued',
    data,
    result: null,
    error: null,
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  localJobStore.set(jobId, jobRecord);
  logger.info(`[JobQueue] Enqueued roadmap job: ${jobId}`);

  setImmediate(() => {
    queueEvents.emit('generateRoadmap', { jobId, data });
  });

  return { jobId, status: 'queued' };
};

/**
 * Get background job status by ID with multi-tenant isolation
 * @param {string} jobId
 * @param {string} userId
 */
const getJobStatus = async (jobId, userId) => {
  const localJob = localJobStore.get(jobId);

  if (!localJob) {
    return null;
  }

  // Multi-tenant user isolation guardrail
  if (userId && localJob.userId !== userId.toString()) {
    const error = new Error('Unauthorized: You do not own this background job.');
    error.statusCode = 403;
    throw error;
  }

  return {
    id: localJob.id,
    name: localJob.name,
    status: localJob.status, // 'queued' | 'active' | 'completed' | 'failed'
    progress: localJob.progress, // 0 - 100
    currentStep: localJob.currentStep,
    result: localJob.result,
    error: localJob.error,
    attempts: localJob.attempts,
    createdAt: localJob.createdAt,
    updatedAt: localJob.updatedAt,
  };
};

/**
 * Update job progress & state
 */
const updateJobProgress = (jobId, { status, progress, currentStep, result, error }) => {
  const job = localJobStore.get(jobId);
  if (job) {
    if (status !== undefined) job.status = status;
    if (progress !== undefined) job.progress = progress;
    if (currentStep !== undefined) job.currentStep = currentStep;
    if (result !== undefined) job.result = result;
    if (error !== undefined) job.error = error;
    job.updatedAt = new Date();
  }
};

module.exports = {
  addResumeProcessingJob,
  addEmbeddingJob,
  addRoadmapJob,
  getJobStatus,
  updateJobProgress,
  localJobStore,
  queueEvents,
  DEFAULT_JOB_OPTIONS,
};
