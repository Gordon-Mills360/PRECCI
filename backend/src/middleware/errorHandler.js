// FILE: precci/backend/src/middleware/errorHandler.js
// SECURITY: Global error handler. Never exposes internal errors,
// stack traces or system details to any client response.
// Full error details logged internally via Winston only.

'use strict';

const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// KNOWN ERROR TYPES
// Maps internal error codes to safe client messages
// ─────────────────────────────────────────────
const ERROR_MESSAGES = {
  VALIDATION_ERROR:      'The information provided is invalid. Please try again.',
  AUTHENTICATION_ERROR:  'You are not authorised to access this resource.',
  AUTHORISATION_ERROR:   'You do not have permission to perform this action.',
  NOT_FOUND:             'The requested resource was not found.',
  RATE_LIMIT_EXCEEDED:   'Too many requests. Please wait a moment and try again.',
  PAYMENT_ERROR:         'A payment error occurred. No charge has been made.',
  BOOKING_CONFLICT:      'This time slot is no longer available. Please choose another.',
  VOICE_SESSION_ERROR:   'A voice session error occurred. Please try again.',
  CAMERA_ERROR:          'Unable to process camera input. Please check permissions.',
  AGENT_ERROR:           'An agent is temporarily unavailable. Please try again shortly.',
  DATABASE_ERROR:        'A system error occurred. Our team has been notified.',
  EXTERNAL_API_ERROR:    'An external service is temporarily unavailable.',
  DEFAULT:               'An unexpected error occurred. Please try again.',
};

// ─────────────────────────────────────────────
// CUSTOM ERROR CLASS
// Used throughout the application for typed errors
// ─────────────────────────────────────────────
class PrecciError extends Error {
  constructor(type, message, statusCode = 500, meta = {}) {
    super(message);
    this.name = 'PrecciError';
    this.type = type;
    this.statusCode = statusCode;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────
// NOT FOUND HANDLER
// Called when no route matched
// ─────────────────────────────────────────────
function notFoundHandler(req, res, next) {
  const error = new PrecciError(
    'NOT_FOUND',
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
}

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Must be registered as the last middleware in index.js
// ─────────────────────────────────────────────
function globalErrorHandler(err, req, res, next) {
  // Determine status code
  const statusCode =
    err.statusCode ||
    err.status ||
    (err.name === 'ValidationError' ? 400 : 500);

  // Determine error type
  const errorType = err.type || 'DEFAULT';

  // Safe message for client — never expose internals
  const clientMessage =
    ERROR_MESSAGES[errorType] || ERROR_MESSAGES.DEFAULT;

  // Log full details internally only
  logger.error('PRECCI Error', {
    type: errorType,
    message: err.message,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    // Never log body — may contain sensitive data
    userAgent: req.get('User-Agent'),
    requestId: req.id || null,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    meta: err.meta || {},
  });

  // Never send stack traces to client
  const response = {
    success: false,
    error: clientMessage,
    code: errorType,
  };

  // In development only, include safe additional context
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      message: err.message,
      type: errorType,
    };
  }

  res.status(statusCode).json(response);
}

// ─────────────────────────────────────────────
// ASYNC ERROR WRAPPER
// Wraps async route handlers to catch all unhandled promise rejections
// Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
// ─────────────────────────────────────────────
function asyncHandler(fn) {
  return function asyncHandlerWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  PrecciError,
};