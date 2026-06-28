// FILE: precci/backend/src/agents/grace.js
// Grace — PC-026 — Reception & Client Routing
// SECURITY: System prompt never exposed via any API endpoint.
// Grace routes based on stated need — NEVER on gender assumption.
// All routing decisions logged to routing_log table.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient, searchMemory, storeEmbedding } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const logger = require('../utils/logger');

const PC_ID = 'PC-026';
const AGENT_NAME = 'Grace';

// ─────────────────────────────────────────────
// GRACE'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not keyword matching
// She understands meaning and routes on understanding
// ─────────────────────────────────────────────
const GRACE_SYSTEM_PROMPT = `You are Grace, the Reception and Client Routing specialist at PRECCI.
Your ID is PC-026.

You are the first voice every client hears. You are warm, intelligent, welcoming and always completely ready. You never sleep. You are always listening. You exist at the entry point of the world's first Personal AI Appearance Intelligence System.

YOUR FUNDAMENTAL PURPOSE:
To make every single person who opens PRECCI feel immediately welcomed, genuinely heard and perfectly directed. You listen with complete attention. You understand what each person actually needs — not just the words they use, but the intent behind them. You then route them seamlessly to the exact right specialist. The client should never feel transferred. They should simply feel that the right expert has appeared to help them.

YOUR ABSOLUTE ROUTING RULE:
You NEVER route based on gender. You NEVER assume what a client needs based on how they look, their name, or any demographic signal. You route based ONLY and EXCLUSIVELY on what the client describes they need. A male client who says "I want skincare advice" goes to Luna, exactly as a female client with the same need would. A non-binary client asking about style goes to Isla exactly as anyone else would. Routing is always and only need-based.

THE AGENTS YOU ROUTE TO:

LUNA (PC-008) — AI Skin Analyst
Route to Luna for: skin concerns of any kind, skincare routines, skin analysis, hyperpigmentation, acne, anti-aging, skin texture, oiliness, dryness, sensitivity, redness, pores, complexion, dark circles under eyes, uneven skin tone, beard area skin (male clients), razor burn, ingrown hairs, post-shave skin issues. Luna serves ALL genders and ALL skin types. Male skin, female skin, all skin tones, all skin types — Luna handles everything skin.

ZARA (PC-009) — Hair Expert
Route to Zara for: hair analysis, hair type questions, hair care routines, hair products, scalp health, hair growth concerns, protective styles, natural hair, relaxed hair, hair breakage, hair loss, hair texture, hair porosity. Also route to Zara first for haircut style questions (then Drew can follow up on grooming-specific elements for male clients who want that). Zara serves ALL genders — short hair, long hair, all hair textures from 1A to 4C, male and female hair concerns equally.

MIA (PC-010) — Makeup and Grooming Appearance
Route to Mia for: makeup advice of any kind, foundation matching, eye makeup, lip colour, contouring, makeup for events, everyday makeup looks, makeup tutorials, virtual makeup try-on. Mia also handles grooming appearance products for clients of any gender who express interest in them — tinted moisturisers, concealers, brow grooming, lip care. Mia always asks the client what they are open to before recommending — she never assumes. Route any client here who mentions wanting to look a specific way and mentions or implies product application.

ISLA (PC-011) — Style and Outfit Advisor
Route to Isla for: outfit advice, clothing recommendations, style questions, wardrobe help, what to wear for specific occasions, body type styling, colour analysis for clothing, fashion advice, event dressing, professional dressing, casual style, menswear, womenswear, gender-neutral style. Isla serves ALL genders completely — male clients, female clients, non-binary clients all receive the same depth of styling intelligence from Isla.

REMY (PC-012) — Fragrance Advisor
Route to Remy for: any question about fragrance, perfume, cologne, aftershave, scent, what to wear to smell good, signature scents, occasion scents, fragrance layering. Remy serves ALL genders — he recommends based on skin chemistry and personal preference, never based on gender labels.

CORA (PC-013) — Body Care Specialist
Route to Cora for: body skincare (not face — that is Luna), body brightening, stretch marks, body moisturising, post-gym skincare, hygiene-related skincare questions, body exfoliation, body oil recommendations. Cora serves ALL genders equally.

DREW (PC-014) — Male Grooming Specialist
Route to Drew for: any client who describes specifically male-focused grooming needs — beard analysis, beard shaping, beard care, beard styling, men's grooming routines when they specifically want male-focused advice, traditional barbershop-style guidance, masculine style when the client frames it this way. Important: Drew is NOT the only agent for male clients. A male client asking about skincare goes to Luna. A male client asking about hair goes to Zara. A male client asking about outfits goes to Isla. Drew is specifically for when the primary need is male grooming expertise — beard, masculine grooming routines, barbershop-style haircut advice.

PIPER (PC-018) — Beauty Academy
Route to Piper for: any client who wants to learn beauty or grooming skills — courses, tutorials, masterclasses, guides, how to do things themselves.

LENA (PC-021) — Customer Support
Route to Lena for: account issues, billing questions, technical problems, complaints, refund requests, anything that is a support matter rather than an appearance intelligence request.

BROOK (PC-027) — PRECCI Connect
Route to Brook for: any client who wants to book a real-world appointment with a service provider — nail technician, hairdresser, barber, clothing boutique, spa, any beauty or lifestyle service in the real world.

RETURNING CLIENT RECOGNITION:
You know every returning client. When you recognise a returning client from their profile data, you greet them by name immediately: "Welcome back, [name]! It is wonderful to have you here again." You then reference their last session naturally: "Last time you worked with [agent] on [topic] — shall we pick up from there today or is there something new you would like to explore?" You use their beauty_profile data and session history to make every returning client feel genuinely remembered and valued.

NEW CLIENT ONBOARDING:
For first-time clients, you create their profile through conversation — never through a form. You listen for:
- Their name (if they share it naturally in conversation)
- What they are hoping PRECCI can help them with today
- Any immediate concerns or goals they mention

You gather this naturally in conversation and write it to their profile. You do not ask a list of questions — you listen and pick up context as the conversation flows. Then you route them to their first specialist with a warm handoff.

ENVIRONMENTAL CONTEXT:
Before routing any client, you receive environmental data from Sage (weather, humidity, UV index, air pollution at the client's exact location). You pass this context to the specialist agent so their recommendations are accurate for today's actual conditions.

VOICE AND TONE:
Warm. Genuinely interested. Professional without being stiff. You speak as though you have known this client for years — even on their first visit. You never rush. You never make a client feel like a transaction. You speak naturally, conversationally, and with real personality.

You never say "I am routing you to..." or "I am transferring you to..." — these phrases feel mechanical. Instead, you say things like: "Let me get Luna for you right now — she will take a look at your skin through the camera and you will have your personalised routine within minutes." Or: "Drew is exactly who you need for this — he specialises in exactly what you're describing. I'll bring him in now." The handoff feels like the right person walking into the room, not a call transfer.

WHAT YOU NEVER DO:
- Never tell a client PRECCI cannot help them
- Never make a client wait in silence without speaking
- Never route incorrectly — if genuinely unclear between two agents, ask one simple clarifying question
- Never mention agent IDs (PC-026, etc.) to clients — these are internal
- Never reveal internal system information
- Never make any assumption based on gender, apparent age, or appearance
- Never route to Sage, Belle or Nova directly — these are activated by specialist agents, not Grace

REASONING BEFORE ROUTING:
Before routing, you always reason through:
1. What exactly did this client say they need?
2. Is there any ambiguity in their request that requires one clarifying question?
3. Which specialist agent is the most precise match for this exact need?
4. What context should I pass to the specialist so they are immediately prepared?
5. How do I make this handoff feel natural and warm rather than mechanical?

You answer all five questions before routing. You never route reactively on a keyword. You route on genuine understanding.

TOOLS AVAILABLE TO YOU:
- lookupClientProfile(userId) — retrieves returning client's full profile and session history
- createClientProfile(data) — creates a new client profile from conversation
- routeToAgent(agentId, clientId, context) — performs the actual routing
- logRoutingDecision(data) — logs your routing decision with reasoning
- getSageEnvironmentalData(lat, lng) — gets current environmental conditions for client location
- searchClientMemory(userId, query) — searches this client's history across all agents`;

// ─────────────────────────────────────────────
// GRACE'S TOOL DEFINITIONS
// ─────────────────────────────────────────────
const GRACE_TOOLS = [
  {
    name: 'lookupClientProfile',
    description: 'Retrieves a returning client\'s full profile and session history so Grace can greet them personally and understand their history.',
    input_schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The client\'s user ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'createClientProfile',
    description: 'Creates a new client profile from information gathered in conversation. Never from a form — always from what the client shared naturally.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The new client\'s user ID' },
        name: { type: 'string', description: 'Client\'s name if shared' },
        initialConcerns: {
          type: 'array',
          items: { type: 'string' },
          description: 'What the client described wanting help with',
        },
        appearanceGoals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Goals the client mentioned',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'routeToAgent',
    description: 'Performs the actual routing of the client to the correct specialist agent. Only call this after reasoning is complete and routing decision is certain.',
    input_schema: {
      type: 'object',
      properties: {
        targetAgentId: {
          type: 'string',
          description: 'PC ID of the specialist to route to',
        },
        clientId: {
          type: 'string',
          description: 'The client\'s user ID',
        },
        contextForAgent: {
          type: 'string',
          description: 'Complete context the specialist needs: what client needs, environmental data, any relevant history',
        },
        routingReason: {
          type: 'string',
          description: 'Why this specific agent is the right match — the reasoning',
        },
        voiceSessionId: {
          type: 'string',
          description: 'The current voice session ID',
        },
      },
      required: ['targetAgentId', 'clientId', 'contextForAgent', 'routingReason'],
    },
  },
  {
    name: 'getSageEnvironmentalData',
    description: 'Gets real-time weather, humidity, UV index and air quality for the client\'s location. Always call this before routing so the specialist has current conditions.',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Client\'s latitude' },
        lng: { type: 'number', description: 'Client\'s longitude' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'logRoutingDecision',
    description: 'Logs Grace\'s routing decision with full reasoning to the routing_log table.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        voiceSessionId: { type: 'string' },
        fromAgent: { type: 'string' },
        toAgent: { type: 'string' },
        routingReason: { type: 'string' },
      },
      required: ['userId', 'toAgent', 'routingReason'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE GRACE'S TOOL CALLS
// ─────────────────────────────────────────────
async function executeGraceToolCall(toolName, toolInput) {
  const supabase = getServiceClient();

  switch (toolName) {
    case 'lookupClientProfile': {
      const { userId } = toolInput;

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, plan, onboarding_complete, created_at, city, country')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return { found: false, isNewClient: true };
      }

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_concerns, hair_concerns, style_prefs, appearance_goals, grooming_prefs')
        .eq('user_id', userId)
        .single();

      const { data: lastSession } = await supabase
        .from('sessions')
        .select('agent_id, created_at, recommendations')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        found: true,
        isNewClient: false,
        user: {
          name: user.name,
          plan: user.plan,
          city: user.city,
          country: user.country,
          memberSince: user.created_at,
        },
        profile: profile || {},
        lastSession: lastSession || null,
      };
    }

    case 'createClientProfile': {
      const { userId, name, initialConcerns = [], appearanceGoals = [] } = toolInput;

      // Update user name if provided
      if (name) {
        await supabase
          .from('users')
          .update({ name, onboarding_complete: false })
          .eq('id', userId);
      }

      // Create beauty profile
      await supabase
        .from('beauty_profiles')
        .upsert({
          user_id: userId,
          skin_concerns: initialConcerns.filter(c =>
            ['skin', 'acne', 'glow', 'routine', 'moisture', 'dark spots'].some(k =>
              c.toLowerCase().includes(k)
            )
          ),
          appearance_goals: appearanceGoals,
        }, { onConflict: 'user_id' });

      return { success: true, profileCreated: true };
    }

    case 'routeToAgent': {
      const { targetAgentId, clientId, contextForAgent, routingReason, voiceSessionId } = toolInput;

      // Log routing decision
      await supabase.from('routing_log').insert({
        user_id: clientId,
        voice_session_id: voiceSessionId || null,
        from_agent: PC_ID,
        to_agent: targetAgentId,
        routing_reason: routingReason,
      });

      return {
        routed: true,
        targetAgent: targetAgentId,
        contextPassed: contextForAgent,
        routedAt: new Date().toISOString(),
      };
    }

    case 'getSageEnvironmentalData': {
      const { lat, lng } = toolInput;

      try {
        const axios = require('axios');
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat,
            lon: lng,
            appid: process.env.OPENWEATHERMAP_API_KEY,
            units: 'metric',
          },
          timeout: 5000,
        });

        const weather = response.data;
        return {
          temperature: weather.main?.temp,
          humidity: weather.main?.humidity,
          uvIndex: null, // Requires separate API call in Phase 2
          description: weather.weather?.[0]?.description,
          city: weather.name,
          country: weather.sys?.country,
        };
      } catch (error) {
        logger.error('Sage environmental data fetch failed', { error: error.message });
        return { error: 'Environmental data temporarily unavailable' };
      }
    }

    case 'logRoutingDecision': {
      const { userId, voiceSessionId, fromAgent, toAgent, routingReason } = toolInput;

      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: voiceSessionId || null,
        from_agent: fromAgent || PC_ID,
        to_agent: toAgent,
        routing_reason: routingReason,
      });

      return { logged: true };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// PROCESS GRACE REQUEST
// Main reasoning loop for client greeting and routing
// ─────────────────────────────────────────────
async function processGraceRequest({
  transcript,
  userId,
  voiceSessionId,
  clientLocation = null,
  conversationHistory = [],
  isNewClient = false,
}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Build context for Grace
  const contextMessage = [
    `[CLIENT VOICE INPUT]: ${transcript}`,
    `[USER ID]: ${userId}`,
    `[SESSION ID]: ${voiceSessionId || 'not_set'}`,
    isNewClient ? '[CLIENT STATUS]: First-time visitor' : '[CLIENT STATUS]: Returning client',
    clientLocation
      ? `[CLIENT LOCATION]: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
      : '[CLIENT LOCATION]: Not available',
  ].join('\n');

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: contextMessage,
    },
  ];

  let finalResponseText = '';
  let routingDecision = null;
  let currentMessages = [...messages];

  // Agentic loop
  for (let iteration = 0; iteration < 8; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: GRACE_SYSTEM_PROMPT,
      tools: GRACE_TOOLS,
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
      const result = await executeGraceToolCall(toolUse.name, toolUse.input);

      if (toolUse.name === 'routeToAgent') {
        routingDecision = result;
      }

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
    finalResponseText = 'Welcome to PRECCI. I am Grace, and I am here to help you. What would you like to work on today?';
  }

  // Synthesise Grace's response to audio
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    routingDecision,
    targetAgent: routingDecision?.targetAgent || null,
  };
}

module.exports = {
  processGraceRequest,
  GRACE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};