const express = require('express');
const router = express.Router();
const {
  createInterview,
  getInterviews,
  getInterviewById,
  startInterview,
  submitAnswer,
  getNextQuestion,
  completeInterview,
  getInterviewReport,
  submitVoiceAnswer,
  transcribeVoiceAudio,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

// All interview routes are protected
router.use(protect);

router.post('/', createInterview);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.post('/:id/start', startInterview);
router.post('/:id/answer', submitAnswer);
router.post('/:id/voice-answer', submitVoiceAnswer);
router.post('/:id/voice-transcribe', transcribeVoiceAudio);
router.post('/:id/next-question', getNextQuestion);
router.post('/:id/complete', completeInterview);
router.get('/:id/report', getInterviewReport);

module.exports = router;
