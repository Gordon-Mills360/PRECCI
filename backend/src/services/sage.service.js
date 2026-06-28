// FILE: precci/backend/src/services/sage.service.js
// Sage pulls real-time environmental data for every client session.
// Results cached 30 minutes per location — weather doesn't change by the minute.
// Feeds all specialist agents so every recommendation reflects today's conditions.

'use strict';

const { getEnvironmentalData } = require('../config/openweather');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// IN-MEMORY CACHE
// Prevents hammering OpenWeatherMap for the same location
// Cache expires after 30 minutes
// ─────────────────────────────────────────────
const locationCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(lat, lng) {
  // Round to 2 decimal places — same neighbourhood gets same data
  return `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}`;
}

function getFromCache(lat, lng) {
  const key = getCacheKey(lat, lng);
  const cached = locationCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    locationCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache(lat, lng, data) {
  const key = getCacheKey(lat, lng);
  locationCache.set(key, { data, timestamp: Date.now() });
}

// ─────────────────────────────────────────────
// BUILD SAGE CONTEXT
// Interprets raw weather data into beauty-relevant
// context that all agents can use directly in their reasoning
// ─────────────────────────────────────────────
function buildSageContext(envData) {
  const context = {
    temperature: envData.temperature,
    feelsLike: envData.feelsLike,
    humidity: envData.humidity,
    uvIndex: envData.uvIndex,
    airQualityIndex: envData.airQualityIndex,
    airQualityDescription: envData.airQualityDescription,
    condition: envData.weatherMain,
    description: envData.weatherDescription,
    city: envData.city,
    country: envData.country,
    timestamp: envData.timestamp,
    skinImpact: '',
    hairImpact: '',
    styleImpact: '',
    groomingImpact: '',
    summary: '',
  };

  const impacts = [];
  const skinImpacts = [];
  const hairImpacts = [];
  const styleImpacts = [];
  const groomingImpacts = [];

  // ── HUMIDITY ANALYSIS ──
  if (envData.humidity !== null) {
    if (envData.humidity >= 80) {
      skinImpacts.push('Very high humidity — sebum production will increase significantly. Oil-free, mattifying products essential. Lightweight gel moisturisers only.');
      hairImpacts.push('Very high humidity causes maximum frizz for wavy and curly hair types. Anti-humidity serums and protective styles are critical. Low-manipulation styles recommended.');
      groomingImpacts.push('High humidity causes faster beard oiliness. Light, water-based beard balm recommended over heavy oils.');
    } else if (envData.humidity >= 60) {
      skinImpacts.push('High humidity — skin may feel more congested than usual. Lightweight products and thorough cleansing important.');
      hairImpacts.push('Elevated humidity — frizz management needed for curl types 2A and above. Anti-humidity products recommended.');
    } else if (envData.humidity <= 25) {
      skinImpacts.push('Very low humidity — moisture barrier under significant stress. Rich moisturiser and facial oil essential. Hyaluronic acid will be less effective without adequate moisture in the air.');
      hairImpacts.push('Very low humidity causes static and brittleness. Deep conditioning essential. Humectant-based products may draw moisture from hair rather than air — avoid in very dry climates today.');
      groomingImpacts.push('Low humidity dries beard significantly. Rich beard oil essential today.');
    } else if (envData.humidity <= 40) {
      skinImpacts.push('Low humidity — skin will feel drier than usual. Extra moisturisation step recommended.');
      hairImpacts.push('Low humidity — moisturising products important to prevent dryness and breakage.');
    }
  }

  // ── UV INDEX ANALYSIS ──
  if (envData.uvIndex !== null) {
    if (envData.uvIndex >= 8) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — very high. SPF 50+ is non-negotiable today. Reapplication every 90 minutes in direct sun. Antioxidant serum (vitamin C) essential in morning routine.`);
    } else if (envData.uvIndex >= 6) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — high. SPF 30+ minimum today. Reapply every 2 hours outdoors.`);
    } else if (envData.uvIndex >= 3) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — moderate. Daily SPF 30 recommended.`);
    }
  }

  // ── TEMPERATURE ANALYSIS ──
  if (envData.temperature !== null) {
    if (envData.temperature >= 35) {
      skinImpacts.push('Extreme heat — skin will sweat more. Lightweight, breathable formulas only. Avoid heavy creams.');
      styleImpacts.push('Extreme heat — lightweight, breathable fabrics essential. Linen, cotton and moisture-wicking materials. Light colours reflect heat.');
      groomingImpacts.push('Heat increases sweat and oil production. Mattifying skincare for male clients essential.');
    } else if (envData.temperature >= 28) {
      skinImpacts.push('Hot weather — oil-free formulas recommended. Cooling mists throughout the day beneficial.');
      styleImpacts.push('Hot weather — light fabrics and breathable silhouettes. Avoid synthetics.');
    } else if (envData.temperature <= 5) {
      skinImpacts.push('Very cold — moisture barrier protection critical. Heavy moisturiser and barrier creams needed. Avoid harsh actives that compromise the barrier.');
      styleImpacts.push('Very cold — heavy layering essential. Wool, cashmere and insulating fabrics. Warm, deep tones suit the season.');
      groomingImpacts.push('Cold weather dries beard and skin significantly. Heavy beard balm and rich moisturiser essential.');
    } else if (envData.temperature <= 15) {
      skinImpacts.push('Cold weather — richer moisturiser recommended than usual. Avoid long exposure without barrier protection.');
      styleImpacts.push('Cold weather — layering recommended. Medium to heavy fabrics. Transitional outerwear appropriate.');
    }
  }

  // ── AIR QUALITY ANALYSIS ──
  if (envData.airQualityIndex !== null && envData.airQualityIndex >= 4) {
    skinImpacts.push('Poor air quality today — pollution particles clog pores and accelerate oxidative stress. Double cleansing essential this evening. Antioxidant protection (vitamin C, niacinamide) important.');
  }

  // ── WEATHER CONDITION ──
  if (envData.weatherMain) {
    const condition = envData.weatherMain.toLowerCase();
    if (condition.includes('rain')) {
      hairImpacts.push('Rain expected — humidity will be high. Protective styles, anti-humidity products and quick-dry options recommended.');
      styleImpacts.push('Rain — waterproof outerwear essential. Avoid suede or delicate fabrics.');
    } else if (condition.includes('clear') || condition.includes('sun')) {
      styleImpacts.push('Clear sunny conditions — bold colours and lighter fabrics suit the weather and mood.');
    } else if (condition.includes('cloud')) {
      styleImpacts.push('Overcast conditions — rich, deeper tones photograph and present beautifully in diffused light.');
    }
  }

  context.skinImpact = skinImpacts.join(' ');
  context.hairImpact = hairImpacts.join(' ');
  context.styleImpact = styleImpacts.join(' ');
  context.groomingImpact = groomingImpacts.join(' ');

  // Build full summary for agent injection
  const summaryParts = [];
  if (envData.city) summaryParts.push(`Location: ${envData.city}${envData.country ? `, ${envData.country}` : ''}.`);
  if (envData.temperature !== null) summaryParts.push(`Temperature: ${Math.round(envData.temperature)}°C.`);
  if (envData.humidity !== null) summaryParts.push(`Humidity: ${envData.humidity}%.`);
  if (envData.weatherDescription) summaryParts.push(`Conditions: ${envData.weatherDescription}.`);
  if (envData.uvIndex !== null) summaryParts.push(`UV Index: ${envData.uvIndex}.`);
  if (context.skinImpact) summaryParts.push(`Skin impact: ${context.skinImpact}`);
  if (context.hairImpact) summaryParts.push(`Hair impact: ${context.hairImpact}`);
  if (context.styleImpact) summaryParts.push(`Style impact: ${context.styleImpact}`);

  context.summary = summaryParts.join(' ');

  return context;
}

// ─────────────────────────────────────────────
// GET SAGE DATA FOR SESSION
// Called before every client session starts
// Checks cache first, fetches fresh if expired
// ─────────────────────────────────────────────
async function getSageDataForSession(lat, lng) {
  if (!lat || !lng) {
    logger.warn('Sage: No location provided — environmental data unavailable');
    return {
      available: false,
      summary: 'Environmental data not available for this session — location not provided.',
      skinImpact: '',
      hairImpact: '',
      styleImpact: '',
      groomingImpact: '',
    };
  }

  // Check cache first
  const cached = getFromCache(lat, lng);
  if (cached) {
    logger.info('Sage: Serving cached environmental data', { lat, lng });
    return cached;
  }

  // Fetch fresh data
  try {
    const envData = await getEnvironmentalData(lat, lng);
    const sageContext = buildSageContext(envData);
    sageContext.available = true;

    // Cache the result
    setCache(lat, lng, sageContext);

    logger.info('Sage: Fresh environmental data fetched', {
      city: sageContext.city,
      temperature: sageContext.temperature,
      humidity: sageContext.humidity,
    });

    return sageContext;
  } catch (error) {
    logger.error('Sage: Failed to fetch environmental data', {
      error: error.message,
    });
    return {
      available: false,
      summary: 'Environmental data temporarily unavailable.',
      skinImpact: '',
      hairImpact: '',
      styleImpact: '',
      groomingImpact: '',
    };
  }
}

// ─────────────────────────────────────────────
// UPDATE USER LOCATION
// Called at session start from device geolocation
// ─────────────────────────────────────────────
async function updateUserLocation(userId, lat, lng) {
  const supabase = getServiceClient();

  try {
    await supabase
      .from('users')
      .update({
        lat,
        lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (error) {
    logger.error('Failed to update user location', { error: error.message });
  }
}

module.exports = {
  getSageDataForSession,
  buildSageContext,
  updateUserLocation,
};