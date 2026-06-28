// FILE: precci/backend/src/routes/webhooks/stripe.js
// SECURITY: Stripe webhook requires raw body — mounted before JSON parser.
// Signature validated via Stripe SDK before any processing.
// All amounts verified server-side.

'use strict';

const express = require('express');
const {
  validateStripeWebhook,
  logTransaction,
  updateRevenueSummary,
} = require('../../config/payments');
const { getServiceClient } = require('../../config/supabase');
const { asyncHandler, PrecciError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/webhooks/stripe
// Raw body required — mounted in index.js before JSON parser
// ─────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { valid, event } = validateStripeWebhook(req);

    if (!valid || !event) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid Stripe webhook signature', 401);
    }

    // Acknowledge immediately
    res.status(200).json({ received: true });

    // Process asynchronously
    try {
      await processStripeEvent(event);
    } catch (error) {
      logger.error('Stripe webhook processing failed', {
        type: event.type,
        error: error.message,
      });
    }
  })
);

// ─────────────────────────────────────────────
// PROCESS STRIPE EVENTS
// ─────────────────────────────────────────────
async function processStripeEvent(event) {
  const supabase = getServiceClient();
  const data = event.data.object;

  switch (event.type) {

    // ── SUBSCRIPTION CREATED OR UPDATED ──
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const userId = data.metadata?.precci_user_id;
      const planName = getPlanFromStripePrice(data.items?.data?.[0]?.price?.id);

      if (userId) {
        await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              plan: planName || 'glow',
              status: data.status,
              stripe_subscription_id: data.id,
              stripe_customer_id: data.customer,
              amount: data.items?.data?.[0]?.price?.unit_amount
                ? data.items.data[0].price.unit_amount / 100
                : null,
              currency: data.currency?.toUpperCase() || 'USD',
              billing_cycle: 'monthly',
              current_period_start: new Date(data.current_period_start * 1000).toISOString(),
              current_period_end: new Date(data.current_period_end * 1000).toISOString(),
              cancel_at_period_end: data.cancel_at_period_end,
            },
            { onConflict: 'user_id' }
          );

        if (data.status === 'active') {
          await supabase
            .from('users')
            .update({ plan: planName || 'glow', plan_status: 'active' })
            .eq('id', userId);
        }
      }

      logger.info('Stripe subscription processed', {
        type: event.type,
        subscriptionId: data.id,
        status: data.status,
      });
      break;
    }

    // ── SUBSCRIPTION CANCELLED ──
    case 'customer.subscription.deleted': {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', data.id);

      // Downgrade user to free plan
      const userId = data.metadata?.precci_user_id;
      if (userId) {
        await supabase
          .from('users')
          .update({ plan: 'free', plan_status: 'inactive' })
          .eq('id', userId);
      }

      logger.info('Stripe subscription cancelled', { subscriptionId: data.id });
      break;
    }

    // ── INVOICE PAID ──
    case 'invoice.payment_succeeded': {
      const amountPaid = data.amount_paid / 100;
      const userId = data.subscription_details?.metadata?.precci_user_id;
      const chargeType = data.metadata?.charge_type || 'subscription';

      await logTransaction({
        userId: userId || null,
        type: chargeType,
        amount: amountPaid,
        currency: data.currency?.toUpperCase() || 'USD',
        gateway: 'stripe',
        gatewayReference: data.id,
        status: 'success',
      });

      await updateRevenueSummary({
        stream: chargeType === 'referral_fee' ? 'connect_referral_fees' : 'subscriptions',
        amount: amountPaid,
        currency: data.currency?.toUpperCase() || 'USD',
      });

      logger.info('Stripe invoice paid', {
        invoiceId: data.id,
        amount: amountPaid,
      });
      break;
    }

    // ── INVOICE PAYMENT FAILED ──
    case 'invoice.payment_failed': {
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', data.subscription);

      logger.warn('Stripe invoice payment failed', {
        subscriptionId: data.subscription,
      });
      break;
    }

    // ── PAYMENT INTENT SUCCEEDED ──
    case 'payment_intent.succeeded': {
      const chargeType = data.metadata?.charge_type;

      if (chargeType === 'referral_fee') {
        const bookingId = data.metadata?.booking_id;

        if (bookingId) {
          await supabase
            .from('provider_bookings')
            .update({
              referral_fee_reference: data.id,
              referral_fee_charged_at: new Date().toISOString(),
            })
            .eq('id', bookingId);
        }
      }

      logger.info('Stripe payment intent succeeded', {
        paymentIntentId: data.id,
        chargeType,
      });
      break;
    }

    default:
      logger.info('Stripe webhook: unhandled event type', { type: event.type });
  }
}

// ─────────────────────────────────────────────
// MAP STRIPE PRICE ID TO PRECCI PLAN
// ─────────────────────────────────────────────
function getPlanFromStripePrice(priceId) {
  const priceMap = {
    [process.env.STRIPE_PRICE_GLOW]: 'glow',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
    [process.env.STRIPE_PRICE_ELITE]: 'elite',
  };
  return priceMap[priceId] || 'glow';
}

module.exports = router;