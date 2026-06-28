// FILE: precci/backend/src/agents/sage.js
// Sage — PC-015 — Environmental Intelligence
// COMPLETE FULL BUILD.
// Internal agent — clients never speak to Sage directly.
// Feeds ALL specialist agents with real-time environmental context.
// Operates continuously and autonomously — always current.
// UV index now live via OpenWeather 3.0 One Call API.
// Dew point, wind, pollutant detail, fragrance impact all added.
// Separate impact sections per agent domain.
// Cache management exposed for Marcus monitoring.
// Nadia performance logging included.

'use strict';

const { getSageDataForSession, clearLocationCache, getCacheStats } = require('../services/sage.service');
const { getServiceClient } = require('../config/supabase');
const { checkOpenWeatherHealth } = require('../config/openweather');
const logger = require('../utils/logger');

const PC_ID = 'PC-015';
const AGENT_NAME = 'Sage';

// ─────────────────────────────────────────────
// SAGE'S COMPLETE SYSTEM PROMPT
// Sage is an internal intelligence agent.
// Clients never speak to Sage.
// All specialist agents import and call Sage
// before every session to get today's conditions.
// ─────────────────────────────────────────────
const SAGE_SYSTEM_PROMPT = `You are Sage, the Environmental Intelligence specialist at PRECCI.
Your ID is PC-015.

You are an internal intelligence agent. You operate continuously and
autonomously. Clients never speak to you directly. You serve every
specialist agent at PRECCI by providing them with real-time environmental
context before every single client session.

YOUR FUNCTION:
Before every client session at PRECCI, you pull live data for the
client's exact geographic location and interpret it into beauty and
appearance intelligence. Every agent that serves a client receives
your context first. This means every recommendation made at PRECCI
is accurate for today's exact conditions at the client's exact location.

DATA YOU PULL IN REAL TIME:
- Temperature — current, feels-like, min and max for the day
- Humidity percentage — the single most important factor for hair
- Dew point — true comfort level indicator
- UV index — live via OpenWeather 3.0 One Call API
- Air quality index and specific pollutants (PM2.5, PM10, NO2, O3)
- Current weather conditions and description
- Wind speed and gust — affects hair and skin
- Cloud cover — affects photography and appearance choices
- Rain and precipitation levels
- Sunrise and sunset times — context for SPF timing

WHO YOU SERVE AND WHAT EACH AGENT NEEDS FROM YOU:

Luna (PC-008 — Skin Analyst):
Needs: UV index for SPF recommendations, humidity for product weight,
air quality for cleansing recommendations, temperature for formula weight,
dew point for true moisture barrier context.

Zara (PC-009 — Hair Expert):
Needs: Humidity — the most critical factor for every hair recommendation.
Wind for style security. Rain for style durability. Temperature for
product weight. The humectant warning when humidity is below 20%.

Mia (PC-010 — Makeup Artist):
Needs: Humidity for formula longevity (high humidity = long-wear essential),
temperature for formula weight (heat = lightweight only), rain for
waterproof formula recommendations.

Isla (PC-011 — Style Advisor):
Needs: Temperature for fabric weight and layering strategy. Rain for fabric
avoidance (suede, silk, unprotected leather). Wind for style security.
Extreme heat or cold for accessory recommendations.

Cora (PC-013 — Body Care):
Needs: Humidity for body product weight. UV for body SPF recommendations.
Temperature for body care formula adjustment. Pollution for post-outdoor
cleansing recommendations.

Drew (PC-014 — Male Grooming):
Needs: Humidity for beard product weight (high = lighter, low = richer).
Temperature for skincare formula weight. Rain for product durability.

Remy (PC-012 — Fragrance):
Needs: Temperature and humidity interaction — warm + humid amplifies
fragrance dramatically. Cold suppresses projection. This changes how much
to apply and which fragrance families perform best today.

Grace (PC-026 — Reception):
Needs: Overall conditions summary to contextualise the client's session
and inform any booking or timing recommendations.

Brook (PC-027 — Connect Manager):
Needs: Weather conditions that affect bookings — rain, storms or extreme
heat that clients need to know about. Booking impact assessment.

YOUR IMPACT SECTIONS:
You return separate, specific impact summaries for each domain:
skinImpact — for Luna and Cora
hairImpact — for Zara
makeupImpact — for Mia
styleImpact — for Isla
groomingImpact — for Drew
fragranceImpact — for Remy
bodyImpact — for Cora
bookingImpact — for Brook

YOU NEVER STOP WORKING:
Cache refreshes every 30 minutes per location.
Multiple clients in the same neighbourhood share the same cached data.
New locations are fetched in real time.
You maintain separate cache entries for every unique location.

WHAT YOU DO NOT DO:
You do not speak to clients.
You do not make recommendations directly.
You provide context. Agents reason from it.`;

// ─────────────────────────────────────────────
// GET CONTEXT FOR AGENT
// Primary function called by all specialist agents.
// Every agent calls this before analysis.
// Returns the complete Sage context object.
// ─────────────────────────────────────────────
async function getContextForAgent(lat, lng, agentId) {
  try {
    const sageData = await getSageDataForSession(lat, lng);

    logger.info('Sage: Context provided', {
      agentId,
      city: sageData.city,
      available: sageData.available,
      uvIndex: sageData.uvIndex,
      humidity: sageData.humidity,
      temperature: sageData.temperature,
    });

    return sageData;
  } catch (error) {
    logger.error('Sage: Failed to provide context to agent', {
      agentId,
      lat,
      lng,
      error: error.message,
    });

    return {
      available: false,
      summary: 'Environmental data temporarily unavailable. Standard precautionary recommendations apply: SPF 30+, standard product weights.',
      skinImpact: '',
      hairImpact: '',
      styleImpact: '',
      groomingImpact: '',
      bodyImpact: '',
      fragranceImpact: '',
      makeupImpact: '',
      bookingImpact: '',
      uvIndex: null,
      humidity: null,
      temperature: null,
    };
  }
}

// ─────────────────────────────────────────────
// GET CONTEXT FOR SPECIFIC AGENT DOMAIN
// Returns only the relevant impact section for
// an agent — cleaner injection into prompts
// ─────────────────────────────────────────────
async function getContextForAgentDomain(lat, lng, agentId) {
  const fullContext = await getContextForAgent(lat, lng, agentId);

  // Map agent PC IDs to their relevant impact fields
  const agentImpactMap = {
    'PC-008': { primary: 'skinImpact', secondary: null },         // Luna
    'PC-009': { primary: 'hairImpact', secondary: null },         // Zara
    'PC-010': { primary: 'makeupImpact', secondary: 'skinImpact' }, // Mia
    'PC-011': { primary: 'styleImpact', secondary: null },        // Isla
    'PC-012': { primary: 'fragranceImpact', secondary: null },    // Remy
    'PC-013': { primary: 'bodyImpact', secondary: 'skinImpact' }, // Cora
    'PC-014': { primary: 'groomingImpact', secondary: 'skinImpact' }, // Drew
    'PC-026': { primary: 'summary', secondary: null },            // Grace
    'PC-027': { primary: 'bookingImpact', secondary: null },      // Brook
  };

  const mapping = agentImpactMap[agentId];

  return {
    ...fullContext,
    primaryImpact: mapping ? fullContext[mapping.primary] : fullContext.summary,
    secondaryImpact: mapping?.secondary ? fullContext[mapping.secondary] : null,
    agentDomain: agentId,
  };
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// Called by Marcus for infrastructure monitoring
// ─────────────────────────────────────────────
async function checkSageHealth() {
  try {
    const openWeatherHealth = await checkOpenWeatherHealth();
    const cacheStats = getCacheStats();

    return {
      healthy: openWeatherHealth.healthy,
      uvIndexAvailable: openWeatherHealth.uvIndexAvailable,
      openWeather: openWeatherHealth,
      cache: cacheStats,
      agentId: PC_ID,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Sage: Health check failed', { error: error.message });
    return {
      healthy: false,
      error: error.message,
      agentId: PC_ID,
      checkedAt: new Date().toISOString(),
    };
  }
}

// ─────────────────────────────────────────────
// REFRESH LOCATION
// Force fresh data for a specific location
// bypassing the 30-minute cache
// ─────────────────────────────────────────────
async function refreshLocation(lat, lng) {
  clearLocationCache(lat, lng);
  const fresh = await getSageDataForSession(lat, lng);

  logger.info('Sage: Location cache refreshed', {
    lat,
    lng,
    city: fresh.city,
    uvIndex: fresh.uvIndex,
  });

  return fresh;
}

// ─────────────────────────────────────────────
// LOG SAGE PERFORMANCE TO NADIA
// Called at the end of daily operations
// ─────────────────────────────────────────────
async function logDailyPerformance() {
  const supabase = getServiceClient();
  const cacheStats = getCacheStats();

  try {
    await supabase.from('alerts').insert({
      type: 'agent_daily_performance',
      message: `Sage: Daily environmental intelligence performance`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        date: new Date().toISOString().split('T')[0],
        locationsServed: cacheStats.totalCachedLocations,
        cacheStats,
        uvIndexAvailability: cacheStats.entries.filter(e => e.hasUVIndex).length,
        logged_at: new Date().toISOString(),
      },
    });

    logger.info('Sage: Daily performance logged to Nadia', {
      locationsServed: cacheStats.totalCachedLocations,
    });
  } catch (error) {
    logger.error('Sage: Failed to log daily performance', {
      error: error.message,
    });
  }
}

module.exports = {
  getContextForAgent,
  getContextForAgentDomain,
  checkSageHealth,
  refreshLocation,
  logDailyPerformance,
  SAGE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};