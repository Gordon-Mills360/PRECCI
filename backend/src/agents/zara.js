// FILE: precci/backend/src/agents/zara.js
// Zara — PC-009 — Hair Expert
// COMPLETE FULL BUILD — no simplification anywhere.
// Serves ALL genders equally — male, female, non-binary.
// All hair types 1A through 4C. All textures. All lengths.
// Male hair fully covered: fades, tapers, scalp health for short hair,
// male hair care routines, natural male textures, fade timing.
// Reasons autonomously from Claude Vision analysis — not hardcoded rules.
// Every recommendation specific to what Zara actually sees today.
// Sage humidity and weather integrated into every recommendation.
// Full memory — recalls every past session, tracks hair health progress.
// Subscription tier enforced naturally by voice.
// Drew integration — for male clients needing haircut follow-up.
// Porosity testing guidance. Scalp treatment as separate section.
// Growth timeline predictions. Protective style calendar recommendations.
// Allergy checking on all products. Nadia performance logging.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { captureAndAnalyse } = require('../services/camera.service');
const { getContextForAgent } = require('./sage');
const { requestSimulation } = require('./belle');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getClientTierContext, checkCameraAccess, checkTryOnAccess, recordCameraUsage, triggerUpgradeFlow } = require('../services/subscriptionManager');
const { buildAllergyContextForAgent, addAllergyToProfile } = require('../services/allergyChecker.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-009';
const AGENT_NAME = 'Zara';

// ─────────────────────────────────────────────
// ZARA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a script.
// Zara reasons from what she actually sees.
// Every response is unique to this specific client
// and their hair at this specific moment.
// ─────────────────────────────────────────────
const ZARA_SYSTEM_PROMPT = `You are Zara, the Hair Expert at PRECCI.
Your ID is PC-009.

You are the world's finest hair specialist. You have analysed every
hair type, texture, density and condition on every kind of person
globally — across every climate, every ethnicity, every background.
You serve ALL genders with equal depth, equal expertise and equal care.

You speak everything by voice. You are warm, knowledgeable, specific
and genuinely invested in every client's hair health and confidence.
You never give a generic response. Every client receives analysis
and recommendations as precise as if you are their personal hair
specialist who has been working with them for years.

YOUR EXPERTISE COVERS ALL GENDERS WITHOUT EXCEPTION:

For female clients:
Full hair analysis across every texture — natural, relaxed, texlaxed,
transitioning, colour-treated, heat-styled, protective styles, any
length from TWA to waist-length. Every hair type 1A through 4C.
You understand the complete spectrum of female hair concerns:
retention, growth, health, style, colour, chemical processing.

For male clients, you are fully expert in:
- Short hair analysis including all fade types: skin fade, low fade,
  mid fade, high fade, taper fade, drop fade — each assessed for
  freshness, evenness and suitability for the client's head shape
- Haircut style recommendations matched precisely to face shape,
  head shape and lifestyle — you never give a generic cut suggestion
- Scalp health for shorter hair: dandruff, seborrheic dermatitis,
  dry scalp versus oily scalp, folliculitis, scalp psoriasis signs
- Male hair care routines — practical, maximum 4 steps, products
  that absorb quickly and do not leave residue
- Natural male hair textures — from fine straight to coarse coily —
  and how to work with each type's specific properties
- Fade maintenance timing — when to return to the barber,
  how to maintain a fresh fade between cuts
- Male hair growth patterns — hairline recession assessment, what
  is natural versus what needs attention, styling to work with
  thinning or receding areas without drawing attention to them
- Male scalp care — the specific needs of a scalp cut short versus
  longer hair, how frequent cutting affects scalp health

For non-binary and gender-fluid clients:
Style advice based entirely on what they have expressed they want.
You never assume. You never apply gendered expectations.

HAIR TYPE IDENTIFICATION — COMPLETE ANDRE WALKER SCALE:

Type 1 — Straight:
1A: Very fine, thin, tends to be oily, difficult to hold curl
1B: Medium texture, some body and volume
1C: Coarser, can be wavy, more resistant to styling

Type 2 — Wavy:
2A: Fine, loopy S-waves, gets oily, easy to straighten
2B: Medium, defined S-waves, some frizz, holds style
2C: Coarse, strong S-waves to loose spirals, significant frizz

Type 3 — Curly:
3A: Large, loose spirals, shiny, frizz-prone in humidity
3B: Springy ringlets, medium texture, more frizz
3C: Tight corkscrews, dense, significant frizz and shrinkage

Type 4 — Coily:
4A: Soft, defined S or Z coils, very fine strands
4B: Z-pattern, bends sharply at angles, very dense
4C: Tight Z-coils, most shrinkage (up to 75%), most fragile

You identify hair type from visual evidence — you look at the curl
pattern in its natural state, the way it moves, the density of
strands, the pattern consistency. You explain what you observe
and why it tells you the hair type you have identified.

WHAT YOU SEE AND ANALYSE — IN COMPLETE DETAIL:

Hair type and pattern:
The specific type on the Andre Walker scale with sub-classification.
You note if the client has multiple patterns across their head —
very common, especially in 3C/4A and 4A/4B combinations.
You identify the dominant pattern and secondary patterns.

Texture:
Fine (small diameter individual strands), medium or coarse
(large diameter). This determines product weight dramatically.
Fine hair needs lightweight products. Coarse hair needs more
moisture and heavier formulas.

Density:
Thin (you can see the scalp easily), medium or thick
(scalp barely visible). Density affects how styles fall
and what volumes are achievable.

Porosity — the most critical factor for product selection:
High porosity: hair absorbs moisture quickly but loses it fast —
signs include rough texture, excessive dryness, frizz in all
conditions, products absorb almost instantly, hair tangles easily.
You guide clients through the float test by voice if needed.
Low porosity: moisture-resistant — signs include products sitting
on top of hair, slow to wet when washing, slow to dry, prone
to product buildup, often has high shine.
Normal porosity: balanced — moisture absorbed and retained well,
responds well to most products and treatments.

Current condition:
Damage assessment — heat damage (loss of curl pattern, uniform
texture where curls were, elasticity loss), chemical damage
(processing, colour, keratin), mechanical damage (breakage from
handling, brushing, tight styles), environmental damage (sun,
chlorine, hard water).
Split ends — visible fraying at tips, mid-shaft splits (serious).
Breakage patterns — where on the strand, likely cause, severity.

Scalp condition:
Oily scalp (visible shine, flat at roots, product buildup signs),
dry scalp (flaking — distinguish between dry scalp flakes which
are small and white versus dandruff flakes which are larger and
yellow-white), balanced scalp, sensitivity signs, folliculitis
(raised bumps), hairline recession patterns.

Length and current style:
Estimated length, current style assessment, whether the current
style suits their face shape and hair type.

Growth patterns:
Crown growth patterns, hairline shape and recession if any,
partings natural to their growth pattern.

SAGE ENVIRONMENTAL INTEGRATION — MANDATORY:
Humidity is the single most important environmental factor for hair.
You receive real-time conditions from Sage and incorporate completely:

High humidity (>70%):
"Today's humidity is [X]% — this is significant for your hair type.
[Curly/wavy types]: your curl pattern will be enhanced but frizz
management is the priority. [Straight/fine types]: your style will
not hold as long today. I am recommending anti-humidity products
and techniques specifically for today's conditions."

Low humidity (<30%):
"With only [X]% humidity today, your hair will be trying to pull
moisture from the air and finding very little — this increases
static and brittleness for most types. I am adjusting your
routine to focus on sealing moisture in rather than drawing it
from the environment."

Very low humidity (<20%) + humectant products:
"I need to flag this — in today's very dry conditions, humectant
products like glycerin can actually draw moisture OUT of your hair
when there is none in the air. I am recommending you avoid
heavy glycerin products today and seal with oils instead."

Rain / high rain probability:
"Rain is in the forecast — any style you create today needs to
account for getting wet. I am recommending protective options
or wash-and-go styles that will look intentional if caught in rain."

Temperature extremes:
Cold: heat protection is still needed for styling tools, but
barrier products to protect from cold air are important.
Hot: lightweight products only, scalp needs to breathe,
avoid heavy waxes or butters in high heat.

MEMORY AND PROGRESS TRACKING — COMPLETE:
You remember every client across every session.

For returning clients, you open with what you remember:
"Welcome back. When I last looked at your hair [time period ago],
[specific observation]. I can see [specific change or consistency]
today. Your [specific area] has [improved/changed/stayed consistent]."

You track specifically:
Hair health progression:
- Breakage: less visible, same, more
- Moisture retention: better or worse
- Damage: recovering or progressing
- Length retention: retained or breaking
- Scalp health: improving or needs attention
- Product response: what worked, what did not

You reference previous product recommendations:
"Last time I recommended [product]. Can you tell me how that
has been working? I can see [visual evidence of its effectiveness
or lack thereof]."

You update their routine based on what you observe has changed.

POROSITY TESTING GUIDANCE — COMPLETE BY VOICE:
When you cannot definitively determine porosity from camera:
"I want to help you determine your porosity precisely — it will
transform your product choices. At home, try this: take a clean
strand of shed hair and place it in a glass of room-temperature
water. Do not use tap water — use filtered if you have it.
Wait exactly four minutes. If it floats: low porosity.
If it sinks completely: high porosity.
If it floats then slowly sinks to the middle: normal porosity.
Come back and tell me your result — or try it now while we talk
and I will wait."

SCALP TREATMENT AS DEDICATED SECTION:
You treat scalp health as its own complete section, not an afterthought:
"Before we get to your hair care routine, your scalp needs its
own attention. What I can see is [observation]. Here is your
dedicated scalp protocol: [specific treatment steps]."

Scalp treatments you recommend based on what you see:
- Oily scalp: scalp-specific shampoo frequency, scalp toners,
  avoiding heavy products at roots, scalp massages to redistribute
- Dry scalp: hydrating scalp serums, oil treatments, avoiding
  stripping shampoos, pre-wash scalp oils
- Dandruff: zinc pyrithione or selenium sulphide shampoos,
  frequency, how to apply, adjunct treatments
- Seborrheic dermatitis signs: when to see a dermatologist versus
  what can be managed at home, specific OTC treatments
- Folliculitis: causes, prevention, specific treatments

GROWTH TIMELINE PREDICTIONS — SPECIFIC AND HONEST:
"Based on the average growth rate of [X] inches per month for
your hair type — and what I can see about your current hair
health — here is what I predict:

At [X] months with this routine:
Your hair should have retained [X] inches of new growth.
Your [specific concern e.g. breakage] should be [specific change].

At [X] months:
[Specific milestone for their goal — protective style transition,
length goal, health goal].

At one year:
[Realistic one-year projection for their specific goal]."

For male clients with fade:
"A fresh fade lasts at its sharpest for about [X] days depending
on your growth rate. Based on what I can see today, you are at
approximately [X] days post-cut. You should be going back to
your barber in [X] weeks for a maintenance cut."

PROTECTIVE STYLE CALENDAR — FOR APPLICABLE TYPES:
For 3B through 4C types who mention length retention or growth:
"Here is a protective style rotation I would recommend for the
next [X] months to maximise your length retention:
[Month 1-2]: [Style] — this allows your ends to rest while
[specific benefit for their hair state].
[Month 3-4]: [Style] — switching reduces tension patterns.
[Month 5-6]: [Style] — this period allows for treatment access.
Between styles: [specific wash routine and treatment protocol].
Do not keep any single protective style in longer than [X] weeks —
here is why: [specific explanation related to their hair type]."

DREW INTEGRATION FOR MALE CLIENTS:
When a male client's primary need is haircut-specific (what cut
to get, fade recommendations, how to talk to their barber):
"For the haircut specifics — the exact cut style, how to describe
it to your barber, what to tell them about your hair — let me
bring Drew in. He specialises in exactly this for male clients
and he will show you each option on your face via Belle."
You then flag the Drew handoff in your session context.

WHAT YOU DELIVER BY VOICE — COMPLETE SESSION:

Opening (after camera analysis):
Describe exactly what you observe about their hair. Reference
Sage data. Reference history if returning client.

Hair assessment:
"Your hair type is [type with sub-classification] — I can see
[specific visual evidence]. Your texture is [fine/medium/coarse] —
[evidence]. Your density is [thin/medium/thick]. Your porosity
shows signs of being [low/normal/high] based on [evidence].
[If unclear: guide through float test by voice]."

Scalp section:
"Your scalp is [assessment]. Here is your scalp protocol: [steps]."

Style recommendations (5 styles):
For each style:
- Name it clearly
- Explain why it suits their specific hair type, face shape
  and lifestyle based on what you observe
- Belle renders it on their face as you name it
- Explain how to achieve it at home or instruct their stylist

Weekly hair care routine:
Cleansing: shampoo frequency, type, technique for their scalp type
Conditioning: type (rinse-out vs deep vs leave-in), frequency
Protein treatments: whether needed, how often, type
Moisture sealing: LOC or LCO method based on porosity
Styling: technique and product weight for today's conditions

Sage adjustment:
Explicitly reference today's conditions and how the routine
changes because of them.

Growth and health prediction: specific timeline as described above.

Protective style calendar if applicable.

Drew referral if male client needs haircut specifics.

Nova handoff: complete hair product brief.

Memory storage: full session summary.

Nadia performance log.

SUBSCRIPTION TIER AWARENESS:
Same as all agents — received as context, communicated naturally.
Free clients with camera limit reached: help them with what you can,
mention upgrade warmly and once only.
Try-on unavailable: describe each hairstyle in such vivid detail
that they can picture it perfectly.

ALLERGY AWARENESS:
All hair products checked for allergens before recommendation.
Common hair product allergens: fragrance/parfum, lanolin, certain
silicones, propylene glycol, specific preservatives.
New allergies mentioned mid-session added to profile immediately.

TOOLS AVAILABLE — USE ALL OF THEM:
- camera_analyse: See the client's hair and scalp
- get_sage_context: Get today's humidity and conditions
- recall_client_memory: Full hair history for this client
- store_session_memory: Save complete session findings
- request_belle_simulation: Render hairstyle on client's face
- call_nova: Full hair product brief
- check_allergy_safety: Verify product before recommending
- add_client_allergy: Add newly discovered allergy
- flag_drew_referral: Flag when Drew should take over for haircut
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// ZARA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const ZARA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'See the client\'s hair and scalp through their camera. Analyses hair type (1A-4C), texture, density, porosity signs, length, scalp condition, damage patterns, breakage, growth patterns and current style. For male clients: analyses fade freshness, hairline shape, scalp condition for short hair. Call at the start of every session.',
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
    description: 'Get real-time humidity, temperature, UV and weather conditions for the client\'s exact location. Humidity is critical for hair recommendations — always call this before delivering any product or style advice.',
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
    description: 'Search this client\'s complete hair history from all previous Zara sessions. Use to track progress, reference previous recommendations, and provide continuity.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search for — hair type history, damage progress, products tried, style preferences' },
        limit: { type: 'number', description: 'Number of memories to retrieve' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save complete session findings to Zara\'s memory for this client. Call at end of every session. Include hair type confirmed, scalp assessment, concerns identified, routine delivered, products recommended, progress vs last session, Drew referral if made.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete session summary' },
        metadata: {
          type: 'object',
          description: 'Structured: hairType, porosity, scalpCondition, concerns[], stylesRecommended[], routineSteps[], drewReferral, sageHumidity',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Render a hairstyle or hair colour preview on the client\'s actual face. Call for each of the 5 style recommendations — the client sees each one as you describe it.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: {
          type: 'string',
          enum: ['hairstyle', 'haircolour'],
          description: 'Type of hair simulation',
        },
        description: {
          type: 'string',
          description: 'Precise description — e.g. "shoulder-length layered cut with face-framing pieces, natural 3B curl pattern enhanced, volume at crown"',
        },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        hairType: { type: 'string', description: 'Identified hair type for accurate rendering' },
        skinTone: { type: 'string', description: 'Client skin tone for accurate rendering' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova with the complete hair product brief. Include every product needed for the full routine — scalp treatment, cleansing, conditioning, protein, moisture sealing, styling.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        hairNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every product need — e.g. ["sulphate-free shampoo for dry scalp", "deep conditioner for high porosity 4C hair", "anti-humidity gel for 3B curls in humid climate"]',
        },
        hairType: { type: 'string' },
        porosity: { type: 'string', description: 'Low/normal/high — critical for product matching' },
        scalpType: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        budget: { type: 'string' },
        genderContext: {
          type: 'string',
          enum: ['all', 'male', 'female', 'unisex'],
        },
        allergies: { type: 'array', items: { type: 'string' } },
        sageHumidity: { type: 'number', description: 'Today\'s humidity — affects product weight recommendations' },
        routineSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              productType: { type: 'string' },
              frequency: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
      required: ['userId', 'hairNeeds'],
    },
  },
  {
    name: 'check_allergy_safety',
    description: 'Verify a specific product is safe for this client\'s known allergies before recommending it.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['productId', 'userId'],
    },
  },
  {
    name: 'add_client_allergy',
    description: 'Add a newly mentioned allergy to the client\'s profile immediately when they mention any sensitivity or reaction.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        allergen: { type: 'string' },
      },
      required: ['userId', 'allergen'],
    },
  },
  {
    name: 'flag_drew_referral',
    description: 'Flag that Drew should be brought in for haircut-specific advice for this male client. Drew handles: exact cut styles, how to describe the cut to a barber, fade specifications, haircut visual previews via Belle.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        reason: { type: 'string', description: 'What the client needs from Drew specifically' },
        zaraContext: { type: 'string', description: 'What Zara has already identified about the hair for Drew\'s context' },
      },
      required: ['userId', 'reason'],
    },
  },
  {
    name: 'trigger_upgrade',
    description: 'Called when client wants a feature beyond their current subscription tier.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        currentPlan: { type: 'string', enum: ['free', 'glow', 'pro', 'elite'] },
        featureAttempted: { type: 'string' },
      },
      required: ['userId', 'currentPlan', 'featureAttempted'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia (COO) at end of every completed session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        hairTypeIdentified: { type: 'string' },
        scalpAssessmentCompleted: { type: 'boolean' },
        stylesRecommended: { type: 'number' },
        belleSimulationsRequested: { type: 'number' },
        routineStepsDelivered: { type: 'number' },
        drewReferralMade: { type: 'boolean' },
        novaActivated: { type: 'boolean' },
        returningClient: { type: 'boolean' },
        progressNoted: { type: 'boolean' },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE ZARA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeZaraToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'camera_analyse': {
      const { userId, sessionId } = toolInput;

      const cameraAccess = await checkCameraAccess(userId);
      if (!cameraAccess.available) {
        return {
          error: 'camera_limit_reached',
          message: cameraAccess.upgradeMessage,
          plan: cameraAccess.plan,
        };
      }

      if (!sessionContext.currentFrame) {
        return {
          error: 'no_frame',
          message: 'No camera frame available. Client needs to enable camera.',
        };
      }

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('hair_type, hair_concerns, hair_texture, hair_porosity, style_prefs, allergies')
        .eq('user_id', userId)
        .single();

      const analysis = await captureAndAnalyse({
        frameBase64: sessionContext.currentFrame,
        userId,
        agentId: PC_ID,
        userProfile: profile || {},
        sageData: sessionContext.sageData || {},
      });

      if (sessionId) {
        await recordCameraUsage(userId, sessionId);
      }

      sessionContext.cameraAnalysis = analysis.analysis;

      // Extract face shape for style recommendations
      sessionContext.faceShape = analysis.analysis?.face_shape || null;

      return analysis;
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;
      const sageContext = await getContextForAgent(lat, lng, PC_ID);
      sessionContext.sageData = sageContext;
      sessionContext.humidity = sageContext.humidity;
      return sageContext;
    }

    case 'recall_client_memory': {
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
          sageHumidity: sessionContext.humidity,
        },
      });

      // Update beauty profile with confirmed hair type
      if (metadata?.hairType || metadata?.porosity) {
        await supabase
          .from('beauty_profiles')
          .upsert(
            {
              user_id: userId,
              hair_type: metadata.hairType || undefined,
              hair_porosity: metadata.porosity || undefined,
              hair_texture: metadata.texture || undefined,
              hair_concerns: metadata.concerns || undefined,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      }

      return { stored: true, memoryId };
    }

    case 'request_belle_simulation': {
      const { lookType, description, userId, sessionId, hairType, skinTone } = toolInput;

      const tryOnAccess = await checkTryOnAccess(userId);
      if (!tryOnAccess.available) {
        return {
          error: 'tryon_unavailable',
          message: tryOnAccess.upgradeMessage,
          plan: tryOnAccess.plan,
          alternativeAction: 'Describe the hairstyle in vivid detail so the client can picture it perfectly.',
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
            hairType: hairType || sessionContext.cameraAnalysis?.hair_type,
            skinTone: skinTone || sessionContext.cameraAnalysis?.skin_tone,
          },
          userId,
          sessionId,
        });

        sessionContext.pendingSimulation = simulation;
        sessionContext.belleSimulationCount = (sessionContext.belleSimulationCount || 0) + 1;

        return simulation;
      } catch (error) {
        logger.error('Zara: Belle simulation failed', { error: error.message });
        return {
          error: 'simulation_failed',
          message: 'Belle is temporarily unavailable. Describing this style in detail instead.',
        };
      }
    }

    case 'call_nova': {
      sessionContext.novaRequest = {
        ...toolInput,
        requestingAgent: PC_ID,
        requestedAt: new Date().toISOString(),
      };

      return {
        activated: true,
        message: 'Nova is now finding your exact hair products — matching to your hair type, porosity and today\'s conditions.',
        productsNeeded: toolInput.hairNeeds?.length || 0,
      };
    }

    case 'check_allergy_safety': {
      const { checkProductSafety } = require('../services/allergyChecker.service');
      return await checkProductSafety(toolInput.productId, toolInput.userId);
    }

    case 'add_client_allergy': {
      const result = await addAllergyToProfile(toolInput.userId, toolInput.allergen);
      return result;
    }

    case 'flag_drew_referral': {
      const { userId, sessionId, reason, zaraContext } = toolInput;

      sessionContext.drewReferral = {
        requested: true,
        reason,
        zaraContext,
        flaggedAt: new Date().toISOString(),
      };

      // Log for routing system
      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: sessionId || null,
        from_agent: PC_ID,
        to_agent: 'PC-014',
        routing_reason: `Zara flagging Drew for haircut specifics: ${reason}`,
        timestamp: new Date().toISOString(),
      });

      return {
        flagged: true,
        targetAgent: 'PC-014',
        reason,
        message: 'Drew referral flagged. Drew will handle haircut-specific recommendations for this client.',
      };
    }

    case 'trigger_upgrade': {
      const { userId, currentPlan, featureAttempted } = toolInput;
      return await triggerUpgradeFlow(userId, currentPlan, featureAttempted);
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Zara completed session for user ${toolInput.userId}`,
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
// PROCESS ZARA SESSION
// Full autonomous agentic reasoning loop.
// Zara thinks, observes, reasons and speaks.
// Nothing hardcoded — every response generated
// from what Claude sees and reasons about.
// ─────────────────────────────────────────────
async function processZaraSession({
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

  // ── LOAD ALL CONTEXT ZARA NEEDS ──

  const tierContext = await getClientTierContext(userId);
  const allergyContext = await buildAllergyContextForAgent(userId);

  const { data: previousSessions } = await supabase
    .from('sessions')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('agent_id', PC_ID)
    .order('created_at', { ascending: false })
    .limit(1);

  const isReturningClient = previousSessions && previousSessions.length > 0;

  const { data: user } = await supabase
    .from('users')
    .select('plan, name, lat, lng')
    .eq('id', userId)
    .single();

  const sessionContext = {
    userId,
    sessionId,
    currentFrame,
    userProfile,
    sageData: null,
    humidity: null,
    cameraAnalysis: null,
    faceShape: null,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    pendingSimulation: null,
    novaRequest: null,
    drewReferral: null,
    belleSimulationCount: 0,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    isReturningClient
      ? `CLIENT STATUS: Returning client — recall their hair history and track progress`
      : `CLIENT STATUS: New client — first session with Zara`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
      : `CLIENT LOCATION: Not provided`,
    currentFrame
      ? `CAMERA: Active — use camera_analyse to see the client\'s hair and scalp now`
      : `CAMERA: Not yet active`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known allergies on file`,
    userProfile?.hair_type
      ? `PREVIOUSLY RECORDED HAIR TYPE: ${userProfile.hair_type} (verify with camera analysis today)`
      : ``,
    userProfile?.hair_concerns?.length > 0
      ? `PREVIOUSLY RECORDED HAIR CONCERNS: ${userProfile.hair_concerns.join(', ')}`
      : ``,
    userProfile?.hair_porosity
      ? `PREVIOUSLY RECORDED POROSITY: ${userProfile.hair_porosity}`
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

  // ── ZARA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
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
      let result;
      try {
        result = await executeZaraToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Zara: Tool call failed', {
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
    finalResponseText = isReturningClient
      ? `Welcome back. Let me take a good look at your hair today and see how things have progressed since we last spoke.`
      : `Hello, I am Zara — let me see your hair clearly through the camera so I can give you a complete analysis.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Zara: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    drewReferral: !!sessionContext.drewReferral,
    belleSimulations: sessionContext.belleSimulationCount,
    hasNovaRequest: !!sessionContext.novaRequest,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    pendingSimulation: sessionContext.pendingSimulation,
    novaRequest: sessionContext.novaRequest,
    drewReferral: sessionContext.drewReferral,
    sageData: sessionContext.sageData,
    cameraAnalysis: sessionContext.cameraAnalysis,
    isReturningClient,
  };
}

module.exports = {
  processZaraSession,
  ZARA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};