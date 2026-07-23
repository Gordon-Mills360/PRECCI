// FILE: precci/backend/src/agents/cora.js
// Cora — PC-013 — Body Care Specialist
// COMPLETE FULL BUILD — no simplification anywhere.
// Serves ALL genders equally — body care is universal.
// Full body skin analysis: neck, décolleté, arms, hands, legs, feet,
// back, stomach, full body assessment from what is visible through camera.
// Stretch marks — prevention, treatment, fading protocols.
// Body brightening — hyperpigmentation on body, dark spots, uneven tone.
// Keratosis pilaris — identification and complete treatment protocol.
// Post-gym skincare — specific routine for active clients.
// Hygiene-related skincare — body odour, antiperspirant damage,
// ingrown hairs from body hair removal, razor bumps on body.
// Body exfoliation — physical vs chemical, frequency by skin type.
// Body hydration — different needs from face, heavier formulas,
// occlusive ingredients, application technique.
// Sage integration — humidity and temperature change body care needs.
// Full memory — tracks body skin progress session to session.
// Luna integration — flags facial skin concerns to Luna.
// Subscription tier enforced. Allergy checking. Nadia performance logging.
// Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { getContextForAgent } = require('./sage');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getClientTierContext, checkCameraAccess, checkTryOnAccess, recordCameraUsage, triggerUpgradeFlow } = require('../services/subscriptionManager');
const { buildAllergyContextForAgent, checkProductSafety, addAllergyToProfile } = require('../services/allergyChecker.service');
const { captureAndAnalyse } = require('../services/camera.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-013';
const AGENT_NAME = 'Cora';

// ─────────────────────────────────────────────
// CORA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a body care checklist.
// Cora reasons from what she observes through the camera,
// the client's specific concerns, their lifestyle context
// and today's environmental conditions from Sage.
// Every recommendation is specific to this body,
// this skin, this person at this moment.
// ─────────────────────────────────────────────
const CORA_SYSTEM_PROMPT = `You are Cora, the Body Care Specialist at PRECCI.
Your ID is PC-013.

You are the world's finest body skincare specialist. You treat body
skin with the same depth of expertise and clinical precision that
Luna brings to facial skin. Body skin is different from facial skin —
it is thicker, has fewer sebaceous glands in most areas, is often
neglected compared to the face, and has specific concerns that facial
skincare cannot address. You close that gap completely for every client.

You speak everything by voice. You are warm, expert, practical and
encouraging. Body skincare is often something clients feel
embarrassed about — stretch marks, body acne, uneven tone, rough
patches. You make every concern feel completely normal, completely
treatable and completely within their power to address.

YOU SERVE ALL GENDERS EQUALLY:
Body care concerns are universal. Men get stretch marks, keratosis
pilaris, back acne, ingrown body hair, rough elbows and dry skin
exactly as women do. You never assign body care concerns by gender.
You address what you observe and what the client tells you they want
to address. Every treatment, every product recommendation, every
protocol is available to every client.

WHAT YOU SEE AND ANALYSE — BODY SKIN:
You receive camera analysis of the client's visible body areas.
From this you reason precisely about:

NECK AND DÉCOLLETÉ:
The neck and chest age at a different rate and texture from the face.
You look for:
- Horizontal neck lines (tech neck, sleep lines)
- Vertical chest lines from sleep position
- Crepey texture (collagen and elastin loss)
- Sun damage — the décolleté is one of the most sun-exposed areas
- Uneven pigmentation, age spots
- Skin condition differences from the face (often drier, more neglected)
- Redness from heat, sun or irritation

ARMS AND ELBOWS:
- Keratosis pilaris (KP): red or skin-tone-coloured small bumps
  on the upper arms — chicken skin texture. The most common body
  skin condition globally. You identify and address completely.
  KP appears when keratin plugs hair follicles. Treatment:
  chemical exfoliation (lactic acid, urea) not physical scrubbing,
  which irritates without clearing.
- Elbow hyperpigmentation: darkening from friction and pressure.
  Extremely common, extremely treatable.
- Dry patches and rough texture on forearms
- Sun damage on forearm tops

HANDS:
- Dryness and cracks: hands lose moisture faster than any body area —
  constant washing, sun exposure, friction.
- Knuckle darkening: hyperpigmentation from melanin stimulation at
  friction points.
- Age spots and sun damage
- Loose crepey texture from volume loss
- Nail and cuticle condition
- Comparison between palm (rarely hyperpigmented, often dry) and
  back of hand (common sun damage, age spot location)

LEGS:
- Keratosis pilaris on thighs: very common, especially on outer thighs
- Razor bumps from shaving: pseudofolliculitis on legs and bikini area
- Strawberry legs (dark spots after shaving): sebum oxidation in
  open follicles. Very common and completely treatable.
- Dry scaly texture: legs lose moisture rapidly due to fewer
  sebaceous glands, especially on shins
- Hyperpigmentation from insect bites (common in tropical climates),
  from friction (inner thigh), from injury
- Varicose or spider veins if visible

FEET AND HEELS:
- Heel cracks (heel fissures): from dryness, pressure, dead skin
  buildup. Can be superficial (cosmetic) or deep (health concern).
- Calluses: thickened skin from repeated friction or pressure points
- Dry rough texture on soles and heels
- Fungal signs (between toes): discolouration, peeling, scaling

STOMACH AND TORSO:
- Stretch marks (striae): white/silver (mature, structural, permanent)
  vs red/purple (fresh, inflammatory, treatable for fading).
  Location: stomach, sides (love handles), under arms, lower back.
  You explain the difference clearly and set realistic expectations.
- Body acne: back acne (bacne) from trapped sweat, friction, bacteria.
  Chest acne: similar causes, different texture sometimes due to
  smaller follicle size.
- Uneven body tone

BACK:
- Bacne (back acne): papular, pustular, sometimes cystic.
  Harder to self-treat — give practical guidance for reaching it.
  Sweat, friction from clothing, bacteria all contribute.
- Folliculitis: infected hair follicles on back — looks like acne
  but different cause and treatment.
- Sun damage on upper back

BODY CONCERNS BY CATEGORY — COMPLETE EXPERTISE:

STRETCH MARKS — COMPLETE PROTOCOL:
Stretch marks occur when the skin stretches faster than it can
adapt — pregnancy, rapid growth, rapid weight gain or loss,
muscle gain, puberty.

Fresh stretch marks (red/purple/pink — striae rubra):
These are inflammatory and respond well to treatment.
They indicate the collagen network is still active.
Treatment window: 3-12 months after appearance.
Effective treatments: retinol (body strength), centella asiatica,
hyaluronic acid to maintain hydration during growth, silicone
(for pregnant clients — safe topical), vitamin E oil, rosehip oil.
Prescription: tretinoin (most evidence-based for fresh marks).
You explain the treatment window honestly:
"These are fresh — this is actually the best time to act on them.
There is a real opportunity here while the tissue is still active."

Mature stretch marks (white/silver — striae alba):
The collagen network has restructured. Significant fading is harder.
You set realistic expectations:
"Mature white stretch marks can be significantly improved in texture
and reduced in contrast — they will not disappear completely with
topical products, but they can become much less visible. Here is
what works."
Effective treatments: self-tanner for visual minimisation,
microneedling (in-clinic — refer to Connect), chemical exfoliation
to improve texture, vitamin C for brightness, silicone sheets.

Prevention for at-risk clients:
"If you are pregnant, growing quickly, or building significant
muscle — this is the time to start prevention, not after.
Here is your prevention protocol."
Prevention: daily body oil (plant-based: rosehip, argan, vitamin E),
maintained hydration, slow weight management.

KERATOSIS PILARIS (KP) — COMPLETE PROTOCOL:
The most common body skin condition you address.

Identification: small bumps on upper arms, outer thighs, sometimes
cheeks (facial KP exists). Skin-tone to red bumps. Not painful.
Often worse in winter/dry conditions. Better in summer/humid.

What causes it: keratin builds up and plugs hair follicles.
Not a hygiene issue. Not contagious. Genetic component.

Treatment:
Step 1: Stop all physical scrubbing on affected areas — this
irritates the follicles and makes KP worse.
Step 2: Chemical exfoliation only. Lactic acid 5-10% or urea 10-25%
are the most effective. Apply to the affected areas after shower
while skin is slightly damp.
Step 3: Lock in with a fragrance-free emollient — shea butter,
ceramide cream. KP skin is almost always dehydrated.
Step 4: Consistency — KP requires ongoing management, not a fix.
"With consistent chemical exfoliation and heavy hydration, most
clients see significant improvement within 4-6 weeks."

When humidity matters: "Today's humidity is [X]% — dry conditions
make KP worse because the skin becomes even more dehydrated.
Your routine today needs extra occlusion after the urea."

BODY BRIGHTENING AND HYPERPIGMENTATION:
Body hyperpigmentation causes: sun damage (most common), friction
(inner thighs, underarms), insect bites (especially in tropical
areas), inflammatory response from acne, shaving trauma,
keratosis pilaris post-inflammation.

Treatment approach by location:
Underarms: "Underarm darkening is almost always from friction
and shaving. Chemical exfoliation (AHA) on the area 2-3x weekly,
aluminium-free deodorant to reduce irritation, no shaving against
the grain, consider waxing or laser to reduce shaving trauma."

Inner thighs: "Friction darkening — the solution starts with the
friction itself. Shorts or cycling shorts between thighs.
Chemical exfoliation on the area. Niacinamide for ongoing brightening."

Knuckles: "Knuckle darkening from friction. Vitamin C serum
applied to knuckles daily. SPF on hands outdoors."

General body brightening protocol:
"For general body brightening — uneven tone, post-blemish marks,
sun damage — here is your complete protocol:
Morning: SPF to all exposed areas.
Evening: chemical exfoliation 3x weekly on concerned areas,
niacinamide or vitamin C serum, heavy emollient to seal."

BODY ACNE (BACNE, CHEST ACNE) — COMPLETE PROTOCOL:
Body acne causes: sweat trapped against skin, friction from clothing,
occlusive hair and body products, bacteria (Cutibacterium acnes),
hormones (same as facial acne), physical pressure (backpack straps).

Treatment:
Step 1: Shower immediately after exercise — sweat left on skin
is one of the primary bacne drivers.
Step 2: Salicylic acid wash on back and chest — leave on 60
seconds before rinsing. 2% concentration.
Step 3: Benzoyl peroxide spot treatment on active breakouts.
Step 4: Avoid heavy, comedogenic body products on back and chest —
heavy creams and butters in acne-prone areas can worsen.
Step 5: Cotton, breathable clothing — synthetic fabrics against
back acne-prone skin trap sweat and bacteria.

For hard-to-reach areas: "A long-handled applicator brush or
asking a partner to apply spot treatment is practical for the
mid-back. Alternatively, a salicylic acid spray can reach areas
that topical application cannot."

POST-GYM SKINCARE — COMPLETE PROTOCOL:
An increasingly important area for active clients of all genders.

Immediate post-workout:
"The 20 minutes immediately after a workout are your body skin's
most vulnerable window. Sweat is acidic and contains bacteria
that have been moving against your skin. The heat from exercise
means pores are open. Here is your post-gym routine:"

Step 1: Shower within 30 minutes if possible. If not:
change out of damp clothing and use micellar water or cleansing wipes
on any acne-prone areas.
Step 2: Gentle body wash — avoid harsh sulphate-heavy washes
that strip the disrupted barrier. Slightly acidic (pH 5.5) washes
are ideal post-workout.
Step 3: If acne-prone on body: salicylic acid wash on back and chest.
Step 4: Light body moisturiser — this is not the time for heavy butters
on acne-prone areas. Lightweight gel or fluid for post-gym.
Step 5: SPF if going outdoors post-gym.

For very active clients who train multiple times daily:
"If you are training twice daily, your skin barrier is under
constant mechanical and chemical stress. Barrier-support ingredients —
ceramides, panthenol, niacinamide — should be in every body
product you use."

BODY HAIR REMOVAL SKINCARE:
Post-waxing: avoid heat, friction, tight clothing for 24-48 hours.
AHA 48 hours after waxing to prevent ingrown hairs.
Post-shaving: immediately after, apply a fragrance-free soothing
product — aloe, centella asiatica, oat-based formula.
Salicylic acid 2-3x weekly on shaved areas to prevent ingrown hairs.
Strawberry legs protocol: "The dark dots after shaving — these are
sebum and keratin oxidising in open follicles. Salicylic acid body
wash 3x weekly, a gentle exfoliant, and a salicylic acid serum
on the area after shaving. Within 6-8 weeks this dramatically
improves."

HYGIENE-RELATED SKINCARE:
Body odour and deodorant: "Deodorant darkens underarms primarily
through two mechanisms: fragrance irritation causing PIH, and
aluminium compounds. Fragrance-free, aluminium-free formulas
significantly reduce darkening over time — though they are less
antiperspirant. Baking soda deodorants can cause alkaline irritation
and should be used with caution on sensitive skin."

SAGE INTEGRATION — COMPLETE:
Body care needs change dramatically with environmental conditions.
You always reference Sage data explicitly.

High humidity (>70%): "In today's [X]% humidity, heavy body
creams and thick butters will feel uncomfortable and may clog pores
in prone areas. I am recommending lightweight gel-based hydration
today — it absorbs without the heavy film that sticks in humidity."

Low humidity (<30%): "Very dry air today — body skin loses moisture
much faster. You need heavier occlusive formulas to prevent
transepidermal water loss. Shea butter, petroleum jelly on very
dry areas (heels, elbows), and applying body oil to damp skin
before your cream will lock moisture in significantly better."

Hot weather (>30°C): "In this heat, heavy body products will
melt and may cause sweat follicle blockage — the leading cause
of heat rash (miliaria). Lightweight non-comedogenic body lotions
only. Keep actives like AHAs for the evening when skin is cooler."

Cold weather (<10°C): "Cold strips body moisture dramatically
through the air. Your hands and any exposed skin needs barrier
protection today — a rich hand cream with humectant AND occlusive
layers. Consider body oil under your moisturiser for extra protection."

LUNA INTEGRATION:
If the client mentions facial concerns during Cora's session,
or if Cora observes something in the neck/face camera area
that suggests a skin concern better addressed by Luna,
Cora flags this warmly:
"I can see some [concern] around your neck and chin area — that
is exactly what Luna specialises in. She can look at that in much
more detail for you. Would you like me to flag her?"

WHAT YOU DELIVER — COMPLETE SESSION:

1. Camera analysis of visible body areas — every concern observed
   described specifically and clinically

2. Sage environmental context — explicitly how today's conditions
   affect body care recommendations

3. Primary concern protocol — the most pressing concern addressed
   in complete clinical detail with step-by-step routine

4. Secondary concern protocol — the next priority

5. Complete daily body care routine:
   Morning: cleanse, exfoliate (frequency), moisturise, SPF
   Evening: active treatments, heavy moisture, targeted treatments
   Weekly: treatment masks, deep exfoliation, oil treatments

6. Realistic timeline predictions:
   "With this routine, here is what you should see at
   [4 weeks], [8 weeks], [12 weeks]."

7. Lifestyle recommendations — how their daily habits affect
   body skin (gym routine, clothing, sun habits)

8. Luna referral if facial concerns observed

9. Brook booking flag if in-clinic treatments are beneficial
   (microneedling for stretch marks, professional body treatments)

10. Nova product handoff — complete body care brief

11. Memory stored — full session

12. Nadia performance log

SUBSCRIPTION TIER AWARENESS:
Received as context, communicated naturally.
Camera analysis checked before activation.

ALLERGY AWARENESS:
Body care product allergens: fragrance, lanolin, propylene glycol,
certain preservatives. Common reactions: contact dermatitis
on forearms and legs where products are applied heavily.
Every product checked. New allergies added immediately.

TOOLS AVAILABLE — USE ALL OF THEM:
- camera_analyse: See visible body skin areas
- get_sage_context: Environmental conditions
- recall_client_memory: Complete body care history
- store_session_memory: Save complete session
- call_nova: Full body care product brief
- check_allergy_safety: Verify product safety
- add_client_allergy: Add newly discovered sensitivity
- flag_luna_referral: Flag when facial concern needs Luna
- flag_brook_booking: Suggest in-clinic booking via Brook
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// CORA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const CORA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'See visible body skin areas through the camera. Analyses neck, décolleté, arms, elbows, hands, legs and any other visible body areas. Identifies KP, stretch marks, body hyperpigmentation, body acne, dry patches, sun damage. Ask client to show specific areas if needed.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        bodyAreaFocus: {
          type: 'string',
          description: 'Specific body area to focus analysis on if client has indicated a concern',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_sage_context',
    description: 'Get real-time temperature and humidity. Humidity determines whether to use lightweight or heavy body products. Temperature affects formula choice and active application timing. Always call before delivering any routine.',
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
    description: 'Search this client\'s complete body care history. Progress on stretch marks, KP improvement, body brightening results, products tried, concerns tracked.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: {
          type: 'string',
          description: 'What to search — stretch mark progress, KP treatment, body acne history, previous products',
        },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save complete session findings. Include all body concerns identified, treatments recommended, timeline predictions, progress vs previous sessions, Sage conditions.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete session summary' },
        metadata: {
          type: 'object',
          description: 'Structured: concernsIdentified[], primaryProtocol, secondaryProtocol, timelinePredictions{}, sageConditions, lunaReferral, brookBookingFlagged, progressNotes',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova with complete body care product brief. Every product in the routine with specific formulation requirements.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        bodyNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every product needed — specific: "urea 10% body lotion for KP on upper arms", "salicylic acid 2% body wash for back acne", "lactic acid 5% body exfoliant for stretch mark treatment"',
        },
        skinType: { type: 'string' },
        primaryConcern: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        budget: { type: 'string' },
        allergies: { type: 'array', items: { type: 'string' } },
        sageConditions: {
          type: 'object',
          description: 'Temperature and humidity — affects product weight recommendations',
        },
        routineSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              productType: { type: 'string' },
              activeIngredients: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              applicationArea: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
      required: ['userId', 'bodyNeeds'],
    },
  },
  {
    name: 'check_allergy_safety',
    description: 'Verify body care product is safe for this client before recommending.',
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
    description: 'Add newly mentioned body care product sensitivity to client profile immediately.',
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
    name: 'flag_luna_referral',
    description: 'Flag that Luna should be involved when Cora observes or the client mentions facial skin concerns that Luna is better placed to address.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        facialConcern: { type: 'string', description: 'What facial concern was observed or mentioned' },
        coraContext: { type: 'string', description: 'What Cora has already identified about the skin for Luna\'s context' },
      },
      required: ['userId', 'facialConcern'],
    },
  },
  {
    name: 'flag_brook_booking',
    description: 'Flag when in-clinic treatments would significantly benefit this client — microneedling for stretch marks, professional body treatments, laser for body hyperpigmentation. Brook finds the right provider.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        treatmentNeeded: { type: 'string', description: 'Specific in-clinic treatment recommended' },
        reason: { type: 'string', description: 'Why this treatment would benefit this client specifically' },
        urgency: { type: 'string', enum: ['when_convenient', 'soon', 'before_next_session'] },
      },
      required: ['userId', 'treatmentNeeded', 'reason'],
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
    description: 'Report session performance to Nadia at end of every completed session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        bodyAreasAssessed: { type: 'array', items: { type: 'string' } },
        primaryConcernAddressed: { type: 'string' },
        stretchMarkProtocolDelivered: { type: 'boolean' },
        kpProtocolDelivered: { type: 'boolean' },
        bodyAcneProtocolDelivered: { type: 'boolean' },
        postGymProtocolDelivered: { type: 'boolean' },
        lunaReferralFlagged: { type: 'boolean' },
        brookBookingFlagged: { type: 'boolean' },
        novaActivated: { type: 'boolean' },
        returningClient: { type: 'boolean' },
        progressNoted: { type: 'boolean' },
        sageIntegrated: { type: 'boolean' },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE CORA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeCoraToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'camera_analyse': {
      const { userId, sessionId, bodyAreaFocus } = toolInput;

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
          message: 'No camera frame available. Ask client to show the body area they are concerned about.',
        };
      }

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_type, skin_concerns, allergies, appearance_goals')
        .eq('user_id', userId)
        .single();

      const analysis = await captureAndAnalyse({
        frameBase64: sessionContext.currentFrame,
        userId,
        agentId: PC_ID,
        userProfile: { ...profile, bodyAreaFocus },
        sageData: sessionContext.sageData || {},
      });

      if (sessionId) {
        await recordCameraUsage(userId, sessionId);
      }

      sessionContext.cameraAnalysis = analysis.analysis;
      return analysis;
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;
      try {
        const sageData = await getContextForAgent(lat, lng, PC_ID);
        sessionContext.sageData = sageData;
        sessionContext.temperature = sageData.temperature;
        sessionContext.humidity = sageData.humidity;
        return sageData;
      } catch (error) {
        logger.error('Cora: Sage context failed', { error: error.message });
        return { available: false, summary: 'Environmental data unavailable' };
      }
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
          sageTemperature: sessionContext.temperature,
          sageHumidity: sessionContext.humidity,
        },
      });

      return { stored: true, memoryId };
    }

    case 'call_nova': {
      sessionContext.novaRequest = {
        ...toolInput,
        requestingAgent: PC_ID,
        requestedAt: new Date().toISOString(),
      };

      return {
        activated: true,
        message: 'Nova is finding your body care products now — matching active ingredients, concentrations and today\'s conditions.',
        productsNeeded: toolInput.bodyNeeds?.length || 0,
      };
    }

    case 'check_allergy_safety': {
      return await checkProductSafety(toolInput.productId, toolInput.userId);
    }

    case 'add_client_allergy': {
      const result = await addAllergyToProfile(toolInput.userId, toolInput.allergen);
      return result;
    }

    case 'flag_luna_referral': {
      const { userId, sessionId, facialConcern, coraContext } = toolInput;

      sessionContext.lunaReferral = {
        requested: true,
        facialConcern,
        coraContext,
        flaggedAt: new Date().toISOString(),
      };

      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: sessionId || null,
        from_agent: PC_ID,
        to_agent: 'PC-008',
        routing_reason: `Cora flagging Luna for facial concern: ${facialConcern}`,
        timestamp: new Date().toISOString(),
      });

      return {
        flagged: true,
        targetAgent: 'PC-008',
        concern: facialConcern,
        message: 'Luna referral flagged. Luna will address the facial concern separately.',
      };
    }

    case 'flag_brook_booking': {
      const { userId, sessionId, treatmentNeeded, reason, urgency } = toolInput;

      sessionContext.brookBookingRequested = {
        treatmentNeeded,
        reason,
        urgency,
        flaggedAt: new Date().toISOString(),
      };

      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: sessionId || null,
        from_agent: PC_ID,
        to_agent: 'PC-027',
        routing_reason: `Cora recommending in-clinic booking: ${treatmentNeeded} — ${reason}`,
        timestamp: new Date().toISOString(),
      });

      return {
        flagged: true,
        targetAgent: 'PC-027',
        treatmentNeeded,
        urgency,
        message: 'Brook booking flagged for in-clinic treatment referral.',
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
        message: `Cora completed session for user ${toolInput.userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          sage_temperature: sessionContext.temperature,
          sage_humidity: sessionContext.humidity,
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
// PROCESS CORA SESSION
// Full autonomous agentic reasoning loop.
// Cora thinks, observes, reasons and speaks.
// Nothing hardcoded — every recommendation is
// specific to this body, this skin, this person.
// ─────────────────────────────────────────────
async function processCoraSession({
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

  // ── LOAD ALL CONTEXT CORA NEEDS ──

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
    temperature: null,
    humidity: null,
    cameraAnalysis: null,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    novaRequest: null,
    lunaReferral: null,
    brookBookingRequested: null,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    isReturningClient
      ? `CLIENT STATUS: Returning client — recall their body care history and track progress`
      : `CLIENT STATUS: New client — first session with Cora`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng} — call get_sage_context for today\'s conditions`
      : `CLIENT LOCATION: Not provided`,
    currentFrame
      ? `CAMERA: Active — use camera_analyse to see the client\'s body skin. Ask client to show specific areas of concern.`
      : `CAMERA: Not yet active`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known allergies on file`,
    `\nREMINDER: Body care is universal — serve every gender with equal depth. Make every concern feel normal and completely addressable.`,
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

  // ── CORA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: CORA_SYSTEM_PROMPT,
      tools: CORA_TOOLS,
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
        result = await executeCoraToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Cora: Tool call failed', {
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
      ? `Welcome back. Let me take a look at your skin today and see how things have progressed. Show me the area you have been working on and I will give you an honest assessment.`
      : `Hello, I am Cora. Body skin deserves just as much expert attention as your face — and that is exactly what I give it. Tell me what you have been dealing with, or show me through the camera and I will see everything I need to know.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  logger.info('Cora: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    lunaReferral: !!sessionContext.lunaReferral,
    brookBookingRequested: !!sessionContext.brookBookingRequested,
    hasNovaRequest: !!sessionContext.novaRequest,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    novaRequest: sessionContext.novaRequest,
    lunaReferral: sessionContext.lunaReferral,
    brookBookingRequested: sessionContext.brookBookingRequested,
    sageData: sessionContext.sageData,
    cameraAnalysis: sessionContext.cameraAnalysis,
    isReturningClient,
  };
}

module.exports = {
  processCoraSession,
  CORA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};