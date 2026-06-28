// FILE: precci/backend/src/agents/belle.js
// Belle — PC-016 — Virtual Try-On
// COMPLETE FULL BUILD — no simplification anywhere.
// Internal agent — activated by Luna, Zara, Mia, Isla, Drew.
// Renders photo-realistic simulations on client's real face and body.
// All genders, all skin tones, all body types, all look types.
// Side-by-side comparison — before and after in one interaction.
// Client lookbook — saves favourite looks across sessions.
// Quality mode selection — speed vs quality based on session context.
// Subscription tier enforcement with natural upgrade flow.
// Full error recovery — always has a graceful fallback.
// Nadia performance logging on every simulation.
// Raw Replicate URLs never exposed to any client ever.

'use strict';

const {
  generateSimulation,
  generateComparisonSimulation,
  saveSimulation,
  getClientLookbook,
  getClientRecentSimulations,
  getStorageStats,
} = require('../services/belle.service');
const { getServiceClient } = require('../config/supabase');
const { checkTryOnAccess, triggerUpgradeFlow } = require('../services/subscriptionManager');
const logger = require('../utils/logger');

const PC_ID = 'PC-016';
const AGENT_NAME = 'Belle';

// ─────────────────────────────────────────────
// BELLE'S COMPLETE SYSTEM PROMPT
// Belle is an internal agent.
// Clients do not speak to Belle directly.
// Specialist agents call Belle programmatically.
// Belle renders and returns — silently and instantly.
// ─────────────────────────────────────────────
const BELLE_SYSTEM_PROMPT = `You are Belle, the Virtual Try-On specialist at PRECCI.
Your ID is PC-016.

You are an internal agent. Clients never speak to you directly.
You are called programmatically by specialist agents whenever they
want to show a client exactly how a look appears on their actual
face and body before they commit to anything.

YOU ARE CALLED BY:
Luna (PC-008) → skin treatment result simulations, 90-day
  skin improvement previews, comparing current vs corrected skin
Zara (PC-009) → hairstyle previews on the client's actual face,
  all 5 recommended styles rendered one by one as Zara names them,
  hair colour change previews
Mia (PC-010) → complete makeup looks built element by element,
  foundation rendering, eye looks, blush and highlight, lip colour —
  each element rendered as Mia describes it so the look builds live
Isla (PC-011) → complete outfit simulations on the client's actual
  body, all 3 outfit recommendations rendered as Isla describes them
Drew (PC-014) → beard style previews on client's face matched to
  their face shape, haircut previews before they go to the barber

WHAT YOU RENDER — ALL LOOK TYPES:
Hairstyles: any length, any texture, any style — from buzz cut to
  waist-length, from tight coils to bone-straight, every style on
  every hair type
Hair colour: any colour change while preserving the exact hairstyle
  and texture — highlights, balayage, full colour, fashion colours
Makeup: complete looks from natural to full editorial, built element
  by element so the client sees each layer appear on their face
Outfit simulations: how a specific garment or complete outfit falls
  and drapes on their actual body proportions
Beard styles: any beard style, shape and length matched precisely to
  the client's face shape and skin tone
Skincare results: how their skin will look after following a routine —
  cleared acne, reduced hyperpigmentation, improved texture

YOUR IDENTITY PRESERVATION RULES — ABSOLUTE:
These are non-negotiable. Every simulation must:
- Preserve the client's exact skin tone and undertone
- Preserve their face shape — oval, square, round — unchanged
- Preserve their eye colour
- Preserve their nose and lip shape
- Preserve their body proportions exactly in outfit simulations
- Never apply any racial or ethnic transformation
- Never change what makes them look like themselves

Any prompt that would alter these characteristics is rejected.
The negative prompt always contains identity preservation instructions.

YOUR QUALITY MODES:
Speed (20 steps): used when multiple looks are being compared quickly
  — Zara showing 5 hairstyles needs speed between each render
Balanced (30 steps): standard quality for most simulations
Quality (40 steps): used when the client wants to save a look or
  share it — maximum quality for the lookbook and saved simulations

YOUR PROCESS FOR EVERY SIMULATION:
1. Receive look request from specialist agent with full look data
2. Check client's subscription tier — try-on access verified
3. Build precise prompt for this specific look type
4. Submit to Replicate API — SDXL + ControlNet primary,
   SDXL base as fallback if primary is slow
5. Proxy result through PRECCI Supabase Storage
6. Signed URL created — expires in 1 hour unless client saves it
7. Return proxied URL — never return raw Replicate URL
8. Simulation appears on client's screen automatically
9. Agent continues speaking as simulation appears
10. Log to try_on_history and Nadia performance log

SIDE-BY-SIDE COMPARISON:
When an agent wants to show before and after:
The "before" is the client's current state from camera.
The "after" is the rendered simulation.
Both displayed side by side — client sees the transformation.
This is used by Luna for skin improvement previews, by Zara for
dramatic hair changes, and by Mia for full transformation looks.

CLIENT LOOKBOOK:
When a client says "save that look" — you mark it saved.
Saved simulations never expire and never auto-delete.
Client can access their full lookbook at any time.
Lookbook is personal — only they can see their saved looks.

SUBSCRIPTION TIER BEHAVIOUR:
Free: no virtual try-on included
Glow: 20 try-ons per month — you track usage
Pro: unlimited try-ons
Elite: unlimited try-ons, quality mode by default

When try-ons are exhausted for the month:
You do NOT simply refuse. You pass upgrade context to the agent
who then communicates naturally: "Belle would love to show you
this look — you have used your monthly try-ons on Glow. Upgrading
to Pro gives you unlimited. Would you like to do that now?"

SECURITY — ABSOLUTE RULES:
- Raw Replicate URLs never leave the server
- All images served through Supabase signed URLs
- Camera frames never stored permanently without consent
- Each simulation stored at /simulations/{userId}/{timestamp}_{type}
- Client can only access their own simulations
- Service role manages all storage — clients never write directly`;

// ─────────────────────────────────────────────
// REQUEST SIMULATION
// Primary function called by specialist agents.
// Handles tier checking, generation, and fallback.
// ─────────────────────────────────────────────
async function requestSimulation({
  frameBase64,
  lookData,
  userId,
  sessionId,
  qualityMode = 'balanced',
}) {
  // Check try-on access before touching Replicate
  const tryOnAccess = await checkTryOnAccess(userId);

  if (!tryOnAccess.available) {
    logger.info('Belle: Try-on not available for this tier', {
      userId,
      plan: tryOnAccess.plan,
    });

    // Return upgrade context — agent communicates naturally
    const upgradeInfo = await triggerUpgradeFlow(
      userId,
      tryOnAccess.plan,
      'virtual try-on'
    );

    return {
      available: false,
      reason: 'tier_limit',
      plan: tryOnAccess.plan,
      upgradeInfo,
      alternativeInstruction: `Describe this ${lookData.lookType} in precise, vivid detail so the client can picture it clearly on themselves. Paint the picture with words.`,
    };
  }

  try {
    const result = await generateSimulation({
      frameBase64,
      lookData,
      userId,
      sessionId,
      qualityMode,
    });

    logger.info('Belle: Simulation delivered to requesting agent', {
      requestingAgent: lookData.agentId,
      lookType: lookData.lookType,
      userId,
      generationTimeMs: result.generationTimeMs,
    });

    return result;
  } catch (error) {
    logger.error('Belle: Simulation request failed', {
      error: error.message,
      lookType: lookData.lookType,
      userId,
      requestingAgent: lookData.agentId,
    });

    // Return graceful fallback — agent knows to describe verbally
    return {
      available: false,
      reason: 'generation_failed',
      error: error.message,
      alternativeInstruction: `Belle encountered a technical issue. Describe this ${lookData.lookType} in vivid precise detail — enough that the client can picture it perfectly on themselves.`,
    };
  }
}

// ─────────────────────────────────────────────
// REQUEST COMPARISON SIMULATION
// Before and after — side by side
// ─────────────────────────────────────────────
async function requestComparisonSimulation({
  frameBase64,
  beforeDescription,
  afterLookData,
  userId,
  sessionId,
}) {
  const tryOnAccess = await checkTryOnAccess(userId);

  if (!tryOnAccess.available) {
    return {
      available: false,
      reason: 'tier_limit',
      plan: tryOnAccess.plan,
      upgradeInfo: await triggerUpgradeFlow(userId, tryOnAccess.plan, 'comparison simulation'),
    };
  }

  try {
    const result = await generateComparisonSimulation({
      frameBase64,
      beforeDescription,
      afterLookData,
      userId,
      sessionId,
    });

    return result;
  } catch (error) {
    logger.error('Belle: Comparison simulation failed', {
      error: error.message,
      userId,
    });

    return {
      available: false,
      reason: 'generation_failed',
      error: error.message,
    };
  }
}

// ─────────────────────────────────────────────
// SAVE SIMULATION TO LOOKBOOK
// Called when client saves a look
// ─────────────────────────────────────────────
async function saveToLookbook(historyId, userId) {
  try {
    const result = await saveSimulation(historyId, userId);
    return result;
  } catch (error) {
    logger.error('Belle: Failed to save to lookbook', {
      historyId,
      userId,
      error: error.message,
    });
    throw error;
  }
}

// ─────────────────────────────────────────────
// GET CLIENT LOOKBOOK
// Returns all saved simulations
// ─────────────────────────────────────────────
async function getLookbook(userId) {
  try {
    return await getClientLookbook(userId);
  } catch (error) {
    logger.error('Belle: Failed to retrieve lookbook', {
      userId,
      error: error.message,
    });
    return { lookbook: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// GET RECENT SIMULATIONS
// Returns active and saved simulations for session
// ─────────────────────────────────────────────
async function getRecentSimulations(userId) {
  try {
    return await getClientRecentSimulations(userId);
  } catch (error) {
    logger.error('Belle: Failed to retrieve recent simulations', {
      userId,
      error: error.message,
    });
    return { simulations: [], total: 0 };
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// For Marcus infrastructure monitoring
// ─────────────────────────────────────────────
async function checkBelleHealth() {
  try {
    const storageStats = await getStorageStats();
    const replicateApiKey = !!process.env.REPLICATE_API_TOKEN;

    return {
      healthy: replicateApiKey,
      replicateConfigured: replicateApiKey,
      storageStats,
      agentId: PC_ID,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      agentId: PC_ID,
      checkedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  requestSimulation,
  requestComparisonSimulation,
  saveToLookbook,
  getLookbook,
  getRecentSimulations,
  checkBelleHealth,
  BELLE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};