// FILE: precci/backend/src/routes/users.js
// SECURITY: Users access only their own data.
// gender and gender_expression never returned in public responses.
// All mutations require authenticated JWT.

'use strict';

const express = require('express');
const { getServiceClient } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/users/me
// Returns authenticated user's profile
// gender fields excluded from response
// ─────────────────────────────────────────────
router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data: user, error } = await supabase
      .from('users')
      .select(
        `id, name, email, phone, city, country,
         plan, plan_status, voice_consent, camera_consent,
         onboarding_complete, created_at`
      )
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      throw new PrecciError('NOT_FOUND', 'User not found', 404);
    }

    const { data: profile } = await supabase
      .from('beauty_profiles')
      .select(
        `skin_concerns, skin_tone, hair_concerns, hair_texture,
         style_prefs, body_type, fragrance_prefs, budget_range,
         appearance_goals, grooming_prefs, allergies`
      )
      .eq('user_id', req.user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      success: true,
      user: {
        ...user,
        profile: profile || null,
        subscription: subscription || null,
      },
    });
  })
);

// ─────────────────────────────────────────────
// PATCH /api/users/me
// Update user profile — name, phone, location
// Never update plan or role via this route
// ─────────────────────────────────────────────
router.patch(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    // Only allow these fields to be updated directly
    const allowedFields = ['name', 'phone', 'city', 'country', 'lat', 'lng'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new PrecciError('VALIDATION_ERROR', 'No valid fields to update', 400);
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, phone, city, country, updated_at')
      .single();

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to update profile', 500);
    }

    res.json({ success: true, user: data });
  })
);

// ─────────────────────────────────────────────
// PATCH /api/users/me/consent
// Update voice and camera consent
// ─────────────────────────────────────────────
router.patch(
  '/me/consent',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const { voiceConsent, cameraConsent } = req.body;

    const updates = {};
    if (typeof voiceConsent === 'boolean') updates.voice_consent = voiceConsent;
    if (typeof cameraConsent === 'boolean') updates.camera_consent = cameraConsent;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, voice_consent, camera_consent')
      .single();

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to update consent settings', 500);
    }

    res.json({ success: true, consent: data });
  })
);

// ─────────────────────────────────────────────
// GET /api/users/me/sessions
// Returns user's session history
// ─────────────────────────────────────────────
router.get(
  '/me/sessions',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

    const { data, error } = await supabase
      .from('sessions')
      .select(
        `id, agent_id, channel, duration_seconds,
         camera_used, completed, created_at`
      )
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve sessions', 500);
    }

    res.json({ success: true, sessions: data || [] });
  })
);

// ─────────────────────────────────────────────
// GET /api/users/me/bookings
// Returns user's PRECCI Connect booking history
// ─────────────────────────────────────────────
router.get(
  '/me/bookings',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('provider_bookings')
      .select(
        `id, appointment_code, services_requested,
         appointment_date, appointment_time, status,
         client_brief_url, created_at,
         service_providers (business_name, address, city)`
      )
      .eq('client_user_id', req.user.id)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve bookings', 500);
    }

    res.json({ success: true, bookings: data || [] });
  })
);

// ─────────────────────────────────────────────
// PATCH /api/users/me/beauty-profile
// Updates beauty profile from agent-gathered data
// ─────────────────────────────────────────────
router.patch(
  '/me/beauty-profile',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const allowedFields = [
      'skin_concerns', 'skin_tone', 'skin_undertone',
      'hair_concerns', 'hair_texture', 'hair_porosity',
      'style_prefs', 'body_type', 'fragrance_prefs',
      'makeup_style', 'budget_range', 'allergies',
      'grooming_prefs', 'appearance_goals',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new PrecciError('VALIDATION_ERROR', 'No valid fields to update', 400);
    }

    updates.updated_at = new Date().toISOString();
    updates.user_id = req.user.id;

    const { data, error } = await supabase
      .from('beauty_profiles')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to update beauty profile', 500);
    }

    res.json({ success: true, profile: data });
  })
);

module.exports = router;