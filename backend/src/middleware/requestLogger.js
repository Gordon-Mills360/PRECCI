// FILE: precci/backend/src/middleware/requestLogger.js
// Request logging middleware.
// Sanitises all sensitive data before writing to logs.
// Never logs authorization headers, tokens, camera frames or gender fields.

'use strict';

const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// REQUEST LOGGER MIDDLEWARE
// Logs method, path, status, duration for every request
// Strips sensitive headers and body fields
// ─────────────────────────────────────────────
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Skip logging for health checks — reduces noise
  if (req.url === '/health') {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('HTTP Request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      // Safe headers only — never authorization
      contentType: req.get('Content-Type') || null,
      userAgent: req.get('User-Agent') || null,
      ip: req.ip,
    });
  });

  next();
}

module.exports = requestLogger;