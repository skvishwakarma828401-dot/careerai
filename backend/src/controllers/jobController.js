const Job = require('../models/Job');
const Resume = require('../models/Resume');
const { analyzeJobDescription } = require('../services/jobAnalyzer.service');
const { indexDocument, deleteVectorsBySource } = require('../services/vector.service');
const { matchResumeToJob: runResumeMatch } = require('../services/matcher.service');
const logger = require('../utils/logger');

/**
 * @desc Create a new job description entry and index vectors
 * @route POST /api/jobs
 * @access Private
 */
const createJob = async (req, res, next) => {
  try {
    const { title, company, description, autoAnalyze } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both a job title and the job description content.',
      });
    }

    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Job description is too short. Please provide a complete job description.',
      });
    }

    // Create job entry
    const job = await Job.create({
      userId: req.user._id,
      title: title.trim(),
      company: (company || '').trim(),
      description: description.trim(),
      status: 'draft',
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      experienceRequirements: '',
      educationRequirements: '',
      analysis: {},
    });

    logger.info(`Job created: ${job.title} (${job._id}) by user ${req.user._id}`);

    // Index job description into vector storage
    try {
      await indexDocument({
        userId: req.user._id,
        sourceId: job._id,
        sourceType: 'job',
        text: job.description,
        metadata: {
          title: job.title,
          company: job.company,
        },
      });
    } catch (vectorErr) {
      logger.warn(`Vector indexing on job create had an issue: ${vectorErr.message}`);
    }

    // If autoAnalyze requested, perform analysis immediately
    if (autoAnalyze) {
      try {
        const analysisResult = await analyzeJobDescription({
          jobTitle: job.title,
          company: job.company,
          descriptionText: job.description,
        });

        job.requiredSkills = analysisResult.requiredSkills || [];
        job.preferredSkills = analysisResult.preferredSkills || [];
        job.responsibilities = analysisResult.responsibilities || [];
        job.experienceRequirements = analysisResult.experienceRequirements || '';
        job.educationRequirements = analysisResult.educationRequirements || '';
        job.analysis = analysisResult;
        job.status = 'analyzed';
        await job.save();
      } catch (analyzeErr) {
        logger.warn(`Auto-analysis during job creation failed: ${analyzeErr.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Job description saved successfully.',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all job descriptions for current authenticated user
 * @route GET /api/jobs
 * @access Private
 */
const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ userId: req.user._id })
      .select('-description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single job description by ID including full text & AI analysis
 * @route GET /api/jobs/:id
 * @access Private
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found or you do not have permission to view it.',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a job description by ID and cleanup vectors
 * @route DELETE /api/jobs/:id
 * @access Private
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found or you do not have permission to delete it.',
      });
    }

    // Clean up associated vectors
    await deleteVectorsBySource(job._id, req.user._id);

    logger.info(`Job deleted: ${job._id} by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Job description deleted successfully.',
      data: { id: job._id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Analyze job description with AI and extract structured hiring criteria
 * @route POST /api/jobs/:id/analyze
 * @access Private
 */
const analyzeJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found or you do not have permission to analyze it.',
      });
    }

    logger.info(`Triggering AI Job Analysis for job ${job._id} (${job.title})`);

    const analysisResult = await analyzeJobDescription({
      jobTitle: job.title,
      company: job.company,
      descriptionText: job.description,
    });

    job.requiredSkills = analysisResult.requiredSkills || [];
    job.preferredSkills = analysisResult.preferredSkills || [];
    job.responsibilities = analysisResult.responsibilities || [];
    job.experienceRequirements = analysisResult.experienceRequirements || '';
    job.educationRequirements = analysisResult.educationRequirements || '';
    job.analysis = analysisResult;
    job.status = 'analyzed';
    await job.save();

    logger.info(`Job ${job._id} analyzed successfully. Required skills count: ${job.requiredSkills.length}`);

    res.status(200).json({
      success: true,
      message: 'Job description analyzed successfully.',
      data: job,
    });
  } catch (error) {
    logger.error(`AI Job Analysis controller error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze job description.',
    });
  }
};

/**
 * @desc Perform hybrid semantic matching between a job and a resume
 * @route POST /api/jobs/:id/match-resume/:resumeId
 * @access Private
 */
const matchResumeToJob = async (req, res, next) => {
  try {
    const { id: jobId, resumeId } = req.params;

    // 1. Fetch Job (verifying user ownership)
    const job = await Job.findOne({
      _id: jobId,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Target job description not found or you do not have permission to access it.',
      });
    }

    // 2. Fetch Resume (verifying user ownership)
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume document not found or you do not have permission to access it.',
      });
    }

    // 3. Execute hybrid semantic matching engine
    const matchAnalysis = await runResumeMatch({ resume, job });

    res.status(200).json({
      success: true,
      message: 'Resume-to-Job matching completed successfully.',
      data: {
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        resumeId: resume._id,
        resumeFileName: resume.originalFileName,
        ...matchAnalysis,
      },
    });
  } catch (error) {
    logger.error(`Resume-to-Job match error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to match resume against job description.',
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
  analyzeJob,
  matchResumeToJob,
};
