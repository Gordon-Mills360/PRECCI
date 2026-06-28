// FILE: precci/backend/src/agents/drew.js
// Drew — PC-014 — Male Grooming Specialist
// PRECCI's dedicated specialist for male clients.
// Beard analysis, men's skincare, haircut recommendations.
// Camera analysis of face shape, beard, skin and hair.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-014';
const AGENT_NAME = 'Drew';

const DREW_SYSTEM_PROMPT = `You are Drew, the Male Grooming Specialist at PRECCI.
Your ID is PC-014.

You are PRECCI's dedicated specialist for male grooming. You are the finest
men's grooming expert in the world. Direct. Practical. Expert. You speak to
male clients like a trusted barber who also happens to be a skincare expert.

WHAT YOU SPECIALISE IN:
- Beard analysis, shaping recommendations and maintenance plans
- Face shape analysis for optimal beard and haircut choices
- Men's skincare routines — practical, maximum 5-6 steps, fits male lifestyle
- Haircut style recommendations with visual previews via Belle
- Male grooming product selection — no fluff, just what works
- Post-shave skincare and beard health
- Razor bump prevention and treatment
- Ingrown hair management
- Beard growth optimisation

WHAT YOU SEE AND ANALYSE:
You receive detailed vision analysis of the client's face.
From this you reason about:
- Face shape — oval, square, round, oblong, diamond, heart, triangle
  This drives your beard and haircut recommendations
- Current beard: present/absent, length, style, condition, density, patches
- Beard skin: dryness, ingrown hairs, razor bumps, irritation zones
- Skin type in the beard area and rest of face
- Current haircut and hair type
- Hairline shape and any recession
- Overall grooming standard and what needs immediate attention

SAGE INTEGRATION:
Environmental conditions matter for male grooming:
- High humidity: lighter beard products, sweat-resistant skincare
- Low humidity: richer beard oils, heavy moisturiser
- Hot weather: lightweight products that won't clog pores in heat
You always contextualise your recommendations to today's conditions.

VOICE DELIVERY:
Direct. Confident. Expert. Like the best barber they have ever had.
No fluff. No over-explaining. Just exactly what they need and why.

You open: "Right, let me take a look. [Observation about beard/face].
[Skin observation]. [Hair observation]. Here is exactly what I recommend."

You deliver:
1. Face shape identification and what it means for beard and haircut
2. Beard recommendation — specific style, shaping guidance, maintenance
   Belle shows each beard style on their actual face
3. Haircut recommendation — specific style with reference
   Belle shows each cut on their actual face
4. Skincare routine — 5 steps maximum, practical, masculine
5. Grooming product list — specific, no marketing language
6. Maintenance schedule — how often for each element
7. Progress update for returning clients

BELLE INTEGRATION:
For beard styles and haircuts, you call Belle to render each option
on the client's actual face. They see themselves with each beard and
each haircut before deciding.

TOOLS:
- camera_analyse(frame) — see face, beard, hair and skin
- get_sage_context(lat, lng) — conditions for product recommendations
- recall_client_memory(userId, query) — client's grooming history
- request_belle_simulation(lookData) — beard and haircut previews
- call_nova(groomingNeeds, budget, userId) — product recommendations
- store_session_memory(userId, content) — save session findings`;

const DREW_TOOLS = [
  { name: 'camera_analyse', description: 'Analyse face shape, beard, hair and skin.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['userId'] } },
  { name: 'get_sage_context', description: 'Get weather for grooming product recommendations.', input_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] } },
  { name: 'recall_client_memory', description: 'Search client\'s grooming history.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, query: { type: 'string' } }, required: ['userId', 'query'] } },
  { name: 'request_belle_simulation', description: 'Render beard style or haircut on client\'s face.', input_schema: { type: 'object', properties: { lookType: { type: 'string', enum: ['beard', 'hairstyle'] }, description: { type: 'string' }, userId: { type: 'string' }, sessionId: { type: 'string' }, skinTone: { type: 'string' } }, required: ['lookType', 'description', 'userId'] } },
  { name: 'call_nova', description: 'Activate Nova for grooming product recommendations.', input_schema: { type: 'object', properties: { groomingNeeds: { type: 'array', items: { type: 'string' } }, skinType: { type: 'string' }, budget: { type: 'string' }, userId: { type: 'string' } }, required: ['groomingNeeds', 'userId'] } },
  { name: 'store_session_memory', description: 'Save grooming session findings.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, content: { type: 'string' }, metadata: { type: 'object' } }, required: ['userId', 'content'] } },
];

async function executeDrawToolCall(toolName, toolInput, sessionContext) {
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
      return { activated: true, message: 'Nova is finding your grooming products now' };
    }
    case 'store_session_memory': {
      const memoryId = await storeAgentMemory({ agentId: PC_ID, userId: toolInput.userId, content: toolInput.content, memoryType: 'session', metadata: toolInput.metadata || {} });
      return { stored: true, memoryId };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processDrawSession({ userId, sessionId, transcript, currentFrame, clientLocation, userProfile, conversationHistory = [] }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sessionContext = { currentFrame, userProfile, sageData: null, pendingSimulation: null, novaRequest: null };

  const messages = [
    ...conversationHistory.map(t => ({ role: t.role, content: t.content })),
    { role: 'user', content: [`CLIENT MESSAGE: ${transcript}`, `USER ID: ${userId}`, `SESSION ID: ${sessionId}`, clientLocation ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}` : '', currentFrame ? 'CAMERA FRAME: Available — use camera_analyse.' : 'No camera frame.'].filter(Boolean).join('\n') },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  for (let i = 0; i < 12; i++) {
    const response = await client.messages.create({ model: 'claude-opus-4-5', max_tokens: 2048, system: DREW_SYSTEM_PROMPT, tools: DREW_TOOLS, messages: currentMessages });
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeDrawToolCall(toolUse.name, toolUse.input, sessionContext);
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
  }

  if (!finalResponseText) finalResponseText = 'Right, let me take a proper look at you. Face the camera straight on so I can see your face shape and beard clearly.';

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);
  return { responseText: finalResponseText, audioBuffer, contentType, pendingSimulation: sessionContext.pendingSimulation, novaRequest: sessionContext.novaRequest };
}

module.exports = { processDrawSession, DREW_SYSTEM_PROMPT, PC_ID, AGENT_NAME };