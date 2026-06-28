// FILE: precci/backend/src/routes/camera.js
// Camera analysis routes.
// SECURITY: All vision processing server-side only.
// Frames never stored without explicit consent.
// Rate limited to 20 requests per minute.

'use strict';

const express = require('express');
const { captureAndAnalyse } = require('../services/camera.service');
const { getSageDataForSession } = require('../services/sage.service');
const { getServiceClient } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateCameraFrame, cameraLimiter } = require('../middleware/security');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/camera/analyse
// Main camera analysis endpoint
// Validates consent, processes frame, returns analysis
// ─────────────────────────────────────────────
router.post(
  '/analyse',
  verifyToken,
  requireRole(['client']),
  validateCameraFrame,
  asyncHandler(async (req, res) => {
    const { agentId, sessionId } = req.body;
    const userId = req.user.id;

    if (!agentId) {
      throw new PrecciError('VALIDATION_ERROR', 'agentId is required', 400);
    }

    const validAgents = ['PC-008', 'PC-009', 'PC-010', 'PC-011', 'PC-013', 'PC-014', 'PC-016'];
    if (!validAgents.includes(agentId)) {
      throw new PrecciError('VALIDATION_ERROR', 'Invalid agent ID for camera analysis', 400);
    }

    // Load user profile and sage data in parallel
    const supabase = getServiceClient();

    const [profileResult, sageResult] = await Promise.allSettled([
      supabase
        .from('beauty_profiles')
        .select('skin_type, skin_tone, hair_type, skin_concerns, grooming_prefs, appearance_goals')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('users')
        .select('lat, lng')
        .eq('id', userId)
        .single(),
    ]);

    const userProfile = profileResult.status === 'fulfilled'
      ? profileResult.value.data
      : {};

    const userLocation = sageResult.status === 'fulfilled'
      ? sageResult.value.data
      : null;

    // Get Sage environmental data
    let sageData = {};
    if (userLocation?.lat && userLocation?.lng) {
      sageData = await getSageDataForSession(userLocation.lat, userLocation.lng);
    }

    // Run camera analysis
    const analysis = await captureAndAnalyse({
      frameBase64: req.cameraFrame,
      userId,
      agentId,
      userProfile,
      sageData,
    });

    res.json({
      success: true,
      analysis: analysis.analysis,
      metadata: analysis.metadata,
      sageContext: sageData,
      analysedAt: analysis.analysedAt,
    });
  })
);

// ─────────────────────────────────────────────
// POST /api/camera/consent
// Update camera consent for user
// ─────────────────────────────────────────────
router.post(
  '/consent',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { consent } = req.body;

    if (typeof consent !== 'boolean') {
      throw new PrecciError('VALIDATION_ERROR', 'consent must be a boolean', 400);
    }

    const supabase = getServiceClient();

    await supabase
      .from('users')
      .update({
        camera_consent: consent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    res.json({
      success: true,
      cameraConsent: consent,
    });
  })
);

// ─────────────────────────────────────────────
// GET /api/camera/status
// Returns camera system status for Marcus monitoring
// ─────────────────────────────────────────────
router.get(
  '/status',
  verifyToken,
  requireRole(['precious_owner']),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      status: 'operational',
      agents: ['PC-008', 'PC-009', 'PC-010', 'PC-011', 'PC-013', 'PC-014'],
      capabilities: {
        skinAnalysis: true,
        hairAnalysis: true,
        bodyAnalysis: true,
        groomingAnalysis: true,
        virtualTryOn: !!process.env.REPLICATE_API_TOKEN,
      },
    });
  })
);

// ─────────────────────────────────────────────
// POST /api/camera/simulate
// Belle virtual try-on endpoint
// ─────────────────────────────────────────────
router.post(
  '/simulate',
  verifyToken,
  requireRole(['client']),
  validateCameraFrame,
  asyncHandler(async (req, res) => {
    const { lookType, description, sessionId, skinTone, hairType } = req.body;
    const userId = req.user.id;

    if (!lookType || !description) {
      throw new PrecciError('VALIDATION_ERROR', 'lookType and description are required', 400);
    }

    const { generateSimulation } = require('../services/belle.service');

    const simulation = await generateSimulation({
      frameBase64: req.cameraFrame,
      lookData: {
        lookType,
        description,
        skinTone,
        hairType,
        agentId: 'PC-016',
      },
      userId,
      sessionId,
    });

    res.json({
      success: true,
      simulation,
    });
  })
);

// ─────────────────────────────────────────────
// GET /api/camera/simulations
// Returns client's try-on history
// ─────────────────────────────────────────────
router.get(
  '/simulations',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('try_on_history')
      .select('id, look_type, look_description, proxied_url, saved, expires_at, created_at')
      .eq('user_id', req.user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve simulations', 500);
    }

    res.json({
      success: true,
      simulations: data || [],
    });
  })
);

module.exports = router;