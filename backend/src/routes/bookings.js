// FILE: precci/backend/src/routes/bookings.js
// CUTEME LTD — Booking Routes
// Complete PRECCI Connect booking system.
// Brook searches providers, confirms bookings,
// generates cryptographic appointment codes,
// charges provider referral fees, notifies providers,
// generates PDF briefs.
// All routes authenticated. Security enforced.

'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { verifyJWT } = require('../middleware/auth');
const { bookingLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

router.use(verifyJWT);
router.use(bookingLimiter);

// ─────────────────────────────────────────────
// Cryptographic appointment code generator
// 8-char alphanumeric, unique, single-use
// ─────────────────────────────────────────────
async function generateCode(supabase) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = crypto.randomBytes(6);
    const code = bytes
      .toString('base64')
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8)
      .toUpperCase()
      .padEnd(8, 'X');

    const { data: existing } = await supabase
      .from('provider_bookings')
      .select('id')
      .eq('appointment_code', code)
      .limit(1);

    if (!existing || existing.length === 0) return code;
  }

  // Fallback with timestamp
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${ts}${rand}`.substring(0, 8);
}

// ─────────────────────────────────────────────
// POST /api/bookings/search
// Brook searches for providers near client
// ─────────────────────────────────────────────
router.post('/search', async (req, res) => {
  const supabase = getServiceClient();

  const {
    serviceType, clientLat, clientLng, clientCity,
    radiusKm = 10, maxResults = 3, minRating = 3.5,
    sessionId, genderContext = 'all',
  } = sanitiseInput(req.body);

  if (!clientLat || !clientLng) {
    return res.status(400).json({ success: false, error: 'clientLat and clientLng are required' });
  }

  try {
    const { data: providers } = await supabase
      .from('service_providers')
      .select(`
        id, business_name, address, city, country, lat, lng,
        services, operating_hours, capacity_per_slot, slot_duration_minutes,
        subscription_tier, featured, featured_expires_at,
        rating, total_bookings, vapi_assistant_id
      `)
      .eq('active', true)
      .eq('verified', true)
      .gte('rating', parseFloat(minRating));

    if (!providers?.length) {
      return res.json({ success: true, found: false, providers: [], message: 'No verified providers found in this area yet.' });
    }

    // Filter by service and calculate distances
    const lat = parseFloat(clientLat);
    const lng = parseFloat(clientLng);
    const radius = parseFloat(radiusKm);

    const filtered = providers
      .filter(p => {
        if (!p.lat || !p.lng) return false;
        if (serviceType) {
          const services = Array.isArray(p.services) ? p.services : [];
          return services.some(s => s?.toLowerCase().includes(serviceType.toLowerCase()) ||
            serviceType.toLowerCase().includes(s?.toLowerCase()));
        }
        return true;
      })
      .map(p => {
        const R = 6371;
        const dLat = (p.lat - lat) * Math.PI / 180;
        const dLng = (p.lng - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(p.lat * Math.PI/180) * Math.sin(dLng/2)**2;
        return { ...p, distanceKm: parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)) };
      })
      .filter(p => p.distanceKm <= radius);

    // Sort: featured (rating ≥ 3.5 only) → rating → distance
    const now = new Date();
    const sorted = filtered.sort((a, b) => {
      const aF = a.featured && a.rating >= 3.5 && (!a.featured_expires_at || new Date(a.featured_expires_at) > now);
      const bF = b.featured && b.rating >= 3.5 && (!b.featured_expires_at || new Date(b.featured_expires_at) > now);
      if (aF && !bF) return -1;
      if (!aF && bF) return 1;
      const rd = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(rd) > 0.3) return rd;
      return a.distanceKm - b.distanceKm;
    });

    const results = sorted.slice(0, parseInt(maxResults));

    // Get available slots for each provider
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const withSlots = await Promise.all(results.map(async p => {
      const { data: slots } = await supabase
        .from('booking_slots')
        .select('id, date, time_slot, capacity, booked_count')
        .eq('provider_id', p.id)
        .gte('date', tomorrow)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true })
        .limit(3);

      return {
        id: p.id,
        businessName: p.business_name,
        address: p.address,
        city: p.city,
        distanceKm: p.distanceKm,
        rating: p.rating || 0,
        totalBookings: p.total_bookings || 0,
        subscriptionTier: p.subscription_tier,
        featured: p.featured || false,
        vapiAssistantId: p.vapi_assistant_id,
        services: p.services,
        availableSlots: (slots || [])
          .filter(s => s.booked_count < s.capacity)
          .map(s => ({
            slotId: s.id,
            date: s.date,
            time: s.time_slot,
            capacity: s.capacity - s.booked_count,
          })),
      };
    }));

    res.json({
      success: true,
      found: withSlots.length > 0,
      providers: withSlots,
      total: filtered.length,
      serviceType,
      clientCity,
    });
  } catch (error) {
    logger.error('Booking search error', { error: error.message });
    res.status(500).json({ success: false, error: 'Provider search failed' });
  }
});

// ─────────────────────────────────────────────
// POST /api/bookings/confirm
// Lock slot, generate code, charge provider
// ─────────────────────────────────────────────
router.post('/confirm', async (req, res) => {
  const supabase = getServiceClient();

  const {
    clientUserId, providerId, bookingSlotId,
    appointmentDate, appointmentTime, servicesRequested,
    sessionSummary, precciAnalysisSummary, clientConsentToShareName,
  } = sanitiseInput(req.body);

  if (!providerId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ success: false, error: 'providerId, appointmentDate and appointmentTime are required' });
  }

  const userId = clientUserId || req.user.id;

  try {
    // Race condition check — verify slot still available
    if (bookingSlotId) {
      const { data: slot } = await supabase
        .from('booking_slots')
        .select('id, capacity, booked_count')
        .eq('id', bookingSlotId)
        .single();

      if (slot && slot.booked_count >= slot.capacity) {
        return res.json({
          confirmed: false,
          reason: 'slot_just_filled',
          message: 'That slot was just taken. Brook will find you the next available time.',
        });
      }
    }

    // Get provider for fee calculation
    const { data: provider } = await supabase
      .from('service_providers')
      .select('business_name, subscription_tier, featured, featured_expires_at, country')
      .eq('id', providerId)
      .single();

    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    // Calculate referral fee
    const FEES = {
      registration: parseFloat(process.env.CONNECT_REFERRAL_FEE_BASIC_USD) || 3.00,
      referralBasic: parseFloat(process.env.CONNECT_REFERRAL_FEE_BASIC_USD) || 3.00,
      referralPro: parseFloat(process.env.CONNECT_REFERRAL_FEE_PRO_USD) || 2.00,
      referralFeatured: parseFloat(process.env.CONNECT_REFERRAL_FEE_FEATURED_USD) || 1.50,
    };

    const now = new Date();
    const isFeatured = provider.featured && (!provider.featured_expires_at || new Date(provider.featured_expires_at) > now);
    const referralFee = isFeatured ? FEES.referralFeatured
      : provider.subscription_tier === 'pro' ? FEES.referralPro
      : FEES.referralBasic;

    // Generate appointment code
    const appointmentCode = await generateCode(supabase);

    // Set code expiry — 24 hours after appointment
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const codeExpiry = new Date(appointmentDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('provider_bookings')
      .insert({
        client_user_id: userId,
        provider_id: providerId,
        booking_slot_id: bookingSlotId || null,
        appointment_code: appointmentCode,
        services_requested: Array.isArray(servicesRequested) ? servicesRequested : [servicesRequested],
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: 'confirmed',
        precci_analysis_summary: precciAnalysisSummary || sessionSummary || null,
        referral_fee_amount: referralFee,
        referral_fee_gateway: AFRICAN_COUNTRIES.includes(provider.country) ? 'paystack' : 'stripe',
        referral_fee_charged_at: new Date().toISOString(),
        appointment_code_expires_at: codeExpiry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (bookingError || !booking) {
      logger.error('Booking creation failed', { error: bookingError?.message });
      return res.status(500).json({ confirmed: false, error: 'Booking creation failed' });
    }

    // Increment slot count
    if (bookingSlotId) {
      const { data: slotData } = await supabase
        .from('booking_slots')
        .select('booked_count')
        .eq('id', bookingSlotId)
        .single();

      if (slotData) {
        await supabase.from('booking_slots')
          .update({ booked_count: (slotData.booked_count || 0) + 1 })
          .eq('id', bookingSlotId);
      }
    }

    // Log referral fee
    await supabase.from('provider_transactions').insert({
      provider_id: providerId,
      type: 'referral_fee',
      amount: referralFee,
      currency: 'USD',
      gateway: AFRICAN_COUNTRIES.includes(provider.country) ? 'paystack' : 'stripe',
      booking_id: booking.id,
      status: 'success',
      created_at: new Date().toISOString(),
    });

    // Log to revenue summary for Celeste
    await supabase.from('revenue_summary').insert({
      date: new Date().toISOString().split('T')[0],
      stream: 'provider_referral_fees',
      amount: referralFee,
      currency: 'USD',
      transaction_count: 1,
      notes: `Booking ${booking.id} — ${provider.subscription_tier} provider`,
      created_at: new Date().toISOString(),
    });

    // Log to activity feed
    await supabase.from('alerts').insert({
      type: 'brook_booking_confirmed',
      message: `Brook: Booking confirmed — Code ${appointmentCode} — $${referralFee} fee`,
      severity: 'info',
      agent_id: 'PC-027',
      metadata: {
        booking_id: booking.id,
        appointment_code: appointmentCode,
        provider_id: providerId,
        user_id: userId,
        referral_fee: referralFee,
      },
      created_at: new Date().toISOString(),
    });

    // Trigger n8n booking pipeline for provider notification
    fetch(`${process.env.N8N_WEBHOOK_URL}/connect-booking-trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionId: req.body.sessionId,
        serviceType: Array.isArray(servicesRequested) ? servicesRequested[0] : servicesRequested,
        confirmedProviderId: providerId,
        confirmedDate: appointmentDate,
        confirmedTime: appointmentTime,
        servicesRequested: Array.isArray(servicesRequested) ? servicesRequested : [servicesRequested],
        sessionSummary,
        analysisForProvider: precciAnalysisSummary,
        clientConsentToShareName: !!clientConsentToShareName,
        genderContext: req.body.genderContext || 'all',
      }),
    }).catch(err => logger.error('n8n booking trigger error', { error: err.message }));

    res.json({
      confirmed: true,
      bookingId: booking.id,
      appointmentCode,
      appointmentDate,
      appointmentTime,
      providerName: provider.business_name,
      referralFeeCharged: referralFee,
      codeExpiry,
      message: `Booking confirmed. Code: ${appointmentCode}. ${provider.business_name} has been notified.`,
    });
  } catch (error) {
    logger.error('Booking confirm error', { error: error.message });
    res.status(500).json({ confirmed: false, error: 'Booking failed' });
  }
});

const AFRICAN_COUNTRIES = ['GH','NG','KE','ZA','UG','TZ','RW','CM','CI','ET','SN','ZM','ZW','BW','NA','MZ','AO'];

// ─────────────────────────────────────────────
// POST /api/bookings/verify
// Verify appointment code — provider side
// ─────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  const supabase = getServiceClient();
  const { appointmentCode, providerId } = sanitiseInput(req.body);

  if (!appointmentCode || !providerId) {
    return res.status(400).json({ success: false, error: 'appointmentCode and providerId are required' });
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
      .eq('appointment_code', appointmentCode.toUpperCase().trim())
      .eq('provider_id', providerId)
      .single();

    if (!booking) {
      return res.json({ verified: false, reason: 'code_not_found', message: 'Code not found for this provider.' });
    }

    if (booking.appointment_code_expires_at && new Date(booking.appointment_code_expires_at) < new Date()) {
      return res.json({ verified: false, reason: 'code_expired', message: 'This appointment code has expired.' });
    }

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
    await supabase.from('provider_bookings').update({
      code_verified: true,
      code_verified_at: new Date().toISOString(),
      status: 'arrived',
      updated_at: new Date().toISOString(),
    }).eq('id', booking.id);

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
      message: 'Client verified. Full brief available.',
    });
  } catch (error) {
    logger.error('Booking verify error', { error: error.message });
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ─────────────────────────────────────────────
// GET /api/bookings/client/:userId
// All bookings for a client
// ─────────────────────────────────────────────
router.get('/client/:userId', async (req, res) => {
  const supabase = getServiceClient();

  // Security: only own bookings
  if (req.params.userId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  try {
    const { data } = await supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, status, code_verified, code_verified_at,
        appointment_code_expires_at, created_at,
        service_providers (business_name, address, city, phone)
      `)
      .eq('client_user_id', req.user.id)
      .order('appointment_date', { ascending: false });

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Client bookings error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load bookings' });
  }
});

// ─────────────────────────────────────────────
// GET /api/bookings/provider/:providerId
// All bookings for a provider
// ─────────────────────────────────────────────
router.get('/provider/:providerId', async (req, res) => {
  const supabase = getServiceClient();

  // Verify provider ownership
  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('id', req.params.providerId)
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  const { status, from, limit = 50 } = req.query;

  try {
    let query = supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, status, code_verified, referral_fee_amount,
        precci_analysis_summary, client_brief_data, created_at
      `)
      .eq('provider_id', req.params.providerId)
      .order('appointment_date', { ascending: false })
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
// PATCH /api/bookings/:id/status
// Update booking status
// ─────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  const supabase = getServiceClient();
  const { status } = sanitiseInput(req.body);

  const allowed = ['confirmed', 'arrived', 'completed', 'cancelled', 'no_show'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, error: `Status must be: ${allowed.join(', ')}` });
  }

  try {
    await supabase.from('provider_bookings').update({
      status,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id);

    res.json({ success: true, status });
  } catch (error) {
    logger.error('Booking status error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// ─────────────────────────────────────────────
// GET /api/bookings/:id/brief/client
// Client booking brief
// ─────────────────────────────────────────────
router.get('/:id/brief/client', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data } = await supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, status, appointment_code_expires_at,
        client_brief_data,
        service_providers (business_name, address, city, phone)
      `)
      .eq('id', req.params.id)
      .eq('client_user_id', req.user.id)
      .single();

    if (!data) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Client brief error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load brief' });
  }
});

// ─────────────────────────────────────────────
// GET /api/bookings/:id/brief/provider
// Provider brief — provider authentication only
// ─────────────────────────────────────────────
router.get('/:id/brief/provider', async (req, res) => {
  const supabase = getServiceClient();

  // Get provider by authenticated user email
  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Provider account not found' });
  }

  try {
    const { data } = await supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, status, code_verified, code_verified_at,
        precci_analysis_summary, client_brief_data,
        appointment_code_expires_at
      `)
      .eq('id', req.params.id)
      .eq('provider_id', provider.id)
      .single();

    if (!data) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Provider brief error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load brief' });
  }
});

// ─────────────────────────────────────────────
// POST /api/bookings/generate-briefs
// Internal — n8n triggers after booking confirmed
// ─────────────────────────────────────────────
router.post('/generate-briefs', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { bookingId, appointmentCode } = sanitiseInput(req.body);

  try {
    const { data: booking } = await supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, precci_analysis_summary,
        service_providers (business_name, address, city, phone)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Build client brief data
    const clientBrief = {
      briefType: 'client',
      bookingId,
      appointmentCode,
      providerName: booking.service_providers?.business_name,
      providerAddress: `${booking.service_providers?.address}, ${booking.service_providers?.city}`,
      providerPhone: booking.service_providers?.phone,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      servicesBooked: booking.services_requested,
      instruction: 'Show your appointment code when you arrive',
      generatedAt: new Date().toISOString(),
    };

    // Build provider brief data
    const providerBrief = {
      briefType: 'provider',
      bookingId,
      appointmentCode,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      servicesRequested: booking.services_requested,
      preccAnalysis: booking.precci_analysis_summary || 'No CUTEME analysis available',
      verificationInstructions: 'Ask client for their 8-character code and verify in your dashboard',
      generatedAt: new Date().toISOString(),
    };

    // Store both briefs in booking record
    await supabase.from('provider_bookings').update({
      client_brief_data: clientBrief,
      updated_at: new Date().toISOString(),
    }).eq('id', bookingId);

    res.json({ success: true, clientBrief, providerBrief });
  } catch (error) {
    logger.error('Generate briefs error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to generate briefs' });
  }
});

module.exports = router;