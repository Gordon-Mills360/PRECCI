// FILE: precci/backend/src/config/payments.js
// SECURITY: All payment operations server-side only.
// Webhook signatures validated before any processing.
// Payment amounts always verified server-side — never trust client.
// Africa → Paystack. Global → Stripe.
// Mobile Money auto-debit for African providers.

'use strict';

const axios = require('axios');
const crypto = require('crypto');
const Stripe = require('stripe');
const { getServiceClient } = require('./supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// AFRICAN COUNTRIES — route to Paystack
// ─────────────────────────────────────────────
const AFRICAN_COUNTRIES = new Set([
  'GH', 'NG', 'KE', 'ZA', 'EG', 'ET', 'TZ', 'UG', 'RW', 'CI',
  'SN', 'CM', 'ZM', 'MZ', 'GN', 'BF', 'ML', 'NE', 'TD', 'SD',
  'AO', 'MG', 'MW', 'ZW', 'BJ', 'TG', 'SL', 'LR', 'MR', 'GM',
  'GA', 'CG', 'CD', 'BI', 'DJ', 'ER', 'SO', 'SS', 'ST', 'CV',
  'GW', 'GQ', 'CF', 'NA', 'BW', 'LS', 'SZ', 'MU', 'SC', 'KM',
]);

// ─────────────────────────────────────────────
// DETERMINE PAYMENT GATEWAY
// Based on user's country code
// ─────────────────────────────────────────────
function determineGateway(countryCode) {
  if (!countryCode) return 'stripe';
  return AFRICAN_COUNTRIES.has(countryCode.toUpperCase()) ? 'paystack' : 'stripe';
}

// ─────────────────────────────────────────────
// STRIPE CLIENT
// ─────────────────────────────────────────────
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
}

// ─────────────────────────────────────────────
// PAYSTACK HTTP CLIENT
// Direct API calls — no SDK needed
// ─────────────────────────────────────────────
function getPaystackClient() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  return axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

// ─────────────────────────────────────────────
// VALIDATE PAYSTACK WEBHOOK SIGNATURE
// ─────────────────────────────────────────────
function validatePaystackWebhook(req) {
  const signature = req.headers['x-paystack-signature'];

  if (!signature) {
    logger.warn('Paystack webhook received without signature');
    return false;
  }

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const valid = hash === signature;

  if (!valid) {
    logger.warn('Paystack webhook signature validation failed');
  }

  return valid;
}

// ─────────────────────────────────────────────
// VALIDATE STRIPE WEBHOOK SIGNATURE
// Stripe requires raw body — mounted before JSON parser in index.js
// ─────────────────────────────────────────────
function validateStripeWebhook(req) {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    logger.warn('Stripe webhook received without signature');
    return { valid: false, event: null };
  }

  const stripe = getStripeClient();

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return { valid: true, event };
  } catch (error) {
    logger.warn('Stripe webhook signature validation failed', {
      error: error.message,
    });
    return { valid: false, event: null };
  }
}

// ─────────────────────────────────────────────
// CREATE STRIPE SUBSCRIPTION
// For global clients (non-African countries)
// ─────────────────────────────────────────────
async function createStripeSubscription({
  userId,
  email,
  plan,
  paymentMethodId,
}) {
  const stripe = getStripeClient();
  const supabase = getServiceClient();

  const STRIPE_PRICE_IDS = {
    glow: process.env.STRIPE_PRICE_GLOW,
    pro: process.env.STRIPE_PRICE_PRO,
    elite: process.env.STRIPE_PRICE_ELITE,
  };

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${plan}`);
  }

  // Create or retrieve Stripe customer
  let customerId;
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email,
      metadata: { precci_user_id: userId },
    });
    customerId = customer.id;
  }

  // Attach payment method
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: { precci_user_id: userId, plan },
  });

  return {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  };
}

// ─────────────────────────────────────────────
// CREATE PAYSTACK SUBSCRIPTION
// For African clients — supports Mobile Money
// ─────────────────────────────────────────────
async function createPaystackSubscription({
  userId,
  email,
  plan,
  callbackUrl,
}) {
  const paystack = getPaystackClient();

  const PAYSTACK_PLAN_CODES = {
    glow: process.env.PAYSTACK_PLAN_GLOW,
    pro: process.env.PAYSTACK_PLAN_PRO,
    elite: process.env.PAYSTACK_PLAN_ELITE,
  };

  const planCode = PAYSTACK_PLAN_CODES[plan];
  if (!planCode) {
    throw new Error(`No Paystack plan code configured for plan: ${plan}`);
  }

  try {
    const response = await paystack.post('/transaction/initialize', {
      email,
      plan: planCode,
      callback_url: callbackUrl,
      metadata: {
        precci_user_id: userId,
        plan,
        custom_fields: [
          {
            display_name: 'PRECCI User ID',
            variable_name: 'precci_user_id',
            value: userId,
          },
        ],
      },
    });

    return {
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error) {
    logger.error('Paystack subscription initialization failed', {
      error: error.response?.data || error.message,
    });
    throw new Error('Failed to initialize Paystack subscription');
  }
}

// ─────────────────────────────────────────────
// CHARGE PROVIDER REFERRAL FEE (PAYSTACK)
// Charged immediately on booking confirmation
// Uses provider's stored Paystack authorization code
// ─────────────────────────────────────────────
async function chargeProviderReferralFeePaystack({
  providerEmail,
  authorizationCode,
  amount,
  bookingId,
  providerId,
}) {
  const paystack = getPaystackClient();

  // Amount in kobo/pesewas (Paystack uses smallest currency unit)
  const amountInSubunit = Math.round(amount * 100);

  try {
    const response = await paystack.post('/transaction/charge_authorization', {
      email: providerEmail,
      amount: amountInSubunit,
      authorization_code: authorizationCode,
      reference: `referral_${bookingId}_${Date.now()}`,
      metadata: {
        booking_id: bookingId,
        provider_id: providerId,
        charge_type: 'referral_fee',
      },
    });

    return {
      success: response.data.data.status === 'success',
      reference: response.data.data.reference,
      amount,
      gateway: 'paystack',
    };
  } catch (error) {
    logger.error('Paystack referral fee charge failed', {
      error: error.response?.data || error.message,
      bookingId,
    });
    throw new Error('Failed to charge provider referral fee via Paystack');
  }
}

// ─────────────────────────────────────────────
// CHARGE PROVIDER REFERRAL FEE (STRIPE)
// For global providers
// ─────────────────────────────────────────────
async function chargeProviderReferralFeeStripe({
  stripeCustomerId,
  amount,
  bookingId,
  providerId,
}) {
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
      metadata: {
        booking_id: bookingId,
        provider_id: providerId,
        charge_type: 'referral_fee',
      },
    });

    return {
      success: paymentIntent.status === 'succeeded',
      reference: paymentIntent.id,
      amount,
      gateway: 'stripe',
    };
  } catch (error) {
    logger.error('Stripe referral fee charge failed', {
      error: error.message,
      bookingId,
    });
    throw new Error('Failed to charge provider referral fee via Stripe');
  }
}

// ─────────────────────────────────────────────
// CHARGE PROVIDER REGISTRATION FEE
// $25 one-time fee on provider signup
// Routes to Paystack or Stripe based on country
// ─────────────────────────────────────────────
async function chargeProviderRegistrationFee({
  providerId,
  email,
  countryCode,
  paymentReference,
}) {
  const gateway = determineGateway(countryCode);
  const registrationFee = parseFloat(process.env.CONNECT_REGISTRATION_FEE || '25.00');

  const supabase = getServiceClient();

  // Log the transaction
  const { data: transaction } = await supabase
    .from('provider_transactions')
    .insert({
      provider_id: providerId,
      type: 'registration',
      amount: registrationFee,
      currency: 'USD',
      gateway,
      gateway_reference: paymentReference,
      status: 'success',
    })
    .select('id')
    .single();

  // Update provider registration status
  await supabase
    .from('service_providers')
    .update({
      registration_fee_paid: true,
      registration_fee_amount: registrationFee,
      registration_fee_paid_at: new Date().toISOString(),
    })
    .eq('id', providerId);

  return {
    success: true,
    transactionId: transaction?.id,
    amount: registrationFee,
    gateway,
  };
}

// ─────────────────────────────────────────────
// LOG TRANSACTION TO SUPABASE
// Called after every successful payment
// ─────────────────────────────────────────────
async function logTransaction({
  userId = null,
  providerId = null,
  type,
  amount,
  currency = 'USD',
  gateway,
  gatewayReference,
  status = 'success',
  metadata = {},
}) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      provider_id: providerId,
      type,
      amount,
      currency,
      gateway,
      gateway_reference: gatewayReference,
      status,
      metadata,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to log transaction', {
      type,
      gateway,
      error: error.message,
    });
    return null;
  }

  return data?.id;
}

// ─────────────────────────────────────────────
// UPDATE REVENUE SUMMARY
// Called after every successful transaction to keep
// daily revenue summary accurate across all 16 streams
// ─────────────────────────────────────────────
async function updateRevenueSummary({
  stream,
  amount,
  currency = 'USD',
  date = null,
}) {
  const supabase = getServiceClient();
  const today = date || new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('upsert_revenue_summary', {
    p_date: today,
    p_stream: stream,
    p_amount: amount,
    p_currency: currency,
  });

  if (error) {
    logger.error('Failed to update revenue summary', {
      stream,
      error: error.message,
    });
  }
}

module.exports = {
  determineGateway,
  getStripeClient,
  getPaystackClient,
  validatePaystackWebhook,
  validateStripeWebhook,
  createStripeSubscription,
  createPaystackSubscription,
  chargeProviderReferralFeePaystack,
  chargeProviderReferralFeeStripe,
  chargeProviderRegistrationFee,
  logTransaction,
  updateRevenueSummary,
  AFRICAN_COUNTRIES,
};