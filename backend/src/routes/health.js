// FILE: precci/backend/src/routes/health.js
// Health check endpoint — used by Render and Uptime Robot.
// No authentication required. Returns service status.

'use strict';

const express = require('express');
const { checkSupabaseHealth } = require('../config/supabase');
const { checkElevenLabsHealth } = require('../config/elevenlabs');
const { checkVapiHealth } = require('../config/vapi');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [supabaseHealth, elevenLabsHealth, vapiHealth] = await Promise.allSettled([
      checkSupabaseHealth(),
      checkElevenLabsHealth(),
      checkVapiHealth(),
    ]);

    const services = {
      supabase: supabaseHealth.value?.healthy ? 'connected' : 'error',
      elevenlabs: elevenLabsHealth.value?.healthy ? 'connected' : 'error',
      vapi: vapiHealth.value?.healthy ? 'connected' : 'error',
    };

    const allHealthy = Object.values(services).every(s => s === 'connected');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services,
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;