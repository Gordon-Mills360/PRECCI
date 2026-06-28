// FILE: precci/backend/src/routes/webhooks/paystack.js
// SECURITY: Paystack webhook signature validated on every request.
// All payment amounts verified server-side.
// Never trust client-side payment confirmation.

'use strict';

const express = require('express');
const {
  validatePaystackWebhook,
  logTransaction,
  updateRevenueSummary,
} = require('../../config/payments');
const { getServiceClient } = require('../../config/supabase');
const { asyncHandler, PrecciError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/webhooks/paystack
// Handles all Paystack webhook events
// ─────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    // Validate signature first — reject anything invalid immediately
    const isValid = validatePaystackWebhook(req);
    if (!isValid) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid Paystack webhook signature', 401);
    }

    const event = req.body;
    const eventType = event.event;
    const data = event.data;

    logger.info('Paystack webhook received', { eventType });

    // Acknowledge immediately — Paystack requires fast response
    res.status(200).json({ received: true });

    // Process asynchronously after acknowledgement
    try {
      await processPaystackEvent(eventType, data);
    } catch (error) {
      logger.error('Paystack webhook processing failed', {
        eventType,
        error: error.message,
      });
    }
  })
);

// ─────────────────────────────────────────────
// PROCESS PAYSTACK EVENTS
// ─────────────────────────────────────────────
async function processPaystackEvent(eventType, data) {
  const supabase = getServiceClient();

  switch (eventType) {

    // ── SUCCESSFUL CHARGE ──
    case 'charge.success': {
      const { reference, amount, customer, metadata } = data;
      const amountInMajor = amount / 100; // Convert from kobo/pesewas
      const preciUserId = metadata?.precci_user_id;
      const chargeType = metadata?.charge_type || 'subscription';

      await logTransaction({
        userId: preciUserId || null,
        type: chargeType,
        amount: amountInMajor,
        currency: data.currency || 'GHS',
        gateway: 'paystack',
        gatewayReference: reference,
        status: 'success',
        metadata: { customer_email: customer?.email },
      });

      // Update revenue summary
      await updateRevenueSummary({
        stream: chargeType === 'referral_fee' ? 'connect_referral_fees' : 'subscriptions',
        amount: amountInMajor,
        currency: data.currency || 'GHS',
      });

      logger.info('Paystack charge.success processed', {
        reference,
        amount: amountInMajor,
      });
      break;
    }

    // ── SUBSCRIPTION CREATED ──
    case 'subscription.create': {
      const { customer, plan, subscription_code, email_token } = data;
      const userId = data.metadata?.precci_user_id || customer?.metadata?.precci_user_id;

      if (userId) {
        const planName = getPlanFromPaystackCode(plan?.plan_code);

        await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              plan: planName || 'glow',
              status: 'active',
              paystack_subscription_code: subscription_code,
              paystack_email_token: email_token,
              paystack_customer_id: customer?.customer_code,
              amount: plan?.amount ? plan.amount / 100 : null,
              currency: plan?.currency || 'GHS',
              billing_cycle: 'monthly',
              current_period_start: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        // Unlock plan features in users table
        await supabase
          .from('users')
          .update({ plan: planName || 'glow', plan_status: 'active' })
          .eq('id', userId);
      }

      logger.info('Paystack subscription created', { subscription_code });
      break;
    }

    // ── SUBSCRIPTION DISABLED (cancellation) ──
    case 'subscription.disable': {
      const { subscription_code } = data;

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancel_at_period_end: true })
        .eq('paystack_subscription_code', subscription_code);

      logger.info('Paystack subscription cancelled', { subscription_code });
      break;
    }

    // ── INVOICE FAILED ──
    case 'invoice.payment_failed': {
      const { subscription } = data;

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('paystack_subscription_code', subscription?.subscription_code);

      logger.warn('Paystack invoice payment failed', {
        subscription_code: subscription?.subscription_code,
      });
      break;
    }

    default:
      logger.info('Paystack webhook: unhandled event type', { eventType });
  }
}

// ─────────────────────────────────────────────
// MAP PAYSTACK PLAN CODE TO PRECCI PLAN NAME
// ─────────────────────────────────────────────
function getPlanFromPaystackCode(planCode) {
  const planMap = {
    [process.env.PAYSTACK_PLAN_GLOW]: 'glow',
    [process.env.PAYSTACK_PLAN_PRO]: 'pro',
    [process.env.PAYSTACK_PLAN_ELITE]: 'elite',
  };
  return planMap[planCode] || 'glow';
}

module.exports = router;