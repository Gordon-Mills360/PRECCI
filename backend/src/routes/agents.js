// FILE: precci/backend/src/routes/agents.js
// Agent routes — status, info and session processing.
// SECURITY: System prompts never returned. Session data scoped to user.

'use strict';

const express = require('express');
const { getServiceClient } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// AGENT SESSION ROUTER
// Routes voice session to correct agent processor
// ─────────────────────────────────────────────
async function routeToAgentProcessor(agentId, sessionData) {
  switch (agentId) {
    case 'PC-008': {
      const { processLunaSession } = require('./luna');
      return await processLunaSession(sessionData);
    }
    case 'PC-009': {
      const { processZaraSession } = require('./zara');
      return await processZaraSession(sessionData);
    }
    case 'PC-010': {
      const { processMiaSession } = require('./mia');
      return await processMiaSession(sessionData);
    }
    case 'PC-011': {
      const { processIslaSession } = require('./isla');
      return await processIslaSession(sessionData);
    }
    case 'PC-014': {
      const { processDrawSession } = require('./drew');
      return await processDrawSession(sessionData);
    }
    case 'PC-017': {
      const { processNovaRequest } = require('./nova');
      return await processNovaRequest(sessionData);
    }
    case 'PC-026': {
      const { processGraceRequest } = require('./grace');
      return await processGraceRequest(sessionData);
    }
    case 'PC-001': {
      const { processVivienneRequest } = require('./vivienne');
      return await processVivienneRequest(sessionData);
    }
    default:
      throw new Error(`No processor found for agent: ${agentId}`);
  }
}

// ─────────────────────────────────────────────
// POST /api/agents/:pcId/session
// Process a voice session with a specific agent
// ─────────────────────────────────────────────
router.post(
  '/:pcId/session',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { pcId } = req.params;
    const {
      transcript,
      sessionId,
      currentFrame,
      clientLocation,
      conversationHistory = [],
    } = req.body;

    const userId = req.user.id;

    if (!transcript) {
      throw new PrecciError('VALIDATION_ERROR', 'transcript is required', 400);
    }

    // Load user profile
    const supabase = getServiceClient();
    const { data: userProfile } = await supabase
      .from('beauty_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const sessionData = {
      userId,
      sessionId,
      transcript,
      currentFrame: currentFrame || null,
      clientLocation: clientLocation || null,
      userProfile: userProfile || {},
      conversationHistory,
    };

    const result = await routeToAgentProcessor(pcId, sessionData);

    // Stream audio back with metadata headers
    res.set({
      'Content-Type': result.contentType || 'audio/mpeg',
      'X-Agent-Response-Text': encodeURIComponent(
        (result.responseText || '').substring(0, 500)
      ),
      'X-Pending-Simulation': result.pendingSimulation
        ? encodeURIComponent(JSON.stringify(result.pendingSimulation))
        : '',
      'X-Nova-Request': result.novaRequest
        ? encodeURIComponent(JSON.stringify(result.novaRequest))
        : '',
    });

    res.send(result.audioBuffer);
  })
);

// ─────────────────────────────────────────────
// GET /api/agents
// Returns all active agents — safe fields only
// ─────────────────────────────────────────────
router.get(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('agents')
      .select('id, name, role, pc_id, gender, division, active')
      .eq('active', true)
      .order('pc_id');

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve agents', 500);
    }

    res.json({ success: true, agents: data || [] });
  })
);

// ─────────────────────────────────────────────
// GET /api/agents/status
// All 28 agents status — precious_owner only
// ─────────────────────────────────────────────
router.get(
  '/status',
  verifyToken,
  requireRole(['precious_owner']),
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, role, pc_id, gender, division, active, updated_at')
      .order('division')
      .order('pc_id');

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve agent status', 500);
    }

    const { data: sessionCounts } = await supabase
      .from('sessions')
      .select('agent_id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const countMap = {};
    if (sessionCounts) {
      for (const s of sessionCounts) {
        countMap[s.agent_id] = (countMap[s.agent_id] || 0) + 1;
      }
    }

    const agentsWithStatus = (agents || []).map(agent => ({
      ...agent,
      sessionsToday: countMap[agent.pc_id] || 0,
      status: agent.active ? 'active' : 'inactive',
    }));

    res.json({ success: true, agents: agentsWithStatus });
  })
);

// ─────────────────────────────────────────────
// GET /api/agents/:pcId
// Single agent info — safe fields only
// ─────────────────────────────────────────────
router.get(
  '/:pcId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('agents')
      .select('id, name, role, pc_id, gender, division, active')
      .eq('pc_id', req.params.pcId)
      .single();

    if (error || !data) {
      throw new PrecciError('NOT_FOUND', 'Agent not found', 404);
    }

    res.json({ success: true, agent: data });
  })
);

module.exports = router;