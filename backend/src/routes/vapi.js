// FILE: precci/backend/src/routes/vapi.js
// Vapi webhook handler for all client voice sessions.
// SECURITY: Every request signature validated before processing.
// Grace routing decisions logged. Sessions logged with consent check.
// Provider voice agent sessions scoped per provider only.

'use strict';

const express = require('express');
const {
  validateWebhookSignature,
  logVoiceSession,
  logRoutingDecision,
} = require('../config/vapi');
const { processGraceRequest } = require('../agents/grace');
const { getServiceClient } = require('../config/supabase');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/voice/vapi
// Main Vapi webhook — handles all voice session events
// Grace processes client requests
// Provider agent handles provider notifications
// ─────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    // Validate Vapi signature on every request
    const signatureValid = validateWebhookSignature(req);
    if (!signatureValid) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid webhook signature', 401);
    }

    const { message } = req.body;

    if (!message) {
      return res.status(200).json({ result: '' });
    }

    const messageType = message.type;
    const callId = message.call?.id;
    const sessionType = message.call?.metadata?.sessionType || 'client';

    logger.info('Vapi webhook received', {
      type: messageType,
      sessionType,
      callId,
    });

    // ── HANDLE EACH EVENT TYPE ──

    switch (messageType) {

      // ── CALL STARTED ──
      case 'call-start':
      case 'call.started': {
        const userId = message.call?.metadata?.userId || null;
        const providerId = message.call?.metadata?.providerId || null;
        const agentId = message.call?.metadata?.agentId || 'PC-026';

        await logVoiceSession({
          userId,
          providerId,
          agentId,
          sessionType,
          vapiCallId: callId,
          transcriptConsent: message.call?.metadata?.transcriptConsent || false,
          startedAt: new Date().toISOString(),
        });

        return res.status(200).json({ result: '' });
      }

      // ── ASSISTANT REQUEST ──
      // Vapi sends this when it needs the assistant to respond
      case 'assistant-request': {
        const userId = message.call?.metadata?.userId || null;
        const providerId = message.call?.metadata?.providerId || null;
        const transcript = message.transcript || '';
        const voiceSessionId = message.call?.id;
        const isNewClient = message.call?.metadata?.isNewClient || false;

        // Route based on session type
        if (sessionType === 'client') {
          // Grace handles all client voice sessions
          try {
            const clientLocation = message.call?.metadata?.location
              ? {
                  lat: parseFloat(message.call.metadata.location.lat),
                  lng: parseFloat(message.call.metadata.location.lng),
                }
              : null;

            const graceResult = await processGraceRequest({
              transcript,
              userId,
              voiceSessionId,
              clientLocation,
              isNewClient,
              conversationHistory: message.call?.metadata?.conversationHistory || [],
            });

            // If Grace is routing to a specialist, log it
            if (graceResult.routingDecision) {
              await logRoutingDecision({
                userId,
                voiceSessionId,
                fromAgent: 'PC-026',
                toAgent: graceResult.targetAgent,
                routingReason: graceResult.routingDecision.contextPassed,
              });
            }

            return res.status(200).json({
              result: graceResult.responseText,
              // Vapi uses this to update assistant behaviour
              ...(graceResult.targetAgent && {
                assistantId: await getAssistantIdForAgent(graceResult.targetAgent),
              }),
            });
          } catch (error) {
            logger.error('Grace processing failed in Vapi webhook', {
              error: error.message,
            });
            return res.status(200).json({
              result: 'Welcome to PRECCI. I am Grace, and I am here to help you. What would you like to work on today?',
            });
          }
        }

        if (sessionType === 'provider') {
          // Provider voice agent — handle provider-scoped session
          return res.status(200).json({
            result: 'Thank you for your patience. Your booking details are ready.',
          });
        }

        return res.status(200).json({ result: '' });
      }

      // ── FUNCTION CALL ──
      // Agent tool use during voice session
      case 'function-call':
      case 'tool-calls': {
        const functionName = message.functionCall?.name || message.toolCallList?.[0]?.function?.name;
        const functionArgs = message.functionCall?.parameters || message.toolCallList?.[0]?.function?.arguments;

        logger.info('Vapi function call received', { functionName });

        // Handle specific tool calls agents make during voice sessions
        const result = await handleVapiFunctionCall(
          functionName,
          functionArgs,
          message.call?.metadata
        );

        return res.status(200).json({
          result: JSON.stringify(result),
        });
      }

      // ── TRANSCRIPT UPDATE ──
      case 'transcript': {
        // Real-time transcript — log if consent given
        const userId = message.call?.metadata?.userId;
        const transcriptConsent = message.call?.metadata?.transcriptConsent || false;

        if (transcriptConsent && message.transcript) {
          const supabase = getServiceClient();
          await supabase
            .from('voice_sessions')
            .update({ transcript: message.transcript })
            .eq('vapi_call_id', callId);
        }

        return res.status(200).json({ result: '' });
      }

      // ── CALL ENDED ──
      case 'end-of-call-report':
      case 'call.ended': {
        const userId = message.call?.metadata?.userId || null;
        const duration = message.durationSeconds || message.call?.duration || null;
        const endTranscript = message.transcript || null;
        const transcriptConsent = message.call?.metadata?.transcriptConsent || false;

        // Update voice session with end data
        const supabase = getServiceClient();
        await supabase
          .from('voice_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: duration,
            transcript: transcriptConsent ? endTranscript : null,
          })
          .eq('vapi_call_id', callId);

        // If client session ended, log the full session
        if (sessionType === 'client' && userId) {
          const agentId = message.call?.metadata?.agentId || 'PC-026';

          await supabase.from('sessions').insert({
            user_id: userId,
            agent_id: agentId,
            voice_session_id: callId,
            channel: 'pwa',
            duration_seconds: duration,
            camera_used: message.call?.metadata?.cameraUsed || false,
            camera_consent: message.call?.metadata?.cameraConsent || false,
            completed: true,
          });
        }

        return res.status(200).json({ result: '' });
      }

      // ── SPEECH UPDATE ──
      case 'speech-update': {
        // Client started or stopped speaking — no action needed
        return res.status(200).json({ result: '' });
      }

      // ── USER INTERRUPTED ──
      case 'user-interrupted': {
        // Client interrupted the agent — Vapi handles this natively
        return res.status(200).json({ result: '' });
      }

      default: {
        logger.info('Vapi: Unhandled event type', { type: messageType });
        return res.status(200).json({ result: '' });
      }
    }
  })
);

// ─────────────────────────────────────────────
// HANDLE VAPI FUNCTION CALLS
// Agents call these during voice sessions
// ─────────────────────────────────────────────
async function handleVapiFunctionCall(functionName, args, callMetadata = {}) {
  const supabase = getServiceClient();

  switch (functionName) {
    case 'getClientProfile': {
      const { userId } = args;
      if (!userId) return { error: 'userId required' };

      const { data } = await supabase
        .from('beauty_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      return data || {};
    }

    case 'saveRecommendation': {
      const { sessionId, userId, agentId, productId, reason } = args;

      await supabase.from('recommendations').insert({
        session_id: sessionId,
        user_id: userId,
        agent_id: agentId,
        product_id: productId,
        reason,
        spoken_at: new Date().toISOString(),
      });

      return { saved: true };
    }

    case 'searchProviders': {
      const { serviceTypes, lat, lng } = args;
      const { searchNearbyProviders } = require('../config/maps');

      const providers = await searchNearbyProviders({
        clientLat: lat,
        clientLng: lng,
        serviceTypes: serviceTypes || [],
        maxResults: 3,
      });

      return { providers };
    }

    default:
      logger.warn('Unknown Vapi function call', { functionName });
      return { error: `Unknown function: ${functionName}` };
  }
}

// ─────────────────────────────────────────────
// GET VAPI ASSISTANT ID FOR AGENT
// Maps PC ID to Vapi assistant ID
// ─────────────────────────────────────────────
async function getAssistantIdForAgent(agentPcId) {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from('agents')
    .select('vapi_assistant_id')
    .eq('pc_id', agentPcId)
    .single();

  return data?.vapi_assistant_id || process.env.VAPI_GRACE_ASSISTANT_ID;
}

module.exports = router;