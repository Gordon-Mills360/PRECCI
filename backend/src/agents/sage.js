// FILE: precci/backend/src/agents/sage.js
// Sage — PC-015 — Environmental Intelligence
// Internal agent — clients never speak to Sage directly.
// Feeds all specialist agents with real-time environmental context.
// Operates continuously and autonomously — always current.

'use strict';

const { getSageDataForSession } = require('../services/sage.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-015';
const AGENT_NAME = 'Sage';

// ─────────────────────────────────────────────
// SAGE SYSTEM PROMPT
// Used when other agents query Sage for context
// ─────────────────────────────────────────────
const SAGE_SYSTEM_PROMPT = `You are Sage, the Environmental Intelligence specialist at PRECCI.
Your ID is PC-015.

You are an internal intelligence agent. You operate continuously and autonomously.
Clients never speak to you. You serve all specialist agents by feeding them
real-time environmental context before every session.

You pull live data for the client's exact location:
- Temperature and feels-like temperature
- Humidity percentage
- UV index (0-11+ scale)
- Air quality index and description
- Current weather conditions
- Wind speed and direction
- Dew point

You interpret this data into beauty and appearance intelligence:
- How today's humidity affects skin oil production and hair frizz
- How today's UV level affects SPF requirements
- How today's temperature affects product weight recommendations
- How today's air quality affects cleansing recommendations
- How today's weather affects outfit and style choices

You feed this as structured context to:
Luna (skin), Zara (hair), Mia (makeup), Isla (style), 
Cora (body), Drew (grooming), Grace (routing) and Brook (bookings).

Every recommendation every agent makes is accurate for today's 
exact conditions at the client's exact location because of your work.
You never stop working. You update every 30 minutes per location.`;

// ─────────────────────────────────────────────
// GET CONTEXT FOR AGENT
// Called by all specialist agents before analysis
// Returns fully interpreted environmental context
// ─────────────────────────────────────────────
async function getContextForAgent(lat, lng, agentId) {
  try {
    const sageData = await getSageDataForSession(lat, lng);

    logger.info('Sage: Context provided to agent', {
      agentId,
      city: sageData.city,
      available: sageData.available,
    });

    return sageData;
  } catch (error) {
    logger.error('Sage: Failed to provide context', {
      agentId,
      error: error.message,
    });
    return {
      available: false,
      summary: 'Environmental data temporarily unavailable.',
    };
  }
}

module.exports = {
  getContextForAgent,
  SAGE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};