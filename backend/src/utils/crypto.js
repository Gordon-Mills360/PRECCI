// FILE: precci/backend/src/utils/crypto.js
// Cryptographic utilities for PRECCI.
// Appointment codes are cryptographically generated — never sequential.
// All codes are single-use and expire 24 hours after appointment time.

'use strict';

const crypto = require('crypto');

// ─────────────────────────────────────────────
// GENERATE APPOINTMENT CODE
// 8 character uppercase alphanumeric
// Cryptographically random — not guessable
// Format: XXXX-XXXX for readability
// ─────────────────────────────────────────────
function generateAppointmentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // Exclude ambiguous characters: 0, O, 1, I
  let code = '';

  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }

  return code;
}

// ─────────────────────────────────────────────
// GENERATE APPOINTMENT CODE EXPIRY
// Expires 24 hours after the appointment time
// ─────────────────────────────────────────────
function generateCodeExpiry(appointmentDate, appointmentTime) {
  const expiryHours = parseInt(
    process.env.APPOINTMENT_CODE_EXPIRY_HOURS || '24',
    10
  );

  const appointmentDateTime = new Date(
    `${appointmentDate}T${appointmentTime}:00`
  );

  const expiry = new Date(
    appointmentDateTime.getTime() + expiryHours * 60 * 60 * 1000
  );

  return expiry.toISOString();
}

// ─────────────────────────────────────────────
// HASH TOKEN
// Used for storing tokens in blacklist table
// SHA-256 — one-way, cannot be reversed
// ─────────────────────────────────────────────
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

// ─────────────────────────────────────────────
// GENERATE SECURE RANDOM STRING
// Used for webhook secrets, session IDs etc.
// ─────────────────────────────────────────────
function generateSecureString(length = 32) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// ─────────────────────────────────────────────
// CONSTANT TIME COMPARISON
// Prevents timing attacks when comparing secrets
// ─────────────────────────────────────────────
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

// ─────────────────────────────────────────────
// VALIDATE HMAC SIGNATURE
// Used for webhook signature validation
// ─────────────────────────────────────────────
function validateHmacSignature(payload, signature, secret, algorithm = 'sha256') {
  if (!payload || !signature || !secret) return false;

  const expected = crypto
    .createHmac(algorithm, secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');

  return safeCompare(signature, expected);
}

module.exports = {
  generateAppointmentCode,
  generateCodeExpiry,
  hashToken,
  generateSecureString,
  safeCompare,
  validateHmacSignature,
};