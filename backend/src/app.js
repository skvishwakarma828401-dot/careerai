const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const { sanitizationMiddleware } = require('./middleware/sanitizationMiddleware');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Security headers middleware with production-grade CSP & frame protections
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws://localhost:5000', 'http://localhost:5000', process.env.CLIENT_URL || 'http://localhost:5173'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration (allow credentials so HTTP-only cookies work seamlessly)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin server requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Access denied for this origin.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-async', 'x-async-processing'],
};
app.use(cors(corsOptions));

// Request logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body & Cookie parsers with size limit guardrails
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// NoSQL Query Injection & Input Sanitization
app.use(sanitizationMiddleware);

// Rate Limiting Protection
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/mentor', aiLimiter);
app.use('/api', apiLimiter);

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'CareerAI API Platform',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
    auth: '/api/auth',
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Global Central Error Handler
app.use(errorHandler);

module.exports = app;
