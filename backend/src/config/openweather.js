// FILE: precci/backend/src/config/openweather.js
// OpenWeatherMap configuration for Sage's environmental intelligence.
// Sage pulls real-time weather, humidity, UV index and air quality
// for every client's exact location before every session.

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_UV_BASE = 'https://api.openweathermap.org/data/3.0';

// ─────────────────────────────────────────────
// GET CURRENT WEATHER + ENVIRONMENTAL DATA
// Called by Sage before every client session
// Returns data fed to all specialist agents
// ─────────────────────────────────────────────
async function getEnvironmentalData(lat, lng) {
  if (!process.env.OPENWEATHERMAP_API_KEY) {
    logger.warn('OPENWEATHERMAP_API_KEY not configured — environmental data unavailable');
    return getDefaultEnvironmentalData();
  }

  try {
    const [weatherResponse, airQualityResponse] = await Promise.allSettled([
      axios.get(`${OPENWEATHER_BASE}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: process.env.OPENWEATHERMAP_API_KEY,
          units: 'metric',
        },
        timeout: 8000,
      }),
      axios.get(`${OPENWEATHER_BASE}/air_pollution`, {
        params: {
          lat,
          lon: lng,
          appid: process.env.OPENWEATHERMAP_API_KEY,
        },
        timeout: 8000,
      }),
    ]);

    const weather = weatherResponse.status === 'fulfilled'
      ? weatherResponse.value.data
      : null;

    const airQuality = airQualityResponse.status === 'fulfilled'
      ? airQualityResponse.value.data
      : null;

    const envData = {
      temperature: weather?.main?.temp ?? null,
      feelsLike: weather?.main?.feels_like ?? null,
      humidity: weather?.main?.humidity ?? null,
      weatherDescription: weather?.weather?.[0]?.description ?? null,
      weatherMain: weather?.weather?.[0]?.main ?? null,
      windSpeed: weather?.wind?.speed ?? null,
      cloudCover: weather?.clouds?.all ?? null,
      city: weather?.name ?? null,
      country: weather?.sys?.country ?? null,
      uvIndex: null, // Requires OpenWeather 3.0 One Call API
      airQualityIndex: airQuality?.list?.[0]?.main?.aqi ?? null,
      airQualityDescription: getAQIDescription(
        airQuality?.list?.[0]?.main?.aqi
      ),
      timestamp: new Date().toISOString(),
    };

    // Build natural language summary for agents
    envData.summary = buildEnvironmentalSummary(envData);

    return envData;
  } catch (error) {
    logger.error('Failed to fetch environmental data', {
      error: error.message,
    });
    return getDefaultEnvironmentalData();
  }
}

// ─────────────────────────────────────────────
// BUILD NATURAL LANGUAGE SUMMARY
// Agents use this in their reasoning
// ─────────────────────────────────────────────
function buildEnvironmentalSummary(data) {
  const parts = [];

  if (data.city && data.country) {
    parts.push(`Location: ${data.city}, ${data.country}.`);
  }

  if (data.temperature !== null) {
    parts.push(`Temperature: ${Math.round(data.temperature)}°C.`);
  }

  if (data.humidity !== null) {
    parts.push(`Humidity: ${data.humidity}%.`);
  }

  if (data.weatherDescription) {
    parts.push(`Conditions: ${data.weatherDescription}.`);
  }

  if (data.airQualityIndex !== null) {
    parts.push(`Air quality: ${data.airQualityDescription}.`);
  }

  // Skin and hair care implications
  const implications = [];

  if (data.humidity !== null) {
    if (data.humidity < 30) {
      implications.push('Very low humidity — recommend heavier moisturiser and hydrating hair products.');
    } else if (data.humidity > 75) {
      implications.push('High humidity — anti-frizz products recommended, lighter moisturisers.');
    }
  }

  if (data.uvIndex !== null && data.uvIndex > 5) {
    implications.push('High UV — SPF essential in any skincare recommendation today.');
  }

  if (implications.length > 0) {
    parts.push('Recommendation implications: ' + implications.join(' '));
  }

  return parts.join(' ');
}

// ─────────────────────────────────────────────
// AQI DESCRIPTION
// ─────────────────────────────────────────────
function getAQIDescription(aqi) {
  const descriptions = {
    1: 'Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Poor',
    5: 'Very Poor',
  };
  return descriptions[aqi] || 'Unknown';
}

// ─────────────────────────────────────────────
// DEFAULT DATA
// Returned when API is unavailable — neutral values
// ─────────────────────────────────────────────
function getDefaultEnvironmentalData() {
  return {
    temperature: null,
    humidity: null,
    weatherDescription: null,
    weatherMain: null,
    uvIndex: null,
    airQualityIndex: null,
    airQualityDescription: null,
    city: null,
    country: null,
    timestamp: new Date().toISOString(),
    summary: 'Environmental data not available for this session.',
  };
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkOpenWeatherHealth() {
  try {
    // Test with Navrongo, Ghana coordinates (PRECCI HQ)
    const data = await getEnvironmentalData(10.8935, -1.0921);
    return { healthy: data.temperature !== null };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  getEnvironmentalData,
  buildEnvironmentalSummary,
  checkOpenWeatherHealth,
};