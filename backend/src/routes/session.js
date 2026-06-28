// FILE: precci/backend/src/routes/session.js
// Appearance session management routes.
// SECURITY: Users access only their own sessions.
// Camera frames never stored without consent.

'use strict';

const express = require('express');
const { getServiceClient } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/sessions
// Creates a new appearance session
// ─────────────────────────────────────────────
router.post(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const { agentId, channel = 'pwa', cameraConsent = false } = req.body;

    if (!agentId) {
      throw new PrecciError('VALIDATION_ERROR', 'agentId is required', 400);
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: req.user.id,
        agent_id: agentId,
        channel,
        camera_consent: cameraConsent,
        camera_used: false,
        completed: false,
        recommendations: [],
      })
      .select('id, agent_id, channel, created_at')
      .single();

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to create session', 500);
    }

    res.status(201).json({ success: true, session: data });
  })
);

// ─────────────────────────────────────────────
// PATCH /api/sessions/:id/complete
// Marks a session as completed with recommendations
// ─────────────────────────────────────────────
router.patch(
  '/:id/complete',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const { recommendations = [], sageData = null, durationSeconds = null } = req.body;

    // Verify session belongs to this user
    const { data: existing } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      throw new PrecciError('NOT_FOUND', 'Session not found', 404);
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({
        completed: true,
        recommendations,
        sage_data: sageData,
        duration_seconds: durationSeconds,
      })
      .eq('id', req.params.id)
      .select('id, completed, created_at')
      .single();

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to complete session', 500);
    }

    res.json({ success: true, session: data });
  })
);

// ─────────────────────────────────────────────
// GET /api/sessions/:id
// Returns a specific session — user must own it
// ─────────────────────────────────────────────
router.get(
  '/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('sessions')
      .select(
        `id, agent_id, channel, duration_seconds,
         camera_used, recommendations, sage_data,
         completed, created_at`
      )
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      throw new PrecciError('NOT_FOUND', 'Session not found', 404);
    }

    res.json({ success: true, session: data });
  })
);

module.exports = router;