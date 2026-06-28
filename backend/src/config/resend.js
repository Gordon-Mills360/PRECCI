// FILE: precci/backend/src/config/resend.js
// Resend email configuration for all transactional emails.
// Used by Lena for client emails and Brook for provider emails.
// All calls server-side only.

'use strict';

const { Resend } = require('resend');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// GET RESEND CLIENT
// ─────────────────────────────────────────────
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@precci.com';
const FROM_NAME = 'PRECCI';

// ─────────────────────────────────────────────
// SEND WELCOME EMAIL — new client
// ─────────────────────────────────────────────
async function sendClientWelcomeEmail({ toEmail, clientName }) {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Welcome to PRECCI — Your Personal AI Appearance Intelligence System',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1A0A0F; color: #FAF0E8; padding: 40px; border-radius: 12px;">
          <h1 style="color: #C9847A; font-size: 2rem; margin-bottom: 8px;">Welcome to PRECCI</h1>
          <p style="color: #D4A853; margin-bottom: 24px; font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase;">Personal AI Appearance Intelligence</p>
          <p style="margin-bottom: 16px;">Hello${clientName ? ` ${clientName}` : ''},</p>
          <p style="margin-bottom: 16px;">Your PRECCI account is ready. You now have access to the world's first Personal AI Appearance Intelligence System.</p>
          <p style="margin-bottom: 16px;">Open the PRECCI app and speak to Grace — she will guide you through everything.</p>
          <p style="color: rgba(250,240,232,0.6); font-size: 0.85rem; margin-top: 32px; border-top: 1px solid rgba(201,132,122,0.2); padding-top: 16px;">
            PRECCI · Navrongo, Ghana · The World
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error('Failed to send client welcome email', { error: error.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Resend client welcome email error', { error: error.message });
    return false;
  }
}

// ─────────────────────────────────────────────
// SEND BOOKING CONFIRMATION EMAIL — client
// ─────────────────────────────────────────────
async function sendBookingConfirmationEmail({
  toEmail,
  clientName,
  providerName,
  services,
  appointmentDate,
  appointmentTime,
  appointmentCode,
  providerAddress,
}) {
  const resend = getResendClient();

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toEmail,
      subject: `Appointment Confirmed — ${providerName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1A0A0F; color: #FAF0E8; padding: 40px; border-radius: 12px;">
          <h1 style="color: #C9847A; font-size: 1.5rem; margin-bottom: 24px;">Appointment Confirmed</h1>
          <div style="background: rgba(201,132,122,0.1); border: 1px solid rgba(201,132,122,0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Provider:</strong> ${providerName}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Services:</strong> ${services?.join(', ')}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Date:</strong> ${appointmentDate}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Time:</strong> ${appointmentTime}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Address:</strong> ${providerAddress}</p>
            <p style="margin-top: 16px; font-size: 1.5rem; letter-spacing: 0.2em; color: #C9847A; font-weight: bold;">Code: ${appointmentCode}</p>
            <p style="font-size: 0.8rem; color: rgba(250,240,232,0.5);">Show this code when you arrive</p>
          </div>
          <p style="color: rgba(250,240,232,0.6); font-size: 0.85rem;">PRECCI · Navrongo, Ghana · The World</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Failed to send booking confirmation email', { error: error.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Resend booking confirmation error', { error: error.message });
    return false;
  }
}

// ─────────────────────────────────────────────
// SEND PROVIDER WELCOME EMAIL
// ─────────────────────────────────────────────
async function sendProviderWelcomeEmail({ toEmail, businessName, ownerName }) {
  const resend = getResendClient();

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toEmail,
      subject: `Welcome to PRECCI Connect — ${businessName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1A0A0F; color: #FAF0E8; padding: 40px; border-radius: 12px;">
          <h1 style="color: #C9847A; font-size: 1.5rem; margin-bottom: 8px;">Welcome to PRECCI Connect</h1>
          <p style="color: #D4A853; margin-bottom: 24px; font-size: 0.9rem;">Your business is now live on the PRECCI marketplace.</p>
          <p style="margin-bottom: 16px;">Hello ${ownerName},</p>
          <p style="margin-bottom: 16px;"><strong>${businessName}</strong> is now registered on PRECCI Connect. When clients book with you, our AI voice agent will notify you immediately.</p>
          <p style="margin-bottom: 16px;">Your provider dashboard is live. Access it at <a href="https://precci.com/provider/dashboard" style="color: #C9847A;">precci.com/provider/dashboard</a></p>
          <p style="color: rgba(250,240,232,0.6); font-size: 0.85rem; margin-top: 32px; border-top: 1px solid rgba(201,132,122,0.2); padding-top: 16px;">PRECCI · Navrongo, Ghana · The World</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Failed to send provider welcome email', { error: error.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Resend provider welcome email error', { error: error.message });
    return false;
  }
}

// ─────────────────────────────────────────────
// SEND SUBSCRIPTION RECEIPT
// ─────────────────────────────────────────────
async function sendSubscriptionReceipt({
  toEmail,
  clientName,
  plan,
  amount,
  currency,
  nextBillingDate,
}) {
  const resend = getResendClient();

  const planLabels = {
    glow: 'GLOW',
    pro: 'PRO',
    elite: 'ELITE',
  };

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toEmail,
      subject: `PRECCI ${planLabels[plan] || plan} — Payment Confirmed`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1A0A0F; color: #FAF0E8; padding: 40px; border-radius: 12px;">
          <h1 style="color: #C9847A; font-size: 1.5rem; margin-bottom: 24px;">Payment Confirmed</h1>
          <p style="margin-bottom: 16px;">Hello${clientName ? ` ${clientName}` : ''},</p>
          <p style="margin-bottom: 16px;">Your PRECCI <strong style="color: #D4A853;">${planLabels[plan] || plan}</strong> subscription is active.</p>
          <div style="background: rgba(201,132,122,0.1); border: 1px solid rgba(201,132,122,0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Plan:</strong> ${planLabels[plan] || plan}</p>
            <p style="margin-bottom: 8px;"><strong style="color: #D4A853;">Amount:</strong> ${currency} ${amount}</p>
            <p><strong style="color: #D4A853;">Next billing:</strong> ${nextBillingDate}</p>
          </div>
          <p style="color: rgba(250,240,232,0.6); font-size: 0.85rem;">PRECCI · Navrongo, Ghana · The World</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Failed to send subscription receipt', { error: error.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Resend subscription receipt error', { error: error.message });
    return false;
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkResendHealth() {
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: FROM_EMAIL,
      subject: 'PRECCI Health Check',
      html: '<p>Health check</p>',
    });
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  sendClientWelcomeEmail,
  sendBookingConfirmationEmail,
  sendProviderWelcomeEmail,
  sendSubscriptionReceipt,
  checkResendHealth,
};