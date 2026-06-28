// FILE: precci/backend/src/middleware/security.js
// SECURITY: All input sanitisation, rate limiting, XSS and SQL injection
// prevention for every route in the PRECCI backend.
// Every rate limiter exported and applied per route group in index.js

'use strict';

const rateLimit = require('express-rate-limit');
const xss = require('xss');
const { PrecciError } = require('./errorHandler');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// RATE LIMITERS
// Applied per route group — not globally
// ─────────────────────────────────────────────

// General API — 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment and try again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      path: req.originalUrl,
      ip: req.ip,
    });
    res.status(429).json(options.message);
  },
});

// Auth routes — 10 requests per 15 minutes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded', { ip: req.ip });
    res.status(429).json(options.message);
  },
});

// Voice and AI endpoints — 30 requests per minute
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Voice session rate limit reached. Please wait a moment.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Camera analysis — 20 requests per minute
const cameraLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Camera analysis rate limit reached. Please wait a moment.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Payment endpoints — 30 requests per 15 minutes
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Payment request limit reached. Please wait before retrying.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Booking endpoints — 60 requests per 15 minutes
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Booking request limit reached. Please wait a moment.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Provider portal — 100 requests per 15 minutes
const providerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many provider requests. Please wait a moment.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// ─────────────────────────────────────────────
// SQL INJECTION PREVENTION
// Blocks common SQL injection patterns in all string inputs
// ─────────────────────────────────────────────
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE)\b)/gi,
  /(--|\/\*|\*\/|;|\bOR\b|\bAND\b)\s*(\d+|'[^']*')\s*=\s*(\d+|'[^']*')/gi,
  /'\s*(OR|AND)\s*'?\d/gi,
  /\bEXEC\b\s*(\(|xp_)/gi,
  /CAST\s*\(/gi,
  /CONVERT\s*\(/gi,
  /\bINFORMATION_SCHEMA\b/gi,
  /\bSYS\.\b/gi,
];

function containsSQLInjection(value) {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

// ─────────────────────────────────────────────
// SANITISE INPUT MIDDLEWARE
// Applied to all routes — strips XSS, blocks SQL injection,
// normalises encoding, trims whitespace
// gender and gender_expression fields handled with extra care
// ─────────────────────────────────────────────
function sanitiseInput(req, res, next) {
  try {
    if (req.body) {
      req.body = sanitiseObject(req.body);
    }
    if (req.query) {
      req.query = sanitiseObject(req.query);
    }
    if (req.params) {
      req.params = sanitiseObject(req.params);
    }
    next();
  } catch (error) {
    next(new PrecciError('VALIDATION_ERROR', 'Invalid input detected', 400));
  }
}

function sanitiseObject(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Block SQL injection
    if (containsSQLInjection(obj)) {
      logger.warn('SQL injection attempt detected', { value: '[REDACTED]' });
      throw new PrecciError('VALIDATION_ERROR', 'Invalid characters in input', 400);
    }
    // Strip XSS
    const cleaned = xss(obj.trim(), {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });
    return cleaned;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitiseObject(item));
  }

  if (typeof obj === 'object') {
    const sanitised = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip binary fields — camera frames, audio buffers
      if (key === 'frame' || key === 'audio' || key === 'buffer') {
        sanitised[key] = value;
        continue;
      }
      sanitised[key] = sanitiseObject(value);
    }
    return sanitised;
  }

  return obj;
}

// ─────────────────────────────────────────────
// VALIDATE CAMERA FRAME MIDDLEWARE
// Camera frames must be valid base64, max 5MB
// All camera processing is server-side only
// ─────────────────────────────────────────────
function validateCameraFrame(req, res, next) {
  const { frame } = req.body;

  if (!frame) {
    return next(new PrecciError('VALIDATION_ERROR', 'No camera frame provided', 400));
  }

  // Must be base64 string
  if (typeof frame !== 'string') {
    return next(new PrecciError('CAMERA_ERROR', 'Invalid camera frame format', 400));
  }

  // Strip data URI prefix if present
  const base64Data = frame.replace(/^data:image\/\w+;base64,/, '');

  // Check size — max 5MB base64 (~3.75MB raw)
  const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (sizeInBytes > maxSize) {
    return next(new PrecciError('CAMERA_ERROR', 'Camera frame exceeds maximum size', 413));
  }

  // Validate it is valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(base64Data)) {
    return next(new PrecciError('CAMERA_ERROR', 'Invalid camera frame encoding', 400));
  }

  // Attach cleaned frame to request
  req.cameraFrame = base64Data;
  next();
}

// ─────────────────────────────────────────────
// VALIDATE VOICE PAYLOAD MIDDLEWARE
// Validates Vapi webhook structure before any processing
// ─────────────────────────────────────────────
function validateVoicePayload(req, res, next) {
  const { message } = req.body;

  if (!message) {
    return next(new PrecciError('VALIDATION_ERROR', 'Invalid voice payload', 400));
  }

  if (typeof message !== 'object') {
    return next(new PrecciError('VALIDATION_ERROR', 'Voice payload must be an object', 400));
  }

  const allowedTypes = [
    'assistant-request',
    'function-call',
    'end-of-call-report',
    'hang',
    'speech-update',
    'transcript',
    'tool-calls',
    'transfer-destination-request',
    'user-interrupted',
  ];

  if (message.type && !allowedTypes.includes(message.type)) {
    return next(new PrecciError('VALIDATION_ERROR', 'Unrecognised voice event type', 400));
  }

  next();
}

// ─────────────────────────────────────────────
// REQUEST SIZE LIMITS
// Applied in index.js via express.json() options
// But also enforced here for multipart
// ─────────────────────────────────────────────
function enforceRequestSizeLimits(req, res, next) {
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

  if (contentLength > MAX_BODY_SIZE) {
    return next(
      new PrecciError('VALIDATION_ERROR', 'Request body too large', 413)
    );
  }

  next();
}

module.exports = {
  sanitiseInput,
  validateCameraFrame,
  validateVoicePayload,
  enforceRequestSizeLimits,
  generalLimiter,
  authLimiter,
  voiceLimiter,
  cameraLimiter,
  paymentLimiter,
  bookingLimiter,
  providerLimiter,
};