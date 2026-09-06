const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for sensitive authentication endpoints (Login, Register)
 * Prevents brute-force credential stuffing and password guessing
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 250 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    retryAfter: '15m',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for computationally expensive AI endpoints (RAG, Mentor, Roadmap)
 * Prevents API quota exhaustion and DoS
 */
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300, // Limit each IP to 300 AI requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI processing rate limit exceeded. Please wait a moment before sending more requests.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * General API rate limiter for all other routes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = {
  authLimiter,
  aiLimiter,
  apiLimiter,
};
