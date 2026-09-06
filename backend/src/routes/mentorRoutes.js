const express = require('express');
const router = express.Router();
const {
  chatWithMentor,
  getMentorMemories,
} = require('../controllers/mentorController');
const { protect } = require('../middleware/authMiddleware');

// All mentor routes are protected
router.use(protect);

router.post('/chat', chatWithMentor);
router.get('/memories', getMentorMemories);

module.exports = router;
