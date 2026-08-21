// FILE: precci/backend/src/routes/camera.js
// CUTEME LTD — Camera Analysis Routes
// Receives frames from client PWA.
// Sends to Claude Vision API server-side.
// Returns structured analysis to specialist agents.
// Frames never stored without explicit consent.

'use strict';

const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken } = require('../middleware/auth');
const { cameraLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const { processSageEnvironment } = require('../services/sage.service');
const logger = require('../utils/logger');

// POST /api/camera/analyse
// Receive base64 frame → Claude Vision → return analysis
router.post('/analyse', verifyToken, cameraLimiter, async (req, res) => {
  const supabase = getServiceClient();

  const {
    frameBase64,
    mimeType = 'image/jpeg',
    agentId,
    sessionId,
  } = sanitiseInput(req.body);

  if (!frameBase64) {
    return res.status(400).json({ success: false, error: 'frameBase64 is required' });
  }

  if (!agentId || !sessionId) {
    return res.status(400).json({ success: false, error: 'agentId and sessionId are required' });
  }

  // Validate frame size — max 5MB
  const frameSizeBytes = Buffer.byteLength(frameBase64, 'base64');
  if (frameSizeBytes > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'Frame too large. Maximum 5MB.' });
  }

  // Check camera consent
  const { data: session } = await supabase
    .from('sessions')
    .select('camera_consent')
    .eq('id', sessionId)
    .single();

  const hasConsent = session?.camera_consent !== false;
  if (!hasConsent) {
    return res.status(403).json({ success: false, error: 'Camera consent not given for this session' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Agent-specific vision prompts
    const VISION_PROMPTS = {
      'PC-008': `You are Luna, CUTEME LTD's AI Skin Analyst. Analyse this face image in detail.
        Identify: skin type (oily/dry/combination/normal/sensitive), skin tone, undertone (warm/cool/neutral),
        visible concerns (hyperpigmentation, acne, redness, dryness, dehydration, pores, texture),
        beard area skin condition if present, razor bumps or ingrown hairs if present.
        Return a structured JSON analysis with: skinType, skinTone, undertone, concerns[], hydrationLevel,
        oilinessLevel, beardAreaConcerns, overallCondition, analysisConfidence.`,

      'PC-009': `You are Zara, CUTEME LTD's Hair Expert. Analyse the hair visible in this image.
        Identify: hair type (1A through 4C Andre Walker scale), texture, density, estimated length,
        visible scalp condition, signs of damage or breakage, moisture level, current style.
        For short hair: assess fade quality, haircut shape, neckline condition.
        Return JSON: hairType, texture, density, length, scalpCondition, damageLevel,
        moistureLevel, currentStyle, recommendedStyles[], analysisConfidence.`,

      'PC-010': `You are Mia, CUTEME LTD's Makeup and Grooming specialist. Analyse the facial features visible.
        Identify: face shape, facial proportions, eye shape, lip shape, brow shape, undertone,
        any current makeup or grooming products visible.
        Return JSON: faceShape, eyeShape, lipShape, browShape, undertone,
        currentMakeup, currentGrooming, recommendedLooks[], analysisConfidence.`,

      'PC-011': `You are Isla, CUTEME LTD's Style Advisor. Analyse the body proportions visible in this image.
        Identify: body shape category, visible proportions (shoulder width, waist, hip ratio),
        estimated height category, any visible clothing style currently worn.
        Return JSON: bodyShape, proportions, heightCategory, currentStyle,
        recommendedStyles[], colourSeasonEstimate, analysisConfidence.`,

      'PC-014': `You are Drew, CUTEME LTD's Male Grooming Specialist. Analyse the face and grooming visible.
        Identify: face shape for beard recommendations, beard growth pattern, beard density,
        beard current condition, skin type in beard area, haircut shape if visible.
        Return JSON: faceShape, beardGrowthPattern, beardDensity, beardCondition,
        beardAreaSkinCondition, recommendedBeardStyles[], haircut, analysisConfidence.`,

      'PC-013': `You are Cora, CUTEME LTD's Body Care Specialist. Analyse any visible body skin.
        Identify: visible body skin condition, tone evenness, any areas of dryness or hyperpigmentation.
        Return JSON: skinCondition, toneEvenness, visibleConcerns[], recommendations[], analysisConfidence.`,
    };

    const visionPrompt = VISION_PROMPTS[agentId] ||
      `Analyse this image and describe what you see about the person's appearance relevant to beauty and style. Return structured JSON.`;

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
      max_tokens: parseInt(process.env.CLAUDE_VISION_MAX_TOKENS) || 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: frameBase64,
              },
            },
            {
              type: 'text',
              text: visionPrompt + '\n\nReturn ONLY valid JSON. No markdown. No explanations outside the JSON.',
            },
          ],
        },
      ],
    });

    const analysisText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    let analysisData = {};
    try {
      const cleanJson = analysisText.replace(/```json|```/g, '').trim();
      analysisData = JSON.parse(cleanJson);
    } catch {
      // If JSON parse fails, return raw text
      analysisData = { rawAnalysis: analysisText, parseError: true };
    }

    // Update session with camera_used flag
    await supabase
      .from('sessions')
      .update({
        camera_used: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .catch(() => {});

    // Log camera analysis to alerts feed
    await supabase.from('alerts').insert({
      type: `${agentId.toLowerCase().replace('pc-', 'agent')}_camera_analysis`,
      message: `${agentId}: Camera analysis complete for session ${sessionId.substring(0, 12)}`,
      severity: 'info',
      agent_id: agentId,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    res.json({
      success: true,
      agentId,
      sessionId,
      data: analysisData,
      analysisTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Camera analysis error', { agentId, error: error.message });
    res.status(500).json({ success: false, error: 'Camera analysis failed' });
  }
});

// POST /api/camera/consent
// Record camera consent for a session
router.post('/consent', verifyToken, async (req, res) => {
  const supabase = getServiceClient();
  const { sessionId, consent } = sanitiseInput(req.body);

  if (!sessionId || typeof consent !== 'boolean') {
    return res.status(400).json({ success: false, error: 'sessionId and consent (boolean) required' });
  }

  try {
    await supabase
      .from('sessions')
      .update({
        camera_consent: consent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', req.user.id);

    res.json({ success: true, consent });
  } catch (error) {
    logger.error('Camera consent error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

module.exports = router;