// FILE: precci/backend/src/config/openai.js
// OpenAI configuration — used exclusively for Whisper voice transcription
// for JARVIS (Precious's voice gateway).
// All calls server-side only. API key never exposed to frontend.

'use strict';

const OpenAI = require('openai');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// GET OPENAI CLIENT
// ─────────────────────────────────────────────
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 2,
  });
}

// ─────────────────────────────────────────────
// TRANSCRIBE AUDIO WITH WHISPER
// Converts Precious's voice audio to text for JARVIS
// Also used if any voice session needs transcription
// audioBuffer: Buffer containing audio data
// mimeType: the audio format (audio/webm, audio/mp4, etc.)
// ─────────────────────────────────────────────
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const openai = getOpenAIClient();

  const extensionMap = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
  };

  const extension = extensionMap[mimeType] || 'webm';

  try {
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    const audioFile = new File(
      [audioBlob],
      `precci-audio.${extension}`,
      { type: mimeType }
    );

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    const transcript = transcription?.trim();

    if (!transcript || transcript.length === 0) {
      throw new Error('No speech detected in audio');
    }

    return transcript;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('Whisper rate limit reached — please try again shortly');
    }
    if (error.status === 413) {
      throw new Error('Audio file too large for transcription');
    }

    logger.error('Whisper transcription failed', { error: error.message });
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// GENERATE EMBEDDING
// Used for agent memory storage in pgvector
// Returns 1536-dimension vector for text
// ─────────────────────────────────────────────
async function generateEmbedding(text) {
  const openai = getOpenAIClient();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('generateEmbedding: text is required');
  }

  // Truncate to OpenAI's token limit if needed
  const truncatedText = text.substring(0, 8000);

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: truncatedText,
    });

    const embedding = response.data?.[0]?.embedding;

    if (!embedding || embedding.length !== 1536) {
      throw new Error('Invalid embedding returned from OpenAI');
    }

    return embedding;
  } catch (error) {
    logger.error('Embedding generation failed', { error: error.message });
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkOpenAIHealth() {
  try {
    const openai = getOpenAIClient();
    await openai.models.list();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  getOpenAIClient,
  transcribeAudio,
  generateEmbedding,
  checkOpenAIHealth,
};