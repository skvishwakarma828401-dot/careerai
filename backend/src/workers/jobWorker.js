const { updateJobProgress, localJobStore, queueEvents, DEFAULT_JOB_OPTIONS } = require('../queues/jobQueue');
const Resume = require('../models/Resume');
const { extractResumeText } = require('../services/resumeService');
const { analyzeResumeText } = require('../services/resumeAnalyzer.service');
const { indexDocument } = require('../services/vector.service');
const { generatePersonalizedRoadmap } = require('../services/roadmapGenerator.service');
const logger = require('../utils/logger');

/**
 * Execute Resume Processing Pipeline asynchronously
 * @param {Object} data
 * @param {string} jobId
 */
const executeResumeProcessing = async (data, jobId) => {
  logger.info(`[Worker] Starting background resume processing for job ${jobId} (Resume ID: ${data.resumeId})`);

  try {
    // Step 1: Text Extraction (20%)
    updateJobProgress(jobId, { status: 'active', progress: 20, currentStep: 'extracting_text' });
    let text = data.text;

    if (!text && data.buffer) {
      text = await extractResumeText(data.buffer, data.fileType);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text extraction failed or uploaded file was empty.');
    }

    // Step 2: AI Structured Analysis with Zod (50%)
    updateJobProgress(jobId, { progress: 50, currentStep: 'analyzing_resume' });
    const analysis = await analyzeResumeText({ resumeText: text });

    // Step 3: Semantic Embeddings & Vector Ingestion (80%)
    updateJobProgress(jobId, { progress: 80, currentStep: 'generating_embeddings' });
    let vectorResult = { chunksCount: 0 };
    try {
      vectorResult = await indexDocument({
        userId: data.userId,
        sourceId: data.resumeId,
        sourceType: 'resume',
        text,
        metadata: {
          originalFileName: data.fileName || 'resume.pdf',
          score: analysis.score,
          skillsCount: analysis.skills?.length || 0,
        },
      });
    } catch (vectorErr) {
      logger.warn(`[Worker] Vector indexing non-fatal warning: ${vectorErr.message}`);
    }

    // Step 4: MongoDB Database Persistence (100%)
    const resume = await Resume.findById(data.resumeId);
    if (resume) {
      resume.rawText = text;
      resume.analysis = analysis;
      resume.score = analysis.score;
      resume.status = 'analyzed';
      await resume.save();
    }

    const finalResult = {
      resumeId: data.resumeId,
      score: analysis.score,
      skillsCount: analysis.skills?.length || 0,
      vectorsCount: vectorResult.chunksCount,
      status: 'completed',
    };

    updateJobProgress(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: 'completed',
      result: finalResult,
    });

    logger.info(`[Worker] Successfully completed background resume job ${jobId}`);
    return finalResult;
  } catch (error) {
    logger.error(`[Worker] Resume processing job ${jobId} failed: ${error.message}`);
    updateJobProgress(jobId, {
      status: 'failed',
      currentStep: 'failed',
      error: error.message,
    });
    throw error;
  }
};

/**
 * Execute Embedding Generation Pipeline
 */
const executeEmbeddingIngestion = async (data, jobId) => {
  try {
    updateJobProgress(jobId, { status: 'active', progress: 30, currentStep: 'generating_embeddings' });

    const vectorResult = await indexDocument({
      userId: data.userId,
      sourceId: data.sourceId,
      sourceType: data.sourceType || 'document',
      text: data.text || data.fullText,
      metadata: data.metadata || {},
    });

    updateJobProgress(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: 'completed',
      result: vectorResult,
    });

    return vectorResult;
  } catch (error) {
    updateJobProgress(jobId, { status: 'failed', currentStep: 'failed', error: error.message });
    throw error;
  }
};

/**
 * Execute Roadmap Generation Pipeline
 */
const executeRoadmapGeneration = async (data, jobId) => {
  try {
    updateJobProgress(jobId, { status: 'active', progress: 40, currentStep: 'generating_roadmap' });

    const roadmap = await generatePersonalizedRoadmap({
      userId: data.userId,
      targetRole: data.targetRole,
      resumeId: data.resumeId,
      jobId: data.jobId,
    });

    updateJobProgress(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: 'completed',
      result: { roadmapId: roadmap._id, progress: roadmap.progress },
    });

    return roadmap;
  } catch (error) {
    updateJobProgress(jobId, { status: 'failed', currentStep: 'failed', error: error.message });
    throw error;
  }
};

/**
 * Runner with exponential retry strategy
 */
const runWithRetry = async (fn, jobId, maxAttempts = 3) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    const jobRecord = localJobStore.get(jobId);
    if (jobRecord) jobRecord.attempts = attempt;

    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxAttempts) {
        logger.error(`[Worker] Job ${jobId} permanently failed after ${attempt} attempts: ${err.message}`);
        updateJobProgress(jobId, { status: 'failed', error: err.message });
        throw err;
      }
      const backoffMs = Math.pow(2, attempt) * 500;
      logger.warn(`[Worker] Job ${jobId} failed attempt ${attempt}/${maxAttempts}. Retrying in ${backoffMs}ms...`);
      await new Promise((res) => setTimeout(res, backoffMs));
    }
  }
};

/**
 * Initialize Queue Event Listeners
 */
const initWorkers = () => {
  queueEvents.on('processResume', ({ jobId, data }) => {
    runWithRetry(() => executeResumeProcessing(data, jobId), jobId).catch(() => {});
  });

  queueEvents.on('generateEmbeddings', ({ jobId, data }) => {
    runWithRetry(() => executeEmbeddingIngestion(data, jobId), jobId).catch(() => {});
  });

  queueEvents.on('generateRoadmap', ({ jobId, data }) => {
    runWithRetry(() => executeRoadmapGeneration(data, jobId), jobId).catch(() => {});
  });

  logger.info('[JobWorker] Initialized event-driven asynchronous job worker listeners.');
};

module.exports = {
  initWorkers,
  executeResumeProcessing,
  executeEmbeddingIngestion,
  executeRoadmapGeneration,
  runWithRetry,
};
