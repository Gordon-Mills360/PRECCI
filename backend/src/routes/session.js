// FILE: precci/backend/src/routes/session.js
// CUTEME LTD — Session Management Routes
// Create, update and close client sessions.
// All session data stored in Supabase.
// Sage data attached to every session.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { generalLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

router.use(verifyJWT);
router.use(generalLimiter);

// POST /api/session/start
router.post('/start', async (req, res) => {
  const supabase = getServiceClient();
  const { sessionId, agentId = 'PC-026', channel = 'pwa' } = sanitiseInput(req.body);

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId is required' });
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: req.user.id,
        agent_id: agentId,
        channel,
        camera_used: false,
        completed: false,
        created_at: new Date().toISOString(),
      })
      .select('id, created_at')
      .single();

    if (error) throw error;

    res.json({ success: true, sessionId: data.id, startedAt: data.created_at });
  } catch (error) {
    logger.error('Session start error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

// PATCH /api/session/:sessionId
// Update session — agent change, sage data, camera status
router.patch('/:sessionId', async (req, res) => {
  const supabase = getServiceClient();
  const { sessionId } = req.params;
  const updates = sanitiseInput(req.body);

  const allowedFields = ['agent_id', 'camera_used', 'camera_consent', 'sage_data', 'recommendations'];
  const safeUpdates = {};
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  });

  safeUpdates.updated_at = new Date().toISOString();

  try {
    await supabase
      .from('sessions')
      .update(safeUpdates)
      .eq('id', sessionId)
      .eq('user_id', req.user.id);

    res.json({ success: true });
  } catch (error) {
    logger.error('Session update error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to update session' });
  }
});

// POST /api/session/:sessionId/complete
// Mark session as completed
router.post('/:sessionId/complete', async (req, res) => {
  const supabase = getServiceClient();
  const { sessionId } = req.params;

  try {
    const completedAt = new Date();

    // Get session start time to calculate duration
    const { data: session } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    const durationSeconds = session?.created_at
      ? Math.round((completedAt - new Date(session.created_at)) / 1000)
      : null;

    await supabase
      .from('sessions')
      .update({
        completed: true,
        duration_seconds: durationSeconds,
        updated_at: completedAt.toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', req.user.id);

    res.json({ success: true, durationSeconds });
  } catch (error) {
    logger.error('Session complete error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to complete session' });
  }
});

// GET /api/session/history
// Client's session history
router.get('/history', async (req, res) => {
  const supabase = getServiceClient();
  const { limit = 20, offset = 0 } = req.query;

  try {
    const { data, count } = await supabase
      .from('sessions')
      .select('id, agent_id, channel, duration_seconds, camera_used, completed, created_at', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    res.json({ success: true, data: data || [], total: count || 0 });
  } catch (error) {
    logger.error('Session history error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load session history' });
  }
});

module.exports = router;