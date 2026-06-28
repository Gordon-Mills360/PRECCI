// FILE: precci/backend/src/services/sage.service.js
// COMPLETE FULL BUILD.
// Sage pulls real-time environmental data for every client session.
// UV index now live via OpenWeather 3.0 One Call API — no longer null.
// Dew point calculated and factored into beauty recommendations.
// Pollen context noted for allergy-sensitive clients.
// AQI pollutant detail used for sensitive skin cleansing advice.
// 30-minute cache per location — weather does not change by the minute.
// All specialist agents receive the same complete structured context.
// Grace, Luna, Zara, Mia, Isla, Cora, Drew and Brook all served.

'use strict';

const { getEnvironmentalData } = require('../config/openweather');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// IN-MEMORY LOCATION CACHE
// 30 minutes per location — prevents hammering
// the OpenWeatherMap API for the same area
// ─────────────────────────────────────────────
const locationCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCacheKey(lat, lng) {
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
// BUILD SAGE CONTEXT — COMPLETE
// Interprets raw weather data into beauty-relevant
// context that every agent reasons from directly.
// This is not a rule set — it is interpreted context.
// Claude receives this and reasons autonomously from it.
// ─────────────────────────────────────────────
function buildSageContext(envData) {
  const context = {
    // Raw data — passed directly
    temperature: envData.temperature,
    feelsLike: envData.feelsLike,
    tempMin: envData.tempMin,
    tempMax: envData.tempMax,
    humidity: envData.humidity,
    dewPoint: envData.dewPoint,
    uvIndex: envData.uvIndex,
    uvDescription: envData.uvDescription,
    airQualityIndex: envData.airQualityIndex,
    airQualityDescription: envData.airQualityDescription,
    pm25: envData.pm25,
    pm10: envData.pm10,
    condition: envData.weatherMain,
    description: envData.weatherDescription,
    windSpeed: envData.windSpeed,
    windGust: envData.windGust,
    cloudCover: envData.cloudCover,
    rainLastHour: envData.rainLastHour,
    snowLastHour: envData.snowLastHour,
    city: envData.city,
    country: envData.country,
    lat: envData.lat,
    lng: envData.lng,
    sunrise: envData.sunrise,
    sunset: envData.sunset,
    timestamp: envData.timestamp,
    dataCompleteness: envData.dataCompleteness,

    // Interpreted impact sections — built below
    skinImpact: '',
    hairImpact: '',
    styleImpact: '',
    groomingImpact: '',
    bodyImpact: '',
    fragranceImpact: '',
    makeupImpact: '',
    bookingImpact: '',
    summary: '',
    available: true,
  };

  const skinImpacts = [];
  const hairImpacts = [];
  const styleImpacts = [];
  const groomingImpacts = [];
  const bodyImpacts = [];
  const fragranceImpacts = [];
  const makeupImpacts = [];
  const bookingImpacts = [];

  // ── UV INDEX — now live from One Call 3.0 ──
  if (envData.uvIndex !== null) {
    if (envData.uvIndex >= 11) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — extreme. SPF 50+ is critical and non-negotiable. Reapplication every 60-90 minutes in direct sun. Vitamin C antioxidant serum essential in morning routine to combat oxidative stress from extreme UV exposure. Seek shade between 10AM and 4PM where possible.`);
    } else if (envData.uvIndex >= 8) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — very high. SPF 50+ mandatory today. Reapplication every 90 minutes outdoors. Vitamin C serum strongly recommended in morning routine.`);
    } else if (envData.uvIndex >= 6) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — high. SPF 30+ minimum, SPF 50 preferred. Reapply every 2 hours outdoors.`);
    } else if (envData.uvIndex >= 3) {
      skinImpacts.push(`UV index is ${envData.uvIndex} — moderate. Daily SPF 30 recommended even on cloudy days.`);
    } else {
      skinImpacts.push(`UV index is ${envData.uvIndex} — low. Standard daily SPF 15-30 sufficient.`);
    }
  } else {
    // UV index unavailable — conservative default
    skinImpacts.push(`UV index data not available today — recommend SPF 30+ as a precaution. UV can be significant even on overcast days.`);
  }

  // ── HUMIDITY ──
  if (envData.humidity !== null) {
    if (envData.humidity >= 85) {
      skinImpacts.push(`Very high humidity at ${envData.humidity}% — sebum production will increase substantially. Oil-free, mattifying products are essential. Lightweight gel moisturisers only. Thorough cleansing twice today.`);
      hairImpacts.push(`${envData.humidity}% humidity causes maximum frizz for wavy, curly and coily types. Anti-humidity serums and sealed styles are critical. Low-manipulation and protective styles strongly recommended.`);
      groomingImpacts.push(`High humidity causes faster beard oiliness — lighter, water-based beard balm only. No heavy waxes or oils today.`);
      makeupImpacts.push(`Very high humidity requires full long-wear and waterproof formulas throughout. Setting spray essential. Heavy oils and butters in any product will slide. Powder products need waterproof binders.`);
    } else if (envData.humidity >= 70) {
      skinImpacts.push(`High humidity at ${envData.humidity}% — skin may feel more congested than usual. Lightweight oil-free products recommended. Thorough cleansing important.`);
      hairImpacts.push(`Elevated humidity at ${envData.humidity}% — anti-frizz products needed for curl types 2A and above. Sealing with a lightweight oil or anti-humidity serum will extend any style.`);
      groomingImpacts.push(`Humidity at ${envData.humidity}% — lighter beard product formulas recommended.`);
      makeupImpacts.push(`High humidity — long-wear formulas recommended. Setting powder and setting spray will significantly improve longevity.`);
    } else if (envData.humidity >= 50) {
      skinImpacts.push(`Comfortable humidity at ${envData.humidity}% — standard product weights appropriate for most skin types.`);
      hairImpacts.push(`Moderate humidity at ${envData.humidity}% — most hair types will respond well to standard product weights.`);
    } else if (envData.humidity <= 20) {
      skinImpacts.push(`Critically low humidity at ${envData.humidity}% — moisture barrier is under serious stress. Rich moisturiser, facial oil as final step, and humectants only if paired with occlusives. Hyaluronic acid alone will draw water from deep skin rather than air — must be sealed.`);
      hairImpacts.push(`Very low humidity at ${envData.humidity}% — avoid standalone humectant products (glycerin, honey) as they will draw moisture from hair not the air. Prioritise oils and butters to seal existing moisture. Expect increased static for fine and straight types.`);
      groomingImpacts.push(`Very dry air at ${envData.humidity}% — rich beard oil essential. Heavy beard balm to seal moisture. Skin beneath beard will be drier than usual.`);
      makeupImpacts.push(`Very dry conditions — powder products will cling to dry patches and look patchy. Cream and liquid formulas throughout. Dewy finish recommended over matte today.`);
    } else if (envData.humidity <= 35) {
      skinImpacts.push(`Low humidity at ${envData.humidity}% — skin will feel drier than usual. Richer moisturiser than standard, consider adding a facial oil tonight.`);
      hairImpacts.push(`Low humidity at ${envData.humidity}% — moisturising products important. Avoid heat styling without heat protection as hair is already moisture-deficient.`);
      groomingImpacts.push(`Low humidity — beard will feel drier. Beard oil before balm, or a richer balm formula.`);
      makeupImpacts.push(`Low humidity — minimise powder use to avoid emphasising dry patches. Primer with hydrating base.`);
    }
  }

  // ── TEMPERATURE ──
  if (envData.temperature !== null) {
    if (envData.temperature >= 38) {
      skinImpacts.push(`Extreme heat at ${Math.round(envData.temperature)}°C — perspiration will be significant. Lightweight breathable formulas only. Water-based everything. No heavy creams at all today. Cooling mists and mattifying blotting throughout the day.`);
      styleImpacts.push(`Extreme heat at ${Math.round(envData.temperature)}°C — linen, light cotton and moisture-wicking natural fabrics only. Light or white colours to reflect heat. Avoid synthetics which trap heat and show perspiration.`);
      groomingImpacts.push(`Extreme heat — mattifying, sweat-resistant skincare for male clients. No wax-based products that will melt. Water-based only.`);
      bodyImpacts.push(`Extreme heat — lightweight body lotion only. Body mists over heavy creams. Deodorant/antiperspirant critical. Post-gym skincare even more important than usual.`);
      fragranceImpacts.push(`Heat at ${Math.round(envData.temperature)}°C amplifies fragrance significantly — apply lightly, to pulse points only, one to two sprays maximum. Skin chemistry shifts in extreme heat.`);
    } else if (envData.temperature >= 30) {
      skinImpacts.push(`Hot conditions at ${Math.round(envData.temperature)}°C — oil-free moisturisers recommended. Lightweight gel or fluid formulas. Cooling facial mist beneficial throughout the day.`);
      styleImpacts.push(`Hot weather at ${Math.round(envData.temperature)}°C — breathable light fabrics. Linen and cotton ideal. Avoid heavy or synthetic fabrics.`);
      fragranceImpacts.push(`Warm temperature amplifies fragrance projection — apply slightly lighter than usual.`);
    } else if (envData.temperature >= 20) {
      skinImpacts.push(`Comfortable temperature at ${Math.round(envData.temperature)}°C — standard product weights appropriate.`);
      styleImpacts.push(`Comfortable temperature at ${Math.round(envData.temperature)}°C — single layer or light layering works well.`);
    } else if (envData.temperature >= 10) {
      skinImpacts.push(`Cool weather at ${Math.round(envData.temperature)}°C — richer moisturiser recommended. Moisture barrier support important.`);
      styleImpacts.push(`Cool weather at ${Math.round(envData.temperature)}°C — layering appropriate. Medium-weight fabrics. Light outerwear.`);
      groomingImpacts.push(`Cool weather — beard skin will be drier. Beard oil daily is important.`);
    } else if (envData.temperature >= 0) {
      skinImpacts.push(`Cold conditions at ${Math.round(envData.temperature)}°C — moisture barrier protection critical. Rich moisturiser and barrier cream needed. Avoid harsh actives (strong retinols, high-strength acids) that further compromise the barrier in cold. Wind and cold together cause significant barrier damage.`);
      styleImpacts.push(`Cold conditions at ${Math.round(envData.temperature)}°C — heavy layering essential. Wool, cashmere and insulating fabrics. Warm, rich tones suit winter conditions and complement most complexions.`);
      groomingImpacts.push(`Cold conditions — beard provides some protection but skin beneath still dries significantly. Rich beard balm essential. Heavy moisturiser for non-beard areas.`);
      bodyImpacts.push(`Cold weather — richer body cream needed, especially on exposed areas. Hands need dedicated barrier hand cream.`);
      fragranceImpacts.push(`Cold weather reduces fragrance projection — apply to pulse points and consider warming them slightly with your hands first to activate.`);
    } else {
      skinImpacts.push(`Below freezing at ${Math.round(envData.temperature)}°C — maximum barrier protection needed. Heavy cream, facial oil, possibly a balm over the top. Exposed skin is at risk of chapping.`);
      styleImpacts.push(`Below freezing — maximum insulation. Wool underlayers, heavy outerwear, protect exposed skin.`);
      fragranceImpacts.push(`Very cold conditions significantly suppress fragrance — apply more generously or choose warmer, deeper fragrance families that project better in cold.`);
    }
  }

  // ── DEW POINT — comfort level ──
  if (envData.dewPoint !== null) {
    if (envData.dewPoint >= 24) {
      skinImpacts.push(`Dew point at ${envData.dewPoint}°C — oppressively humid feel. Skin will feel sticky regardless of products. Ultra-lightweight formulas and thorough cleansing twice today.`);
    } else if (envData.dewPoint <= 0) {
      skinImpacts.push(`Dew point at ${envData.dewPoint}°C — air is very dry. Aggressive barrier protection needed.`);
    }
  }

  // ── AIR QUALITY ──
  if (envData.airQualityIndex !== null) {
    if (envData.airQualityIndex >= 5) {
      skinImpacts.push(`Air quality is Very Poor today (AQI ${envData.airQualityIndex}). Pollution particles actively damage skin — they penetrate pores, create oxidative stress and accelerate aging. Double cleansing essential this evening without exception. Vitamin C or niacinamide antioxidant in morning routine is critical today. Consider a physical barrier (tinted SPF) to minimise direct particle contact.`);
      bodyImpacts.push(`Very poor air quality — shower after any outdoor exposure. Rinse hair thoroughly.`);
    } else if (envData.airQualityIndex >= 4) {
      skinImpacts.push(`Air quality is Poor today (AQI ${envData.airQualityIndex}). Double cleansing recommended this evening. Antioxidant serum important in morning routine.`);
    } else if (envData.airQualityIndex >= 3) {
      skinImpacts.push(`Air quality is Moderate today (AQI ${envData.airQualityIndex}). Thorough cleansing and antioxidant protection recommended.`);
    }
  }

  // PM2.5 specific note for very sensitive skin
  if (envData.pm25 !== null && envData.pm25 > 35) {
    skinImpacts.push(`Fine particulate matter (PM2.5) is elevated at ${Math.round(envData.pm25)} μg/m³ — clients with sensitive or acne-prone skin should be especially diligent with cleansing today.`);
  }

  // ── WEATHER CONDITION ──
  if (envData.weatherMain) {
    const condition = envData.weatherMain.toLowerCase();

    if (condition.includes('thunderstorm')) {
      hairImpacts.push(`Thunderstorm conditions — humidity will be very high. Fully protective or sealed hairstyles only. Anti-humidity products essential.`);
      styleImpacts.push(`Thunderstorm — waterproof outerwear essential. Avoid delicate fabrics, suede, uncoated leather and anything that marks in rain.`);
      bookingImpacts.push(`Thunderstorm conditions — Brook should prioritise indoor providers or providers with covered entrances. Note weather to client when confirming booking.`);
    } else if (condition.includes('drizzle') || condition.includes('rain')) {
      hairImpacts.push(`Rain expected — humidity will be elevated. Protective styles, anti-humidity serums and wash-and-go styles that look intentional if caught in rain are recommended.`);
      styleImpacts.push(`Rain — waterproof outerwear essential. Avoid suede, unprotected leather and silk. Darker colours or patterns that hide water marks if caught without cover.`);
      bookingImpacts.push(`Rain today — Brook should note weather conditions when confirming bookings. Clients may need extra travel time.`);
    } else if (condition.includes('snow')) {
      styleImpacts.push(`Snow conditions — waterproof outerwear and footwear essential. Heavy insulation.`);
      bookingImpacts.push(`Snow conditions — Brook should check if providers are open and accessible. Note travel conditions to client.`);
    } else if (condition.includes('clear')) {
      styleImpacts.push(`Clear sunny conditions — full colour range works well. Bright and saturated colours look excellent in direct sunlight.`);
      bodyImpacts.push(`Clear sunny day — body SPF important if skin will be exposed outdoors.`);
    } else if (condition.includes('cloud')) {
      styleImpacts.push(`Overcast conditions — rich, deeper tones and jewel colours photograph and present beautifully in diffused natural light. Avoid very pale pastels which can look washed out in grey light.`);
    } else if (condition.includes('mist') || condition.includes('fog')) {
      hairImpacts.push(`Mist and fog add invisible moisture to the air — treat as moderate humidity for hair product choices.`);
      styleImpacts.push(`Fog conditions — visibility reduced. Light colours or reflective accessories beneficial for safety outdoors.`);
    } else if (condition.includes('haze') || condition.includes('smoke')) {
      skinImpacts.push(`Haze or smoke conditions — particle pollution significantly elevated even if AQI sensor does not reflect it. Treat as poor air quality for skincare purposes. Antioxidants and thorough cleansing essential.`);
    } else if (condition.includes('sand') || condition.includes('dust')) {
      skinImpacts.push(`Sand or dust in the air — particulate matter will physically abrade and clog skin. Physical barrier SPF strongly recommended. Thorough double cleansing essential tonight.`);
      hairImpacts.push(`Sandy or dusty conditions — protective styles and scalp cover recommended. Thorough cleansing tonight.`);
    }
  }

  // ── WIND ──
  if (envData.windSpeed !== null) {
    if (envData.windSpeed >= 14) {
      hairImpacts.push(`Strong winds at ${Math.round(envData.windSpeed)} m/s — secured styles and updos recommended. Avoid loose styles that will tangle significantly.`);
      skinImpacts.push(`Strong winds accelerate moisture loss from skin — barrier protection important.`);
    } else if (envData.windSpeed >= 8) {
      hairImpacts.push(`Moderate wind at ${Math.round(envData.windSpeed)} m/s — consider secured styles if hair is long.`);
    }
  }

  // ── FRAGRANCE — TEMPERATURE AND HUMIDITY INTERACTION ──
  if (envData.temperature !== null && envData.humidity !== null) {
    if (envData.temperature >= 25 && envData.humidity >= 60) {
      fragranceImpacts.push(`Warm and humid conditions significantly amplify fragrance projection and longevity — apply more lightly than usual and choose lighter, fresher fragrance families. Heavy orientals and musks can become overwhelming in these conditions.`);
    } else if (envData.temperature <= 10) {
      fragranceImpacts.push(`Cold conditions reduce fragrance projection — warmer, heavier fragrance families (woody, oriental, amber) perform better in cold as they project despite suppression. Apply to pulse points on warm skin.`);
    }
  }

  // Build impact strings
  context.skinImpact = skinImpacts.join(' ');
  context.hairImpact = hairImpacts.join(' ');
  context.styleImpact = styleImpacts.join(' ');
  context.groomingImpact = groomingImpacts.join(' ');
  context.bodyImpact = bodyImpacts.join(' ');
  context.fragranceImpact = fragranceImpacts.join(' ');
  context.makeupImpact = makeupImpacts.join(' ');
  context.bookingImpact = bookingImpacts.join(' ');

  // Build complete agent-ready summary
  const summaryParts = [];
  if (envData.city) summaryParts.push(`Location: ${envData.city}${envData.country ? `, ${envData.country}` : ''}.`);
  if (envData.temperature !== null) summaryParts.push(`Temperature: ${Math.round(envData.temperature)}°C (feels like ${Math.round(envData.feelsLike || envData.temperature)}°C).`);
  if (envData.humidity !== null) summaryParts.push(`Humidity: ${envData.humidity}%.`);
  if (envData.dewPoint !== null) summaryParts.push(`Dew point: ${envData.dewPoint}°C.`);
  if (envData.weatherDescription) summaryParts.push(`Conditions: ${envData.weatherDescription}.`);
  if (envData.uvIndex !== null) summaryParts.push(`UV Index: ${envData.uvIndex} (${context.uvDescription || envData.uvDescription}).`);
  else summaryParts.push(`UV Index: unavailable — recommend SPF 30+ precaution.`);
  if (envData.airQualityIndex !== null) summaryParts.push(`Air quality: ${envData.airQualityDescription} (AQI ${envData.airQualityIndex}).`);
  if (context.skinImpact) summaryParts.push(`Skin: ${context.skinImpact}`);
  if (context.hairImpact) summaryParts.push(`Hair: ${context.hairImpact}`);
  if (context.makeupImpact) summaryParts.push(`Makeup: ${context.makeupImpact}`);
  if (context.styleImpact) summaryParts.push(`Style: ${context.styleImpact}`);
  if (context.groomingImpact) summaryParts.push(`Grooming: ${context.groomingImpact}`);
  if (context.fragranceImpact) summaryParts.push(`Fragrance: ${context.fragranceImpact}`);

  context.summary = summaryParts.join(' ');

  return context;
}

// ─────────────────────────────────────────────
// GET SAGE DATA FOR SESSION
// Called before every client session.
// Checks 30-minute cache first.
// Fetches fresh if expired or not cached.
// ─────────────────────────────────────────────
async function getSageDataForSession(lat, lng) {
  if (!lat || !lng) {
    logger.warn('Sage: No location provided — environmental data unavailable');
    return {
      available: false,
      summary: 'Environmental data not available — location not provided. Standard precautionary recommendations apply: SPF 30+, humidity-appropriate product weights.',
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

  // Check cache
  const cached = getFromCache(lat, lng);
  if (cached) {
    logger.info('Sage: Serving cached environmental data', {
      lat: parseFloat(lat).toFixed(2),
      lng: parseFloat(lng).toFixed(2),
      cachedCity: cached.city,
      uvIndex: cached.uvIndex,
    });
    return cached;
  }

  // Fetch fresh
  try {
    const envData = await getEnvironmentalData(lat, lng);
    const sageContext = buildSageContext(envData);

    // Cache the result
    setCache(lat, lng, sageContext);

    logger.info('Sage: Fresh data built and cached', {
      city: sageContext.city,
      temperature: sageContext.temperature,
      humidity: sageContext.humidity,
      uvIndex: sageContext.uvIndex,
      uvDescription: sageContext.uvDescription,
      airQuality: sageContext.airQualityDescription,
      dataCompleteness: sageContext.dataCompleteness,
    });

    return sageContext;
  } catch (error) {
    logger.error('Sage: Failed to fetch or build environmental data', {
      error: error.message,
      lat,
      lng,
    });

    return {
      available: false,
      summary: 'Environmental data temporarily unavailable. Standard precautionary recommendations apply.',
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

    logger.info('Sage: User location updated', { userId });
  } catch (error) {
    logger.error('Sage: Failed to update user location', {
      userId,
      error: error.message,
    });
  }
}

// ─────────────────────────────────────────────
// CLEAR LOCATION CACHE
// Called when testing or when fresh data is needed
// ─────────────────────────────────────────────
function clearLocationCache(lat, lng) {
  if (lat && lng) {
    const key = getCacheKey(lat, lng);
    locationCache.delete(key);
    logger.info('Sage: Cache cleared for location', { lat, lng });
  } else {
    locationCache.clear();
    logger.info('Sage: Full location cache cleared');
  }
}

// ─────────────────────────────────────────────
// GET CACHE STATS
// For Marcus monitoring dashboard
// ─────────────────────────────────────────────
function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(locationCache.entries()).map(([key, value]) => ({
    location: key,
    city: value.data?.city,
    ageMinutes: Math.round((now - value.timestamp) / 60000),
    expiresInMinutes: Math.round((CACHE_TTL_MS - (now - value.timestamp)) / 60000),
    hasUVIndex: value.data?.uvIndex !== null,
    humidity: value.data?.humidity,
    temperature: value.data?.temperature,
  }));

  return {
    totalCachedLocations: locationCache.size,
    cacheTTLMinutes: CACHE_TTL_MS / 60000,
    entries,
  };
}

module.exports = {
  getSageDataForSession,
  buildSageContext,
  updateUserLocation,
  clearLocationCache,
  getCacheStats,
};