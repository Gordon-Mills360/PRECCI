// FILE: precci/backend/src/config/replicate.js
// Replicate API configuration for Belle's virtual try-on.
// All calls server-side only. Simulation URLs proxied through backend.
// Camera frames never stored permanently without explicit consent.

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const REPLICATE_BASE_URL = 'https://api.replicate.com/v1';

// ─────────────────────────────────────────────
// GET REPLICATE HTTP CLIENT
// ─────────────────────────────────────────────
function getReplicateClient() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  return axios.create({
    baseURL: REPLICATE_BASE_URL,
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 minutes — image generation takes time
  });
}

// ─────────────────────────────────────────────
// RUN PREDICTION
// Submits a prediction to Replicate and polls until complete
// Used by Belle for virtual try-on rendering
// ─────────────────────────────────────────────
async function runPrediction(modelVersion, input) {
  const client = getReplicateClient();

  // Submit prediction
  const { data: prediction } = await client.post('/predictions', {
    version: modelVersion,
    input,
  });

  if (!prediction.id) {
    throw new Error('Replicate: No prediction ID returned');
  }

  // Poll until complete — max 90 seconds
  const maxAttempts = 30;
  const pollIntervalMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const { data: status } = await client.get(`/predictions/${prediction.id}`);

    if (status.status === 'succeeded') {
      return {
        id: status.id,
        output: status.output,
        status: 'succeeded',
      };
    }

    if (status.status === 'failed' || status.status === 'canceled') {
      logger.error('Replicate prediction failed', {
        predictionId: prediction.id,
        status: status.status,
        error: status.error,
      });
      throw new Error(`Replicate prediction ${status.status}: ${status.error}`);
    }
  }

  throw new Error('Replicate prediction timed out after 90 seconds');
}

// ─────────────────────────────────────────────
// PROXY SIMULATION URL
// Replicate URLs are proxied through PRECCI backend
// so the raw Replicate URL is never exposed to the client
// ─────────────────────────────────────────────
async function proxySimulationUrl(replicateUrl) {
  try {
    const response = await axios.get(replicateUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return {
      data: Buffer.from(response.data),
      contentType: response.headers['content-type'] || 'image/png',
    };
  } catch (error) {
    logger.error('Failed to proxy simulation URL', { error: error.message });
    throw new Error('Failed to retrieve simulation image');
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkReplicateHealth() {
  try {
    const client = getReplicateClient();
    await client.get('/models/stability-ai/sdxl');
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  runPrediction,
  proxySimulationUrl,
  checkReplicateHealth,
};