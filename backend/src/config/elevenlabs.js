// FILE: precci/backend/src/config/elevenlabs.js
// SECURITY: ElevenLabs API calls are server-side ONLY.
// API key never exposed to frontend under any circumstances.
// Every agent has a unique voice mapped by PC ID.
// Voice IDs populated from environment variables — Gordon fills these.

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// ELEVENLABS API CONFIGURATION
// ─────────────────────────────────────────────
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// ─────────────────────────────────────────────
// ALL 28 AGENT VOICE IDs
// Mapped by PC ID — populated from environment variables
// Gordon sets these in .env after creating voices in ElevenLabs
// ─────────────────────────────────────────────
function getAgentVoiceMap() {
  return {
    'JARVIS':   process.env.ELEVENLABS_VOICE_JARVIS,
    'PC-001':   process.env.ELEVENLABS_VOICE_VIVIENNE,
    'PC-002':   process.env.ELEVENLABS_VOICE_CELESTE,
    'PC-003':   process.env.ELEVENLABS_VOICE_MARCUS,
    'PC-004':   process.env.ELEVENLABS_VOICE_SIENNA,
    'PC-005':   process.env.ELEVENLABS_VOICE_RAFAEL,
    'PC-006':   process.env.ELEVENLABS_VOICE_NADIA,
    'PC-007':   process.env.ELEVENLABS_VOICE_SEBASTIAN,
    'PC-008':   process.env.ELEVENLABS_VOICE_LUNA,
    'PC-009':   process.env.ELEVENLABS_VOICE_ZARA,
    'PC-010':   process.env.ELEVENLABS_VOICE_MIA,
    'PC-011':   process.env.ELEVENLABS_VOICE_ISLA,
    'PC-012':   process.env.ELEVENLABS_VOICE_REMY,
    'PC-013':   process.env.ELEVENLABS_VOICE_CORA,
    'PC-014':   process.env.ELEVENLABS_VOICE_DREW,
    'PC-015':   process.env.ELEVENLABS_VOICE_SAGE,
    'PC-016':   process.env.ELEVENLABS_VOICE_BELLE,
    'PC-017':   process.env.ELEVENLABS_VOICE_NOVA,
    'PC-018':   process.env.ELEVENLABS_VOICE_PIPER,
    'PC-019':   process.env.ELEVENLABS_VOICE_NINA,
    'PC-020':   process.env.ELEVENLABS_VOICE_ELTON,
    'PC-021':   process.env.ELEVENLABS_VOICE_LENA,
    'PC-022':   process.env.ELEVENLABS_VOICE_FINN,
    'PC-023':   process.env.ELEVENLABS_VOICE_AURORA,
    'PC-024':   process.env.ELEVENLABS_VOICE_COLE,
    'PC-025':   process.env.ELEVENLABS_VOICE_EVA,
    'PC-026':   process.env.ELEVENLABS_VOICE_GRACE,
    'PC-027':   process.env.ELEVENLABS_VOICE_BROOK,
  };
}

// ─────────────────────────────────────────────
// GET VOICE ID FOR AGENT
// ─────────────────────────────────────────────
function getVoiceIdForAgent(pcId) {
  const voiceMap = getAgentVoiceMap();
  const voiceId = voiceMap[pcId];

  if (!voiceId) {
    logger.warn('No ElevenLabs voice ID configured for agent', { pcId });
    // Fall back to Vivienne's voice as default
    return process.env.ELEVENLABS_VOICE_VIVIENNE;
  }

  return voiceId;
}

// ─────────────────────────────────────────────
// SYNTHESISE SPEECH
// Converts text to audio buffer using ElevenLabs
// Returns raw audio buffer (mp3) for streaming to client
// ─────────────────────────────────────────────
async function synthesiseSpeech(text, agentPcId, options = {}) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('synthesiseSpeech: text is required');
  }

  const voiceId = getVoiceIdForAgent(agentPcId);

  if (!voiceId) {
    throw new Error(`No voice configured for agent: ${agentPcId}`);
  }

  const requestBody = {
    text: text.trim(),
    model_id: options.modelId || 'eleven_multilingual_v2',
    voice_settings: {
      stability: options.stability ?? 0.75,
      similarity_boost: options.similarityBoost ?? 0.85,
      style: options.style ?? 0.35,
      use_speaker_boost: options.useSpeakerBoost ?? true,
    },
  };

  try {
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      requestBody,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      }
    );

    return {
      audioBuffer: Buffer.from(response.data),
      contentType: 'audio/mpeg',
      voiceId,
      agentPcId,
    };
  } catch (error) {
    if (error.response) {
      logger.error('ElevenLabs API error', {
        status: error.response.status,
        agentPcId,
      });

      if (error.response.status === 401) {
        throw new Error('ElevenLabs authentication failed — check API key');
      }
      if (error.response.status === 422) {
        throw new Error('ElevenLabs rejected voice settings — check voice ID');
      }
      if (error.response.status === 429) {
        throw new Error('ElevenLabs rate limit reached');
      }
    }

    throw new Error(`Speech synthesis failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// SYNTHESISE SPEECH TO STREAM
// Returns a readable stream for direct pipe to HTTP response
// More efficient for longer responses
// ─────────────────────────────────────────────
async function synthesiseSpeechStream(text, agentPcId, options = {}) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  if (!text || typeof text !== 'string') {
    throw new Error('synthesiseSpeechStream: text is required');
  }

  const voiceId = getVoiceIdForAgent(agentPcId);

  const response = await axios.post(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/stream`,
    {
      text: text.trim(),
      model_id: options.modelId || 'eleven_multilingual_v2',
      voice_settings: {
        stability: options.stability ?? 0.75,
        similarity_boost: options.similarityBoost ?? 0.85,
        style: options.style ?? 0.35,
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      responseType: 'stream',
      timeout: 60000,
    }
  );

  return response.data;
}

// ─────────────────────────────────────────────
// LIST AVAILABLE VOICES
// Used by Marcus during setup to verify voice configurations
// ─────────────────────────────────────────────
async function listVoices() {
  try {
    const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      timeout: 10000,
    });
    return response.data.voices || [];
  } catch (error) {
    logger.error('Failed to list ElevenLabs voices', { error: error.message });
    throw new Error('Failed to retrieve voice list from ElevenLabs');
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkElevenLabsHealth() {
  try {
    await listVoices();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  synthesiseSpeech,
  synthesiseSpeechStream,
  getVoiceIdForAgent,
  getAgentVoiceMap,
  listVoices,
  checkElevenLabsHealth,
};