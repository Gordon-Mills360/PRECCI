// FILE: precci/backend/src/utils/validators.js
// Input validation utilities used across all routes.
// All validation is server-side — never trust client.

'use strict';

// ─────────────────────────────────────────────
// VALIDATE EMAIL FORMAT
// ─────────────────────────────────────────────
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

// ─────────────────────────────────────────────
// VALIDATE PASSWORD STRENGTH
// Min 8 chars — no complexity requirements enforced
// (clients may have simple passwords by choice)
// ─────────────────────────────────────────────
function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 8 && password.length <= 128;
}

// ─────────────────────────────────────────────
// VALIDATE UUID
// ─────────────────────────────────────────────
function isValidUUID(value) {
  if (typeof value !== 'string') return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim());
}

// ─────────────────────────────────────────────
// VALIDATE PLAN NAME
// ─────────────────────────────────────────────
function isValidPlan(plan) {
  return ['free', 'glow', 'pro', 'elite'].includes(plan);
}

// ─────────────────────────────────────────────
// VALIDATE SUBSCRIPTION TIER (provider)
// ─────────────────────────────────────────────
function isValidProviderTier(tier) {
  return ['basic', 'pro'].includes(tier);
}

// ─────────────────────────────────────────────
// VALIDATE COUNTRY CODE (ISO 3166-1 alpha-2)
// ─────────────────────────────────────────────
function isValidCountryCode(code) {
  if (typeof code !== 'string') return false;
  return /^[A-Z]{2}$/.test(code.trim().toUpperCase());
}

// ─────────────────────────────────────────────
// VALIDATE COORDINATES
// ─────────────────────────────────────────────
function isValidLatitude(lat) {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

function isValidLongitude(lng) {
  const num = parseFloat(lng);
  return !isNaN(num) && num >= -180 && num <= 180;
}

// ─────────────────────────────────────────────
// VALIDATE DATE STRING (YYYY-MM-DD)
// ─────────────────────────────────────────────
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

// ─────────────────────────────────────────────
// VALIDATE TIME STRING (HH:MM)
// ─────────────────────────────────────────────
function isValidTimeString(timeStr) {
  if (typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());
}

// ─────────────────────────────────────────────
// VALIDATE APPOINTMENT CODE FORMAT
// 8 character uppercase hex string
// ─────────────────────────────────────────────
function isValidAppointmentCode(code) {
  if (typeof code !== 'string') return false;
  return /^[A-Z0-9]{8}$/.test(code.trim().toUpperCase());
}

// ─────────────────────────────────────────────
// VALIDATE PC ID FORMAT
// ─────────────────────────────────────────────
function isValidPcId(pcId) {
  if (typeof pcId !== 'string') return false;
  return /^PC-\d{3}$/.test(pcId.trim()) || pcId.trim() === 'JARVIS';
}

// ─────────────────────────────────────────────
// VALIDATE PHONE NUMBER
// International format with country code
// ─────────────────────────────────────────────
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
}

// ─────────────────────────────────────────────
// VALIDATE AMOUNT
// Must be positive number with max 2 decimal places
// ─────────────────────────────────────────────
function isValidAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  return /^\d+(\.\d{1,2})?$/.test(String(amount));
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  isValidPlan,
  isValidProviderTier,
  isValidCountryCode,
  isValidLatitude,
  isValidLongitude,
  isValidDateString,
  isValidTimeString,
  isValidAppointmentCode,
  isValidPcId,
  isValidPhone,
  isValidAmount,
};