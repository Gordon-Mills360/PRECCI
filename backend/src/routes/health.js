// FILE: precci/backend/src/routes/health.js
'use strict';

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Basic health — check Supabase only
    const { getServiceClient } = require('../config/supabase');
    let supabaseStatus = 'error';

    try {
      const supabase = getServiceClient();
      const { error } = await supabase.from('agents').select('id').limit(1);
      supabaseStatus = error ? 'error' : 'connected';
    } catch {
      supabaseStatus = 'error';
    }

    const elevenLabsStatus = process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_API_KEY.includes('placeholder') ? 'configured' : 'not_configured';
    const vapiStatus = process.env.VAPI_API_KEY && !process.env.VAPI_API_KEY.includes('placeholder') ? 'configured' : 'not_configured';
    const anthropicStatus = process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured';

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        supabase: supabaseStatus,
        anthropic: anthropicStatus,
        elevenlabs: elevenLabsStatus,
        vapi: vapiStatus,
      },
    });
  } catch (error) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Backend running',
    });
  }
});

module.exports = router;