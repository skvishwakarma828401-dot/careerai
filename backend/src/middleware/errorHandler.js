const logger = require('../utils/logger');

/**
 * Central Global Error Handler with MongoDB & JWT error parsing and production sanitization
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error for debugging internally (never exposed to client)
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
  });

  // Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate field value entered: A resource with this ${field} already exists.`;
    return res.status(400).json({
      success: false,
      message,
      field,
      timestamp: new Date().toISOString(),
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired. Please log in again.',
      timestamp: new Date().toISOString(),
    });
  }

  const statusCode = res.statusCode !== 200 && res.statusCode !== 404 ? res.statusCode : (err.statusCode || 500);

  // In production, sanitize 500 server errors
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction && statusCode === 500 
    ? 'An unexpected internal server error occurred. Please contact support if the issue persists.' 
    : (error.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    error: !isProduction ? {
      name: err.name,
      stack: err.stack,
      details: err.errors || undefined,
    } : undefined,
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
