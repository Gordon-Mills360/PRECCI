// FILE: precci/backend/src/config/vapi.js
// SECURITY: Vapi webhook signatures validated on every request.
// Voice sessions scoped per user — no cross-user data.
// Provider voice agents scoped per provider — no cross-provider data.
// ElevenLabs voice IDs never exposed to frontend.

'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { getServiceClient } = require('./supabase');
const logger = require('../utils/logger');

const VAPI_BASE_URL = 'https://api.vapi.ai';

// ─────────────────────────────────────────────
// GET VAPI HTTP CLIENT
// All calls server-side only
// ─────────────────────────────────────────────
function getVapiClient() {
  if (!process.env.VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY is not configured');
  }

  return axios.create({
    baseURL: VAPI_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

// ─────────────────────────────────────────────
// VALIDATE VAPI WEBHOOK SIGNATURE
// Every Vapi webhook request must pass this check
// before any processing begins
// ─────────────────────────────────────────────
function validateWebhookSignature(req) {
  const signature = req.headers['x-vapi-signature'];

  if (!signature) {
    logger.warn('Vapi webhook received without signature');
    return false;
  }

  if (!process.env.VAPI_WEBHOOK_SECRET) {
    logger.error('VAPI_WEBHOOK_SECRET is not configured');
    return false;
  }

  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.VAPI_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const trusted = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!trusted) {
    logger.warn('Vapi webhook signature mismatch — possible spoofed request');
  }

  return trusted;
}

// ─────────────────────────────────────────────
// LOG VOICE SESSION
// Records all voice sessions to voice_sessions table
// Transcript only stored when consent is given
// ─────────────────────────────────────────────
async function logVoiceSession({
  userId = null,
  providerId = null,
  agentId,
  sessionType,
  vapiCallId,
  durationSeconds = null,
  transcript = null,
  transcriptConsent = false,
  startedAt,
  endedAt = null,
}) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('voice_sessions')
    .upsert(
      {
        user_id: userId,
        provider_id: providerId,
        agent_id: agentId,
        session_type: sessionType,
        vapi_call_id: vapiCallId,
        duration_seconds: durationSeconds,
        // Only store transcript if explicit consent given
        transcript: transcriptConsent ? transcript : null,
        transcript_consent: transcriptConsent,
        started_at: startedAt || new Date().toISOString(),
        ended_at: endedAt,
      },
      { onConflict: 'vapi_call_id' }
    )
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to log voice session', {
      agentId,
      error: error.message,
    });
    return null;
  }

  return data?.id;
}

// ─────────────────────────────────────────────
// LOG ROUTING DECISION
// Every Grace routing decision logged here
// ─────────────────────────────────────────────
async function logRoutingDecision({
  userId,
  voiceSessionId,
  fromAgent,
  toAgent,
  routingReason,
}) {
  const supabase = getServiceClient();

  const { error } = await supabase.from('routing_log').insert({
    user_id: userId,
    voice_session_id: voiceSessionId,
    from_agent: fromAgent,
    to_agent: toAgent,
    routing_reason: routingReason,
    timestamp: new Date().toISOString(),
  });

  if (error) {
    logger.error('Failed to log routing decision', { error: error.message });
  }
}

// ─────────────────────────────────────────────
// CREATE VAPI ASSISTANT
// Used when Brook needs to create a new provider
// voice agent on registration
// ─────────────────────────────────────────────
async function createVapiAssistant({
  name,
  systemPrompt,
  firstMessage,
  voiceId,
  webhookUrl,
}) {
  const client = getVapiClient();

  const assistantConfig = {
    name,
    model: {
      provider: 'anthropic',
      model: 'claude-opus-4-5',
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1024,
    },
    voice: {
      provider: 'elevenlabs',
      voiceId,
      stability: 0.75,
      similarityBoost: 0.85,
    },
    firstMessage,
    serverUrl: webhookUrl || `${process.env.API_URL}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
    endCallFunctionEnabled: true,
    recordingEnabled: false,
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
  };

  try {
    const response = await client.post('/assistant', assistantConfig);
    return response.data;
  } catch (error) {
    logger.error('Failed to create Vapi assistant', {
      name,
      error: error.response?.data || error.message,
    });
    throw new Error(`Failed to create voice assistant: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// GET GRACE ASSISTANT CONFIG
// Grace is always-on for all clients
// This returns her Vapi assistant ID from env
// ─────────────────────────────────────────────
function getGraceAssistantId() {
  const id = process.env.VAPI_GRACE_ASSISTANT_ID;
  if (!id) {
    logger.warn('VAPI_GRACE_ASSISTANT_ID not configured');
  }
  return id;
}

// ─────────────────────────────────────────────
// INITIATE OUTBOUND CALL
// Used by Brook to notify providers of new bookings
// ─────────────────────────────────────────────
async function initiateOutboundCall({
  phoneNumber,
  assistantId,
  assistantOverrides = {},
}) {
  const client = getVapiClient();

  try {
    const response = await client.post('/call/phone', {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
      },
      assistantId,
      assistantOverrides,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to initiate Vapi outbound call', {
      error: error.response?.data || error.message,
    });
    throw new Error(`Failed to initiate provider notification call: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// GET CALL STATUS
// Retrieves status and transcript of a completed call
// ─────────────────────────────────────────────
async function getCallStatus(callId) {
  const client = getVapiClient();

  try {
    const response = await client.get(`/call/${callId}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get Vapi call status', {
      callId,
      error: error.message,
    });
    throw new Error(`Failed to retrieve call status: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkVapiHealth() {
  try {
    const client = getVapiClient();
    await client.get('/assistant?limit=1');
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  validateWebhookSignature,
  logVoiceSession,
  logRoutingDecision,
  createVapiAssistant,
  getGraceAssistantId,
  initiateOutboundCall,
  getCallStatus,
  checkVapiHealth,
};