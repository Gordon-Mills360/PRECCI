// FILE: precci/backend/src/agents/mia.js
// Mia — PC-010 — Makeup & Grooming Appearance
// Serves ALL genders. Never assumes. Always asks before recommending
// grooming appearance products to male clients.
// Reasons autonomously from facial structure analysis.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-010';
const AGENT_NAME = 'Mia';

const MIA_SYSTEM_PROMPT = `You are Mia, the Makeup and Grooming Appearance specialist at PRECCI.
Your ID is PC-010.

You are the world's finest makeup artist and grooming appearance expert.
You serve ALL genders with complete expertise.

YOUR CRITICAL RULE ABOUT GENDER:
You NEVER assume what any client wants based on their gender or appearance.
For any client, you first understand what they are looking for by listening
to what they have said. Then you recommend accordingly.

FOR FEMALE AND NON-BINARY CLIENTS seeking makeup:
Full makeup analysis and recommendations — foundation matching, complete looks,
event makeup, everyday looks, virtual try-on for every recommendation.

FOR MALE CLIENTS:
You are fully expert in male grooming appearance, including:
- Tinted moisturisers and BB creams for men
- Concealers for dark circles and blemishes
- Brow grooming and shaping
- Lip care and tinted lip balms
- Skincare with colour correction
You only recommend these when the client expresses openness to them.
You might say: "I can see some dark circles under your eyes — there are some
grooming products that can help with that if that's something you'd be open to?"
You wait for their response before recommending. You never assume.

WHAT YOU SEE AND ANALYSE:
You receive a detailed vision analysis of facial structure.
From this you reason about:
- Face shape with clinical precision
- Eye shape and spacing
- Lip proportions
- Brow condition and symmetry
- Skin undertone for perfect colour matching
- Facial proportions and balance
- Features to enhance and how

VOICE DELIVERY:
Warm, expert, creative. You speak like the best makeup artist in the world.

You open: "I can see your facial structure clearly. You have [face shape observation].
[Feature observation]. [Undertone assessment]. Let me create [the right look for
what they've described they want]."

You deliver:
1. Facial structure analysis with the reasoning
2. Foundation shade recommendation with undertone explanation
3. Complete look for the occasion or need stated
   — Belle renders each element as you describe it
4. Step-by-step application guidance by voice
5. Product hand-off to Nova

BELLE INTEGRATION:
As you describe each element of the look, Belle renders it on the client's
actual face in real time. The foundation appears. Then the eye look.
Then the lip colour. Client sees their complete look before leaving.

TOOLS:
- camera_analyse(frame) — see facial structure
- get_sage_context(lat, lng) — environmental context
- recall_client_memory(userId, query) — previous sessions
- request_belle_simulation(lookData) — render makeup looks
- call_nova(makeupNeeds, budget, userId) — product recommendations
- store_session_memory(userId, content) — save session findings`;

const MIA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'Analyse facial structure through camera.',
    input_schema: { type: 'object', properties: { userId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['userId'] },
  },
  {
    name: 'get_sage_context',
    description: 'Get environmental conditions — affects makeup longevity and product recommendations.',
    input_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] },
  },
  {
    name: 'recall_client_memory',
    description: 'Search client\'s makeup history and preferences.',
    input_schema: { type: 'object', properties: { userId: { type: 'string' }, query: { type: 'string' } }, required: ['userId', 'query'] },
  },
  {
    name: 'request_belle_simulation',
    description: 'Render makeup look on client\'s face. Call for each major element of the look.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: { type: 'string', enum: ['makeup'] },
        description: { type: 'string' },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        skinTone: { type: 'string' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova for makeup and grooming product recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        makeupNeeds: { type: 'array', items: { type: 'string' } },
        foundationShade: { type: 'string' },
        budget: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['makeupNeeds', 'userId'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save session findings to Mia\'s memory.',
    input_schema: { type: 'object', properties: { userId: { type: 'string' }, content: { type: 'string' }, metadata: { type: 'object' } }, required: ['userId', 'content'] },
  },
];

async function executeMiaToolCall(toolName, toolInput, sessionContext) {
  switch (toolName) {
    case 'camera_analyse': {
      if (!sessionContext.currentFrame) return { error: 'No camera frame available' };
      return await captureAndAnalyse({ frameBase64: sessionContext.currentFrame, userId: toolInput.userId, agentId: PC_ID, userProfile: sessionContext.userProfile, sageData: sessionContext.sageData });
    }
    case 'get_sage_context': {
      const ctx = await getContextForAgent(toolInput.lat, toolInput.lng, PC_ID);
      sessionContext.sageData = ctx;
      return ctx;
    }
    case 'recall_client_memory': {
      const memories = await searchAgentMemory({ agentId: PC_ID, userId: toolInput.userId, query: toolInput.query });
      return { memories, memoryContext: buildMemoryContext(memories) };
    }
    case 'request_belle_simulation': {
      if (!sessionContext.currentFrame) return { error: 'No camera frame for simulation' };
      const simulation = await requestSimulation({ frameBase64: sessionContext.currentFrame, lookData: { lookType: toolInput.lookType, description: toolInput.description, agentId: PC_ID, skinTone: toolInput.skinTone }, userId: toolInput.userId, sessionId: toolInput.sessionId });
      sessionContext.pendingSimulation = simulation;
      return simulation;
    }
    case 'call_nova': {
      sessionContext.novaRequest = toolInput;
      return { activated: true, message: 'Nova is finding your products now' };
    }
    case 'store_session_memory': {
      const memoryId = await storeAgentMemory({ agentId: PC_ID, userId: toolInput.userId, content: toolInput.content, memoryType: 'session', metadata: toolInput.metadata || {} });
      return { stored: true, memoryId };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processMiaSession({ userId, sessionId, transcript, currentFrame, clientLocation, userProfile, conversationHistory = [] }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sessionContext = { currentFrame, userProfile, sageData: null, pendingSimulation: null, novaRequest: null };

  const messages = [
    ...conversationHistory.map(t => ({ role: t.role, content: t.content })),
    { role: 'user', content: [`CLIENT MESSAGE: ${transcript}`, `USER ID: ${userId}`, `SESSION ID: ${sessionId}`, clientLocation ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}` : '', currentFrame ? 'CAMERA FRAME: Available — use camera_analyse.' : 'No camera frame.'].filter(Boolean).join('\n') },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  for (let i = 0; i < 12; i++) {
    const response = await client.messages.create({ model: 'claude-opus-4-5', max_tokens: 2048, system: MIA_SYSTEM_PROMPT, tools: MIA_TOOLS, messages: currentMessages });
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeMiaToolCall(toolUse.name, toolUse.input, sessionContext);
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
  }

  if (!finalResponseText) finalResponseText = 'Let me look at your facial structure clearly. Please face the camera directly.';

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);
  return { responseText: finalResponseText, audioBuffer, contentType, pendingSimulation: sessionContext.pendingSimulation, novaRequest: sessionContext.novaRequest };
}

module.exports = { processMiaSession, MIA_SYSTEM_PROMPT, PC_ID, AGENT_NAME };