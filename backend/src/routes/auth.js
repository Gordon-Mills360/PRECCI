// FILE: precci/backend/src/routes/auth.js
// SECURITY: Auth routes — rate limited to 10/15min.
// Passwords hashed with bcrypt. Tokens never logged.
// Supabase Auth used as the identity provider.

'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { getServiceClient } = require('../config/supabase');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  invalidateToken,
  refreshAccessToken,
} = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────
// POST /api/auth/register
// New client registration via Supabase Auth
// Profile created in users table after auth creation
// ─────────────────────────────────────────────
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new PrecciError('VALIDATION_ERROR', 'Email and password are required', 400);
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new PrecciError('VALIDATION_ERROR', 'Invalid email format', 400);
    }

    if (password.length < 8) {
      throw new PrecciError('VALIDATION_ERROR', 'Password must be at least 8 characters', 400);
    }

    const supabase = getServiceClient();

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new PrecciError('VALIDATION_ERROR', 'An account with this email already exists', 409);
      }
      logger.error('Auth registration error', { error: authError.message });
      throw new PrecciError('DATABASE_ERROR', 'Registration failed', 500);
    }

    const userId = authData.user.id;

    // Create user record in users table
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email: email.toLowerCase().trim(),
      plan: 'free',
      plan_status: 'active',
      onboarding_complete: false,
    });

    if (userError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      logger.error('User profile creation failed after auth', { error: userError.message });
      throw new PrecciError('DATABASE_ERROR', 'Account setup failed', 500);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId,
      role: 'client',
      email: email.toLowerCase().trim(),
    });

    const refreshToken = generateRefreshToken({
      userId,
      role: 'client',
    });

    logger.info('New PRECCI client registered', { userId });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        plan: 'free',
        isNewClient: true,
      },
    });
  })
);

// ─────────────────────────────────────────────
// POST /api/auth/login
// Client login — returns JWT pair
// ─────────────────────────────────────────────
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new PrecciError('VALIDATION_ERROR', 'Email and password are required', 400);
    }

    const supabase = getServiceClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError || !authData.user) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid email or password', 401);
    }

    const userId = authData.user.id;

    // Fetch user plan and role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, plan, plan_status, onboarding_complete')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new PrecciError('DATABASE_ERROR', 'Account data not found', 500);
    }

    // Determine role
    let role = 'client';
    if (email.toLowerCase().trim() === process.env.PRECIOUS_EMAIL?.toLowerCase()) {
      role = 'precious_owner';
    }

    const accessToken = generateAccessToken({
      userId,
      role,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId,
      role,
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        onboardingComplete: user.onboarding_complete,
        role,
      },
    });
  })
);

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// Issues new access token from refresh token
// ─────────────────────────────────────────────
router.post('/refresh', refreshAccessToken);

// ─────────────────────────────────────────────
// POST /api/auth/logout
// Invalidates current access token
// ─────────────────────────────────────────────
router.post(
  '/logout',
  verifyToken,
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      await invalidateToken(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

module.exports = router;