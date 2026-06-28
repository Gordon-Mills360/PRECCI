// FILE: precci/backend/src/utils/rateLimiters.js
// Re-exports all rate limiters from security middleware.
// Centralised export so any file can import limiters cleanly.

'use strict';

const {
  generalLimiter,
  authLimiter,
  voiceLimiter,
  cameraLimiter,
  paymentLimiter,
  bookingLimiter,
  providerLimiter,
} = require('../middleware/security');

module.exports = {
  generalLimiter,
  authLimiter,
  voiceLimiter,
  cameraLimiter,
  paymentLimiter,
  bookingLimiter,
  providerLimiter,
};