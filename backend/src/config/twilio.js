// FILE: precci/backend/src/config/twilio.js
// Twilio SMS configuration for booking alerts and verification.
// All calls server-side only.

'use strict';

const twilio = require('twilio');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// GET TWILIO CLIENT
// ─────────────────────────────────────────────
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not configured');
  }

  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// ─────────────────────────────────────────────
// SEND BOOKING CONFIRMATION SMS — client
// ─────────────────────────────────────────────
async function sendBookingConfirmationSMS({
  toPhone,
  providerName,
  appointmentDate,
  appointmentTime,
  appointmentCode,
}) {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    logger.warn('TWILIO_PHONE_NUMBER not configured — SMS skipped');
    return false;
  }

  const client = getTwilioClient();

  const message =
    `PRECCI Booking Confirmed!\n` +
    `${providerName}\n` +
    `${appointmentDate} at ${appointmentTime}\n` +
    `Your code: ${appointmentCode}\n` +
    `Show this code on arrival.`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send booking SMS', { error: error.message });
    return false;
  }
}

// ─────────────────────────────────────────────
// SEND BOOKING NOTIFICATION SMS — provider
// ─────────────────────────────────────────────
async function sendProviderBookingNotificationSMS({
  toPhone,
  clientName,
  services,
  appointmentDate,
  appointmentTime,
  appointmentCode,
}) {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    logger.warn('TWILIO_PHONE_NUMBER not configured — SMS skipped');
    return false;
  }

  const client = getTwilioClient();

  const message =
    `New PRECCI Booking!\n` +
    `Client: ${clientName || 'PRECCI Client'}\n` +
    `Services: ${services?.join(', ')}\n` +
    `${appointmentDate} at ${appointmentTime}\n` +
    `Verification code: ${appointmentCode}`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send provider booking SMS', { error: error.message });
    return false;
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkTwilioHealth() {
  try {
    const client = getTwilioClient();
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  sendBookingConfirmationSMS,
  sendProviderBookingNotificationSMS,
  checkTwilioHealth,
};