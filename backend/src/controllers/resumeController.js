const path = require('path');
const Resume = require('../models/Resume');
const { extractResumeText } = require('../services/resumeService');
const { analyzeResumeText } = require('../services/resumeAnalyzer.service');
const { indexDocument, deleteVectorsBySource } = require('../services/vector.service');
const logger = require('../utils/logger');

/**
 * @desc Upload and extract text from a resume (PDF / DOCX)
 * @route POST /api/resumes/upload
 * @access Private
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF or DOCX resume to upload.',
      });
    }

    const { originalname, size, buffer } = req.file;

    // Check for empty files
    if (size === 0 || !buffer || buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file is empty (0 bytes). Please upload a valid document.',
      });
    }

    // Determine file type from extension
    const ext = path.extname(originalname).toLowerCase();
    let fileType = '';
    if (ext === '.pdf') {
      fileType = 'pdf';
    } else if (ext === '.docx' || ext === '.doc') {
      fileType = 'docx';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF (.pdf) and Microsoft Word (.docx) files are supported.',
      });
    }

    logger.info(`Extracting text from ${originalname} (${size} bytes) for user ${req.user._id}`);

    // Perform text extraction
    let extractedText;
    try {
      extractedText = await extractResumeText(buffer, fileType);
    } catch (extractError) {
      return res.status(422).json({
        success: false,
        message: extractError.message,
      });
    }

    // Save resume to database scoped to authenticated user
    const resume = await Resume.create({
      userId: req.user._id,
      originalFileName: originalname,
      fileType,
      fileSize: size,
      extractedText,
      status: 'extracted',
      analysis: {},
      score: 0,
    });

    logger.info(`Resume saved successfully: ID ${resume._id} with ${resume.wordCount} words`);

    // Check for async background job request
    if (req.query.async === 'true' || req.headers['x-async-processing'] === 'true') {
      const { addResumeProcessingJob } = require('../queues/jobQueue');
      const { executeResumeProcessing } = require('../workers/jobWorker');

      const job = await addResumeProcessingJob({
        userId: req.user._id,
        resumeId: resume._id,
        text: extractedText,
        fileName: originalname,
        fileType,
      });

      // Dispatch worker asynchronously
      setImmediate(() => {
        executeResumeProcessing(
          {
            userId: req.user._id,
            resumeId: resume._id,
            text: extractedText,
            fileName: originalname,
            fileType,
          },
          job.jobId
        ).catch((err) => logger.error(`Background job ${job.jobId} error: ${err.message}`));
      });

      return res.status(202).json({
        success: true,
        message: 'Resume uploaded and enqueued for background AI processing.',
        data: {
          jobId: job.jobId,
          resumeId: resume._id,
          status: 'queued',
        },
      });
    }

    // Asynchronously index resume into vector storage
    try {
      await indexDocument({
        userId: req.user._id,
        sourceId: resume._id,
        sourceType: 'resume',
        text: extractedText,
        metadata: {
          originalFileName: originalname,
          fileType,
        },
      });
    } catch (vectorErr) {
      logger.warn(`Vector indexing on resume upload had an issue: ${vectorErr.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and text extracted successfully.',
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Analyze resume text using AI and persist structured analysis & score
 * @route POST /api/resumes/:id/analyze
 * @access Private
 */
const analyzeResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id, // Strict user isolation
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or you do not have permission to analyze it.',
      });
    }

    if (!resume.extractedText || resume.extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot analyze an empty resume. Please upload a valid document first.',
      });
    }

    // Check for async background job request
    if (req.query.async === 'true' || req.headers['x-async-processing'] === 'true') {
      const { addResumeProcessingJob } = require('../queues/jobQueue');
      const { executeResumeProcessing } = require('../workers/jobWorker');

      const job = await addResumeProcessingJob({
        userId: req.user._id,
        resumeId: resume._id,
        text: resume.extractedText,
        fileName: resume.originalFileName,
        fileType: resume.fileType,
      });

      setImmediate(() => {
        executeResumeProcessing(
          {
            userId: req.user._id,
            resumeId: resume._id,
            text: resume.extractedText,
            fileName: resume.originalFileName,
            fileType: resume.fileType,
          },
          job.jobId
        ).catch((err) => logger.error(`Background job ${job.jobId} error: ${err.message}`));
      });

      return res.status(202).json({
        success: true,
        message: 'Resume analysis enqueued for background processing.',
        data: {
          jobId: job.jobId,
          resumeId: resume._id,
          status: 'queued',
        },
      });
    }

    logger.info(`Triggering AI Analysis for resume ${resume._id} (${resume.originalFileName})`);

    const targetRole = req.user.profile?.targetRole || 'Full Stack Developer';
    const candidateName = req.user.name || '';

    const analysisResult = await analyzeResumeText({
      resumeText: resume.extractedText,
      targetRole,
      candidateName,
    });

    // Update resume record in MongoDB
    resume.analysis = analysisResult;
    resume.score = analysisResult.score || 0;
    resume.status = 'analyzed';
    await resume.save();

    logger.info(`Resume ${resume._id} analyzed successfully. Persisted score: ${resume.score}`);

    res.status(200).json({
      success: true,
      message: 'AI Resume Analysis completed successfully.',
      data: resume,
    });
  } catch (error) {
    logger.error(`AI Analysis controller error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete AI resume analysis.',
    });
  }
};

/**
 * @desc Get all uploaded resumes for the current authenticated user
 * @route GET /api/resumes
 * @access Private
 */
const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('-extractedText')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single resume by ID including full extracted text & analysis
 * @route GET /api/resumes/:id
 * @access Private
 */
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or you do not have permission to view it.',
      });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a resume by ID and cleanup associated vector embeddings
 * @route DELETE /api/resumes/:id
 * @access Private
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or you do not have permission to delete it.',
      });
    }

    // Clean up vector documents for this resume
    await deleteVectorsBySource(resume._id, req.user._id);

    logger.info(`Resume deleted: ${resume._id} by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
      data: { id: resume._id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  analyzeResume,
  getResumes,
  getResumeById,
  deleteResume,
};
