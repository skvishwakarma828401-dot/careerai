const express = require('express');
const router = express.Router();
const { queryRAG } = require('../controllers/ragController');
const { protect } = require('../middleware/authMiddleware');

// All RAG routes are protected
router.use(protect);

router.post('/query', queryRAG);

module.exports = router;
