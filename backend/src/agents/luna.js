// FILE: precci/backend/src/agents/luna.js
// Luna — PC-008 — AI Skin Analyst
// Serves ALL genders. All skin types. All skin tones.
// Male-specific concerns fully covered.
// Reasons autonomously from what she sees — no hardcoded rules.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { getServiceClient, storeEmbedding, searchMemory } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { generateEmbedding } = require('../config/openai');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-008';
const AGENT_NAME = 'Luna';

// ─────────────────────────────────────────────
// LUNA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a script
// She thinks from what she actually sees
// ─────────────────────────────────────────────
const LUNA_SYSTEM_PROMPT = `You are Luna, the AI Skin Analyst at PRECCI.
Your ID is PC-008.

You are the finest skin specialist in the world. You have seen every skin type,
every skin tone, every skin concern, on every kind of person. You serve
ALL genders with equal expertise and depth.

You can see your clients through their camera in real time.
You speak everything by voice — warm, expert, specific, never generic.

YOUR EXPERTISE COVERS ALL GENDERS:
For female clients: full skincare analysis and routine building.
For male clients: you are fully expert in:
- Thicker male skin and its specific needs
- Beard area skin — folliculitis, razor bumps, ingrown hairs, post-shave irritation
- Male oil production patterns (typically higher than female)
- Practical male skincare routines — maximum 5-6 steps, lifestyle-appropriate
- Post-shave skincare — what to use and when
- Skincare for men who shave daily vs bearded clients
For all clients: you adapt your language and recommendations to what they
have expressed they want — you never assume lifestyle or preferences.

WHAT YOU SEE AND ANALYSE:
You receive a detailed vision analysis of the client's face.
From this you reason about:
- Exact skin type with evidence from what you observe
- Skin tone and undertone with confidence
- Every concern you can identify, ranked by priority
- Environmental factors from Sage's data that affect what you see today
- Progress compared to their previous sessions in your memory

SAGE INTEGRATION:
You always incorporate Sage's environmental data:
"Given today's [humidity/UV/temperature], what I'm seeing makes sense because..."
Every recommendation you make is adjusted for today's actual conditions.

YOUR VOICE DELIVERY:
You speak like the world's best aesthetician who has known this client for years.
Warm. Specific. Expert. You never say anything generic.

You open by describing what you actually see:
"I can see you clearly. Looking at your skin today — you have [specific observation].
[Second specific observation]. [Environmental context from Sage].
Let me build your complete routine."

You deliver:
1. Skin type identification with your clinical reasoning
2. Your top 3 concerns ranked by priority with explanations
3. Complete morning routine — step by step, each step with why
4. Complete evening routine — step by step, each step with why
5. One targeted treatment (mask, exfoliant, acid, etc.)
6. 30/60/90 day improvement prediction — specific and realistic
7. Progress update if returning client: what has improved, what needs attention

BELLE INTEGRATION:
When you want to show a client how their skin will look after treatment,
you call request_simulation with before/after context.

NOVA INTEGRATION:
After delivering your routine, you call Nova:
"Nova is finding your exact products now based on what your skin needs today."

MEMORY:
You remember every client. You recall their previous sessions, their progress,
their sensitivities, what has worked and what has not.
You reference this naturally: "Last time I saw you, your T-zone was significantly
more oily — I can see it has improved. The niacinamide is working."

TOOLS AVAILABLE:
- camera_analyse(frame) — analyse current camera frame
- get_sage_context(lat, lng) — get today's environmental data
- recall_memory(userId) — search client's skin history
- request_belle_simulation(lookData, frame) — trigger visual simulation
- call_nova(skinNeeds, budget) — trigger product recommendations
- store_session_memory(content) — save this session's findings`;

// ─────────────────────────────────────────────
// LUNA'S TOOL DEFINITIONS
// ─────────────────────────────────────────────
const LUNA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'Analyse the client\'s current camera frame for skin characteristics. Call this at the start of every session to see what Luna observes.',
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
    description: 'Get real-time environmental conditions for the client\'s location. Always call this to incorporate today\'s conditions into skin recommendations.',
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
    description: 'Search client\'s skin history from previous sessions. Call this to provide continuity and track progress.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search for in memory' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Ask Belle to render a visual simulation on the client\'s face — showing how their skin will look after treatment or comparing before/after.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: { type: 'string', enum: ['skincare', 'makeup', 'hairstyle', 'beard', 'outfit', 'haircolour'] },
        description: { type: 'string', description: 'Precise description of what to simulate' },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova to find and display exact products for this client\'s specific skin needs.',
    input_schema: {
      type: 'object',
      properties: {
        skinNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of specific skin needs identified',
        },
        skinType: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        budget: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['skinNeeds', 'userId'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save key findings from this session to Luna\'s memory for this client.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Summary of session findings to remember' },
        metadata: { type: 'object' },
      },
      required: ['userId', 'content'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE LUNA'S TOOL CALLS
// ─────────────────────────────────────────────
async function executeLunaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {
    case 'camera_analyse': {
      const { userId } = toolInput;
      const frame = sessionContext.currentFrame;
      const userProfile = sessionContext.userProfile || {};
      const sageData = sessionContext.sageData || {};

      if (!frame) {
        return { error: 'No camera frame available in this session' };
      }

      const analysis = await captureAndAnalyse({
        frameBase64: frame,
        userId,
        agentId: PC_ID,
        userProfile,
        sageData,
      });

      return analysis;
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;
      const sageContext = await getContextForAgent(lat, lng, PC_ID);
      sessionContext.sageData = sageContext;
      return sageContext;
    }

    case 'recall_client_memory': {
      const { userId, query } = toolInput;
      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId,
        query,
        matchCount: 5,
      });
      return { memories, memoryContext: buildMemoryContext(memories) };
    }

    case 'request_belle_simulation': {
      const { lookType, description, userId, sessionId } = toolInput;
      const frame = sessionContext.currentFrame;

      if (!frame) {
        return { error: 'No camera frame for simulation' };
      }

      const simulation = await requestSimulation({
        frameBase64: frame,
        lookData: {
          lookType,
          description,
          agentId: PC_ID,
          skinTone: sessionContext.userProfile?.skin_tone,
        },
        userId,
        sessionId,
      });

      // Emit to frontend via session context
      sessionContext.pendingSimulation = simulation;
      return simulation;
    }

    case 'call_nova': {
      const { skinNeeds, skinType, concerns, budget, userId } = toolInput;
      // Store Nova request in session context for orchestration
      sessionContext.novaRequest = { skinNeeds, skinType, concerns, budget, userId };
      return {
        activated: true,
        message: 'Nova is now finding your exact products',
      };
    }

    case 'store_session_memory': {
      const { userId, content, metadata } = toolInput;
      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId,
        content,
        memoryType: 'session',
        metadata: metadata || {},
      });
      return { stored: true, memoryId };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// PROCESS LUNA SESSION
// Full autonomous reasoning loop
// ─────────────────────────────────────────────
async function processLunaSession({
  userId,
  sessionId,
  transcript,
  currentFrame,
  clientLocation,
  userProfile,
  conversationHistory = [],
}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Session context shared across tool calls
  const sessionContext = {
    currentFrame,
    userProfile,
    sageData: null,
    pendingSimulation: null,
    novaRequest: null,
  };

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: [
        `CLIENT MESSAGE: ${transcript}`,
        `USER ID: ${userId}`,
        `SESSION ID: ${sessionId}`,
        clientLocation
          ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
          : '',
        currentFrame ? 'CAMERA FRAME: Available — use camera_analyse tool to see the client.' : 'CAMERA FRAME: Not yet available.',
        userProfile ? `CLIENT PROFILE: Skin type: ${userProfile.skin_type || 'unknown'}, Concerns: ${userProfile.skin_concerns?.join(', ') || 'none recorded'}` : '',
      ].filter(Boolean).join('\n'),
    },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  // Agentic loop — Luna reasons and acts until complete
  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: LUNA_SYSTEM_PROMPT,
      tools: LUNA_TOOLS,
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
      const result = await executeLunaToolCall(
        toolUse.name,
        toolUse.input,
        sessionContext
      );

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  if (!finalResponseText) {
    finalResponseText = 'Let me take a good look at your skin. Please ensure your camera is on and the lighting is clear.';
  }

  // Synthesise Luna's voice response
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    pendingSimulation: sessionContext.pendingSimulation,
    novaRequest: sessionContext.novaRequest,
    sageData: sessionContext.sageData,
  };
}

module.exports = {
  processLunaSession,
  LUNA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};