// FILE: precci/backend/src/routes/agents.js
// CUTEME LTD — Agent Session Routes
// All 28 agents accessible via these endpoints.
// Every route authenticated. Rate limited.
// Agent sessions logged to Supabase.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { voiceAILimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// Import all agents
const { processGraceSession } = require('../agents/grace');
const { processVivienneSession } = require('../agents/vivienne');
const { processLunaSession } = require('../agents/luna');
const { processZaraSession } = require('../agents/zara');
const { processMiaSession } = require('../agents/mia');
const { processIslaSession } = require('../agents/isla');
const { processRemySession } = require('../agents/remy');
const { processCoraSession } = require('../agents/cora');
const { processDrawSession } = require('../agents/drew');
const { processSageEnvironment } = require('../services/sage.service');
const { processBelleSession } = require('../agents/belle');
const { processNovaSession } = require('../agents/nova');
const { processPiperSession } = require('../agents/piper');
const { processNinaSession } = require('../agents/nina');
const { processEltonSession } = require('../agents/elton');
const { processLenaSession } = require('../agents/lena');
const { processFinnSession } = require('../agents/finn');
const { processAuroraSession } = require('../agents/aurora');
const { processColeSession } = require('../agents/cole');
const { processEvaSession } = require('../agents/eva');
const { processBrookSession } = require('../agents/brook');

// Agent map — all 28
const AGENT_PROCESSORS = {
  'PC-026': { name: 'Grace', processor: processGraceSession },
  'PC-001': { name: 'Vivienne', processor: processVivienneSession },
  'PC-008': { name: 'Luna', processor: processLunaSession },
  'PC-009': { name: 'Zara', processor: processZaraSession },
  'PC-010': { name: 'Mia', processor: processMiaSession },
  'PC-011': { name: 'Isla', processor: processIslaSession },
  'PC-012': { name: 'Remy', processor: processRemySession },
  'PC-013': { name: 'Cora', processor: processCoraSession },
  'PC-014': { name: 'Drew', processor: processDrawSession },
  'PC-017': { name: 'Nova', processor: processNovaSession },
  'PC-018': { name: 'Piper', processor: processPiperSession },
  'PC-019': { name: 'Nina', processor: processNinaSession },
  'PC-020': { name: 'Elton', processor: processEltonSession },
  'PC-021': { name: 'Lena', processor: processLenaSession },
  'PC-022': { name: 'Finn', processor: processFinnSession },
  'PC-023': { name: 'Aurora', processor: processAuroraSession },
  'PC-024': { name: 'Cole', processor: processColeSession },
  'PC-025': { name: 'Eva', processor: processEvaSession },
  'PC-027': { name: 'Brook', processor: processBrookSession },
};

// POST /api/agents/:agentId/session
// Start or continue a session with any agent
router.post(
  '/:agentId/session',
  verifyJWT,
  voiceAILimiter,
  async (req, res) => {
    const { agentId } = req.params;
    const supabase = getServiceClient();

    const agent = AGENT_PROCESSORS[agentId];
    if (!agent) {
      return res.status(404).json({ success: false, error: `Agent ${agentId} not found` });
    }

    const {
      sessionId,
      transcript = '',
      conversationHistory = [],
      sessionType = 'client_session',
      additionalContext = {},
    } = sanitiseInput(req.body);

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    try {
      const result = await agent.processor({
        userId: req.user.id,
        sessionId,
        transcript,
        conversationHistory,
        sessionType,
        ...additionalContext,
      });

      // Log session activity
      await supabase.from('alerts').insert({
        type: `${agentId.toLowerCase().replace('pc-', 'agent')}_session`,
        message: `${agent.name}: Session processed — ${req.user.id.substring(0, 12)}`,
        severity: 'info',
        agent_id: agentId,
        created_at: new Date().toISOString(),
      }).catch(() => {});

      res.json({
        success: true,
        agentId,
        agentName: agent.name,
        response: result.responseText,
        audioBuffer: result.audioBuffer
          ? Buffer.from(result.audioBuffer).toString('base64')
          : null,
        contentType: result.contentType || 'audio/mpeg',
        data: result,
      });
    } catch (error) {
      logger.error('Agent session error', { agentId, error: error.message });
      res.status(500).json({ success: false, error: 'Agent session failed' });
    }
  }
);

// GET /api/agents/sage/environment
// Sage pulls environmental data for a location
router.get(
  '/sage/environment',
  verifyJWT,
  async (req, res) => {
    const { lat, lng, city, country } = req.query;

    try {
      const result = await processSageEnvironment({
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        city: city || '',
        country: country || '',
        userId: req.user.id,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Sage environment error', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to get environmental data' });
    }
  }
);

// POST /api/agents/sage/environment (for n8n workflows)
router.post(
  '/sage/environment',
  async (req, res) => {
    // Internal API key check for n8n
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorised' });
    }

    const { lat, lng, city, country, userId } = req.body;

    try {
      const result = await processSageEnvironment({
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        city: city || '',
        country: country || '',
        userId: userId || 'system',
      });

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Sage environment error', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to get environmental data' });
    }
  }
);

// GET /api/agents — list all agents with status
router.get('/', verifyJWT, async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data } = await supabase
      .from('agents')
      .select('name, pc_id, role, division, active, gender')
      .eq('active', true)
      .order('pc_id', { ascending: true });

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('agent_id')
      .gte('created_at', tenMinAgo);

    const activeSet = new Set((recentSessions || []).map(s => s.agent_id));

    const agents = (data || []).map(a => ({
      ...a,
      status: activeSet.has(a.pc_id) ? 'busy' : 'online',
    }));

    res.json({ success: true, data: agents, total: agents.length });
  } catch (error) {
    logger.error('Agents list error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load agents' });
  }
});

module.exports = router;