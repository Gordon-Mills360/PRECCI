// FILE: precci/backend/src/config/sentry.js
// Sentry error monitoring configuration.
// Only initialises when a real DSN is provided.
// Never captures personal data, camera frames or voice transcripts.

'use strict';

const logger = require('../utils/logger');

let sentryInstance = null;

// ─────────────────────────────────────────────
// INITIALISE SENTRY
// Called once in index.js startup
// ─────────────────────────────────────────────
function initialiseSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (
    !dsn ||
    dsn.trim() === '' ||
    dsn === 'your_sentry_dsn_here' ||
    !dsn.startsWith('https://')
  ) {
    logger.info('Sentry not configured — error monitoring inactive');
    return null;
  }

  try {
    const Sentry = require('@sentry/node');

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event) {
        // Strip all personal and sensitive data before sending to Sentry
        if (event.request) {
          if (event.request.data) {
            delete event.request.data.frame;
            delete event.request.data.audio;
            delete event.request.data.transcript;
            delete event.request.data.password;
            delete event.request.data.token;
            delete event.request.data.gender;
            delete event.request.data.gender_expression;
          }
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        return event;
      },
    });

    sentryInstance = Sentry;
    logger.info('Sentry initialised successfully');
    return Sentry;
  } catch (error) {
    logger.warn('Sentry initialisation failed', { error: error.message });
    return null;
  }
}

// ─────────────────────────────────────────────
// CAPTURE EXCEPTION
// Safe wrapper — never throws if Sentry unavailable
// ─────────────────────────────────────────────
function captureException(error, context = {}) {
  if (!sentryInstance) return;

  try {
    sentryInstance.captureException(error, { extra: context });
  } catch {
    // Sentry errors must never crash the application
  }
}

// ─────────────────────────────────────────────
// CAPTURE MESSAGE
// ─────────────────────────────────────────────
function captureMessage(message, level = 'info') {
  if (!sentryInstance) return;

  try {
    sentryInstance.captureMessage(message, level);
  } catch {
    // Sentry errors must never crash the application
  }
}

module.exports = {
  initialiseSentry,
  captureException,
  captureMessage,
};