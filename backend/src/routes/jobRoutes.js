const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
  analyzeJob,
  matchResumeToJob,
} = require('../controllers/jobController');
const { getJobStatusById } = require('../controllers/jobStatusController');
const { protect } = require('../middleware/authMiddleware');

// All job routes are protected
router.use(protect);

router.get('/status/:jobId', getJobStatusById);
router.post('/', createJob);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.delete('/:id', deleteJob);
router.post('/:id/analyze', analyzeJob);
router.post('/:id/match-resume/:resumeId', matchResumeToJob);

module.exports = router;
