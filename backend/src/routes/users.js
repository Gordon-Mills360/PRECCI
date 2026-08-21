// FILE: precci/backend/src/routes/users.js
// CUTEME LTD — User Profile Routes
// CRUD for user profiles and beauty profiles.
// All authenticated. RLS enforced via Supabase.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { generalLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

router.use(verifyJWT);
router.use(generalLimiter);

// GET /api/users/me
router.get('/me', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone, city, country, plan, plan_status, onboarding_complete, created_at')
      .eq('id', req.user.id)
      .single();

    const { data: profile } = await supabase
      .from('beauty_profiles')
      .select('skin_concerns, skin_tone, hair_concerns, hair_texture, style_prefs, body_type, fragrance_prefs, budget_range, appearance_goals, allergies')
      .eq('user_id', req.user.id)
      .single();

    // Never return gender or gender_expression in API response
    res.json({
      success: true,
      data: {
        ...user,
        beautyProfile: profile || null,
      },
    });
  } catch (error) {
    logger.error('Get user error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load user profile' });
  }
});

// PATCH /api/users/me
router.patch('/me', async (req, res) => {
  const supabase = getServiceClient();
  const updates = sanitiseInput(req.body);

  // Allowed user fields — never allow plan changes via this route
  const allowedUserFields = ['name', 'phone', 'city', 'country', 'lat', 'lng', 'voice_consent', 'camera_consent'];
  const userUpdates = {};
  allowedUserFields.forEach(f => {
    if (updates[f] !== undefined) userUpdates[f] = updates[f];
  });

  userUpdates.updated_at = new Date().toISOString();

  try {
    if (Object.keys(userUpdates).length > 1) {
      await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', req.user.id);
    }

    // Beauty profile updates
    const allowedProfileFields = [
      'skin_concerns', 'skin_tone', 'skin_undertone', 'hair_concerns',
      'hair_texture', 'hair_porosity', 'style_prefs', 'body_type',
      'fragrance_prefs', 'makeup_style', 'budget_range', 'allergies',
      'grooming_prefs', 'appearance_goals',
    ];

    const profileUpdates = {};
    allowedProfileFields.forEach(f => {
      if (updates[f] !== undefined) profileUpdates[f] = updates[f];
    });

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      await supabase
        .from('beauty_profiles')
        .upsert({ user_id: req.user.id, ...profileUpdates });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Update user error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// GET /api/users/me/subscriptions
router.get('/me/subscriptions', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, plan, status, amount, currency, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Subscriptions error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load subscriptions' });
  }
});

// GET /api/users/me/try-on-history
router.get('/me/try-on-history', async (req, res) => {
  const supabase = getServiceClient();
  const { limit = 20 } = req.query;

  try {
    const { data } = await supabase
      .from('try_on_history')
      .select('id, look_type, look_description, proxied_url, saved, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Try-on history error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load try-on history' });
  }
});

// GET /api/users/me/recommendations
router.get('/me/recommendations', async (req, res) => {
  const supabase = getServiceClient();
  const { limit = 30 } = req.query;

  try {
    const { data } = await supabase
      .from('recommendations')
      .select(`
        id, agent_id, reason, purchased, commission_earned, created_at,
        products (id, name, brand, category, price, currency, affiliate_url, image_url, description)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Recommendations error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load recommendations' });
  }
});

module.exports = router;