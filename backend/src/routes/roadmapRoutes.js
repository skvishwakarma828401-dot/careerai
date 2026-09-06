const express = require('express');
const router = express.Router();
const {
  generateRoadmap,
  getRoadmaps,
  updateProgress,
} = require('../controllers/roadmapController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', generateRoadmap);
router.get('/', getRoadmaps);
router.patch('/:id/progress', updateProgress);

module.exports = router;
