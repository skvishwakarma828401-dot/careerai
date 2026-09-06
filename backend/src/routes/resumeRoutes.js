const express = require('express');
const router = express.Router();
const {
  uploadResume,
  analyzeResume,
  getResumes,
  getResumeById,
  deleteResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/uploadMiddleware');

// All resume routes are protected
router.use(protect);

router.post('/upload', handleUpload, uploadResume);
router.post('/:id/analyze', analyzeResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

module.exports = router;
