// FILE: precci/backend/src/utils/sanitise.js
// Sanitisation utilities used across all routes and services.
// Strips sensitive data, normalises inputs, prevents injection.

'use strict';

const xss = require('xss');

// ─────────────────────────────────────────────
// SANITISE STRING
// Strips XSS, trims whitespace, normalises encoding
// ─────────────────────────────────────────────
function sanitiseString(value) {
  if (typeof value !== 'string') return value;
  return xss(value.trim(), {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}

// ─────────────────────────────────────────────
// SANITISE EMAIL
// Lowercases and trims
// ─────────────────────────────────────────────
function sanitiseEmail(email) {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

// ─────────────────────────────────────────────
// SANITISE PHONE
// Strips everything except digits, +, spaces, dashes
// ─────────────────────────────────────────────
function sanitisePhone(phone) {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^0-9+\s\-()]/g, '').trim();
}

// ─────────────────────────────────────────────
// SANITISE UUID
// Validates UUID format — rejects anything that is not valid
// ─────────────────────────────────────────────
function sanitiseUUID(value) {
  if (typeof value !== 'string') return null;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim()) ? value.trim().toLowerCase() : null;
}

// ─────────────────────────────────────────────
// SANITISE NUMBER
// Returns a safe float or null
// ─────────────────────────────────────────────
function sanitiseNumber(value, min = null, max = null) {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (min !== null && num < min) return null;
  if (max !== null && num > max) return null;
  return num;
}

// ─────────────────────────────────────────────
// SANITISE ARRAY OF STRINGS
// ─────────────────────────────────────────────
function sanitiseStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitiseString(item))
    .filter(item => item.length > 0);
}

// ─────────────────────────────────────────────
// STRIP SENSITIVE FIELDS FROM OBJECT
// Used before logging or returning data to client
// ─────────────────────────────────────────────
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'api_key', 'apikey',
  'authorization', 'credit_card', 'card_number', 'cvv',
  'mobile_money_number', 'paystack_customer_id',
  'stripe_customer_id', 'stripe_subscription_id',
  'paystack_subscription_code', 'gateway_reference',
  'gender', 'gender_expression', 'embedding',
  'raw_transcript', 'transcript',
];

function stripSensitiveFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripSensitiveFields);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(f => keyLower.includes(f));
    if (isSensitive) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = stripSensitiveFields(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// ─────────────────────────────────────────────
// SANITISE AGENT RESPONSE
// Strips any accidentally leaked system internals
// from Claude API responses before sending to client
// ─────────────────────────────────────────────
function sanitiseAgentResponse(text) {
  if (typeof text !== 'string') return '';

  // Remove any accidentally leaked tool call syntax
  let clean = text.replace(/<tool_use>[\s\S]*?<\/tool_use>/gi, '');
  clean = clean.replace(/<tool_result>[\s\S]*?<\/tool_result>/gi, '');

  // Remove any PC ID references (internal only)
  clean = clean.replace(/\bPC-\d{3}\b/g, '');

  return clean.trim();
}

module.exports = {
  sanitiseString,
  sanitiseEmail,
  sanitisePhone,
  sanitiseUUID,
  sanitiseNumber,
  sanitiseStringArray,
  stripSensitiveFields,
  sanitiseAgentResponse,
};