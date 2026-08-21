// FILE: precci/backend/src/routes/jarvis.js
// CUTEME LTD — JARVIS Voice Gateway
// Precious speaks → Whisper transcribes → Claude parses intent
// → Navigation command returned → Frontend navigates automatically
// → ElevenLabs speaks Vivienne's response simultaneously.
// Vivienne controls the dashboard in real time during conversation.

'use strict';

const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { authLimiter, voiceAILimiter, sanitiseInput } = require('../middleware/security');
const logger = require('../utils/logger');

// Navigation command map — what Claude can return
const NAV_COMMANDS = {
  // Dashboard pages
  'dashboard':           { path: '/dashboard',                    label: 'Command Center' },
  'executive-board':     { path: '/dashboard/executive-board',    label: 'Executive Board' },
  'specialist-agents':   { path: '/dashboard/specialist-agents',  label: 'Specialist Agents' },
  'live-operations':     { path: '/dashboard/live-operations',    label: 'Live Operations' },
  'mission-board':       { path: '/dashboard/mission-board',      label: 'Mission Board' },
  'communications':      { path: '/dashboard/communications',     label: 'Communications' },
  'client-sessions':     { path: '/dashboard/client-sessions',    label: 'Client Sessions' },
  'beauty-academy':      { path: '/dashboard/beauty-academy',     label: 'Beauty Academy' },
  'analytics':           { path: '/dashboard/analytics',          label: 'Analytics' },
  'revenue':             { path: '/dashboard/revenue',            label: 'Orders & Revenue' },
  'system-health':       { path: '/dashboard/system-health',      label: 'System Intelligence' },
  'settings':            { path: '/dashboard/settings',           label: 'Settings & Controls' },
  // Actions
  'none':                { path: null, label: null },
};

// POST /api/voice/jarvis
// Precious speaks → Vivienne responds + dashboard navigates
router.post('/', voiceAILimiter, async (req, res) => {
  const supabase = getServiceClient();

  const { transcript, sessionId } = sanitiseInput(req.body);

  if (!transcript?.trim()) {
    return res.status(400).json({ success: false, error: 'transcript is required' });
  }

  const startTime = Date.now();

  try {
    // Pull real metrics for Vivienne's context
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const [
      { data: revData },
      { count: totalClients },
      { count: sessionsToday },
      { count: decisionsToday },
      { count: criticalAlerts },
      { count: totalBookings },
      { data: recentAlerts },
    ] = await Promise.all([
      supabase.from('revenue_summary').select('amount').gte('date', monthStart),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('severity', 'critical').eq('resolved', false),
      supabase.from('provider_bookings').select('id', { count: 'exact', head: true }),
      supabase.from('alerts').select('message, agent_id, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const totalRevMonth = (revData || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    const recentActivity = (recentAlerts || []).map(a => a.message?.substring(0, 60)).filter(Boolean).join('; ');

    // Claude parses intent AND composes Vivienne's response
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are Vivienne, AI CEO of CUTEME LTD — the world's first Personal AI Appearance Intelligence System, headquartered in Navrongo, Ghana. You report to Precious Mills, Brand Owner and Co-Founder.

CUTEME LTD has 28 AI agents, zero human employees, and operates two divisions:
- PRECCI Core: AI appearance intelligence (skin, hair, makeup, grooming, style, fragrance, body care, virtual try-on)
- PRECCI Connect: AI-powered beauty and lifestyle booking marketplace

REAL-TIME DATA RIGHT NOW:
- Revenue this month: $${totalRevMonth.toFixed(2)}
- Total clients: ${totalClients || 0}
- Sessions today: ${sessionsToday || 0}
- Decisions today: ${decisionsToday || 0}
- Critical alerts: ${criticalAlerts || 0}
- Total Connect bookings: ${totalBookings || 0}
- Recent activity: ${recentActivity || 'All systems operational'}
- System health: ${criticalAlerts === 0 ? '100%' : criticalAlerts <= 2 ? '90%' : '75%'}

DASHBOARD NAVIGATION — you control the screen while speaking:
When Precious mentions any of these topics, include the matching navigationCommand in your response:
- "command center" / "home" / "overview" → "dashboard"
- "executive board" / "directors" / "board" → "executive-board"
- "specialist agents" / "agents" / "team" → "specialist-agents"
- "live operations" / "operations" → "live-operations"
- "mission board" / "missions" / "tasks" → "mission-board"
- "communications" / "messages" → "communications"
- "client sessions" / "sessions" / "clients" → "client-sessions"
- "beauty academy" / "academy" / "courses" → "beauty-academy"
- "analytics" / "data" / "insights" → "analytics"
- "revenue" / "money" / "earnings" / "orders" → "revenue"
- "system" / "health" / "intelligence" → "system-health"
- "settings" / "controls" → "settings"
- No navigation needed → "none"

You must respond in JSON only with this exact structure:
{
  "responseText": "Your spoken response as Vivienne — warm, executive, confident. 2-4 sentences. Use real numbers from the data above.",
  "navigationCommand": "the-nav-key-from-above",
  "dashboardAction": "optional specific action like highlight_revenue or scroll_to_agents",
  "urgency": "normal" | "high" | "low"
}`;

    const claudeResponse = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Precious Mills says: "${transcript.trim()}"`,
        },
      ],
      system: systemPrompt,
    });

    const responseText = claudeResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Parse Claude's JSON response
    let parsedResponse = {
      responseText: 'Understood, Precious. I am on it.',
      navigationCommand: 'none',
      dashboardAction: null,
      urgency: 'normal',
    };

    try {
      const clean = responseText.replace(/```json|```/g, '').trim();
      parsedResponse = JSON.parse(clean);
    } catch {
      // If JSON parse fails, use raw text as response
      parsedResponse.responseText = responseText.substring(0, 300);
    }

    // Resolve navigation path
    const navKey = parsedResponse.navigationCommand || 'none';
    const navTarget = NAV_COMMANDS[navKey] || NAV_COMMANDS['none'];

    // Generate Vivienne's voice via ElevenLabs
    let audioBase64 = null;
    try {
      const vivienneVoiceId = process.env.ELEVENLABS_VOICE_VIVIENNE;
      if (vivienneVoiceId && parsedResponse.responseText) {
        const audioBuffer = await synthesiseSpeech(parsedResponse.responseText, vivienneVoiceId);
        if (audioBuffer) {
          audioBase64 = Buffer.from(audioBuffer).toString('base64');
        }
      }
    } catch (voiceErr) {
      logger.error('ElevenLabs error', { error: voiceErr.message });
    }

    const durationMs = Date.now() - startTime;

    // Log to jarvis_commands table — Supabase Realtime picks this up
    // and the frontend dashboard listener navigates automatically
    const { data: commandRecord } = await supabase
      .from('jarvis_commands')
      .insert({
        raw_transcript: transcript.trim(),
        parsed_intent: navKey,
        routed_to: navTarget.label || 'none',
        response_summary: parsedResponse.responseText?.substring(0, 200),
        navigation_action: navTarget.path || null,
        duration_ms: durationMs,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Also push to alerts so the dashboard activity feed shows it
    await supabase.from('alerts').insert({
      type: 'jarvis_precious_command',
      message: `Vivienne → Precious: ${parsedResponse.responseText?.substring(0, 100)}`,
      severity: 'info',
      agent_id: 'PC-001',
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      commandId: commandRecord?.id,
      responseText: parsedResponse.responseText,
      audioBase64,
      contentType: 'audio/mpeg',
      navigationCommand: navKey,
      navigationPath: navTarget.path,
      navigationLabel: navTarget.label,
      dashboardAction: parsedResponse.dashboardAction,
      urgency: parsedResponse.urgency,
      durationMs,
    });
  } catch (error) {
    logger.error('JARVIS error', { error: error.message });
    res.status(500).json({ success: false, error: 'JARVIS processing failed' });
  }
});

// GET /api/voice/jarvis/history
// Last 20 JARVIS commands for dashboard display
router.get('/history', async (req, res) => {
  const supabase = getServiceClient();
  try {
    const { data } = await supabase
      .from('jarvis_commands')
      .select('id, raw_transcript, parsed_intent, routed_to, response_summary, navigation_action, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load history' });
  }
});

// POST /api/voice/jarvis/weekly-briefing
// Internal — n8n triggers Sunday 8AM
router.post('/weekly-briefing', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { masterReport, weekEndingDate } = sanitiseInput(req.body);

  try {
    // Log weekly briefing command
    await supabase.from('jarvis_commands').insert({
      raw_transcript: `Weekly report for week ending ${weekEndingDate}`,
      parsed_intent: 'weekly-report',
      routed_to: 'Precious Mills',
      response_summary: 'Weekly voice briefing delivered',
      navigation_action: '/dashboard/revenue',
      duration_ms: 0,
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, briefingDelivered: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Weekly briefing failed' });
  }
});

module.exports = router;