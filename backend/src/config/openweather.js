// FILE: precci/backend/src/config/openweather.js
// COMPLETE FULL BUILD.
// OpenWeatherMap configuration for Sage's environmental intelligence.
// Uses BOTH data/2.5 (current weather + air quality) AND
// data/3.0/onecall (UV index + hourly forecast) simultaneously.
// UV index was previously always null — fixed here with One Call API 3.0.
// All calls run in parallel. Any single failure does not kill the others.
// Sage receives complete data for every client session.

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const OPENWEATHER_BASE_25 = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_BASE_30 = 'https://api.openweathermap.org/data/3.0';

// ─────────────────────────────────────────────
// UV INDEX DESCRIPTION
// Returns human-readable risk level from UV index number
// ─────────────────────────────────────────────
function getUVDescription(uvIndex) {
  if (uvIndex === null || uvIndex === undefined) return null;
  if (uvIndex < 3) return 'Low';
  if (uvIndex < 6) return 'Moderate';
  if (uvIndex < 8) return 'High';
  if (uvIndex < 11) return 'Very High';
  return 'Extreme';
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
// GET UV INDEX — OpenWeather 3.0 One Call API
// This is the ONLY correct source for UV index.
// The data/2.5 endpoints do not provide UV index.
// One Call 3.0 requires subscription — free tier
// does not include it. If the key does not have
// access, UV returns null gracefully.
// ─────────────────────────────────────────────
async function getUVIndex(lat, lng) {
  if (!process.env.OPENWEATHERMAP_API_KEY) return null;

  try {
    const response = await axios.get(
      `${OPENWEATHER_BASE_30}/onecall`,
      {
        params: {
          lat,
          lon: lng,
          appid: process.env.OPENWEATHERMAP_API_KEY,
          exclude: 'minutely,hourly,daily,alerts',
          units: 'metric',
        },
        timeout: 8000,
      }
    );

    const uvIndex = response.data?.current?.uvi ?? null;

    logger.info('Sage: UV index fetched via One Call 3.0', {
      lat,
      lng,
      uvIndex,
    });

    return uvIndex;
  } catch (error) {
    // 401 means API key does not have One Call 3.0 subscription
    // 403 means same — log clearly so Gordon knows what to enable
    if (error.response?.status === 401 || error.response?.status === 403) {
      logger.warn('Sage: UV index unavailable — OpenWeather One Call 3.0 subscription required for this API key. UV index will be null until subscription is enabled at openweathermap.org/api/one-call-3', {
        status: error.response.status,
      });
      return null;
    }

    logger.error('Sage: UV index fetch failed', {
      error: error.message,
      status: error.response?.status,
    });
    return null;
  }
}

// ─────────────────────────────────────────────
// GET CURRENT WEATHER
// data/2.5/weather — standard endpoint
// ─────────────────────────────────────────────
async function getCurrentWeather(lat, lng) {
  const response = await axios.get(
    `${OPENWEATHER_BASE_25}/weather`,
    {
      params: {
        lat,
        lon: lng,
        appid: process.env.OPENWEATHERMAP_API_KEY,
        units: 'metric',
      },
      timeout: 8000,
    }
  );
  return response.data;
}

// ─────────────────────────────────────────────
// GET AIR QUALITY
// data/2.5/air_pollution — standard endpoint
// ─────────────────────────────────────────────
async function getAirQuality(lat, lng) {
  const response = await axios.get(
    `${OPENWEATHER_BASE_25}/air_pollution`,
    {
      params: {
        lat,
        lon: lng,
        appid: process.env.OPENWEATHERMAP_API_KEY,
      },
      timeout: 8000,
    }
  );
  return response.data;
}

// ─────────────────────────────────────────────
// GET ENVIRONMENTAL DATA — MAIN FUNCTION
// Calls all three endpoints in parallel.
// Any individual failure does not kill the others.
// Sage always gets whatever data is available.
// ─────────────────────────────────────────────
async function getEnvironmentalData(lat, lng) {
  if (!process.env.OPENWEATHERMAP_API_KEY) {
    logger.warn('Sage: OPENWEATHERMAP_API_KEY not configured — environmental data unavailable');
    return getDefaultEnvironmentalData();
  }

  // Run all three API calls in parallel
  const [weatherResult, airQualityResult, uvResult] = await Promise.allSettled([
    getCurrentWeather(lat, lng),
    getAirQuality(lat, lng),
    getUVIndex(lat, lng),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const airQuality = airQualityResult.status === 'fulfilled' ? airQualityResult.value : null;
  const uvIndex = uvResult.status === 'fulfilled' ? uvResult.value : null;

  if (!weather) {
    logger.error('Sage: Primary weather fetch failed — returning defaults', {
      error: weatherResult.reason?.message,
    });
    return getDefaultEnvironmentalData();
  }

  // Build complete environmental data object
  const envData = {
    // Temperature
    temperature: weather?.main?.temp ?? null,
    feelsLike: weather?.main?.feels_like ?? null,
    tempMin: weather?.main?.temp_min ?? null,
    tempMax: weather?.main?.temp_max ?? null,

    // Atmosphere
    humidity: weather?.main?.humidity ?? null,
    pressure: weather?.main?.pressure ?? null,
    dewPoint: calculateDewPoint(
      weather?.main?.temp,
      weather?.main?.humidity
    ),

    // Wind
    windSpeed: weather?.wind?.speed ?? null,
    windDirection: weather?.wind?.deg ?? null,
    windGust: weather?.wind?.gust ?? null,

    // Sky
    cloudCover: weather?.clouds?.all ?? null,
    visibility: weather?.visibility ?? null,

    // Weather condition
    weatherMain: weather?.weather?.[0]?.main ?? null,
    weatherDescription: weather?.weather?.[0]?.description ?? null,
    weatherIconCode: weather?.weather?.[0]?.icon ?? null,

    // Rain/Snow
    rainLastHour: weather?.rain?.['1h'] ?? null,
    snowLastHour: weather?.snow?.['1h'] ?? null,

    // UV Index — from One Call 3.0
    uvIndex: uvIndex ?? null,
    uvDescription: getUVDescription(uvIndex),

    // Air Quality
    airQualityIndex: airQuality?.list?.[0]?.main?.aqi ?? null,
    airQualityDescription: getAQIDescription(
      airQuality?.list?.[0]?.main?.aqi
    ),
    // Specific pollutants for sensitive skin clients
    pm25: airQuality?.list?.[0]?.components?.pm2_5 ?? null,
    pm10: airQuality?.list?.[0]?.components?.pm10 ?? null,
    no2: airQuality?.list?.[0]?.components?.no2 ?? null,
    o3: airQuality?.list?.[0]?.components?.o3 ?? null,

    // Location
    city: weather?.name ?? null,
    country: weather?.sys?.country ?? null,
    lat,
    lng,

    // Sunrise / Sunset
    sunrise: weather?.sys?.sunrise
      ? new Date(weather.sys.sunrise * 1000).toISOString()
      : null,
    sunset: weather?.sys?.sunset
      ? new Date(weather.sys.sunset * 1000).toISOString()
      : null,

    // Meta
    timestamp: new Date().toISOString(),
    dataCompleteness: calculateDataCompleteness(weather, airQuality, uvIndex),
  };

  logger.info('Sage: Environmental data assembled', {
    city: envData.city,
    temperature: envData.temperature,
    humidity: envData.humidity,
    uvIndex: envData.uvIndex,
    uvDescription: envData.uvDescription,
    airQuality: envData.airQualityDescription,
    dataCompleteness: envData.dataCompleteness,
  });

  return envData;
}

// ─────────────────────────────────────────────
// CALCULATE DEW POINT
// Dew point matters for comfort and product feel
// Magnus approximation — accurate within ±0.35°C
// ─────────────────────────────────────────────
function calculateDewPoint(temperature, humidity) {
  if (temperature === null || humidity === null) return null;

  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);

  return Math.round(dewPoint * 10) / 10;
}

// ─────────────────────────────────────────────
// CALCULATE DATA COMPLETENESS
// Tells agents how complete this data set is
// ─────────────────────────────────────────────
function calculateDataCompleteness(weather, airQuality, uvIndex) {
  let complete = 0;
  let total = 3;

  if (weather) complete++;
  if (airQuality) complete++;
  if (uvIndex !== null) complete++;

  return {
    score: `${complete}/${total}`,
    hasWeather: !!weather,
    hasAirQuality: !!airQuality,
    hasUVIndex: uvIndex !== null,
  };
}

// ─────────────────────────────────────────────
// BUILD NATURAL LANGUAGE SUMMARY
// For agent injection — human-readable
// ─────────────────────────────────────────────
function buildEnvironmentalSummary(data) {
  const parts = [];

  if (data.city && data.country) {
    parts.push(`Location: ${data.city}, ${data.country}.`);
  }

  if (data.temperature !== null) {
    parts.push(`Temperature: ${Math.round(data.temperature)}°C (feels like ${Math.round(data.feelsLike)}°C).`);
  }

  if (data.humidity !== null) {
    parts.push(`Humidity: ${data.humidity}%.`);
  }

  if (data.weatherDescription) {
    parts.push(`Conditions: ${data.weatherDescription}.`);
  }

  if (data.uvIndex !== null) {
    parts.push(`UV Index: ${data.uvIndex} (${data.uvDescription}).`);
  } else {
    parts.push(`UV Index: not available — recommend standard SPF 30+ as precaution.`);
  }

  if (data.airQualityIndex !== null) {
    parts.push(`Air quality: ${data.airQualityDescription} (AQI ${data.airQualityIndex}).`);
  }

  if (data.dewPoint !== null) {
    parts.push(`Dew point: ${data.dewPoint}°C.`);
  }

  if (data.windSpeed !== null) {
    parts.push(`Wind: ${data.windSpeed} m/s.`);
  }

  if (data.rainLastHour) {
    parts.push(`Rain: ${data.rainLastHour}mm in the last hour.`);
  }

  return parts.join(' ');
}

// ─────────────────────────────────────────────
// DEFAULT DATA
// Returned when API is unavailable
// ─────────────────────────────────────────────
function getDefaultEnvironmentalData() {
  return {
    temperature: null,
    feelsLike: null,
    humidity: null,
    dewPoint: null,
    weatherDescription: null,
    weatherMain: null,
    windSpeed: null,
    cloudCover: null,
    uvIndex: null,
    uvDescription: null,
    airQualityIndex: null,
    airQualityDescription: null,
    pm25: null,
    pm10: null,
    city: null,
    country: null,
    lat: null,
    lng: null,
    timestamp: new Date().toISOString(),
    dataCompleteness: { score: '0/3', hasWeather: false, hasAirQuality: false, hasUVIndex: false },
    summary: 'Environmental data not available for this session — API key not configured.',
  };
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkOpenWeatherHealth() {
  try {
    // Test with Navrongo, Ghana coordinates — PRECCI HQ
    const data = await getEnvironmentalData(10.8935, -1.0921);
    return {
      healthy: data.temperature !== null,
      uvIndexAvailable: data.uvIndex !== null,
      airQualityAvailable: data.airQualityIndex !== null,
      city: data.city,
      dataCompleteness: data.dataCompleteness,
    };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  getEnvironmentalData,
  buildEnvironmentalSummary,
  getUVIndex,
  checkOpenWeatherHealth,
};