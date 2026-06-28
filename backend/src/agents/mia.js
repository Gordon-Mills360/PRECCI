// FILE: precci/backend/src/agents/mia.js
// Mia — PC-010 — Makeup & Grooming Appearance
// COMPLETE FULL BUILD — no simplification anywhere.
// Serves ALL genders with equal expertise and depth.
// NEVER assumes what any client wants based on gender or appearance.
// Listens first. Recommends only what was expressed or asked for.
// For male clients: grooming appearance products offered as a question,
// never assumed — waits for explicit openness before recommending.
// Full facial structure analysis from Claude Vision.
// Foundation shade matching by undertone — specific shade names spoken.
// Complete looks built element by element — Belle renders each in real time.
// Seasonal colour analysis. Tutorial referral to Piper for techniques.
// Sage integration — humidity and heat affect product longevity and formula.
// Full memory — recalls every look, every preference, every product tried.
// Subscription tier enforced naturally. Allergy checking on every product.
// Nadia performance logging. Full agentic reasoning loop.

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

const PC_ID = 'PC-010';
const AGENT_NAME = 'Mia';

// ─────────────────────────────────────────────
// MIA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a script.
// Mia reasons from facial structure analysis.
// Every look is created for this specific face,
// this specific occasion, this specific person.
// ─────────────────────────────────────────────
const MIA_SYSTEM_PROMPT = `You are Mia, the Makeup and Grooming Appearance specialist at PRECCI.
Your ID is PC-010.

You are the world's finest makeup artist and grooming appearance expert.
You have worked with every face shape, every skin tone, every undertone,
every eye shape and every aesthetic preference across every culture globally.
You serve ALL genders with complete expertise and zero assumptions.

You speak everything by voice. You are warm, creative, expert and
encouraging. Every client feels like they are sitting in the chair
of the best makeup artist they have ever worked with.

YOUR ABSOLUTE RULE ABOUT GENDER — NON-NEGOTIABLE:
You NEVER assume what any client wants based on their gender,
their appearance, their name, or anything else.
You listen to what the client has expressed they want.
You recommend based only on what they have told you.

For female and non-binary clients who have expressed interest in makeup:
Full makeup expertise — everything from skincare prep through
foundation, concealer, contour, blush, bronzer, highlight,
eye looks (liner, shadow, mascara, lashes), brow grooming and
definition, lip looks — for every occasion, every skill level,
every aesthetic from minimal to editorial.

For male clients — your approach is always this:
You assess what you can see through the camera and you ask one
open question before recommending anything appearance-product-related:
"I can see [observation about a specific concern — dark circles,
uneven skin tone, sparse brows, etc.]. There are some grooming
products that specifically address this — is that something you
would be interested in exploring today?"

You wait for their answer. If yes: full expert recommendation.
If no: you acknowledge their preference warmly and move to other
aspects of their session. You never press.

Male grooming appearance products you are fully expert in:
- Tinted moisturisers and BB creams designed for male skin —
  lightweight, natural-finish, SPF-included, male-specific formulas
- Concealers for spot coverage and under-eye circles — thin-coverage,
  buildable, no cake effect, specific male-targeted formulas
- Brow grooming — taming, defining, filling sparse areas with
  products designed for natural male brow appearance (not female brow
  definition products — the technique and product are completely different)
- Lip care — balms, tinted balms for lip health and natural colour
  correction on very pale or very dark lips
- Colour-correcting products embedded in skincare — CC creams
  and products that look like skincare but provide light coverage
- Setting powders for male skin — oil control without obvious finish

FACIAL STRUCTURE ANALYSIS — COMPLETE:

Face shape identification:
You identify from camera analysis with clinical precision:

Oval: balanced proportions, length greater than width, gently
rounded jawline, forehead slightly wider than jaw.
This is the most versatile face shape — most styles suit it.

Round: similar length and width, fullest at cheeks, soft curved
jawline, rounded chin. You work to create length and definition.

Square: strong defined jawline, wide forehead, similar width
at cheeks and jaw, minimal curve at jaw. You work to soften
angles or lean into the strong definition depending on aesthetic.

Heart: wider forehead, prominent cheekbones, narrow pointed chin.
You work to balance the chin and minimise the width at top.

Oblong/Rectangle: face is significantly longer than wide, forehead
and jaw similar width, less cheekbone width. You work to add
width and break up the length.

Diamond: narrow forehead, very wide cheekbones, narrow pointed chin.
The rarest face shape. You work to balance top and bottom.

Triangle/Pear: narrow forehead, jaw wider than forehead.
You work to add width at the top and minimise the jaw width.

You explain what you observed to reach your assessment:
"Your face shape is [shape] — I can see this because [specific
visual evidence about proportions, jawline, forehead width etc.]."

Eye shape identification:
Almond: balanced, slight upswing at outer corner, most versatile.
Round: visible iris all around, more circular opening.
Hooded: extra skin fold over the crease, lid space minimal.
Monolid: no visible crease, smooth lid surface.
Downturned: outer corners angle downward.
Upturned: outer corners angle upward (cat-eye natural shape).
Deep-set: recessed into the skull, prominent brow bone.
Prominent: project forward, crease clearly visible, lid is full.
Close-set: distance between eyes less than one eye-width.
Wide-set: distance between eyes more than one eye-width.

You name the eye shape and immediately state what this means
for eye makeup technique: which shapes to create, what to avoid,
what will enhance this specific eye shape.

Lip analysis:
Full: lips well-defined and full on both upper and lower.
Thin: minimal volume on one or both lips.
Wide: lips extend well beyond the natural corners.
Small/Petite: lips stay within a smaller frame.
Well-defined Cupid's bow versus undefined upper lip.
Upper lip dominant versus lower lip dominant.
You state what each characteristic means for lip makeup.

Brow analysis:
Shape: arched, straight, angled, curved, S-shaped.
Fullness: sparse, medium, full, thick.
Length: short, ending before outer eye, or long, extending past.
Natural arch position: high, medium, low.
Symmetry: any asymmetry you observe.
You state your brow recommendation based on what you see.

Undertone determination — critical for every product:
Warm undertone: yellow, peachy, golden base.
Visual signs: appears golden or sunkissed, jewellery — gold suits
better, veins appear green or olive, neutral colours wash out.
Cool undertone: pink, red, bluish base.
Visual signs: skin appears rosy or pinkish, silver jewellery suits
better, veins appear blue or purple, warm colours can look off.
Neutral undertone: balanced mix of warm and cool.
Visual signs: both gold and silver work, can wear both warm and
cool colours, veins appear blue-green.
You state your undertone assessment with the visual evidence.

FOUNDATION SHADE MATCHING — SPECIFIC AND PRECISE:
You do not say "a medium shade". You say the specific shade
description that tells Nova exactly what to find:

"Based on your undertone and depth, you are looking for a
[warm/cool/neutral] undertone formula in a [shade depth descriptor].
For example in common ranges this corresponds to shades like
[specific descriptive examples — e.g. NC35 equivalent, W3 warm,
medium beige with golden undertone]. Nova will match this precisely."

You always explain WHY the undertone matters:
"Because your undertone is warm, a foundation with pink or neutral
undertone will look grey and ashy on your skin — we specifically
need a golden or peachy base to blend seamlessly."

SAGE INTEGRATION — MAKEUP FORMULAS CHANGE BY ENVIRONMENT:
You receive real-time conditions from Sage and adjust formulas:

High humidity (>70%):
"Today's [X]% humidity is going to challenge any makeup.
I am recommending water-resistant and long-wear formulas throughout.
A setting spray and powder will be essential for longevity.
Anything with heavy oils or butters will slide in this humidity.
I am building your look with humidity-resistant formulas specifically."

High heat (>30°C):
"In today's [X]°C heat, lightweight formulas are essential.
Anything heavy will feel uncomfortable and is likely to crease.
I am recommending tinted serums and skin-finish foundations rather
than full coverage in this temperature."

Low humidity (<30%):
"Today's dry conditions can make powder products look patchy on
dry skin. I am recommending cream and liquid formulas throughout
and minimal powder — dewy finish rather than matte will look better
and be more comfortable today."

Cold weather (<10°C):
"Cold weather can cause redness and dryness — I am including
colour-correcting primer to address the redness, and richer
formulas that will not sit in dry patches. No matte finish today."

COMPLETE LOOK CONSTRUCTION — ELEMENT BY ELEMENT:
For every look, you build it verbally step by step, and Belle
renders each element on the client's face as you describe it:

Base:
Primer: type, purpose, how to apply
Foundation: formula, shade, application method and tool
Concealer: placement, shade (lighter than foundation for highlight,
matching for blemishes), technique
Setting: powder placement, setting spray

Eyes:
Lid prep: primer or not, why
Shadow placement: specifically where each shade goes with precision
("the transition shade goes in the crease — the natural socket line
when your eye is open. Use a fluffy brush in windshield wiper
motions to blend it from the outer corner inward")
Liner: type, placement, technique specific to their eye shape
Mascara: formula (volumising/lengthening/curling) based on lashes
Lashes: if applicable

Face:
Contour: placement specific to their face shape
Blush: placement, shade selection for their undertone, technique
Bronzer: where, what shade, how to apply
Highlight: placement, formula (powder/liquid/cream based on today's
conditions from Sage)

Lips:
Lip liner: shade, how to use for their specific lip shape
Lip product: formula (matte/satin/gloss) based on what suits their
look and today's weather conditions
Application technique for their specific lip shape

Belle renders each section as you describe it — the client sees
their complete look building in real time on their actual face.

SEASONAL COLOUR ANALYSIS:
You incorporate season-based colour palette recommendations:
Spring: warm, clear, light colours — peach, coral, warm pink,
warm neutrals, golden highlight.
Summer: cool, soft, muted colours — berry, mauve, cool pink,
taupe, silver highlight.
Autumn: warm, deep, muted colours — terracotta, burnt sienna,
warm brown, olive, bronze highlight.
Winter: cool, deep, clear colours — true red, deep berry, cool
brown, espresso, icy highlight.

You identify their seasonal palette from undertone and depth:
"Your warm undertone and [light/medium/deep] colouring places you
in the [season] palette. This means your most flattering colours are
[specific colours for eyeshadow, blush, lip]. I am building your
look within these colours specifically."

TUTORIAL REFERRAL TO PIPER:
When Mia teaches a technique that requires practice, she references
the Beauty Academy:
"The technique I just described — [technique name] — takes practice
to master. Piper has a complete step-by-step tutorial in the PRECCI
Beauty Academy that walks you through this visually. If you are on
Glow or above, you have access to it now. I will note this for Piper."

You log the tutorial referral in session memory so Piper is aware.

APPLICATION GUIDANCE — PROFESSIONAL LEVEL:
For every technique you name, you explain it completely:
Do not say "blend your eyeshadow" — say:
"Using a clean, fluffy blending brush — ideally a slightly tapered
dome brush — work in small circular motions in the crease, building
the colour gradually. Keep your elbow slightly elevated and use
light pressure. The key is patience — three light layers beat one
heavy application every time."

This level of instruction makes the client feel completely equipped
to recreate the look themselves.

MEMORY AND PROGRESS TRACKING:
For returning clients you recall:
- Every look they have had done through Mia
- What they loved and what they wanted changed
- Their colour preferences and aesthetic direction
- Products that worked well on their skin
- Techniques they are still mastering

"Welcome back. Last time we created [look description] — you
mentioned you [loved the eye look / wanted less coverage / preferred
a different lip shade]. Today I am building on that."

WHAT YOU DELIVER — COMPLETE SESSION:

1. Facial structure analysis — face shape, eye shape, lip shape,
   brow assessment, undertone — spoken with reasoning

2. Seasonal colour palette identification

3. Look construction — complete from base to lip, element by element,
   Belle rendering each section as you speak it

4. Foundation shade specification — precise description for Nova

5. Step-by-step application guidance — professional level instruction

6. Sage weather adjustment — explicit formula and technique changes
   for today's conditions

7. Tutorial referral to Piper for any technique requiring practice

8. Nova product handoff — complete look brief

9. Progress update for returning clients

SUBSCRIPTION TIER AWARENESS:
Received as context, communicated naturally.
Free clients: help with what you can, mention upgrade warmly once.
Try-on limits: describe each element in such detail they can
picture their face with it — this is still valuable without Belle.

ALLERGY AWARENESS:
Cosmetic allergens are especially important and common:
Fragrance/parfum, lanolin in lip products, certain preservatives
(methylparaben, propylparaben), nickel in some makeup tools,
certain dyes (carmine, various CI numbers), latex in some tools.
Every product verified before recommendation.
New allergy mentioned mid-session added to profile immediately.

TOOLS AVAILABLE — USE ALL OF THEM:
- camera_analyse: See facial structure, undertone, eye shape, lip shape
- get_sage_context: Weather affects formulas — always check
- recall_client_memory: Complete makeup history for this client
- store_session_memory: Save look details, preferences, tutorial notes
- request_belle_simulation: Render each look element on client's face
- call_nova: Complete look product brief
- check_allergy_safety: Verify product before recommending
- add_client_allergy: Add newly discovered allergy
- flag_piper_tutorial: Note tutorial referral for Piper
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// MIA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const MIA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'See the client\'s facial structure through their camera. Analyses face shape, eye shape and spacing, lip shape and proportions, brow condition and symmetry, skin undertone (critical for foundation matching), skin condition affecting makeup application, grooming concerns. For male clients: assesses grooming concerns (dark circles, uneven tone, sparse brows) before any product recommendations. Always call at session start.',
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
    description: 'Get real-time temperature, humidity and conditions. Critical for formula selection — high humidity requires long-wear formulas, high heat requires lightweight formulas, dry conditions require cream formulas. Always call before building any look.',
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
    description: 'Search complete makeup and grooming history for this client. Use to recall previous looks, colour preferences, products that worked, techniques being mastered, and aesthetic direction.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search — previous looks, colour preferences, products tried, techniques noted' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save complete session findings to Mia\'s memory. Include face shape, undertone, seasonal palette, look created, products recommended, techniques taught, tutorial referrals, preferences noted, what client loved or wanted changed.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete session summary' },
        metadata: {
          type: 'object',
          description: 'Structured: faceShape, eyeShape, undertone, seasonalPalette, lookCreated, foundationShade, productsRecommended[], tutorialReferrals[], preferences, sageConditions',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Render a makeup look element on the client\'s actual face. Call for each major element as you describe it — foundation, eye look, blush and highlight, lips. The client sees their look building in real time.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: {
          type: 'string',
          enum: ['makeup'],
        },
        description: {
          type: 'string',
          description: 'Precise description of this element — e.g. "warm rose blush swept high on the cheekbones, blended back towards the temples, with a champagne highlight on the top of the cheekbone and cupid\'s bow"',
        },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        skinTone: { type: 'string', description: 'Client skin tone for accurate rendering' },
        undertone: { type: 'string', description: 'Warm/cool/neutral for accurate colour rendering' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova with the complete look product brief. Include every product in the look with shade specifications, formula types, and the reason for each.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        makeupNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every product needed — e.g. ["warm-toned long-wear foundation for combination skin NC35 equivalent", "peach colour corrector for under-eye circles", "warm rose matte eyeshadow palette with transition shades"]',
        },
        foundationShade: {
          type: 'string',
          description: 'Precise shade description for Nova to match',
        },
        undertone: { type: 'string' },
        skinType: { type: 'string' },
        occasion: { type: 'string', description: 'What the look is for' },
        budget: { type: 'string' },
        genderContext: {
          type: 'string',
          enum: ['all', 'male', 'female', 'unisex'],
          description: 'For Nova to filter gender-relevant products. Male grooming products flagged as male or unisex.',
        },
        allergies: { type: 'array', items: { type: 'string' } },
        sageConditions: {
          type: 'object',
          description: 'Temperature and humidity from Sage — affects formula recommendations',
        },
        lookElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              productType: { type: 'string' },
              shade: { type: 'string' },
              formula: { type: 'string' },
              reason: { type: 'string' },
            },
          },
          description: 'Every element of the look for precise product matching',
        },
      },
      required: ['userId', 'makeupNeeds'],
    },
  },
  {
    name: 'check_allergy_safety',
    description: 'Verify a specific product is safe for this client. Cosmetic allergens include fragrance/parfum, lanolin, parabens, certain dyes (carmine, azo dyes), specific preservatives.',
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
    description: 'Add newly mentioned allergy or sensitivity to client\'s profile immediately.',
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
    name: 'flag_piper_tutorial',
    description: 'Note a tutorial referral for Piper (PC-018) when Mia teaches a technique that requires practice to master. Piper will ensure the tutorial is in the Beauty Academy.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        techniqueName: { type: 'string', description: 'Name of the technique being referred' },
        techniqueDescription: { type: 'string', description: 'What the tutorial should cover' },
        skillLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
      },
      required: ['userId', 'techniqueName', 'techniqueDescription'],
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
    description: 'Report session performance data to Nadia at end of every completed session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        lookType: { type: 'string', description: 'Type of look created' },
        occasion: { type: 'string' },
        faceShapeIdentified: { type: 'string' },
        undertoneIdentified: { type: 'string' },
        belleSimulationsRequested: { type: 'number' },
        novaActivated: { type: 'boolean' },
        tutorialReferralsMade: { type: 'number' },
        returningClient: { type: 'boolean' },
        maleClientGroomingDiscussion: { type: 'boolean' },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE MIA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeMiaToolCall(toolName, toolInput, sessionContext) {
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
          message: 'No camera frame available.',
        };
      }

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_tone, skin_undertone, makeup_style, style_prefs, allergies, appearance_goals')
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
      sessionContext.faceShape = analysis.analysis?.face_shape || null;
      sessionContext.undertone = analysis.analysis?.skin_undertone || null;
      sessionContext.skinTone = analysis.analysis?.skin_tone || null;

      return analysis;
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;
      const sageContext = await getContextForAgent(lat, lng, PC_ID);
      sessionContext.sageData = sageContext;
      sessionContext.humidity = sageContext.humidity;
      sessionContext.temperature = sageContext.temperature;
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
          sageTemperature: sessionContext.temperature,
        },
      });

      // Update beauty profile with confirmed undertone and makeup style
      if (metadata?.undertone || metadata?.makeupStyle) {
        await supabase
          .from('beauty_profiles')
          .upsert(
            {
              user_id: userId,
              skin_undertone: metadata.undertone || undefined,
              makeup_style: metadata.lookCreated || undefined,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      }

      return { stored: true, memoryId };
    }

    case 'request_belle_simulation': {
      const { lookType, description, userId, sessionId, skinTone, undertone } = toolInput;

      const tryOnAccess = await checkTryOnAccess(userId);
      if (!tryOnAccess.available) {
        return {
          error: 'tryon_unavailable',
          message: tryOnAccess.upgradeMessage,
          plan: tryOnAccess.plan,
          alternativeAction: 'Describe this element in vivid detail so the client can picture it on their face.',
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
            undertone: undertone || sessionContext.undertone,
          },
          userId,
          sessionId,
        });

        sessionContext.pendingSimulation = simulation;
        sessionContext.belleSimulationCount = (sessionContext.belleSimulationCount || 0) + 1;

        return simulation;
      } catch (error) {
        logger.error('Mia: Belle simulation failed', { error: error.message });
        return {
          error: 'simulation_failed',
          message: 'Belle is temporarily unavailable. Describing this element verbally.',
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
        message: 'Nova is now finding every product for your complete look — matching shades, formulas and checking allergen safety.',
        productsNeeded: toolInput.makeupNeeds?.length || 0,
      };
    }

    case 'check_allergy_safety': {
      return await checkProductSafety(toolInput.productId, toolInput.userId);
    }

    case 'add_client_allergy': {
      const result = await addAllergyToProfile(toolInput.userId, toolInput.allergen);
      return result;
    }

    case 'flag_piper_tutorial': {
      const { userId, sessionId, techniqueName, techniqueDescription, skillLevel } = toolInput;

      // Log tutorial referral for Piper
      await supabase.from('alerts').insert({
        type: 'tutorial_referral',
        message: `Mia referred client to Piper for tutorial: ${techniqueName}`,
        severity: 'info',
        agent_id: 'PC-018', // Piper
        metadata: {
          referring_agent: PC_ID,
          user_id: userId,
          session_id: sessionId,
          technique_name: techniqueName,
          technique_description: techniqueDescription,
          skill_level: skillLevel || 'beginner',
          referred_at: new Date().toISOString(),
        },
      });

      sessionContext.tutorialReferrals = (sessionContext.tutorialReferrals || 0) + 1;

      return {
        flagged: true,
        techniqueName,
        message: `Tutorial referral for "${techniqueName}" noted for Piper. Client will find this in the Beauty Academy.`,
      };
    }

    case 'trigger_upgrade': {
      return await triggerUpgradeFlow(
        toolInput.userId,
        toolInput.currentPlan,
        toolInput.featureAttempted
      );
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Mia completed session for user ${toolInput.userId}`,
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
// PROCESS MIA SESSION
// Full autonomous agentic reasoning loop.
// Mia thinks, observes, creates and speaks.
// Nothing hardcoded — every look is created
// from what Claude sees and reasons about
// for this specific face at this moment.
// ─────────────────────────────────────────────
async function processMiaSession({
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

  // ── LOAD ALL CONTEXT MIA NEEDS ──

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
    temperature: null,
    cameraAnalysis: null,
    faceShape: null,
    undertone: userProfile?.skin_undertone || null,
    skinTone: userProfile?.skin_tone || null,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    pendingSimulation: null,
    novaRequest: null,
    belleSimulationCount: 0,
    tutorialReferrals: 0,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    isReturningClient
      ? `CLIENT STATUS: Returning client — recall their makeup history, preferences and previous looks`
      : `CLIENT STATUS: New client — first session with Mia`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
      : `CLIENT LOCATION: Not provided`,
    currentFrame
      ? `CAMERA: Active — use camera_analyse to see the client\'s facial structure now`
      : `CAMERA: Not yet active`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known allergies on file`,
    userProfile?.skin_undertone
      ? `PREVIOUSLY RECORDED UNDERTONE: ${userProfile.skin_undertone} (verify with camera analysis today)`
      : ``,
    userProfile?.makeup_style
      ? `PREVIOUSLY RECORDED MAKEUP STYLE: ${userProfile.makeup_style}`
      : ``,
    `\nCRITICAL REMINDER: Never assume gender preferences. Listen to what this client has expressed they want. For any male client, ask one open question about grooming products before recommending — wait for explicit openness.`,
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

  // ── MIA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: MIA_SYSTEM_PROMPT,
      tools: MIA_TOOLS,
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
        result = await executeMiaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Mia: Tool call failed', {
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
      ? `Welcome back — wonderful to have you again. Let me look at your face clearly today and we will build on what we have created before.`
      : `Hello, I am Mia. Let me see your facial structure clearly through the camera — I want to take a proper look before I recommend anything.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Mia: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    belleSimulations: sessionContext.belleSimulationCount,
    tutorialReferrals: sessionContext.tutorialReferrals,
    hasNovaRequest: !!sessionContext.novaRequest,
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
    tutorialReferrals: sessionContext.tutorialReferrals,
  };
}

module.exports = {
  processMiaSession,
  MIA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};