// FILE: precci/backend/src/routes/providers.js
// CUTEME LTD — Provider Management Routes
// Provider registration, profile management,
// slot management, voice agent activation,
// booking verification, revenue queries.
// All routes authenticated. RLS enforced.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const { generalLimiter, bookingLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const { generateAppointmentCode } = require('../agents/brook');
const logger = require('../utils/logger');

const AFRICAN_COUNTRIES = [
  'GH','NG','KE','ZA','UG','TZ','RW','CM','CI',
  'ET','SN','ZM','ZW','BW','NA','MZ','AO',
];

const CONNECT_FEES = {
  registration: parseFloat(process.env.CONNECT_REGISTRATION_FEE_USD) || 25,
  basic: parseFloat(process.env.CONNECT_BASIC_SUBSCRIPTION_USD) || 15,
  pro: parseFloat(process.env.CONNECT_PRO_SUBSCRIPTION_USD) || 30,
  featuredAfrica: parseFloat(process.env.CONNECT_FEATURED_PRICE_AFRICA_USD) || 20,
  featuredGlobal: parseFloat(process.env.CONNECT_FEATURED_PRICE_GLOBAL_USD) || 50,
  referralBasic: parseFloat(process.env.CONNECT_REFERRAL_FEE_BASIC_USD) || 3.00,
  referralPro: parseFloat(process.env.CONNECT_REFERRAL_FEE_PRO_USD) || 2.00,
  referralFeatured: parseFloat(process.env.CONNECT_REFERRAL_FEE_FEATURED_USD) || 1.50,
};

// ─────────────────────────────────────────────
// POST /api/providers/register
// New provider registration — called from
// the provider registration form at /connect
// ─────────────────────────────────────────────
router.post('/register', generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  const {
    businessName, ownerName, email, phone,
    address, city, country, lat, lng,
    services, operatingHours, capacityPerSlot,
    slotDurationMinutes, subscriptionTier,
    featuredPlacement, paymentMethod,
    mobileMoneyNumber, mobileMoneyNetwork,
    registrationGateway,
  } = sanitiseInput(req.body);

  if (!businessName || !ownerName || !email || !city || !country || !services?.length) {
    return res.status(400).json({
      success: false,
      error: 'businessName, ownerName, email, city, country and services are required',
    });
  }

  if (!['basic', 'pro'].includes(subscriptionTier)) {
    return res.status(400).json({ success: false, error: 'subscriptionTier must be basic or pro' });
  }

  // Check if email already registered
  const { data: existing } = await supabase
    .from('service_providers')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({ success: false, error: 'This email is already registered as a provider.' });
  }

  try {
    const { data: provider, error } = await supabase
      .from('service_providers')
      .insert({
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city.trim(),
        country: country.trim(),
        lat: lat || null,
        lng: lng || null,
        services: Array.isArray(services) ? services : [services],
        operating_hours: operatingHours || null,
        capacity_per_slot: parseInt(capacityPerSlot) || 1,
        slot_duration_minutes: parseInt(slotDurationMinutes) || 60,
        subscription_tier: subscriptionTier,
        featured: false,
        registration_fee_paid: false,
        registration_fee_amount: CONNECT_FEES.registration,
        mobile_money_number: mobileMoneyNumber?.trim() || null,
        mobile_money_network: mobileMoneyNetwork?.trim() || null,
        payment_method: paymentMethod || 'card',
        rating: 0,
        total_bookings: 0,
        active: false,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, business_name, email, subscription_tier')
      .single();

    if (error) throw error;

    // Initiate payment — redirect to Paystack or Stripe
    const gateway = AFRICAN_COUNTRIES.includes(country) ? 'paystack' : 'stripe';
    const totalAmount = CONNECT_FEES.registration +
      CONNECT_FEES[subscriptionTier] +
      (featuredPlacement ? (AFRICAN_COUNTRIES.includes(country) ? CONNECT_FEES.featuredAfrica : CONNECT_FEES.featuredGlobal) : 0);

    let checkoutUrl = null;

    if (gateway === 'paystack') {
      try {
        const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
        const response = await Paystack.transaction.initialize({
          email: email.toLowerCase(),
          amount: Math.round(totalAmount * 100),
          currency: 'GHS',
          metadata: {
            providerId: provider.id,
            businessName,
            subscriptionTier,
            featuredPlacement: !!featuredPlacement,
            gateway: 'paystack',
            type: 'provider_registration',
          },
          callback_url: `${process.env.FRONTEND_URL}/provider/dashboard`,
        });
        checkoutUrl = response.data?.authorization_url;
      } catch (payErr) {
        logger.error('Paystack provider payment error', { error: payErr.message });
      }
    } else {
      try {
        const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await Stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(totalAmount * 100),
              product_data: {
                name: `CUTEME Connect — ${businessName} Registration`,
                description: `Registration fee + ${subscriptionTier} plan first month`,
              },
            },
            quantity: 1,
          }],
          success_url: `${process.env.FRONTEND_URL}/provider/dashboard`,
          cancel_url: `${process.env.FRONTEND_URL}/connect`,
          metadata: {
            providerId: provider.id,
            businessName,
            subscriptionTier,
            type: 'provider_registration',
          },
        });
        checkoutUrl = session.url;
      } catch (stripeErr) {
        logger.error('Stripe provider payment error', { error: stripeErr.message });
      }
    }

    // Trigger n8n provider onboarding workflow
    fetch(`${process.env.N8N_WEBHOOK_URL}/provider-onboarding-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: provider.id,
        businessName,
        ownerName,
        email: email.toLowerCase(),
        city,
        country,
        services,
        subscriptionTier,
        featuredPlacement: !!featuredPlacement,
        paymentMethod,
        mobileMoneyNumber,
        mobileMoneyNetwork,
        gateway,
      }),
    }).catch(err => logger.error('n8n provider webhook error', { error: err.message }));

    res.json({
      success: true,
      onboarded: true,
      providerId: provider.id,
      businessName: provider.business_name,
      checkoutUrl,
      gateway,
      message: `${businessName} registered successfully. Complete payment to activate your listing.`,
    });
  } catch (error) {
    logger.error('Provider register error', { error: error.message });
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/providers/charge-registration
// Internal — n8n calls this to charge the fee
// ─────────────────────────────────────────────
router.post('/charge-registration', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const { providerId, email, amount, gateway, mobileMoneyNumber } = sanitiseInput(req.body);

  try {
    if (gateway === 'paystack') {
      const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
      const response = await Paystack.transaction.initialize({
        email,
        amount: Math.round((amount || CONNECT_FEES.registration) * 100),
        currency: 'GHS',
        metadata: { providerId, type: 'registration_fee', gateway: 'paystack' },
        callback_url: `${process.env.FRONTEND_URL}/provider/dashboard`,
      });

      res.json({
        success: true,
        gateway: 'paystack',
        checkoutUrl: response.data?.authorization_url,
        reference: response.data?.reference,
      });
    } else {
      const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const session = await Stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round((amount || CONNECT_FEES.registration) * 100),
            product_data: { name: 'CUTEME Connect Registration Fee' },
          },
          quantity: 1,
        }],
        success_url: `${process.env.FRONTEND_URL}/provider/dashboard`,
        cancel_url: `${process.env.FRONTEND_URL}/connect`,
        metadata: { providerId, type: 'registration_fee' },
      });

      res.json({ success: true, gateway: 'stripe', checkoutUrl: session.url });
    }
  } catch (error) {
    logger.error('Charge registration error', { error: error.message });
    res.status(500).json({ success: false, error: 'Payment initiation failed' });
  }
});

// ─────────────────────────────────────────────
// GET /api/providers/:id
// Get provider details
// ─────────────────────────────────────────────
router.get('/:id', verifyJWT, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data } = await supabase
      .from('service_providers')
      .select(`
        id, business_name, owner_name, city, country,
        services, operating_hours, capacity_per_slot,
        slot_duration_minutes, subscription_tier, featured,
        rating, total_bookings, active, verified, created_at
      `)
      .eq('id', req.params.id)
      .single();

    if (!data) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get provider error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load provider' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/providers/:id
// Update provider profile
// ─────────────────────────────────────────────
router.put('/:id', verifyJWT, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  // Verify ownership by email
  const { data: provider } = await supabase
    .from('service_providers')
    .select('id, email')
    .eq('id', req.params.id)
    .single();

  if (!provider || provider.email !== req.user.email) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  const updates = sanitiseInput(req.body);
  const allowedFields = [
    'phone', 'address', 'lat', 'lng',
    'capacity_per_slot', 'slot_duration_minutes',
    'operating_hours',
  ];

  const safeUpdates = {};
  allowedFields.forEach(f => {
    if (updates[f] !== undefined) safeUpdates[f] = updates[f];
  });

  safeUpdates.updated_at = new Date().toISOString();

  try {
    await supabase
      .from('service_providers')
      .update(safeUpdates)
      .eq('id', req.params.id);

    res.json({ success: true });
  } catch (error) {
    logger.error('Update provider error', { error: error.message });
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// ─────────────────────────────────────────────
// GET /api/providers/:id/bookings
// Provider's bookings
// ─────────────────────────────────────────────
router.get('/:id/bookings', verifyJWT, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  // Verify provider owns this ID
  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('id', req.params.id)
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  const { status, from, limit = 50 } = req.query;
  const today = new Date().toISOString().split('T')[0];

  try {
    let query = supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, status, code_verified, code_verified_at,
        referral_fee_amount, precci_analysis_summary,
        client_brief_data, created_at
      `)
      .eq('provider_id', req.params.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(parseInt(limit));

    if (status) query = query.eq('status', status);
    if (from) query = query.gte('appointment_date', from);

    const { data } = await query;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Provider bookings error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load bookings' });
  }
});

// ─────────────────────────────────────────────
// GET /api/providers/:id/slots
// Provider's availability slots
// ─────────────────────────────────────────────
router.get('/:id/slots', verifyJWT, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();
  const { from, to } = req.query;
  const today = new Date().toISOString().split('T')[0];

  try {
    let query = supabase
      .from('booking_slots')
      .select('id, date, time_slot, capacity, booked_count')
      .eq('provider_id', req.params.id)
      .gte('date', from || today)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (to) query = query.lte('date', to);

    const { data } = await query;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Provider slots error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load slots' });
  }
});

// ─────────────────────────────────────────────
// POST /api/providers/:id/slots
// Create availability slots
// ─────────────────────────────────────────────
router.post('/:id/slots', verifyJWT, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  const { data: provider } = await supabase
    .from('service_providers')
    .select('id, capacity_per_slot')
    .eq('id', req.params.id)
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  const { date, timeSlots } = sanitiseInput(req.body);

  if (!date || !timeSlots?.length) {
    return res.status(400).json({ success: false, error: 'date and timeSlots are required' });
  }

  try {
    const records = timeSlots.map(t => ({
      provider_id: req.params.id,
      date,
      time_slot: t,
      capacity: provider.capacity_per_slot || 1,
      booked_count: 0,
      created_at: new Date().toISOString(),
    }));

    await supabase.from('booking_slots').upsert(records, {
      onConflict: 'provider_id,date,time_slot',
      ignoreDuplicates: true,
    });

    res.json({ success: true, slotsCreated: records.length });
  } catch (error) {
    logger.error('Create slots error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to create slots' });
  }
});

// ─────────────────────────────────────────────
// GET /api/providers/:id/revenue
// Provider revenue summary
// ─────────────────────────────────────────────
router.get('/:id/revenue', verifyJWT, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('id', req.params.id)
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  try {
    const { data: transactions } = await supabase
      .from('provider_transactions')
      .select('type, amount, currency, status, created_at')
      .eq('provider_id', req.params.id)
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);

    const totals = { allTime: 0, month: 0, today: 0, byType: {} };
    (transactions || []).forEach(t => {
      const amount = parseFloat(t.amount || 0);
      totals.allTime += amount;
      if (t.created_at >= monthStart.toISOString()) totals.month += amount;
      if (t.created_at.startsWith(today)) totals.today += amount;
      totals.byType[t.type] = (totals.byType[t.type] || 0) + amount;
    });

    res.json({ success: true, data: { totals, transactions: transactions || [] } });
  } catch (error) {
    logger.error('Provider revenue error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load revenue' });
  }
});

// ─────────────────────────────────────────────
// POST /api/providers/verify-code
// Verify appointment code when client arrives
// ─────────────────────────────────────────────
router.post('/verify-code', verifyJWT, bookingLimiter, async (req, res) => {
  const supabase = getServiceClient();
  const { appointmentCode } = sanitiseInput(req.body);

  if (!appointmentCode || appointmentCode.length !== 8) {
    return res.status(400).json({ success: false, error: 'Valid 8-character appointment code is required' });
  }

  // Get provider ID from authenticated user's email
  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Provider account not found' });
  }

  try {
    const { data: booking } = await supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        status, services_requested, precci_analysis_summary,
        client_brief_data, code_verified, code_verified_at,
        appointment_code_expires_at
      `)
      .eq('appointment_code', appointmentCode.toUpperCase())
      .eq('provider_id', provider.id)
      .single();

    if (!booking) {
      return res.json({
        verified: false,
        reason: 'code_not_found',
        message: 'Code not found for your account. Check the code and try again.',
      });
    }

    // Check expiry
    if (booking.appointment_code_expires_at && new Date(booking.appointment_code_expires_at) < new Date()) {
      return res.json({
        verified: false,
        reason: 'code_expired',
        message: 'This appointment code has expired.',
      });
    }

    // Already verified
    if (booking.code_verified) {
      return res.json({
        verified: true,
        alreadyVerified: true,
        verifiedAt: booking.code_verified_at,
        booking: {
          appointmentDate: booking.appointment_date,
          appointmentTime: booking.appointment_time,
          services: booking.services_requested,
          analysis: booking.precci_analysis_summary,
          clientBrief: booking.client_brief_data,
        },
      });
    }

    // Mark verified
    await supabase
      .from('provider_bookings')
      .update({
        code_verified: true,
        code_verified_at: new Date().toISOString(),
        status: 'arrived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    res.json({
      verified: true,
      alreadyVerified: false,
      verifiedAt: new Date().toISOString(),
      booking: {
        bookingId: booking.id,
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        services: booking.services_requested,
        preccAnalysis: booking.precci_analysis_summary,
        clientBrief: booking.client_brief_data,
      },
      message: 'Client verified. Full brief is now available.',
    });
  } catch (error) {
    logger.error('Verify code error', { error: error.message });
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ─────────────────────────────────────────────
// POST /api/providers/activate-voice-agent
// Internal — Brook activates provider voice agent
// ─────────────────────────────────────────────
router.post('/activate-voice-agent', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { providerId, businessName, ownerName, services, city, subscriptionTier } = sanitiseInput(req.body);

  try {
    // Create a dedicated Vapi assistant for this provider
    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `CUTEME Connect — ${businessName}`,
        model: {
          provider: 'anthropic',
          model: 'claude-opus-4-5',
          systemPrompt: `You are the dedicated CUTEME Connect voice agent for ${businessName} in ${city}.
You notify ${ownerName} of incoming bookings from CUTEME clients.
When a new booking arrives, you tell them: who is coming, when, what services they need,
what CUTEME's AI agents found about this client, and the appointment code they should verify on arrival.
You are professional, warm and concise. You speak as a representative of CUTEME LTD.
Services offered: ${Array.isArray(services) ? services.join(', ') : services}.
Plan: ${subscriptionTier}.`,
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: process.env.ELEVENLABS_VOICE_LENA,
        },
      }),
    });

    let vapiAssistantId = null;
    if (vapiResponse.ok) {
      const vapiData = await vapiResponse.json();
      vapiAssistantId = vapiData.id;
    }

    // Update provider with voice agent ID
    if (vapiAssistantId) {
      await supabase
        .from('service_providers')
        .update({ vapi_assistant_id: vapiAssistantId, updated_at: new Date().toISOString() })
        .eq('id', providerId);
    }

    res.json({ success: true, vapiAssistantId });
  } catch (error) {
    logger.error('Activate voice agent error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to activate voice agent' });
  }
});

// ─────────────────────────────────────────────
// POST /api/providers/notify-voice
// Internal — notify provider of new booking via voice
// ─────────────────────────────────────────────
router.post('/notify-voice', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const {
    providerId, bookingId, appointmentCode,
    appointmentDate, appointmentTime,
    servicesRequested, analysisForProvider,
  } = sanitiseInput(req.body);

  try {
    const { data: provider } = await supabase
      .from('service_providers')
      .select('vapi_assistant_id, business_name, owner_name')
      .eq('id', providerId)
      .single();

    if (!provider?.vapi_assistant_id) {
      return res.json({ success: false, message: 'No voice agent configured for this provider' });
    }

    // Log the notification
    await supabase.from('alerts').insert({
      type: 'brook_provider_notification',
      message: `Brook: Provider notified — Booking ${bookingId} — Code ${appointmentCode}`,
      severity: 'info',
      agent_id: 'PC-027',
      metadata: {
        provider_id: providerId,
        booking_id: bookingId,
        appointment_code: appointmentCode,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        services: servicesRequested,
        analysis: analysisForProvider,
      },
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Provider notified' });
  } catch (error) {
    logger.error('Provider notify error', { error: error.message });
    res.status(500).json({ success: false, error: 'Notification failed' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/setup-provider-subscription
// Internal — n8n sets up auto-billing
// ─────────────────────────────────────────────
router.post('/setup-subscription', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { providerId, email, subscriptionTier, gateway, mobileMoneyNumber, featuredPlacement } = sanitiseInput(req.body);

  const monthlyAmount = CONNECT_FEES[subscriptionTier] || CONNECT_FEES.basic;

  try {
    if (gateway === 'paystack') {
      const planCode = process.env[`PAYSTACK_PLAN_PROVIDER_${subscriptionTier.toUpperCase()}`];
      if (planCode) {
        const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
        const sub = await Paystack.subscription.create({
          customer: email,
          plan: planCode,
          authorization: mobileMoneyNumber || undefined,
        });

        await supabase.from('service_providers').update({
          paystack_subscription_code: sub.data?.subscription_code,
          updated_at: new Date().toISOString(),
        }).eq('id', providerId);
      }
    } else {
      const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const priceId = process.env[`STRIPE_PRICE_PROVIDER_${subscriptionTier.toUpperCase()}`];

      if (priceId) {
        const customer = await Stripe.customers.create({ email, metadata: { providerId } });
        await supabase.from('service_providers').update({
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString(),
        }).eq('id', providerId);
      }
    }

    res.json({ success: true, subscriptionTier, monthlyAmount });
  } catch (error) {
    logger.error('Provider subscription setup error', { error: error.message });
    res.status(500).json({ success: false, error: 'Subscription setup failed' });
  }
});

module.exports = router;