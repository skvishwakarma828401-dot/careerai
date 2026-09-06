const Resume = require('../models/Resume');
const Job = require('../models/Job');
const vectorService = require('../services/vector.service');
const logger = require('../utils/logger');

/**
 * @desc Index a source document (Resume / Job) into vector storage
 * @route POST /api/semantic/index
 * @access Private
 */
const indexSource = async (req, res, next) => {
  try {
    const { sourceId, sourceType } = req.body;

    if (!sourceId || !sourceType) {
      return res.status(400).json({
        success: false,
        message: 'Both sourceId and sourceType (resume | job | project | interview) are required.',
      });
    }

    let textToIndex = '';
    let metadata = {};

    if (sourceType === 'resume') {
      const resume = await Resume.findOne({ _id: sourceId, userId: req.user._id });
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found or you do not have permission to access it.',
        });
      }
      textToIndex = resume.extractedText || '';
      metadata = {
        fileName: resume.originalFileName,
        fileType: resume.fileType,
        score: resume.score,
      };
    } else if (sourceType === 'job') {
      const job = await Job.findOne({ _id: sourceId, userId: req.user._id });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job description not found or you do not have permission to access it.',
        });
      }
      textToIndex = job.description || '';
      metadata = {
        title: job.title,
        company: job.company,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported sourceType: "${sourceType}". Supported types: resume, job, project, interview.`,
      });
    }

    if (!textToIndex || textToIndex.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Source document does not contain any readable text for vector indexing.',
      });
    }

    const indexedDocs = await vectorService.indexDocument({
      userId: req.user._id,
      sourceId,
      sourceType,
      text: textToIndex,
      metadata,
    });

    res.status(200).json({
      success: true,
      message: `Document indexed successfully into ${indexedDocs.length} vector chunks.`,
      data: {
        sourceId,
        sourceType,
        chunksIndexed: indexedDocs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Search for semantically similar chunks across user's vectors
 * @route POST /api/semantic/search
 * @access Private
 */
const semanticSearch = async (req, res, next) => {
  try {
    const { query, queryText, sourceType, sourceId, topK, minScore } = req.body;
    const searchPrompt = query || queryText;

    if (!searchPrompt || searchPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query text is required.',
      });
    }

    const results = await vectorService.searchSimilarVectors({
      userId: req.user._id, // Strict multi-tenant user isolation
      queryText: searchPrompt.trim(),
      sourceType,
      sourceId,
      topK: topK ? parseInt(topK, 10) : 5,
      minScore: minScore !== undefined ? parseFloat(minScore) : 0.3,
    });

    res.status(200).json({
      success: true,
      query: searchPrompt,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get vector storage statistics for the authenticated user
 * @route GET /api/semantic/stats
 * @access Private
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await vectorService.getVectorStats(req.user._id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  indexSource,
  semanticSearch,
  getStats,
};
