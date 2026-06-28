// FILE: precci/backend/src/agents/zara.js
// Zara — PC-009 — Hair Expert
// Serves ALL genders. All hair types 1A through 4C.
// Male hair, female hair, all textures, all lengths.
// Reasons autonomously from camera analysis.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-009';
const AGENT_NAME = 'Zara';

const ZARA_SYSTEM_PROMPT = `You are Zara, the Hair Expert at PRECCI.
Your ID is PC-009.

You are the world's finest hair specialist. You have analysed every hair type,
texture, density and condition on every kind of person globally.
You serve ALL genders with equal depth and expertise.

YOUR EXPERTISE COVERS ALL HAIR TYPES AND ALL GENDERS:
For female clients: full hair analysis — natural, relaxed, transitioning,
colour-treated, any length, any texture.
For male clients: you are fully expert in:
- Short hair analysis including fades and tapers
- Male haircut recommendations specific to face shape and lifestyle
- Scalp health for shorter hair styles
- Male hair care routines that are practical and simple
- Fade maintenance and timing
- Natural male hair textures and how to work with them
For all clients: you adapt your language and recommendations to what they
have expressed they want.

WHAT YOU SEE AND ANALYSE:
You receive a detailed vision analysis of the client's hair.
From this you reason about:
- Exact hair type on the Andre Walker scale with clinical reasoning
- Texture, density and porosity from visual evidence
- Scalp condition and health
- Damage patterns and their likely causes
- Current style and whether it suits their face shape
- Growth patterns and hairline

SAGE INTEGRATION:
Today's humidity is critical for hair recommendations.
High humidity + curly/wavy hair = frizz management priority.
Low humidity + any hair type = moisture retention priority.
You always contextualise: "Today's [humidity]% humidity means..."

YOUR VOICE DELIVERY:
Warm, expert, specific. You speak like the best hairdresser your client has ever had.

You open by describing what you actually see:
"Looking at your hair — I can see [specific observation about type/texture/condition].
[Second specific observation]. Based on what I'm seeing and today's [weather condition],
here is what I recommend."

You deliver:
1. Hair type identification with your reasoning from what you see
2. Scalp condition assessment
3. 5 hairstyle recommendations appropriate for their face shape and hair type
   — Belle renders each one as you name it
4. Complete weekly hair care routine — step by step
5. Sage adjustment: specific product weights and techniques for today's conditions
6. Growth and health prediction
7. Progress update for returning clients

BELLE INTEGRATION:
As you name each hairstyle recommendation, you call Belle to render it
on the client's actual face immediately. The client sees each style
as you describe it — before, during and after your explanation.

NOVA INTEGRATION:
After your routine, you activate Nova for exact product matches.

TOOLS:
- camera_analyse(frame) — see the client's hair
- get_sage_context(lat, lng) — get today's conditions
- recall_client_memory(userId, query) — client's hair history
- request_belle_simulation(lookData) — render hairstyle previews
- call_nova(hairNeeds, budget, userId) — product recommendations
- store_session_memory(userId, content) — save session findings`;

const ZARA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'Analyse client\'s hair through camera. Call at session start.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_sage_context',
    description: 'Get real-time weather and humidity — critical for hair recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'recall_client_memory',
    description: 'Search client\'s hair history from previous Zara sessions.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Render a hairstyle preview on the client\'s actual face. Call for each style recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: { type: 'string', enum: ['hairstyle', 'haircolour'] },
        description: { type: 'string' },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        hairType: { type: 'string' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova for hair product recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        hairNeeds: { type: 'array', items: { type: 'string' } },
        hairType: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        budget: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['hairNeeds', 'userId'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save this session\'s hair findings to Zara\'s memory.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['userId', 'content'],
    },
  },
];

async function executeZaraToolCall(toolName, toolInput, sessionContext) {
  const { captureAndAnalyse } = require('../services/camera.service');

  switch (toolName) {
    case 'camera_analyse': {
      if (!sessionContext.currentFrame) return { error: 'No camera frame available' };
      return await captureAndAnalyse({
        frameBase64: sessionContext.currentFrame,
        userId: toolInput.userId,
        agentId: PC_ID,
        userProfile: sessionContext.userProfile,
        sageData: sessionContext.sageData,
      });
    }
    case 'get_sage_context': {
      const ctx = await getContextForAgent(toolInput.lat, toolInput.lng, PC_ID);
      sessionContext.sageData = ctx;
      return ctx;
    }
    case 'recall_client_memory': {
      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: toolInput.userId,
        query: toolInput.query,
      });
      return { memories, memoryContext: buildMemoryContext(memories) };
    }
    case 'request_belle_simulation': {
      if (!sessionContext.currentFrame) return { error: 'No camera frame for simulation' };
      const simulation = await requestSimulation({
        frameBase64: sessionContext.currentFrame,
        lookData: {
          lookType: toolInput.lookType,
          description: toolInput.description,
          agentId: PC_ID,
          hairType: toolInput.hairType,
        },
        userId: toolInput.userId,
        sessionId: toolInput.sessionId,
      });
      sessionContext.pendingSimulation = simulation;
      return simulation;
    }
    case 'call_nova': {
      sessionContext.novaRequest = toolInput;
      return { activated: true, message: 'Nova is finding your hair products now' };
    }
    case 'store_session_memory': {
      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId: toolInput.userId,
        content: toolInput.content,
        memoryType: 'session',
        metadata: toolInput.metadata || {},
      });
      return { stored: true, memoryId };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processZaraSession({
  userId, sessionId, transcript, currentFrame,
  clientLocation, userProfile, conversationHistory = [],
}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sessionContext = { currentFrame, userProfile, sageData: null, pendingSimulation: null, novaRequest: null };

  const messages = [
    ...conversationHistory.map(t => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: [
        `CLIENT MESSAGE: ${transcript}`,
        `USER ID: ${userId}`,
        `SESSION ID: ${sessionId}`,
        clientLocation ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}` : '',
        currentFrame ? 'CAMERA FRAME: Available — use camera_analyse to see the client.' : 'No camera frame.',
        userProfile?.hair_type ? `KNOWN HAIR TYPE: ${userProfile.hair_type}` : '',
      ].filter(Boolean).join('\n'),
    },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  for (let i = 0; i < 12; i++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: ZARA_SYSTEM_PROMPT,
      tools: ZARA_TOOLS,
      messages: currentMessages,
    });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeZaraToolCall(toolUse.name, toolUse.input, sessionContext);
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  if (!finalResponseText) {
    finalResponseText = 'Let me look at your hair clearly. Please make sure your hair is visible in the camera.';
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    pendingSimulation: sessionContext.pendingSimulation,
    novaRequest: sessionContext.novaRequest,
    sageData: sessionContext.sageData,
  };
}

module.exports = { processZaraSession, ZARA_SYSTEM_PROMPT, PC_ID, AGENT_NAME };