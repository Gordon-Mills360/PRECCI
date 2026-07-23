// FILE: precci/backend/src/agents/grace.js
// Grace — PC-026 — Reception & Client Routing
// COMPLETE FULL BUILD — no simplification anywhere.
// The first voice every client hears. Always on. Always warm.
// Routes based ONLY on stated need — NEVER on gender assumption.
// All routing decisions logged to routing_log table with full reasoning.
// Returning clients recognised, greeted by name, history recalled.
// New clients profiled through conversation — never through a form.
// Sage environmental data passed to every specialist before routing.
// Allergy context passed to every specialist before routing.
// Subscription tier context passed to every specialist.
// Lena escalation for distressed clients — support before routing.
// Session created in database before routing.
// Nadia performance logging on every completed routing.
// Full agentic reasoning loop — 12 iterations maximum.
// Grace never routes reactively — she reasons before every decision.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { getContextForAgent } = require('./sage');
const { getClientTierContext, triggerUpgradeFlow } = require('../services/subscriptionManager');
const { buildAllergyContextForAgent } = require('../services/allergyChecker.service');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-026';
const AGENT_NAME = 'Grace';

// ─────────────────────────────────────────────
// GRACE'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not keyword matching.
// Grace understands meaning and routes on understanding.
// She reasons through every routing decision completely
// before making it. Never reactive. Always thoughtful.
// ─────────────────────────────────────────────
const GRACE_SYSTEM_PROMPT = `You are Grace, the Reception and Client Routing specialist at PRECCI.
Your ID is PC-026.

You are the first voice every client hears when they open PRECCI.
You are warm, intelligent, welcoming and completely present.
You never sleep. You are always listening. You are always ready.
You exist at the entry point of the world's first Personal AI
Appearance Intelligence System — and every client's experience
of PRECCI begins with you.

YOUR FUNDAMENTAL PURPOSE:
To make every single person who opens PRECCI feel immediately
welcomed, genuinely heard and perfectly directed. You listen with
complete attention. You understand what each person actually needs —
not just the words they use, but the intent behind them. You then
route them seamlessly to the exact right specialist. The client
should never feel transferred. They should feel that the right
expert has simply appeared to help them.

YOUR ABSOLUTE ROUTING RULE — NON-NEGOTIABLE:
You NEVER route based on gender.
You NEVER assume what a client needs based on how they look,
their name, or any demographic signal whatsoever.
You route based ONLY and EXCLUSIVELY on what the client
describes they need.

A male client saying "I want to sort my skin" → Luna.
A male client saying "help me with my hair" → Zara.
A male client saying "I need outfit advice" → Isla.
A male client saying "I want to smell better" → Remy.
A male client saying "I want to sort my beard" → Drew.
A female client saying any of the above → exact same routing.
A non-binary client saying any of the above → exact same routing.

The agent you route to is determined entirely by the topic.
Never by the person's gender, apparent age, or appearance.

THE SPECIALIST AGENTS AND EXACTLY WHEN TO ROUTE TO EACH:

LUNA (PC-008) — AI Skin Analyst
Route when client mentions: skin of any kind, skincare routine,
skin analysis, spots, acne, breakouts, hyperpigmentation, dark spots,
anti-aging, wrinkles, fine lines, skin texture, oily skin, dry skin,
sensitive skin, redness, rosacea, pores, complexion, glow, dull skin,
dark circles (under eyes — skin-related), uneven tone, sun damage,
post-acne marks, moisturiser advice, serum advice, SPF advice,
beard area skin (razor bumps, ingrown hairs, post-shave skin issues),
any skin concern on any part of the face or body.
Luna serves every gender. Every skin type. Every skin tone.

ZARA (PC-009) — Hair Expert
Route when client mentions: hair of any kind, hair care, hair analysis,
hair type, scalp health, hair growth, protective styles, natural hair,
relaxed hair, transitioning hair, hair breakage, hair loss, shedding,
hair texture, hair porosity, hair products, shampoo, conditioner,
deep conditioning, hair dryness, frizz, hair colour care, braids,
locs, haircut style (route to Zara first — she identifies hair type
and may flag Drew for male haircut specifics), fade questions.
Zara serves every gender. Every hair type 1A through 4C.
Short hair on men and long hair on women — equal expertise.

MIA (PC-010) — Makeup and Grooming Appearance
Route when client mentions: makeup of any kind, foundation, concealer,
coverage, eye makeup, lip colour, contouring, highlighter, blush,
bronzer, makeup for events, everyday makeup, bridal makeup, makeup
tutorial, learning makeup, virtual makeup try-on, how to apply makeup,
colour matching for foundation, brow products, mascara.
Also route to Mia when any client (any gender) mentions wanting to
look polished with product — tinted moisturiser, CC cream, concealer
for dark circles, brow grooming products. Mia always asks the client
what they are open to before recommending anything.

ISLA (PC-011) — Style and Outfit Advisor
Route when client mentions: outfit advice, what to wear, clothing,
wardrobe, style, fashion, event dressing, what to wear for an occasion,
professional dress, casual style, smart casual, body type styling,
colour palette for clothes, shopping advice, capsule wardrobe,
menswear, womenswear, gender-neutral fashion, seasonal dressing,
how to look put together, styling advice.
Isla serves every gender with equal depth of expertise.

REMY (PC-012) — Fragrance Advisor
Route when client mentions: fragrance, perfume, cologne, aftershave,
how to smell good, what scent to wear, signature scent, occasion scent,
smelling better, scent recommendations, fragrance layering, which
perfume to buy. Remy serves every gender — recommends based on
skin chemistry and preference, never on gender.

CORA (PC-013) — Body Care Specialist
Route when client mentions: body skincare (NOT face — that is Luna),
body moisturising, body lotion, stretch marks, body brightening,
body exfoliation, hyperpigmentation on body, post-gym skincare,
body care routine, hygiene-related skincare, hands and feet skincare.
Cora serves every gender equally.

DREW (PC-014) — Male Grooming Specialist
Route when client specifically frames their need as male grooming:
beard analysis, beard shaping, beard care, beard styling,
beard grooming routine, beard oil, beard balm, how to shape a beard,
what beard style suits their face, men's grooming routine when they
specifically want masculine/male-focused advice, barbershop-style
guidance, traditional male grooming.
CRITICAL: Drew is NOT the only agent for male clients.
Male client asking about skin → Luna.
Male client asking about hair → Zara.
Male client asking about outfit → Isla.
Male client asking about fragrance → Remy.
Drew is specifically for beard-primary needs and masculine
grooming when the client frames it this way.

PIPER (PC-018) — Beauty Academy
Route when client wants to learn skills themselves: online courses,
tutorials, masterclasses, beauty education, learning to do their own
makeup, self-care courses, grooming education. Piper covers
all genders — male grooming courses, female beauty courses,
universal skincare education all exist in the Academy.

LENA (PC-021) — Customer Support
Route when client has: account issues, billing questions,
subscription problems, technical issues with the app, complaints,
refund requests, questions about their plan. Also route to Lena
or involve Lena directly when a client seems distressed,
overwhelmed or in need of support before appearance advice.

BROOK (PC-027) — PRECCI Connect
Route when client wants to book a real-world appointment:
nail technician, hairdresser, barber, barbershop, men's grooming
studio, clothing boutique, spa, makeup artist, skincare clinic,
massage therapist, personal stylist. Any real-world beauty or
lifestyle service booking goes to Brook.
Brook serves every gender — barbers for male clients, salons
for female clients, any provider type for any client.

INTERNAL AGENTS — NEVER ROUTE CLIENTS DIRECTLY:
Sage (PC-015): feeds environmental data to all agents — not client-facing
Belle (PC-016): activated by specialist agents — not routed to by Grace
Nova (PC-017): activated by specialist agents — not routed to by Grace
Elton (PC-020): data analyst — internal only
Finn (PC-022): advertising — internal only
Aurora (PC-023): community — clients access Inner Circle but not routed here
Cole (PC-024): partnerships — internal only
Eva (PC-025): legal — internal only
Vivienne (PC-001): CEO — Precious only, not client-facing
All board directors: internal only

RETURNING CLIENT RECOGNITION AND HANDLING:
You know every returning client from their profile data.
When you recognise a returning client, you greet them by name
immediately: "Welcome back, [name]. It is wonderful to have you
here again."
You reference their last session naturally:
"Last time you worked with [agent name] on [topic] — shall we
pick up from there, or is there something new you would like
to explore today?"
You use their profile and history to make every returning client
feel genuinely remembered. You notice things:
"I remember you mentioned [specific concern from their profile] —
how has that been progressing?"
You never make returning clients re-explain their history.

NEW CLIENT ONBOARDING — THROUGH CONVERSATION:
For first-time clients, you create their profile through natural
conversation. Never through a form. Never through a list of questions.
You listen for:
- Their name (pick it up if they share it naturally)
- What they are hoping PRECCI can help them with today
- Any immediate concerns, goals or context they mention
You gather this naturally and write to their profile.
You then route them with a warm, prepared handoff.

DISTRESSED OR EMOTIONAL CLIENTS:
If a client seems stressed, anxious or overwhelmed before you
route them, you acknowledge them first. You do not rush to route.
"I can hear that [concern]. Let me make sure I get you exactly
the right person for this."
If the distress seems personal or unrelated to appearance,
you bring Lena in warmly: "Let me get Lena for you — she will
take wonderful care of you from here."

SAGE ENVIRONMENTAL CONTEXT:
Before routing any client, you call Sage for their location's
current conditions. You pass this to the specialist.
You may also mention it warmly:
"I can see you are in [city] — it is [weather] today. [Agent]
will factor that into everything they recommend for you."

HANDOFF LANGUAGE — HOW YOU ROUTE:
Never say: "I am routing you to..." — mechanical and cold.
Never say: "I am transferring you to..." — feels like a call centre.

Instead, say things like:
"Let me get Luna for you right now — she will look at your skin
through the camera and have your personalised routine ready in minutes."
"Drew is exactly who you need — he specialises in precisely this
and he will take it from here."
"Zara is brilliant for what you are describing. She will look at
your hair through the camera and you will have everything you need."
"Let me bring Isla in — she will build you three complete looks
for [occasion] and show you each one on your actual body."

The handoff feels like the right expert walking into the room.
Not a call transfer. Not a redirect. A warm introduction.

REASONING BEFORE EVERY ROUTING DECISION:
Before routing, you reason through all of these:
1. Exactly what did this client say they need?
2. Is there ambiguity? If so, one clarifying question only.
3. Which specialist is the most precise match for this need?
4. What environmental context from Sage should I pass?
5. What profile or history context should I pass?
6. What allergy or tier context should I pass?
7. How do I make this handoff feel natural and warm?

You answer all seven before routing.
You never route reactively on a single keyword.
You route on genuine understanding of what this person needs.

SUBSCRIPTION TIER AWARENESS:
You receive the client's tier context.
Free clients can only access Grace and Lena — other specialists
require a paid plan. If a free client tries to access a specialist,
you handle this warmly:
"To work with [specialist] I would need to let you know that
requires a PRECCI Glow subscription — that is just [price] per month
and gives you [key benefits]. Would you like to upgrade now so
we can get started right away?"
You never refuse them coldly. You always offer the path forward.

TOOLS AVAILABLE — USE ALL OF THEM:
- lookup_client_profile: Get returning client's history
- create_client_profile: Create new client from conversation
- route_to_agent: Perform the routing
- log_routing_decision: Log routing with full reasoning
- get_sage_context: Environmental data before routing
- search_client_memory: Search this client's history across all agents
- store_grace_memory: Save key context from this session
- create_session: Create a session record before routing
- trigger_upgrade: When free client needs a paid feature
- log_grace_performance: Report session to Nadia`;

// ─────────────────────────────────────────────
// GRACE'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const GRACE_TOOLS = [
  {
    name: 'lookup_client_profile',
    description: 'Retrieves a returning client\'s full profile, session history, last agent worked with, last topic, current plan, and any notes. Call this immediately for any client who may be returning — before responding.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The client\'s user ID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'create_client_profile',
    description: 'Creates or updates a client\'s profile from information gathered naturally in conversation. Call this for new clients after learning their name and initial needs. Never use a form — always from conversation.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        name: { type: 'string', description: 'Client\'s name if shared naturally' },
        initialConcerns: {
          type: 'array',
          items: { type: 'string' },
          description: 'What the client described wanting help with',
        },
        appearanceGoals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Goals or occasions the client mentioned',
        },
        groomingPrefs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any grooming preferences mentioned',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'route_to_agent',
    description: 'Performs the actual routing of the client to the correct specialist agent. Only call this after all reasoning is complete. Pass complete context so the specialist is fully prepared.',
    input_schema: {
      type: 'object',
      properties: {
        targetAgentId: {
          type: 'string',
          description: 'PC ID of the specialist to route to — e.g. PC-008 for Luna',
          enum: ['PC-008', 'PC-009', 'PC-010', 'PC-011', 'PC-012', 'PC-013', 'PC-014', 'PC-018', 'PC-021', 'PC-027'],
        },
        clientId: { type: 'string' },
        sessionId: { type: 'string' },
        voiceSessionId: { type: 'string' },
        contextForAgent: {
          type: 'string',
          description: 'Complete context the specialist needs: what the client needs, environmental data summary, allergy context, tier context, any relevant history from Grace\'s conversation',
        },
        routingReason: {
          type: 'string',
          description: 'Grace\'s full reasoning for why this specific agent is the correct match',
        },
        clientNeed: {
          type: 'string',
          description: 'The specific need the client expressed, in their own words',
        },
        isReturningClient: { type: 'boolean' },
        sageContext: {
          type: 'object',
          description: 'Environmental data from Sage to pass to specialist',
        },
      },
      required: ['targetAgentId', 'clientId', 'contextForAgent', 'routingReason', 'clientNeed'],
    },
  },
  {
    name: 'log_routing_decision',
    description: 'Logs Grace\'s routing decision with complete reasoning to the routing_log table. Always call this after every routing decision.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        voiceSessionId: { type: 'string' },
        toAgent: { type: 'string' },
        routingReason: { type: 'string', description: 'Full reasoning for this routing decision' },
        clientNeed: { type: 'string', description: 'What the client said they needed' },
        wasAmbiguous: { type: 'boolean', description: 'Was clarification needed before routing?' },
        clarificationAsked: { type: 'string', description: 'If clarification was needed, what was asked' },
      },
      required: ['userId', 'toAgent', 'routingReason', 'clientNeed'],
    },
  },
  {
    name: 'get_sage_context',
    description: 'Gets real-time weather, humidity, UV index and air quality for the client\'s location. Always call this before routing so the specialist has current environmental conditions.',
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
    name: 'search_client_memory',
    description: 'Search this client\'s conversation and session history across all agents. Use for returning clients to find relevant past context Grace can reference naturally.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search for — concerns, agents visited, topics discussed' },
        limit: { type: 'number', description: 'Number of memories to retrieve' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_grace_memory',
    description: 'Save key context from this session to Grace\'s memory for this client. Call at end of every session — include what the client needed, where they were routed, any new information learned.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Summary of this session — client need, routing decision, new profile information learned' },
        metadata: {
          type: 'object',
          description: 'Structured: routedTo, clientNeed, newInformationLearned, sessionDate',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'create_session',
    description: 'Creates a session record in the database before routing. Call this before route_to_agent so the session exists for the specialist to reference.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        agentId: { type: 'string', description: 'The target agent ID — who the session is with' },
        voiceSessionId: { type: 'string' },
        channel: { type: 'string', description: 'Channel: vapi, app, web' },
      },
      required: ['userId', 'agentId'],
    },
  },
  {
    name: 'trigger_upgrade',
    description: 'Called when a free client tries to access a specialist that requires a paid plan. Returns the upgrade context Grace uses to offer upgrade naturally by voice.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        currentPlan: { type: 'string', enum: ['free', 'glow', 'pro', 'elite'] },
        featureAttempted: { type: 'string', description: 'Which specialist or feature the client tried to access' },
      },
      required: ['userId', 'currentPlan', 'featureAttempted'],
    },
  },
  {
    name: 'log_grace_performance',
    description: 'Report this session\'s performance data to Nadia (COO) for agent monitoring. Call at end of every completed routing.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        voiceSessionId: { type: 'string' },
        routedToAgent: { type: 'string' },
        isReturningClient: { type: 'boolean' },
        isNewClient: { type: 'boolean' },
        clarificationRequired: { type: 'boolean' },
        upgradeOffered: { type: 'boolean' },
        lenaEscalation: { type: 'boolean' },
        sessionDurationEstimate: { type: 'string' },
      },
      required: ['userId', 'routedToAgent'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE GRACE'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeGraceToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'lookup_client_profile': {
      const { userId } = toolInput;

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, plan, plan_status, onboarding_complete, created_at, city, country, lat, lng, camera_consent, voice_consent')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          found: false,
          isNewClient: true,
          message: 'No existing profile — this is a new client',
        };
      }

      // Get beauty profile
      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_type, skin_tone, skin_concerns, hair_type, hair_concerns, style_prefs, appearance_goals, grooming_prefs, allergies, budget_range')
        .eq('user_id', userId)
        .single();

      // Get last session
      const { data: lastSession } = await supabase
        .from('sessions')
        .select('agent_id, created_at, recommendations')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get session count
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Get agent names for last session reference
      const agentNames = {
        'PC-008': 'Luna', 'PC-009': 'Zara', 'PC-010': 'Mia',
        'PC-011': 'Isla', 'PC-012': 'Remy', 'PC-013': 'Cora',
        'PC-014': 'Drew', 'PC-018': 'Piper', 'PC-021': 'Lena',
        'PC-026': 'Grace', 'PC-027': 'Brook',
      };

      sessionContext.clientName = user.name;
      sessionContext.clientPlan = user.plan;
      sessionContext.isReturningClient = sessionCount > 0;

      return {
        found: true,
        isNewClient: !sessionCount || sessionCount === 0,
        isReturningClient: sessionCount > 0,
        totalSessions: sessionCount || 0,
        user: {
          name: user.name,
          plan: user.plan,
          planStatus: user.plan_status,
          onboardingComplete: user.onboarding_complete,
          city: user.city,
          country: user.country,
          lat: user.lat,
          lng: user.lng,
          cameraConsent: user.camera_consent,
          memberSince: user.created_at,
        },
        profile: profile || {},
        lastSession: lastSession
          ? {
              agentName: agentNames[lastSession.agent_id] || lastSession.agent_id,
              agentId: lastSession.agent_id,
              date: lastSession.created_at,
            }
          : null,
        hasAllergies: (profile?.allergies || []).length > 0,
        allergies: profile?.allergies || [],
      };
    }

    case 'create_client_profile': {
      const { userId, name, initialConcerns = [], appearanceGoals = [], groomingPrefs = [] } = toolInput;

      if (name) {
        await supabase
          .from('users')
          .update({
            name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        sessionContext.clientName = name;
      }

      // Create or update beauty profile with what Grace learned from conversation
      await supabase
        .from('beauty_profiles')
        .upsert(
          {
            user_id: userId,
            appearance_goals: appearanceGoals.length > 0 ? appearanceGoals : undefined,
            grooming_prefs: groomingPrefs.length > 0 ? groomingPrefs : undefined,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      return {
        success: true,
        profileCreated: true,
        name: name || null,
        message: 'Client profile created from conversation',
      };
    }

    case 'route_to_agent': {
      const {
        targetAgentId, clientId, sessionId, voiceSessionId,
        contextForAgent, routingReason, clientNeed,
        isReturningClient, sageContext,
      } = toolInput;

      // Log routing decision
      await supabase.from('routing_log').insert({
        user_id: clientId,
        voice_session_id: voiceSessionId || null,
        from_agent: PC_ID,
        to_agent: targetAgentId,
        routing_reason: routingReason,
        timestamp: new Date().toISOString(),
      });

      sessionContext.routingDecision = {
        targetAgent: targetAgentId,
        clientNeed,
        routingReason,
        contextForAgent,
        routedAt: new Date().toISOString(),
      };

      return {
        routed: true,
        targetAgent: targetAgentId,
        clientNeed,
        contextPassed: contextForAgent,
        routedAt: new Date().toISOString(),
      };
    }

    case 'log_routing_decision': {
      const { userId, voiceSessionId, toAgent, routingReason, clientNeed, wasAmbiguous, clarificationAsked } = toolInput;

      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: voiceSessionId || null,
        from_agent: PC_ID,
        to_agent: toAgent,
        routing_reason: `${routingReason} | Client need: ${clientNeed}${wasAmbiguous ? ` | Clarification asked: ${clarificationAsked}` : ''}`,
        timestamp: new Date().toISOString(),
      });

      return { logged: true };
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;

      try {
        const sageData = await getContextForAgent(lat, lng, PC_ID);
        sessionContext.sageData = sageData;
        return sageData;
      } catch (error) {
        logger.error('Grace: Sage context fetch failed', { error: error.message });
        return {
          available: false,
          summary: 'Environmental data temporarily unavailable',
        };
      }
    }

    case 'search_client_memory': {
      const { userId, query, limit } = toolInput;

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

    case 'store_grace_memory': {
      const { userId, content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId,
        content,
        memoryType: 'routing',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
        },
      });

      return { stored: true, memoryId };
    }

    case 'create_session': {
      const { userId, agentId, voiceSessionId, channel } = toolInput;

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          agent_id: agentId,
          voice_session_id: voiceSessionId || null,
          channel: channel || 'vapi',
          camera_used: false,
          camera_consent: false,
          completed: false,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (sessionError) {
        logger.error('Grace: Failed to create session', { error: sessionError.message });
        return { created: false, error: sessionError.message };
      }

      sessionContext.createdSessionId = session.id;

      return {
        created: true,
        sessionId: session.id,
        agentId,
        userId,
      };
    }

    case 'trigger_upgrade': {
      const { userId, currentPlan, featureAttempted } = toolInput;
      const upgradeInfo = await triggerUpgradeFlow(userId, currentPlan, featureAttempted);
      sessionContext.upgradeOffered = true;
      return upgradeInfo;
    }

    case 'log_grace_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Grace completed routing for user ${toolInput.userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
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
// PROCESS GRACE REQUEST
// Full autonomous agentic reasoning loop.
// Grace thinks, listens, understands and routes.
// Nothing hardcoded — every routing decision
// generated from what Claude reasons about
// this specific client's specific need.
// ─────────────────────────────────────────────
async function processGraceRequest({
  transcript,
  userId,
  voiceSessionId,
  clientLocation = null,
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  // ── LOAD ALL CONTEXT GRACE NEEDS ──

  // 1. Subscription tier context
  const tierContext = await getClientTierContext(userId);

  // 2. Allergy context — passed to specialist
  const allergyContext = await buildAllergyContextForAgent(userId);

  // 3. Check if new or returning
  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  const isNewClient = !sessionCount || sessionCount === 0;
  const isReturningClient = !isNewClient;

  // 4. Get user basic data
  const { data: user } = await supabase
    .from('users')
    .select('name, plan, lat, lng, city, country')
    .eq('id', userId)
    .single();

  // Session context shared across all tool calls
  const sessionContext = {
    userId,
    voiceSessionId,
    tierContext,
    allergyContext,
    sageData: null,
    routingDecision: null,
    clientName: user?.name || null,
    clientPlan: user?.plan || 'free',
    isNewClient,
    isReturningClient,
    createdSessionId: null,
    upgradeOffered: false,
  };

  // Build complete context message Grace receives
  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `VOICE SESSION ID: ${voiceSessionId || 'not_set'}`,
    isNewClient
      ? `CLIENT STATUS: New client — first time at PRECCI. Create their profile through conversation.`
      : `CLIENT STATUS: Returning client — ${sessionCount} previous sessions. Look up their profile and greet them by name.`,
    user?.name ? `CLIENT NAME: ${user.name}` : `CLIENT NAME: Not yet known`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng} — call get_sage_context to get today\'s conditions`
      : `CLIENT LOCATION: Not available — proceed without environmental data`,
    user?.city ? `CLIENT CITY: ${user.city}, ${user.country || ''}` : '',
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY CONTEXT FOR SPECIALIST:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known allergies on file`,
    `\nCRITICAL: Route based ONLY on what this client said they need. Never on gender assumption. Never on appearance assumption.`,
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

  // ── GRACE'S AGENTIC REASONING LOOP ──
  // Grace reasons through the client's need,
  // gathers context, and routes with full preparation.
  // Nothing reactive. Everything reasoned.
  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
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
      let result;
      try {
        result = await executeGraceToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Grace: Tool call failed', {
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

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  if (!finalResponseText) {
    finalResponseText = isReturningClient && sessionContext.clientName
      ? `Welcome back, ${sessionContext.clientName}. It is wonderful to have you here again. What would you like to work on today?`
      : `Welcome to PRECCI. I am Grace, and I am delighted to have you here. What would you like help with today?`;
  }

  // Synthesise Grace's voice response
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Grace: Session complete', {
    userId,
    voiceSessionId,
    isNewClient,
    isReturningClient,
    routedTo: sessionContext.routingDecision?.targetAgent || 'not yet routed',
    upgradeOffered: sessionContext.upgradeOffered,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    routingDecision: sessionContext.routingDecision,
    targetAgent: sessionContext.routingDecision?.targetAgent || null,
    createdSessionId: sessionContext.createdSessionId,
    isNewClient,
    isReturningClient,
    clientName: sessionContext.clientName,
  };
}

module.exports = {
  processGraceRequest,
  GRACE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};