const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const resumeRoutes = require('./resumeRoutes');
const jobRoutes = require('./jobRoutes');
const semanticRoutes = require('./semanticRoutes');
const ragRoutes = require('./ragRoutes');
const interviewRoutes = require('./interviewRoutes');
const mentorRoutes = require('./mentorRoutes');
const roadmapRoutes = require('./roadmapRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// API Version & Endpoints Catalog
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CareerAI API Platform',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      resumes: {
        upload: 'POST /api/resumes/upload',
        list: 'GET /api/resumes',
        getById: 'GET /api/resumes/:id',
        delete: 'DELETE /api/resumes/:id',
        analyze: 'POST /api/resumes/:id/analyze',
      },
      jobs: {
        create: 'POST /api/jobs',
        list: 'GET /api/jobs',
        getById: 'GET /api/jobs/:id',
        delete: 'DELETE /api/jobs/:id',
        analyze: 'POST /api/jobs/:id/analyze',
        matchResume: 'POST /api/jobs/:id/match-resume/:resumeId',
      },
      semantic: {
        index: 'POST /api/semantic/index',
        search: 'POST /api/semantic/search',
        stats: 'GET /api/semantic/stats',
      },
      rag: {
        query: 'POST /api/ai/rag/query',
      },
      interviews: {
        create: 'POST /api/interviews',
        list: 'GET /api/interviews',
        getById: 'GET /api/interviews/:id',
        start: 'POST /api/interviews/:id/start',
        answer: 'POST /api/interviews/:id/answer',
        nextQuestion: 'POST /api/interviews/:id/next-question',
        complete: 'POST /api/interviews/:id/complete',
        report: 'GET /api/interviews/:id/report',
      },
      mentor: {
        chat: 'POST /api/mentor/chat',
        memories: 'GET /api/mentor/memories',
      },
      roadmaps: {
        generate: 'POST /api/roadmaps/generate',
        list: 'GET /api/roadmaps',
        progress: 'PATCH /api/roadmaps/:id/progress',
      },
      analytics: {
        overview: 'GET /api/analytics',
      },
    },
  });
});

// Mount modular sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/semantic', semanticRoutes);
router.use('/ai/rag', ragRoutes);
router.use('/rag', ragRoutes);
router.use('/interviews', interviewRoutes);
router.use('/mentor', mentorRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
