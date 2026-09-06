const express = require('express');
const router = express.Router();
const {
  indexSource,
  semanticSearch,
  getStats,
} = require('../controllers/semanticController');
const { protect } = require('../middleware/authMiddleware');

// All semantic routes are protected
router.use(protect);

router.post('/index', indexSource);
router.post('/search', semanticSearch);
router.get('/stats', getStats);

module.exports = router;
