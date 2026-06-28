// FILE: precci/backend/src/routes/agents.js
// Agent status and info routes.
// SECURITY: System prompts never returned to any client.
// Agent list readable by authenticated users for routing context.

'use strict';

const express = require('express');
const { getServiceClient } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/agents
// Returns all active agents — safe fields only
// system_prompt never returned
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
// Returns status of all 28 agents
// Used by Precious's dashboard — precious_owner only
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

    // Get session counts per agent for performance data
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
// Returns single agent info — safe fields only
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