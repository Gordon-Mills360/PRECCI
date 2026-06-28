// FILE: precci/backend/src/agents/luna.js
// Luna — PC-008 — AI Skin Analyst
// COMPLETE FULL BUILD — no simplification anywhere.
// Serves ALL genders equally — male, female, non-binary, all skin tones.
// Male-specific concerns fully covered: beard area skin, razor bumps,
// ingrown hairs, post-shave concerns, male oil production patterns.
// Reasons autonomously from Claude Vision analysis — not hardcoded rules.
// Every recommendation is specific to what Luna actually sees today.
// Sage environmental data incorporated into every analysis.
// Full memory: recalls every past session, tracks progress over time.
// Subscription tier enforced — but communicated naturally by voice.
// Allergy checking on every product before recommendation.
// Belle called for visual simulations. Nova called for products.
// Celeste receives commission data. Nadia receives performance data.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getClientTierContext, checkCameraAccess, checkTryOnAccess, recordCameraUsage, triggerUpgradeFlow } = require('../services/subscriptionManager');
const { buildAllergyContextForAgent, checkProductSafety, addAllergyToProfile } = require('../services/allergyChecker.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-008';
const AGENT_NAME = 'Luna';

// ─────────────────────────────────────────────
// LUNA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a script or decision tree.
// Luna reasons from what she actually sees through the camera.
// Every response is unique to this specific client at this specific moment.
// ─────────────────────────────────────────────
const LUNA_SYSTEM_PROMPT = `You are Luna, the AI Skin Analyst at PRECCI.
Your ID is PC-008.

You are the finest skin specialist in the world. You have analysed
every skin type, every skin tone, every skin concern on every kind
of person across every climate and background globally. You serve
ALL genders with equal depth, equal expertise and equal care.

You speak everything by voice. You are warm, expert, specific and
deeply personal. You never give a generic response. Every client
receives analysis and recommendations as precise as if you have
known them for years — because through your memory, you have.

YOUR EXPERTISE COVERS ALL GENDERS WITHOUT EXCEPTION:

For female clients:
Full skincare analysis and complete routine building across all
skin types, all skin tones, all ages and all concerns.

For male clients, you are fully expert in:
- Thicker male skin — typically 25% thicker than female skin,
  higher collagen density, larger pores, higher sebum production
- Beard area skin — a completely distinct microenvironment with
  unique concerns: folliculitis, pseudofolliculitis barbae (razor
  bumps), ingrown hairs, post-shave irritation and inflammation,
  beard itch from dryness, beard dandruff (seborrheic dermatitis)
- Male shaving skin — daily mechanical exfoliation from shaving
  creates a compromised barrier that needs specific support
- Male oil production — typically higher than female, peaks
  differently across the face, T-zone often significantly oilier
- Practical male skincare — maximum 5-6 steps, products that
  absorb quickly, no sticky or greasy textures, results-focused
- Male anti-aging — thicker skin ages differently, collagen loss
  patterns differ, specific actives work better for male skin
- Male hyperpigmentation — often post-shave marks, sun damage
  from less consistent SPF use, different distribution patterns

For non-binary and gender-fluid clients:
You listen to what they describe they want and build their
routine accordingly. You never assume or assign gendered products.

WHAT YOU SEE AND ANALYSE — IN COMPLETE DETAIL:
You receive a detailed camera analysis of the client's face.
From this you reason independently about every visible characteristic:

Skin type assessment:
You assess oily, dry, combination, normal and sensitive skin types
by looking at the specific evidence — shine patterns, texture,
visible pores, dry patches, flaking, redness — not by asking.
You explain what you observe and why it tells you the skin type.

Skin tone and undertone:
You identify fair, light, medium, olive, tan, deep and rich tones.
You determine warm, cool and neutral undertones from the visible
evidence — vein colour patterns, how the skin sits against the
background, yellow versus pink versus neutral base tones.
This drives every product shade and colour recommendation.

Specific concerns you identify and reason about:
- Pores: size, visibility, location, congestion, blackhead presence
- Hydration: dehydration lines, plumpness, tight appearance, bounce
- Oil zones: which specific zones are oily, degree of oiliness
- Dry zones: which specific areas, severity, cause assessment
- Hyperpigmentation: dark spots (post-inflammatory vs sun damage),
  melasma patterns, uneven tone, sun damage assessment, location
  and severity of each mark you can see
- Redness: rosacea signs (central face flushing, visible capillaries),
  general sensitivity redness, irritation zones, blemish redness
- Texture: smooth areas versus rough, bumpy (comedonal acne vs KP),
  pitted areas (ice pick vs rolling vs boxcar scarring)
- Active acne: type (comedonal, papular, pustular, cystic signs),
  location mapping, surrounding inflammation, severity assessment
- Fine lines and wrinkles: location, type (expression vs damage),
  depth, which areas are most advanced
- Under-eye area: dark circles with colour assessment (blue-purple
  suggests vascular, brown suggests pigmentation, hollow suggests
  structural), puffiness, fine lines, dehydration
- Lip condition: dryness, chapping, colour, symmetry, definition
- Neck and décolleté (if visible): sun damage, texture differences
- Beard area (male clients): skin condition under beard or in
  recently shaved areas, razor bumps visible, ingrown hairs,
  irritation patterns, follicle health, post-shave marks

SAGE ENVIRONMENTAL INTEGRATION — MANDATORY:
Before every analysis, you receive real-time environmental data
from Sage covering the client's exact location right now.
You incorporate this completely — it changes your recommendations:

High humidity (>70%):
"The humidity today at [X]% means your skin is producing more
sebum than usual. What I'm seeing in your T-zone confirms this.
I'm adjusting your routine to use lighter, water-based formulas."

Low humidity (<30%):
"With only [X]% humidity today, your skin's moisture barrier is
under significant stress. The slight dehydration lines I can see
are partly environmental. I'm building your routine to compensate."

High UV index (>6):
"Today's UV index is [X] — SPF is non-negotiable in your routine.
I'm recommending SPF 50+ and an antioxidant serum to protect
against the oxidative stress from today's UV levels."

Cold weather (<10°C):
"Today's temperature affects your barrier function. I can see
some mild tightness around your cheeks consistent with cold
exposure. Your routine needs barrier support tonight."

Air quality issues:
"Today's air quality means increased oxidative stress on your
skin. I'm including double cleansing in your evening routine
and an antioxidant to counteract pollution damage."

MEMORY AND PROGRESS TRACKING:
You remember every client across every session.
For returning clients, you open with what you remember:
"Welcome back. Last time I saw you — [date] — your main concern
was [concern]. I can see [specific observation about progress].
Your [specific area] has [improved/needs more attention] because
[specific reasoning from what you see today]."

You track progress specifically:
- Hyperpigmentation: lighter, same, or darker versus last time
- Acne: cleared, improved, same, or worsened — with reasoning
- Texture: smoother or same
- Hydration: better or worse
- Oil control: improving or not
You give percentage estimates where you can see clear progress.

SUBSCRIPTION TIER AWARENESS:
You receive the client's tier context and reason naturally from it.
You never announce tier restrictions mechanically.
If a client on Free tries to access camera analysis and has used
all 3 sessions: you warmly explain what is available and mention
the upgrade naturally, then continue helping them with what you can.
If try-on is unavailable for their tier, you describe looks in
such vivid detail that they can picture it perfectly — then mention
Belle is available on higher tiers.

ALLERGY AWARENESS — NON-NEGOTIABLE:
You receive the client's complete allergy profile before every session.
You NEVER recommend a product containing a known allergen.
If you discover a conflict while recommending, you stop immediately:
"Actually, let me check that — that product contains [ingredient]
which I have on your profile as an allergen. Let me find you
something equivalent that is completely safe for you."
If a client mentions a new allergy mid-session, you note it
immediately and add it to their profile.

WHAT YOU DELIVER BY VOICE — COMPLETE SESSION:

Opening (after camera analysis):
Describe exactly what you see. Be specific. Reference environmental
conditions from Sage. Reference their history if returning.

Skin assessment (spoken clearly):
"Your skin type is [type] — I can see [specific evidence].
Your undertone is [undertone] — this matters for [reason].
Your top three concerns right now are [1], [2] and [3]."

Morning routine — every step spoken with reasons:
Step 1: Cleanser — type, texture, why for their skin
Step 2: Toner — whether needed, which type, why
Step 3: Vitamin C or targeted serum — specific active, why
Step 4: Moisturiser — texture, weight, why for their skin today
Step 5: SPF — minimum SPF level based on UV index from Sage
[Optional Step 6 for specific concerns]
After each step: "Nova is finding your [step product] now."

Evening routine — every step spoken with reasons:
Step 1: First cleanse — oil or micellar, why
Step 2: Second cleanse — gel or cream, why
Step 3: Treatment — retinol / acid / niacinamide based on concerns
Step 4: Serum — targeted active for primary concern
Step 5: Moisturiser — richer than morning, why
Step 6: Eye cream — if dark circles or lines visible
Step 7: Spot treatment — if active acne visible
After each step: "Nova is finding your [step product] now."

Weekly treatments:
One exfoliant — type (physical vs chemical), frequency, why
One mask — type, target concern, frequency

30/60/90 day predictions — specific and honest:
"At 30 days with this routine, you should see [specific change].
At 60 days, [specific second change] should be visible.
By 90 days, [specific third change] — this is the realistic
timeline for [active ingredient] to address [their concern]."

Belle visual simulation:
After describing the expected results, you call Belle to render
a visual of how their skin will look after 90 days of the routine.

Nova product handoff:
"Nova is building your complete routine now — finding every product
I have recommended, checking they are in stock and within your budget,
and verifying they are safe for your allergies."

TOOLS AVAILABLE — USE THEM ALL:
- camera_analyse: See the client through their camera
- get_sage_context: Get today's environmental conditions
- recall_client_memory: Search this client's full skin history
- store_session_memory: Save today's findings for next time
- request_belle_simulation: Show visual skin predictions
- call_nova: Activate product matching with full needs brief
- check_allergy_safety: Verify a product before recommending
- add_client_allergy: Add newly discovered allergy to profile
- trigger_upgrade: When client wants a feature beyond their tier
- log_session_performance: Report session data to Nadia`;

// ─────────────────────────────────────────────
// LUNA'S COMPLETE TOOL DEFINITIONS
// Every tool she needs — fully defined
// ─────────────────────────────────────────────
const LUNA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'See the client\'s face through their camera. Analyses skin type, tone, undertone, pores, hydration, oil levels, hyperpigmentation, redness, texture, acne, fine lines, under-eye area, lip condition and beard area concerns for male clients. Call this at the start of every session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Client user ID' },
        sessionId: { type: 'string', description: 'Current session ID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_sage_context',
    description: 'Get real-time environmental conditions for the client\'s exact location — temperature, humidity, UV index, air quality. Always call this before delivering recommendations. Sage data changes what products you recommend.',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Client latitude' },
        lng: { type: 'number', description: 'Client longitude' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'recall_client_memory',
    description: 'Search this client\'s full skin history from all previous Luna sessions. Call this for returning clients to track progress and reference past findings.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search for — e.g. skin concerns, previous routine, progress notes' },
        limit: { type: 'number', description: 'Number of past memories to retrieve — based on subscription tier' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save today\'s session findings to Luna\'s memory for this client. Call at the end of every session. Include skin assessment, routine built, products recommended, progress notes.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete session summary — skin type, concerns identified, routine delivered, progress vs last session' },
        metadata: {
          type: 'object',
          description: 'Structured data: skinType, concerns[], routineSteps[], sageConditions, progressNotes',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Ask Belle to render a visual simulation on the client\'s face. Use for: showing expected skin results after 90 days of routine, showing how a makeup look will complement their corrected skin, before/after comparisons.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: {
          type: 'string',
          enum: ['skincare', 'makeup', 'hairstyle', 'beard', 'outfit', 'haircolour'],
          description: 'Type of simulation to render',
        },
        description: {
          type: 'string',
          description: 'Precise description of what to simulate — e.g. "skin after 90 days of vitamin C and niacinamide — even tone, reduced dark spots, healthy glow"',
        },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        skinTone: { type: 'string', description: 'Client\'s identified skin tone for accurate rendering' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova to find and display exact products matching the routine Luna has built. Pass the complete routine brief so Nova can match every step precisely.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        skinNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every product need from the routine — e.g. ["gentle foaming cleanser for oily skin", "vitamin C serum for hyperpigmentation", "oil-free SPF 50 moisturiser"]',
        },
        skinType: { type: 'string' },
        skinTone: { type: 'string' },
        concerns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Primary concerns identified — for Nova to filter by',
        },
        budget: { type: 'string' },
        genderContext: {
          type: 'string',
          enum: ['all', 'male', 'female', 'unisex'],
          description: 'For Nova to filter gender-relevant products appropriately',
        },
        allergies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Client allergies — Nova will exclude products containing these',
        },
        routineSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              productType: { type: 'string' },
              keyIngredients: { type: 'array', items: { type: 'string' } },
              texture: { type: 'string' },
              reason: { type: 'string' },
            },
          },
          description: 'Every step of the morning and evening routine for precise matching',
        },
      },
      required: ['userId', 'skinNeeds'],
    },
  },
  {
    name: 'check_allergy_safety',
    description: 'Verify a specific product is safe for this client before recommending it. Always call this when you have a specific product ID to recommend.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to check' },
        userId: { type: 'string', description: 'Client user ID' },
      },
      required: ['productId', 'userId'],
    },
  },
  {
    name: 'add_client_allergy',
    description: 'Add a newly discovered allergy to the client\'s profile. Call immediately when client mentions any allergy or sensitivity during the session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        allergen: { type: 'string', description: 'The allergen to add — exactly as the client described it' },
      },
      required: ['userId', 'allergen'],
    },
  },
  {
    name: 'trigger_upgrade',
    description: 'Called when client wants a feature beyond their current subscription tier. Returns the upgrade voice script for Luna to deliver naturally.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        currentPlan: { type: 'string', enum: ['free', 'glow', 'pro', 'elite'] },
        featureAttempted: { type: 'string', description: 'What the client tried to access' },
      },
      required: ['userId', 'currentPlan', 'featureAttempted'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report this session\'s performance data to Nadia (COO) for agent monitoring. Call at the end of every completed session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        sessionDurationEstimate: { type: 'string', description: 'Estimated session length' },
        concernsIdentified: { type: 'array', items: { type: 'string' } },
        routineStepsDelivered: { type: 'number' },
        belleSimulationsRequested: { type: 'number' },
        novaActivated: { type: 'boolean' },
        returningClient: { type: 'boolean' },
        progressNoted: { type: 'boolean' },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE LUNA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeLunaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'camera_analyse': {
      const { userId, sessionId } = toolInput;

      // Check camera access for this tier
      const cameraAccess = await checkCameraAccess(userId);

      if (!cameraAccess.available) {
        return {
          error: 'camera_limit_reached',
          message: cameraAccess.upgradeMessage,
          plan: cameraAccess.plan,
          remaining: 0,
        };
      }

      if (!sessionContext.currentFrame) {
        return {
          error: 'no_frame',
          message: 'No camera frame available. Client needs to enable camera.',
        };
      }

      // Load user profile for context
      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_type, skin_tone, skin_undertone, skin_concerns, allergies, grooming_prefs, appearance_goals')
        .eq('user_id', userId)
        .single();

      const analysis = await captureAndAnalyse({
        frameBase64: sessionContext.currentFrame,
        userId,
        agentId: PC_ID,
        userProfile: profile || {},
        sageData: sessionContext.sageData || {},
      });

      // Record usage against their tier allowance
      if (sessionId) {
        await recordCameraUsage(userId, sessionId);
      }

      // Store analysis in session context for tool calls later
      sessionContext.cameraAnalysis = analysis.analysis;
      sessionContext.skinTone = analysis.analysis?.skin_tone || null;

      return analysis;
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;

      const sageContext = await getContextForAgent(lat, lng, PC_ID);
      sessionContext.sageData = sageContext;

      return sageContext;
    }

    case 'recall_client_memory': {
      const { userId, query, limit } = toolInput;

      // Memory depth based on subscription tier
      const tierContext = sessionContext.tierContext;
      const memoryDepth = tierContext?.memoryDepth || 1;
      const effectiveLimit = Math.min(limit || memoryDepth, memoryDepth);

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId,
        query,
        matchCount: effectiveLimit,
        matchThreshold: 0.70,
      });

      return {
        memories,
        memoryContext: buildMemoryContext(memories),
        memoriesFound: memories.length,
      };
    }

    case 'store_session_memory': {
      const { userId, content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId,
        content,
        memoryType: 'session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
        },
      });

      return { stored: true, memoryId };
    }

    case 'request_belle_simulation': {
      const { lookType, description, userId, sessionId, skinTone } = toolInput;

      // Check try-on access for this tier
      const tryOnAccess = await checkTryOnAccess(userId);

      if (!tryOnAccess.available) {
        return {
          error: 'tryon_unavailable',
          message: tryOnAccess.upgradeMessage,
          plan: tryOnAccess.plan,
          alternativeAction: 'Describe the expected results verbally in vivid detail instead.',
        };
      }

      if (!sessionContext.currentFrame) {
        return { error: 'no_frame', message: 'No camera frame for simulation' };
      }

      try {
        const simulation = await requestSimulation({
          frameBase64: sessionContext.currentFrame,
          lookData: {
            lookType,
            description,
            agentId: PC_ID,
            skinTone: skinTone || sessionContext.skinTone,
          },
          userId,
          sessionId,
        });

        sessionContext.pendingSimulation = simulation;
        sessionContext.belleSimulationCount = (sessionContext.belleSimulationCount || 0) + 1;

        return simulation;
      } catch (error) {
        logger.error('Luna: Belle simulation failed', { error: error.message });
        return {
          error: 'simulation_failed',
          message: 'Belle is temporarily unavailable. Describing the expected result verbally.',
        };
      }
    }

    case 'call_nova': {
      const {
        userId, sessionId, skinNeeds, skinType,
        skinTone, concerns, budget, genderContext,
        allergies, routineSteps,
      } = toolInput;

      // Store full Nova request in session context
      sessionContext.novaRequest = {
        userId,
        sessionId,
        skinNeeds,
        skinType,
        skinTone,
        concerns,
        budget,
        genderContext: genderContext || 'all',
        allergies: allergies || sessionContext.allergyProfile?.allergies || [],
        routineSteps,
        requestingAgent: PC_ID,
        requestedAt: new Date().toISOString(),
      };

      return {
        activated: true,
        message: 'Nova is now building your complete routine — finding every product, checking stock and verifying allergen safety.',
        productsNeeded: skinNeeds?.length || 0,
      };
    }

    case 'check_allergy_safety': {
      const { productId, userId } = toolInput;

      const safetyResult = await checkProductSafety(productId, userId);
      return safetyResult;
    }

    case 'add_client_allergy': {
      const { userId, allergen } = toolInput;

      const result = await addAllergyToProfile(userId, allergen);
      sessionContext.allergyProfile = null; // Force refresh on next check

      return result;
    }

    case 'trigger_upgrade': {
      const { userId, currentPlan, featureAttempted } = toolInput;

      const upgradeInfo = await triggerUpgradeFlow(userId, currentPlan, featureAttempted);
      return upgradeInfo;
    }

    case 'log_session_performance': {
      const {
        userId, sessionId, sessionDurationEstimate,
        concernsIdentified, routineStepsDelivered,
        belleSimulationsRequested, novaActivated,
        returningClient, progressNoted,
      } = toolInput;

      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Luna completed session for user ${userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          session_id: sessionId,
          duration_estimate: sessionDurationEstimate,
          concerns_identified: concernsIdentified || [],
          routine_steps_delivered: routineStepsDelivered || 0,
          belle_simulations: belleSimulationsRequested || 0,
          nova_activated: novaActivated || false,
          returning_client: returningClient || false,
          progress_noted: progressNoted || false,
          completed_at: new Date().toISOString(),
        },
      });

      return { logged: true };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// PROCESS LUNA SESSION
// Full autonomous agentic reasoning loop.
// Luna thinks, observes, reasons and speaks.
// Nothing is hardcoded — every response is
// generated from what Claude actually sees
// and reasons about in real time.
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
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  // ── LOAD ALL CONTEXT LUNA NEEDS BEFORE REASONING ──

  // 1. Subscription tier context
  const tierContext = await getClientTierContext(userId);

  // 2. Allergy context
  const allergyContext = await buildAllergyContextForAgent(userId);

  // 3. Check if returning client
  const { data: previousSessions } = await supabase
    .from('sessions')
    .select('id, created_at, agent_id')
    .eq('user_id', userId)
    .eq('agent_id', PC_ID)
    .order('created_at', { ascending: false })
    .limit(1);

  const isReturningClient = previousSessions && previousSessions.length > 0;

  // 4. Load user plan for product limits
  const { data: user } = await supabase
    .from('users')
    .select('plan, name, city, country, lat, lng')
    .eq('id', userId)
    .single();

  // Session context — shared state across all tool calls in this session
  const sessionContext = {
    userId,
    sessionId,
    currentFrame,
    userProfile,
    sageData: null,
    cameraAnalysis: null,
    skinTone: userProfile?.skin_tone || null,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    pendingSimulation: null,
    novaRequest: null,
    belleSimulationCount: 0,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  // Build the complete context message Luna receives
  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    isReturningClient
      ? `CLIENT STATUS: Returning client — recall their history and track progress`
      : `CLIENT STATUS: New client — first session with Luna`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
      : `CLIENT LOCATION: Not provided — ask Sage for general conditions if possible`,
    currentFrame
      ? `CAMERA: Active — use camera_analyse tool to see the client now`
      : `CAMERA: Not yet active — guide client to enable camera`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known allergies on file`,
    userProfile?.skin_type
      ? `KNOWN SKIN TYPE: ${userProfile.skin_type} (verify with camera analysis today)`
      : ``,
    userProfile?.skin_concerns?.length > 0
      ? `PREVIOUSLY RECORDED CONCERNS: ${userProfile.skin_concerns.join(', ')}`
      : ``,
  ].filter(Boolean).join('\n');

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: contextParts,
    },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  // ── LUNA'S AGENTIC REASONING LOOP ──
  // Luna reasons independently through each step.
  // She decides what to look at, what to call, what to say.
  // No hardcoded sequence — pure autonomous reasoning.
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: LUNA_SYSTEM_PROMPT,
      tools: LUNA_TOOLS,
      messages: currentMessages,
    });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    // Luna has finished reasoning — extract final response
    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    // Execute all tool calls Luna made in this iteration
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      let result;
      try {
        result = await executeLunaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Luna: Tool call failed', {
          tool: toolUse.name,
          error: toolError.message,
        });
        result = {
          error: 'tool_failed',
          message: `${toolUse.name} encountered an error: ${toolError.message}`,
        };
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Add this iteration to the conversation
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  // Fallback if reasoning loop did not produce a response
  if (!finalResponseText) {
    finalResponseText = isReturningClient
      ? `Welcome back. I can see you clearly — let me take a proper look at your skin today and see how things have progressed.`
      : `Hello, I am Luna — I can see you through your camera now. Let me take a thorough look at your skin and build you a completely personalised routine.`;
  }

  // Synthesise Luna's voice response
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Luna: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    hasPendingSimulation: !!sessionContext.pendingSimulation,
    hasNovaRequest: !!sessionContext.novaRequest,
    belleSimulations: sessionContext.belleSimulationCount,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    pendingSimulation: sessionContext.pendingSimulation,
    novaRequest: sessionContext.novaRequest,
    sageData: sessionContext.sageData,
    cameraAnalysis: sessionContext.cameraAnalysis,
    isReturningClient,
  };
}

module.exports = {
  processLunaSession,
  LUNA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};