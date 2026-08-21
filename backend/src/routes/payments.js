// FILE: precci/backend/src/routes/payments.js
// CUTEME LTD — Payment Routes
// Subscription creation via Paystack and Stripe.
// Provider registration fee charging.
// All amounts verified server-side — never trust client.
// Webhook handlers in separate files (vapi.js handles Vapi,
// this file handles Paystack + Stripe subscription webhooks).

'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { paymentLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

const PLAN_AMOUNTS = {
  glow: parseFloat(process.env.SUBSCRIPTION_GLOW_USD) || 9.99,
  pro: parseFloat(process.env.SUBSCRIPTION_PRO_USD) || 19.99,
  elite: parseFloat(process.env.SUBSCRIPTION_ELITE_USD) || 29.99,
};

const AFRICAN_COUNTRIES = ['GH','NG','KE','ZA','UG','TZ','RW','CM','CI','ET','SN','ZM','ZW','BW','NA','MZ','AO'];

// POST /api/payments/subscribe
// Initiate subscription — returns checkout URL or success
router.post('/subscribe', verifyToken, paymentLimiter, async (req, res) => {
  const supabase = getServiceClient();
  const { plan, currency = 'USD', country } = sanitiseInput(req.body);

  if (!plan || !PLAN_AMOUNTS[plan]) {
    return res.status(400).json({ success: false, error: 'Invalid plan. Must be: glow, pro, or elite' });
  }

  const amount = PLAN_AMOUNTS[plan];

  // Verify user exists
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, country')
    .eq('id', req.user.id)
    .single();

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const userCountry = country || user.country || 'GH';
  const usePaystack = AFRICAN_COUNTRIES.includes(userCountry);
  const gateway = usePaystack ? 'paystack' : 'stripe';

  try {
    if (usePaystack) {
      // Paystack subscription
      const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
      const planCode = process.env[`PAYSTACK_PLAN_${plan.toUpperCase()}`];

      if (!planCode) {
        return res.status(500).json({ success: false, error: 'Paystack plan not configured' });
      }

      const response = await Paystack.transaction.initialize({
        email: user.email,
        amount: Math.round(amount * 100), // Paystack uses pesewas/kobo
        plan: planCode,
        currency: 'GHS',
        metadata: {
          userId: req.user.id,
          plan,
          gateway: 'paystack',
        },
        callback_url: `${process.env.FRONTEND_URL}/upgrade/success`,
      });

      res.json({
        success: true,
        gateway: 'paystack',
        checkoutUrl: response.data.authorization_url,
        reference: response.data.reference,
      });
    } else {
      // Stripe subscription
      const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];

      if (!priceId) {
        return res.status(500).json({ success: false, error: 'Stripe price not configured' });
      }

      // Create or retrieve Stripe customer
      let { data: existingSub } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', req.user.id)
        .not('stripe_customer_id', 'is', null)
        .limit(1);

      let customerId = existingSub?.[0]?.stripe_customer_id;

      if (!customerId) {
        const customer = await Stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: { userId: req.user.id },
        });
        customerId = customer.id;
      }

      const checkoutSession = await Stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
        metadata: { userId: req.user.id, plan },
      });

      res.json({
        success: true,
        gateway: 'stripe',
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      });
    }
  } catch (error) {
    logger.error('Subscribe error', { error: error.message, gateway });
    res.status(500).json({ success: false, error: 'Payment initiation failed' });
  }
});

// POST /api/payments/verify-paystack
// Verify Paystack payment (called by n8n webhook handler)
router.post('/verify-paystack', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const { reference } = sanitiseInput(req.body);

  try {
    const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
    const response = await Paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      res.json({
        success: true,
        verified: true,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        metadata: response.data.metadata,
      });
    } else {
      res.json({ success: false, verified: false, status: response.data.status });
    }
  } catch (error) {
    logger.error('Paystack verify error', { error: error.message });
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// POST /api/payments/verify-stripe
// Verify Stripe payment
router.post('/verify-stripe', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const { paymentIntentId, subscriptionId } = sanitiseInput(req.body);

  try {
    const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    if (subscriptionId) {
      const sub = await Stripe.subscriptions.retrieve(subscriptionId);
      res.json({
        success: true,
        verified: sub.status === 'active',
        status: sub.status,
        customerId: sub.customer,
      });
    } else if (paymentIntentId) {
      const pi = await Stripe.paymentIntents.retrieve(paymentIntentId);
      res.json({
        success: true,
        verified: pi.status === 'succeeded',
        amount: pi.amount / 100,
        currency: pi.currency,
      });
    } else {
      res.status(400).json({ success: false, error: 'paymentIntentId or subscriptionId required' });
    }
  } catch (error) {
    logger.error('Stripe verify error', { error: error.message });
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Paystack webhook
router.post('/webhook/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body);
  logger.info('Paystack webhook received', { event: event.event });

  // Fire n8n subscription workflow
  if (event.event === 'charge.success' || event.event === 'subscription.create') {
    try {
      await fetch(`${process.env.N8N_WEBHOOK_URL}/subscription-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'paystack',
          event: event.event,
          reference: event.data?.reference,
          userId: event.data?.metadata?.userId,
          plan: event.data?.metadata?.plan,
          amount: event.data?.amount / 100,
          currency: event.data?.currency,
        }),
      });
    } catch (err) {
      logger.error('n8n trigger error', { error: err.message });
    }
  }

  res.json({ status: 'ok' });
});

// Stripe webhook
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  logger.info('Stripe webhook received', { type: event.type });

  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    const session = event.data.object;
    try {
      await fetch(`${process.env.N8N_WEBHOOK_URL}/subscription-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'stripe',
          event: event.type,
          subscriptionId: session.subscription,
          paymentIntentId: session.payment_intent,
          userId: session.metadata?.userId,
          plan: session.metadata?.plan,
          amount: session.amount_total / 100,
          currency: session.currency,
        }),
      });
    } catch (err) {
      logger.error('n8n trigger error', { error: err.message });
    }
  }

  res.json({ received: true });
});

module.exports = router;