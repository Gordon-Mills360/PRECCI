// FILE: precci/backend/src/routes/jarvis.js
// JARVIS voice gateway — Precious Mills only
// SECURITY: Requires precious_owner JWT. Voice audio processed server-side.
// Whisper transcription → Claude reasoning → ElevenLabs response.
// All commands logged to jarvis_commands table.

'use strict';

const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const { processVivienneRequest } = require('../agents/vivienne');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — in-memory audio storage
// Max 25MB for audio files (Whisper limit)
// ─────────────────────────────────────────────
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new PrecciError('VALIDATION_ERROR', 'Invalid audio format', 400), false);
    }
  },
});

// ─────────────────────────────────────────────
// OPENAI CLIENT FOR WHISPER
// ─────────────────────────────────────────────
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new PrecciError('AGENT_ERROR', 'Voice transcription not configured', 503);
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─────────────────────────────────────────────
// POST /api/voice/jarvis
// Receives Precious's voice audio, transcribes, processes via Vivienne,
// returns audio response and dashboard navigation action
// ─────────────────────────────────────────────
router.post(
  '/',
  verifyToken,
  requireRole(['precious_owner']),
  audioUpload.single('audio'),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    if (!req.file) {
      throw new PrecciError('VALIDATION_ERROR', 'No audio file received', 400);
    }

    const {
      conversationHistory = '[]',
      dashboardContext = '{}',
    } = req.body;

    let parsedHistory = [];
    let parsedContext = {};

    try {
      parsedHistory = JSON.parse(conversationHistory);
      parsedContext = JSON.parse(dashboardContext);
    } catch {
      // Use defaults if parsing fails
    }

    logger.info('JARVIS: Audio received from Precious', {
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    // ── STEP 1: WHISPER TRANSCRIPTION ──
    const openai = getOpenAIClient();

    // Whisper requires a File-like object with name
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const audioFile = new File([audioBlob], `precious-audio.${req.file.mimetype.split('/')[1]}`, {
      type: req.file.mimetype,
    });

    let transcript;
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });
      transcript = transcription.trim();
    } catch (whisperError) {
      logger.error('JARVIS: Whisper transcription failed', {
        error: whisperError.message,
      });
      throw new PrecciError('VOICE_SESSION_ERROR', 'Voice transcription failed', 503);
    }

    if (!transcript || transcript.length === 0) {
      throw new PrecciError('VOICE_SESSION_ERROR', 'No speech detected in audio', 400);
    }

    logger.info('JARVIS: Transcript received', {
      transcriptLength: transcript.length,
    });

    // ── STEP 2: VIVIENNE PROCESSES THE REQUEST ──
    let vivienneResult;
    try {
      vivienneResult = await processVivienneRequest({
        transcript,
        conversationHistory: parsedHistory,
        dashboardContext: parsedContext,
      });
    } catch (vivienneError) {
      logger.error('JARVIS: Vivienne processing failed', {
        error: vivienneError.message,
      });
      throw new PrecciError('AGENT_ERROR', 'Vivienne is temporarily unavailable', 503);
    }

    const durationMs = Date.now() - startTime;

    logger.info('JARVIS: Response ready', {
      durationMs,
      hasNavigation: vivienneResult.navigationActions.length > 0,
    });

    // ── STEP 3: RETURN AUDIO + NAVIGATION ACTIONS ──
    // Send multipart response: audio buffer + JSON metadata
    res.set({
      'Content-Type': 'audio/mpeg',
      'X-JARVIS-Response-Text': encodeURIComponent(
        vivienneResult.responseText.substring(0, 500)
      ),
      'X-JARVIS-Navigation': encodeURIComponent(
        JSON.stringify(vivienneResult.navigationActions)
      ),
      'X-JARVIS-Duration-Ms': durationMs.toString(),
    });

    res.send(vivienneResult.audioBuffer);
  })
);

// ─────────────────────────────────────────────
// POST /api/voice/jarvis/text
// Alternative endpoint for text input (testing only in development)
// Never available in production
// ─────────────────────────────────────────────
router.post(
  '/text',
  verifyToken,
  requireRole(['precious_owner']),
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      throw new PrecciError('NOT_FOUND', 'This endpoint is not available', 404);
    }

    const { transcript, conversationHistory = [], dashboardContext = {} } = req.body;

    if (!transcript) {
      throw new PrecciError('VALIDATION_ERROR', 'Transcript is required', 400);
    }

    const vivienneResult = await processVivienneRequest({
      transcript,
      conversationHistory,
      dashboardContext,
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'X-JARVIS-Response-Text': encodeURIComponent(vivienneResult.responseText),
      'X-JARVIS-Navigation': encodeURIComponent(
        JSON.stringify(vivienneResult.navigationActions)
      ),
    });

    res.send(vivienneResult.audioBuffer);
  })
);

// ─────────────────────────────────────────────
// GET /api/voice/jarvis/history
// Returns recent JARVIS command history for dashboard display
// ─────────────────────────────────────────────
router.get(
  '/history',
  verifyToken,
  requireRole(['precious_owner']),
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

    const { data, error } = await supabase
      .from('jarvis_commands')
      .select('id, parsed_intent, response_summary, navigation_action, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve command history', 500);
    }

    res.json({
      success: true,
      commands: data || [],
    });
  })
);

module.exports = router;