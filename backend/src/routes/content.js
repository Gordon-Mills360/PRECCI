// FILE: precci/backend/src/routes/content.js
// CUTEME LTD — Content Routes
// Piper's academy content and daily tips.
// Nina's social media publishing.
// Aurora's community content.
// All content logged to content_log table.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const { generalLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const { processPiperSession } = require('../agents/piper');
const { processNinaSession } = require('../agents/nina');
const { processAuroraSession } = require('../agents/aurora');
const logger = require('../utils/logger');

// POST /api/content/piper/daily-tips
// Internal — n8n triggers this daily at 7:30 AM
router.post('/piper/daily-tips', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { date, userCount } = sanitiseInput(req.body);

  try {
    const result = await processPiperSession({
      sessionType: 'daily_tips_generation',
      transcript: `Generate personalised daily beauty, grooming and style tips for all active CUTEME clients. Today is ${date}. We have ${userCount || 0} active users. Cover skin, hair, makeup, fashion, fragrance and grooming across all genders.`,
      conversationHistory: [],
    });

    // Log to content_log
    await supabase.from('content_log').insert({
      agent_id: 'PC-018',
      platform: 'app',
      type: 'daily_tip',
      caption: result.responseText?.substring(0, 500) || 'Daily tips generated',
      published_at: new Date().toISOString(),
    });

    await supabase.from('alerts').insert({
      type: 'daily_tips_generated',
      message: `Piper: Daily tips generated for ${date}`,
      severity: 'info',
      agent_id: 'PC-018',
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, tipsGenerated: true, tipSummary: result.responseText?.substring(0, 200) });
  } catch (error) {
    logger.error('Piper daily tips error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to generate daily tips' });
  }
});

// POST /api/content/piper/beauty-tip-series
// Internal — n8n triggers after new user onboarding
router.post('/piper/beauty-tip-series', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const { userId, userName, userEmail, beautyProfile, lunaAnalysis, seriesDays = 3 } = sanitiseInput(req.body);

  try {
    const result = await processPiperSession({
      sessionType: 'onboarding_tip_series',
      transcript: `Create a ${seriesDays}-day personalised beauty and appearance tip email series for a new CUTEME client named ${userName || 'our new client'}. 
      Beauty profile: ${beautyProfile ? JSON.stringify(beautyProfile) : 'not yet collected'}.
      Luna's initial analysis: ${lunaAnalysis ? JSON.stringify(lunaAnalysis) : 'not yet available'}.
      Tips should cover: skin, hair, style, grooming and appearance across all relevant categories.
      Make each tip actionable, personalised and motivating.
      Schedule: Day 1 (skin/hair basics), Day 2 (style and grooming), Day 3 (fragrance and full look).
      Their email: ${userEmail}.`,
      conversationHistory: [],
    });

    res.json({ success: true, seriesCreated: true, tipsGenerated: seriesDays });
  } catch (error) {
    logger.error('Piper tip series error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to create tip series' });
  }
});

// POST /api/content/nina/morning-content
// Internal — n8n triggers daily at 7:00 AM
router.post('/nina/morning-content', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { date, platforms, contentThemes } = sanitiseInput(req.body);

  try {
    const result = await processNinaSession({
      sessionType: 'morning_publish',
      transcript: `Publish morning content across all platforms for ${date}. 
      Platforms: ${Array.isArray(platforms) ? platforms.join(', ') : 'instagram, tiktok, pinterest, facebook, youtube'}.
      Themes to cover today: ${Array.isArray(contentThemes) ? contentThemes.join(', ') : 'skin, hair, makeup, style, grooming, fashion, fragrance, body, wellness'}.
      Content must serve ALL genders — include male grooming, women\'s beauty, universal style and fashion content.
      Post at optimal engagement times per platform.
      Use trending hashtags. Maintain CUTEME LTD brand voice.`,
      conversationHistory: [],
    });

    // Log published content
    const platformsArray = Array.isArray(platforms) ? platforms : ['instagram', 'tiktok', 'pinterest', 'facebook', 'youtube'];
    await Promise.all(platformsArray.map(platform =>
      supabase.from('content_log').insert({
        agent_id: 'PC-019',
        platform,
        type: 'morning_post',
        caption: result.responseText?.substring(0, 300) || 'Morning content published',
        published_at: new Date().toISOString(),
      }).catch(() => {})
    ));

    await supabase.from('alerts').insert({
      type: 'nina_morning_publish',
      message: `Nina: Morning content published across ${platformsArray.length} platforms — ${date}`,
      severity: 'info',
      agent_id: 'PC-019',
      metadata: { platforms: platformsArray, date },
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      postsPublished: platformsArray.length,
      platforms: platformsArray,
      summary: result.responseText?.substring(0, 200),
    });
  } catch (error) {
    logger.error('Nina morning content error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to publish morning content' });
  }
});

// POST /api/content/nina/evening-content
// Internal — n8n triggers daily at 9:00 PM
router.post('/nina/evening-content', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { date } = sanitiseInput(req.body);

  try {
    const result = await processNinaSession({
      sessionType: 'evening_publish',
      transcript: `Publish evening content for ${date}. Focus on: nighttime skincare routines, evening grooming, tomorrow\'s outfit inspiration, fragrance for evening occasions, motivational appearance content. Serve all genders. Engage with comments from today\'s morning posts.`,
      conversationHistory: [],
    });

    await supabase.from('content_log').insert({
      agent_id: 'PC-019',
      platform: 'all',
      type: 'evening_post',
      caption: result.responseText?.substring(0, 300) || 'Evening content published',
      published_at: new Date().toISOString(),
    });

    await supabase.from('alerts').insert({
      type: 'nina_evening_publish',
      message: `Nina: Evening content published — ${date}`,
      severity: 'info',
      agent_id: 'PC-019',
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, published: true });
  } catch (error) {
    logger.error('Nina evening content error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to publish evening content' });
  }
});

// POST /api/content/aurora/invite-inner-circle
// Internal — n8n triggers after Glow+ subscription
router.post('/aurora/invite-inner-circle', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const { userId, plan } = sanitiseInput(req.body);

  try {
    const result = await processAuroraSession({
      userId,
      sessionType: 'inner_circle_invitation',
      transcript: `Welcome a new ${plan} member to the CUTEME Inner Circle community. Introduce yourself as Aurora. Explain the Inner Circle benefits: 7-day and 30-day appearance challenges, exclusive weekly content, transformation tracking, community of people on the same appearance journey. Invite them warmly. Tell them their first challenge starts immediately.`,
      conversationHistory: [],
    });

    res.json({ success: true, invited: true });
  } catch (error) {
    logger.error('Aurora invite error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to send invitation' });
  }
});

// GET /api/content/feed
// Content log — for dashboard display
router.get('/feed', verifyJWT, requireRole('precious_owner'), async (req, res) => {
  const supabase = getServiceClient();
  const { platform, type, limit = 50 } = req.query;

  try {
    let query = supabase
      .from('content_log')
      .select('id, agent_id, platform, type, caption, media_url, published_at, engagement')
      .order('published_at', { ascending: false })
      .limit(parseInt(limit));

    if (platform) query = query.eq('platform', platform);
    if (type) query = query.eq('type', type);

    const { data } = await query;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Content feed error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load content feed' });
  }
});

module.exports = router;