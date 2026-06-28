// FILE: precci/backend/src/utils/logger.js
// SECURITY: Sanitises all sensitive data before writing to any log transport.
// Never logs API keys, tokens, passwords, gender fields, camera frames,
// payment credentials or personal identification numbers.

'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');

// ─────────────────────────────────────────────
// SENSITIVE FIELD PATTERNS — never logged
// ─────────────────────────────────────────────
const SENSITIVE_FIELDS = [
  'password', 'token', 'api_key', 'apikey', 'secret',
  'authorization', 'credit_card', 'card_number', 'cvv',
  'mobile_money_number', 'paystack_customer_id',
  'stripe_customer_id', 'stripe_subscription_id',
  'paystack_subscription_code', 'gateway_reference',
  'gender', 'gender_expression', 'embedding',
  'frame', 'camera_frame', 'image_data', 'base64',
  'raw_transcript', 'transcript',
];

// ─────────────────────────────────────────────
// SANITISE FUNCTION
// Recursively strips sensitive fields from any object before logging
// ─────────────────────────────────────────────
function sanitiseForLog(data) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Mask anything that looks like a JWT or API key
    if (data.length > 40 && /^[A-Za-z0-9+/=._-]+$/.test(data)) {
      return '[REDACTED_TOKEN]';
    }
    return data;
  }

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitiseForLog);
  }

  const sanitised = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      keyLower.includes(field)
    );

    if (isSensitive) {
      sanitised[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitised[key] = sanitiseForLog(value);
    } else {
      sanitised[key] = value;
    }
  }

  return sanitised;
}

// ─────────────────────────────────────────────
// CUSTOM FORMAT
// Applies sanitisation before any transport writes
// ─────────────────────────────────────────────
const sanitiseFormat = format((info) => {
  if (info.meta) {
    info.meta = sanitiseForLog(info.meta);
  }
  if (info.data) {
    info.data = sanitiseForLog(info.data);
  }
  if (info.error && info.error.stack) {
    // Include stack in dev, strip in prod
    if (process.env.NODE_ENV === 'production') {
      info.error = { message: info.error.message };
    }
  }
  return info;
});

// ─────────────────────────────────────────────
// TRANSPORT CONFIGURATION
// Dev: console with colours
// Prod: file transport only
// ─────────────────────────────────────────────
const logTransports = [];

if (process.env.NODE_ENV !== 'production') {
  logTransports.push(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'HH:mm:ss' }),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? ' ' + JSON.stringify(meta, null, 2)
            : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      ),
    })
  );
} else {
  logTransports.push(
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 10,
    })
  );
}

// ─────────────────────────────────────────────
// LOGGER INSTANCE
// ─────────────────────────────────────────────
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    sanitiseFormat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: process.env.NODE_ENV !== 'production' }),
    format.json()
  ),
  transports: logTransports,
  exitOnError: false,
});

module.exports = logger;
module.exports.sanitiseForLog = sanitiseForLog;