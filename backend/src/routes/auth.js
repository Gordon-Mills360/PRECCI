// FILE: precci/backend/src/routes/auth.js
// CUTEME LTD — Authentication Routes
// Supabase Auth integration.
// JWT issuance and refresh.
// Precious owner role guard.
// Provider auth separate from client auth.

'use strict';

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// Public Supabase client for auth operations
function getAnonClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  const { email, password } = sanitiseInput(req.body);

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  try {
    const supabaseAnon = getAnonClient();
    const { data, error } = await supabaseAnon.auth.signUp({ email, password });

    if (error) throw error;

    if (data.user) {
      // Create user record
      const supabase = getServiceClient();
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        plan: 'free',
        plan_status: 'active',
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).catch(() => {}); // May already exist
    }

    res.json({
      success: true,
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session ? {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      } : null,
    });
  } catch (error) {
    logger.error('Signup error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/signin
router.post('/signin', authLimiter, async (req, res) => {
  const { email, password } = sanitiseInput(req.body);

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const supabaseAnon = getAnonClient();
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error) throw error;

    res.json({
      success: true,
      user: { id: data.user?.id, email: data.user?.email },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    logger.error('Signin error', { error: error.message });
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authLimiter, async (req, res) => {
  const { refreshToken } = sanitiseInput(req.body);

  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'refreshToken is required' });
  }

  try {
    const supabaseAnon = getAnonClient();
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });

    if (error) throw error;

    res.json({
      success: true,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({ success: false, error: 'Failed to refresh token' });
  }
});

// POST /api/auth/signout
router.post('/signout', authLimiter, async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  try {
    if (token) {
      const supabaseAnon = getAnonClient();
      await supabaseAnon.auth.signOut();

      // Blacklist the token
      const supabase = getServiceClient();
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await supabase.from('token_blacklist').insert({
        token_hash: tokenHash,
        invalidated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Signout error', { error: error.message });
    res.json({ success: true }); // Always succeed signout
  }
});

// POST /api/auth/provider/signin
// Provider login via email
router.post('/provider/signin', authLimiter, async (req, res) => {
  const { email, password } = sanitiseInput(req.body);

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const supabaseAnon = getAnonClient();
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error) throw error;

    // Verify this email belongs to a provider
    const supabase = getServiceClient();
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id, business_name, active')
      .eq('email', email)
      .single();

    if (!provider) {
      return res.status(403).json({ success: false, error: 'No provider account found for this email. Register at cuteme.com/connect' });
    }

    if (!provider.active) {
      return res.status(403).json({ success: false, error: 'Your provider account is not yet active. Please complete registration.' });
    }

    res.json({
      success: true,
      provider: { id: provider.id, businessName: provider.business_name },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    logger.error('Provider signin error', { error: error.message });
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

module.exports = router;