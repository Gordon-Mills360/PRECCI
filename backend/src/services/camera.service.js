// FILE: precci/backend/src/services/camera.service.js
// SECURITY: Camera frames never stored without explicit consent.
// All Claude Vision calls server-side only.
// Frame data sanitised and size-validated before any processing.
// Timeout enforced on all vision calls.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const sharp = require('sharp');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// AGENT-SPECIFIC VISION PROMPTS
// Each agent receives a prompt tuned to their domain
// These are not hardcoded rules — they instruct Claude
// Vision what to observe and return as structured data.
// Claude reasons independently from what it sees.
// ─────────────────────────────────────────────
function buildVisionPrompt(agentId, userProfile = {}, sageData = {}) {
  const environmentContext = sageData?.summary
    ? `\n\nCURRENT ENVIRONMENTAL CONDITIONS:\n${sageData.summary}`
    : '';

  const profileContext = userProfile
    ? `\n\nCLIENT PROFILE CONTEXT:\nSkin type: ${userProfile.skin_type || 'unknown'}\nHair type: ${userProfile.hair_type || 'unknown'}\nKnown concerns: ${userProfile.skin_concerns?.join(', ') || 'none recorded'}`
    : '';

  const prompts = {
    'PC-008': `You are Luna, PRECCI's AI Skin Analyst. Analyse this client's face and skin in complete detail.

Examine and report on every visible skin characteristic:
- Skin type (oily/dry/combination/normal/sensitive) with specific evidence from what you see
- Skin tone and undertone (warm/cool/neutral) with confidence level
- Pore size and visibility across different facial zones
- Hydration level — look for dehydration lines, tight appearance, plumpness
- Oil levels — shine patterns, T-zone vs cheek differences
- Hyperpigmentation — dark spots, uneven tone, sun damage, post-acne marks, their location and severity
- Redness — rosacea signs, sensitivity areas, irritation zones
- Texture — smoothness, roughness, bumps, pitted areas
- Active acne — type, location, severity, surrounding inflammation
- Fine lines and wrinkles — location, depth, type (expression lines vs damage)
- Under-eye area — dark circles (colour: blue/purple/brown), puffiness, hollowness
- Lip condition — dryness, chapping, colour, symmetry
- Beard area concerns if visible — razor bumps, ingrown hairs, irritation, dryness
- Overall skin health assessment${environmentContext}${profileContext}

Return a detailed JSON object with all findings. Be specific about locations on the face. Be clinical and precise. Do not generalise.`,

    'PC-009': `You are Zara, PRECCI's Hair Expert. Analyse this client's hair in complete detail.

Examine and report on every visible hair characteristic:
- Hair type on the Andre Walker scale: 1A/1B/1C (straight), 2A/2B/2C (wavy), 3A/3B/3C (curly), 4A/4B/4C (coily) — be specific
- Texture: fine/medium/coarse — assess individual strand appearance
- Density: thin/medium/thick — assess fullness and coverage
- Porosity indicators: shine level, frizz pattern, how light reflects
- Current length: estimate in inches or cm
- Current style and condition
- Scalp condition: visible dryness, oiliness, flaking, redness
- Breakage patterns: look at ends, mid-shaft, edges
- Damage indicators: split ends, colour damage, heat damage, chemical processing signs
- Natural growth pattern and hairline shape
- For shorter hair: fade condition, line freshness, style suitability for face shape${environmentContext}${profileContext}

Return a detailed JSON object. Note the face shape as it determines hairstyle recommendations.`,

    'PC-010': `You are Mia, PRECCI's Makeup and Grooming Appearance specialist. Analyse this client's facial structure and features.

Examine and report on:
- Face shape: oval/round/square/heart/oblong/diamond — provide specific measurements evidence
- Facial symmetry assessment
- Eye shape: almond/round/hooded/monolid/downturned/upturned — be precise
- Eye spacing: close-set/average/wide-set
- Eyebrow shape, fullness, and arch — current condition
- Nose shape and proportions
- Lip shape: full/thin/average — upper vs lower lip ratio
- Jawline definition: strong/soft/angular
- Cheekbone prominence
- Forehead proportions
- Skin undertone for foundation matching: warm/cool/neutral with confidence
- Current skin condition affecting makeup application
- Any grooming concerns: uneven brows, stray hairs, skin texture issues affecting coverage${environmentContext}${profileContext}

Return a detailed JSON object. These measurements drive precise makeup recommendations.`,

    'PC-011': `You are Isla, PRECCI's Style and Outfit Advisor. Analyse this client's body type and proportions.

Examine and report on:
- Body type classification: pear/apple/hourglass/rectangle/inverted triangle — provide visual evidence
- Shoulder width relative to hips
- Waist definition visibility
- Hip prominence
- Height estimation from proportions if possible
- Neck length: short/average/long
- Arm length proportions
- Overall silhouette and how clothing currently falls
- Colouring contrast level: low/medium/high (affects colour palette recommendations)
- Current outfit notes (fabric weight, fit, style direction)
- Any proportion balancing opportunities${environmentContext}${profileContext}

Return a detailed JSON object. These proportions determine which silhouettes, cuts and colours will work best.`,

    'PC-014': `You are Drew, PRECCI's Male Grooming Specialist. Analyse this client's face, beard and grooming status.

Examine and report on:
- Face shape for beard and haircut recommendations: oval/square/round/oblong/diamond/heart/triangle
- Current beard: present/absent, current length estimate, style (full/goatee/stubble/clean-shaven)
- Beard condition if present: even growth, patches, density, neckline definition, shape
- Beard skin condition: dryness, ingrown hairs visible, razor bumps, irritation
- Skin type and concerns (male-specific): oiliness in T-zone, razor burn areas, coarse texture
- Hair type and current cut: length, style, fade level if present, condition
- Hairline shape and recession if any
- Grooming standard: well-maintained/needs attention areas
- Eyebrow condition: grooming needs
- Overall masculine grooming assessment${environmentContext}${profileContext}

Return a detailed JSON object. These findings drive precise beard shaping, haircut and skincare recommendations for this specific man.`,
  };

  return prompts[agentId] || prompts['PC-008'];
}

// ─────────────────────────────────────────────
// PRE-PROCESS FRAME
// Normalises image before sending to Claude Vision
// ─────────────────────────────────────────────
async function preprocessFrame(frameBase64) {
  try {
    const imageBuffer = Buffer.from(frameBase64, 'base64');

    const processedBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(processedBuffer).metadata();

    return {
      processedBase64: processedBuffer.toString('base64'),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: processedBuffer.length,
      },
    };
  } catch (error) {
    logger.error('Frame preprocessing failed', { error: error.message });
    throw new Error('Failed to process camera frame');
  }
}

// ─────────────────────────────────────────────
// ANALYSE WITH CLAUDE VISION
// Sends frame to Claude API with agent-specific prompt
// Claude reasons independently from what it sees
// Returns structured analysis object
// ─────────────────────────────────────────────
async function analyseWithClaude(frameBase64, agentId, userProfile, sageData) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildVisionPrompt(agentId, userProfile, sageData);

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: frameBase64,
            },
          },
          {
            type: 'text',
            text: prompt + '\n\nReturn your complete analysis as a valid JSON object only. No preamble. No explanation outside the JSON.',
          },
        ],
      },
    ],
    timeout: 30000,
  });

  const responseText = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Parse JSON from Claude's response
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in vision response');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Failed to parse Claude Vision response', {
      agentId,
      error: error.message,
    });
    // Return raw text if JSON parsing fails
    return { raw_analysis: responseText, parse_error: true };
  }
}

// ─────────────────────────────────────────────
// CAPTURE AND ANALYSE
// Main function called by camera routes
// Full pipeline: validate → consent → preprocess → analyse
// ─────────────────────────────────────────────
async function captureAndAnalyse({
  frameBase64,
  userId,
  agentId,
  userProfile = {},
  sageData = {},
}) {
  const supabase = getServiceClient();

  // Check camera consent
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('camera_consent, plan')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  if (!user.camera_consent) {
    throw new Error('Camera consent not given — cannot analyse');
  }

  // Validate frame
  if (!frameBase64 || typeof frameBase64 !== 'string') {
    throw new Error('Invalid camera frame');
  }

  const sizeBytes = Buffer.byteLength(frameBase64, 'base64');
  if (sizeBytes > 5 * 1024 * 1024) {
    throw new Error('Camera frame exceeds 5MB limit');
  }

  // Preprocess
  const { processedBase64, metadata } = await preprocessFrame(frameBase64);

  // Analyse with Claude Vision
  const analysis = await analyseWithClaude(
    processedBase64,
    agentId,
    userProfile,
    sageData
  );

  logger.info('Camera analysis complete', {
    agentId,
    userId,
    imageSize: metadata,
  });

  return {
    analysis,
    metadata,
    agentId,
    analysedAt: new Date().toISOString(),
  };
}

module.exports = {
  captureAndAnalyse,
  analyseWithClaude,
  preprocessFrame,
  buildVisionPrompt,
};