// FILE: precci/backend/src/agents/isla.js
// Isla — PC-011 — Style & Outfit Advisor
// Serves ALL genders equally.
// Male body types, menswear, masculine styling fully covered.
// Reasons autonomously from body proportion analysis.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-011';
const AGENT_NAME = 'Isla';

const ISLA_SYSTEM_PROMPT = `You are Isla, the Style and Outfit Advisor at PRECCI.
Your ID is PC-011.

You are the world's finest personal stylist. You serve ALL genders with
equal depth of expertise and intelligence.

YOUR EXPERTISE COVERS ALL GENDERS:
For female clients: complete styling for all occasions, body types, aesthetics.
For male clients: you are fully expert in:
- Male body type classification and proportion balancing
- Menswear from casual to formal — cut, fit, fabric
- Colour palettes for men based on their complexion and contrast
- Professional dressing for different industries
- Casual to event styling for men
- How to dress for specific body proportions in menswear
For non-binary and gender-fluid clients: style advice based entirely on
what they have expressed they want to wear and how they want to present.
You never make assumptions. You listen first.

WHAT YOU SEE AND ANALYSE:
You receive a detailed body proportion analysis.
From this you reason about:
- Body type with clinical reasoning from what you observe
- Proportions — shoulders, waist, hips — and their relationship
- Height estimation from visual cues
- Colouring and contrast level
- What silhouettes, cuts and fabrics will create visual harmony

SAGE INTEGRATION:
Today's temperature directly affects outfit weight and layering.
Today's conditions affect fabric choices.
"Given today's [temperature]°C, I'm recommending [specific fabric weight]."

VOICE DELIVERY:
Confident, encouraging, specific. The best stylist they have ever worked with.

You open: "I can see your body proportions clearly.
[Body type observation with positive framing].
[Proportion analysis]. For [what they need],
here is exactly what will look incredible on you."

You deliver for each look:
1. The complete outfit by voice — every piece named
2. Why each piece works for their specific proportions
3. Belle renders the complete look on their actual body
4. Colour palette with reasoning
5. 3 looks for the stated occasion
6. What to avoid and why — spoken tactfully and positively
7. Product/shopping hand-off to Nova

BELLE INTEGRATION:
As you describe each outfit, Belle renders it on the client's body.
They see themselves in it before deciding. You describe the look
as Belle renders it — simultaneously.

TOOLS:
- camera_analyse(frame) — see body proportions
- get_sage_context(lat, lng) — weather for outfit weight
- recall_client_memory(userId, query) — previous style sessions
- request_belle_simulation(lookData) — render outfits
- call_nova(styleNeeds, budget, userId) — shopping recommendations
- store_session_memory(userId, content) — save session findings`;

const ISLA_TOOLS = [
  { name: 'camera_analyse', description: 'Analyse body proportions and type.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['userId'] } },
  { name: 'get_sage_context', description: 'Get weather for outfit recommendations.', input_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] } },
  { name: 'recall_client_memory', description: 'Search client style history.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, query: { type: 'string' } }, required: ['userId', 'query'] } },
  { name: 'request_belle_simulation', description: 'Render outfit on client body.', input_schema: { type: 'object', properties: { lookType: { type: 'string', enum: ['outfit'] }, description: { type: 'string' }, userId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['lookType', 'description', 'userId'] } },
  { name: 'call_nova', description: 'Activate Nova for shopping recommendations.', input_schema: { type: 'object', properties: { styleNeeds: { type: 'array', items: { type: 'string' } }, occasion: { type: 'string' }, budget: { type: 'string' }, userId: { type: 'string' } }, required: ['styleNeeds', 'userId'] } },
  { name: 'store_session_memory', description: 'Save style session findings.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, content: { type: 'string' }, metadata: { type: 'object' } }, required: ['userId', 'content'] } },
];

async function executeIslaToolCall(toolName, toolInput, sessionContext) {
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
      const simulation = await requestSimulation({ frameBase64: sessionContext.currentFrame, lookData: { lookType: toolInput.lookType, description: toolInput.description, agentId: PC_ID }, userId: toolInput.userId, sessionId: toolInput.sessionId });
      sessionContext.pendingSimulation = simulation;
      return simulation;
    }
    case 'call_nova': {
      sessionContext.novaRequest = toolInput;
      return { activated: true, message: 'Nova is finding your items now' };
    }
    case 'store_session_memory': {
      const memoryId = await storeAgentMemory({ agentId: PC_ID, userId: toolInput.userId, content: toolInput.content, memoryType: 'session', metadata: toolInput.metadata || {} });
      return { stored: true, memoryId };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processIslaSession({ userId, sessionId, transcript, currentFrame, clientLocation, userProfile, conversationHistory = [] }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sessionContext = { currentFrame, userProfile, sageData: null, pendingSimulation: null, novaRequest: null };

  const messages = [
    ...conversationHistory.map(t => ({ role: t.role, content: t.content })),
    { role: 'user', content: [`CLIENT MESSAGE: ${transcript}`, `USER ID: ${userId}`, `SESSION ID: ${sessionId}`, clientLocation ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}` : '', currentFrame ? 'CAMERA FRAME: Available — use camera_analyse.' : 'No camera frame.', userProfile?.style_prefs ? `KNOWN STYLE PREFS: ${userProfile.style_prefs.join(', ')}` : ''].filter(Boolean).join('\n') },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  for (let i = 0; i < 12; i++) {
    const response = await client.messages.create({ model: 'claude-opus-4-5', max_tokens: 2048, system: ISLA_SYSTEM_PROMPT, tools: ISLA_TOOLS, messages: currentMessages });
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeIslaToolCall(toolUse.name, toolUse.input, sessionContext);
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
  }

  if (!finalResponseText) finalResponseText = 'Let me see your full silhouette clearly. Please step back slightly from the camera so I can see your proportions.';

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);
  return { responseText: finalResponseText, audioBuffer, contentType, pendingSimulation: sessionContext.pendingSimulation, novaRequest: sessionContext.novaRequest };
}

module.exports = { processIslaSession, ISLA_SYSTEM_PROMPT, PC_ID, AGENT_NAME };