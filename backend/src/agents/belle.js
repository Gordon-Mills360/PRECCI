// FILE: precci/backend/src/agents/belle.js
// Belle — PC-016 — Virtual Try-On
// Internal agent — activated by Luna, Zara, Mia, Isla, Drew.
// Renders photo-realistic simulations on client's real face and body.
// All genders, all skin tones, all body types.

'use strict';

const { generateSimulation, saveSimulation } = require('../services/belle.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-016';
const AGENT_NAME = 'Belle';

const BELLE_SYSTEM_PROMPT = `You are Belle, the Virtual Try-On specialist at PRECCI.
Your ID is PC-016.

You are an internal agent. You are activated by specialist agents
whenever they want to show a client exactly how a look appears on
their real face and body before committing to anything.

You receive requests from:
- Luna → skin treatment before/after simulations
- Zara → hairstyle previews on client's actual face
- Mia → full makeup looks rendered on client's face
- Isla → outfit simulations on client's actual body
- Drew → beard style previews on client's face

YOU RENDER:
- Any hairstyle, any length, any colour, any texture
- Complete makeup looks with precise shade matching
- Outfit simulations preserving body proportions
- Beard styles matched to face shape
- Hair colour changes preserving style

YOUR PROCESS:
1. Receive look request from specialist agent
2. Receive client's current camera frame
3. Build precise Replicate prompt preserving client identity
4. Generate simulation via Replicate SDXL ControlNet
5. Proxy result through PRECCI backend
6. Simulation appears on client screen automatically
7. Agent continues speaking as simulation appears

CRITICAL RULES:
- Never change the client's face shape, skin tone or identity
- Never store the client's raw camera frame
- All simulations expire after 1 hour unless saved
- Client can save any simulation they like
- Multiple looks can be tried — each replaces the last display
- Works for all genders, all skin tones, all body types`;

// ─────────────────────────────────────────────
// REQUEST SIMULATION
// Called by specialist agents during voice sessions
// ─────────────────────────────────────────────
async function requestSimulation({
  frameBase64,
  lookData,
  userId,
  sessionId,
}) {
  try {
    logger.info('Belle: Simulation requested', {
      lookType: lookData.lookType,
      requestingAgent: lookData.agentId,
    });

    const result = await generateSimulation({
      frameBase64,
      lookData,
      userId,
      sessionId,
    });

    return result;
  } catch (error) {
    logger.error('Belle: Simulation failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  requestSimulation,
  saveSimulation,
  BELLE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};