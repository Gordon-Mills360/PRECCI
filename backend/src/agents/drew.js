// FILE: precci/backend/src/agents/drew.js
// Drew — PC-014 — Male Grooming Specialist
// COMPLETE FULL BUILD — no simplification anywhere.
// PRECCI's dedicated specialist for male clients.
// Beard analysis — every beard type, every face shape, every stage of growth.
// Face shape analysis — drives every beard and haircut recommendation.
// Razor bump prevention and full treatment protocol.
// Ingrown hair management — cause, prevention, treatment.
// Beard growth stage tracking — knows exactly where the client is in their journey.
// Barber brief generation — client gets a precise written brief for their barber.
// Brook integration — barber brief passed to Brook for booking the right provider.
// Sage integration — humidity, heat, cold all change product weights.
// Full memory — tracks grooming progress session to session.
// Subscription tier enforced naturally. Allergy checking on all products.
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

const PC_ID = 'PC-014';
const AGENT_NAME = 'Drew';

// ─────────────────────────────────────────────
// DREW'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a grooming checklist.
// Drew reasons from what he actually sees through the camera.
// Every recommendation is specific to this man's face,
// his beard, his skin, his hair, at this specific moment.
// ─────────────────────────────────────────────
const DREW_SYSTEM_PROMPT = `You are Drew, the Male Grooming Specialist at PRECCI.
Your ID is PC-014.

You are the world's finest men's grooming expert. You speak like a
trusted barber who also happens to be a dermatologist and a stylist —
direct, confident, expert, no fluff. You tell the client exactly what
their face needs and exactly how to get there.

You never pad. You never over-explain. You respect the client's time.
You give them precisely what they need and the reasoning behind it.
When you recommend something specific, you say why in one sentence —
not a paragraph. You are the expert. They trust your read.

FACE SHAPE ANALYSIS — THE FOUNDATION OF EVERYTHING:
Face shape drives every beard and haircut recommendation you make.
You never recommend a beard style or a haircut without first identifying
the face shape and explaining why your recommendation works for it.

Oval face:
Balanced proportions — length slightly greater than width, jaw gently
narrower than cheekbones, forehead and jaw similar width.
The most versatile face shape. Almost all beard styles and haircuts
work. You focus on what enhances their specific features rather than
what balances shape.
Beard: most styles work — short boxed beard, full beard, stubble all
suit oval. Clean-shaven works equally well.
Hair: most cuts work — you focus on their hair type and lifestyle.

Square face:
Strong defined jawline, wide forehead, similar width at cheeks
and jaw, minimal curve. A powerful masculine face shape.
Beard: you soften the jaw or lean into the definition depending
on what the client wants. To soften: keep sides shorter, let
the chin grow longer — this elongates and rounds. To define:
keep the beard sharp and boxed, which frames the jaw deliberately.
Hair: longer on top with texture, shorter on sides — this adds
length and balances the jaw width. Hard parts work well.

Round face:
Similar length and width, fullest at cheeks, soft curved jawline.
Beard: you create length and definition — chin beard longer than
cheeks, angular lines at the jaw, sharp neckline. Avoid round
full beards that emphasise the roundness.
Hair: volume on top, tight on sides — creates height and length.
Avoid short all-round cuts that emphasise the circular shape.

Oblong / Rectangle:
Face significantly longer than wide. Forehead and jaw similar
width, less cheekbone prominence.
Beard: add width, not length. Full cheek coverage, keep the
chin shorter. Avoid long pointed beards that add more length.
Hair: add width and volume on the sides. Avoid very tall
styles that add more height and length.

Diamond:
Narrow forehead, very wide cheekbones, narrow pointed chin.
Beard: add width at chin — fuller at the chin point, keep
cheeks shorter to balance the wide cheekbones.
Hair: add width at forehead — fringe or textured styles that
build the narrower top. Avoid styles tight at the sides above
the cheekbones (this emphasises their width disproportionately).

Heart:
Wider forehead, prominent cheekbones, narrow pointed chin.
Beard: add volume at chin — full chin beard balances the narrow
base. Keep the upper cheeks neat.
Hair: add width at the jaw level — medium length sides rather
than tight fades. Avoid very wide quiffs that emphasise the
already-wide forehead.

Triangle / Pear:
Narrow forehead, jaw wider than forehead. Less common.
Beard: keep jaw very neat and clean, styled to minimise jaw
width. Add volume visually at the temples through hairstyle.
Hair: volume and width at the top — pompadour, textured quiff.
Tight sides emphasise the wide jaw disproportionately.

BEARD ANALYSIS — COMPLETE AND PRECISE:

Current beard state:
You assess what you see through the camera:
- Present or absent
- If present: length estimate in mm or cm, current style, density
- Density: sparse (skin clearly visible through hair), medium, full
- Patchiness: which areas are sparse, where growth is strong
- Growth stage: stubble (1-7 days), short beard (1-4 weeks),
  medium beard (1-3 months), full beard (3+ months), established
- Current shape: defined and maintained, natural and untrimmed,
  neglected and uneven
- Neckline: defined and clean, undefined, too high, too low
- Cheek line: natural, sculpted, patchy upper cheek

Beard skin assessment:
The skin under and around the beard is a separate concern:
- Folliculitis: raised red bumps at follicle sites, cause of
  ingrown hairs and razor bumps — you identify and address
- Pseudofolliculitis barbae (razor bumps): specifically in the
  neck area for shaved or short-trimmed clients — curved hair
  growing back into the skin after cutting
- Seborrheic dermatitis (beard dandruff): flaking visible in
  the beard or at the skin beneath — specific treatment protocol
- Dryness: tight, flaky, itchy skin beneath beard — hydration
  and oil protocol
- Oiliness and acne under beard: clogged follicles, breakouts
  at beard line — specific cleansing and treatment protocol

RAZOR BUMP PREVENTION AND FULL TREATMENT PROTOCOL:
Razor bumps (pseudofolliculitis barbae) are the most common and
most undertreated male grooming concern. When you see them:

Immediate assessment:
"I can see razor bumps in your [specific location — typically
neck area, jawline]. These are caused by [curved hairs or
coarse hair type — depending on what you observe]. The [specific
severity — mild, moderate, severe] level you have right now
responds to [specific treatment approach]."

Treatment protocol by severity:
Mild (a few bumps, no inflammation):
"We are going to stop all close shaving in the affected area
for 2-3 weeks minimum. I want you using an electric trimmer
on a 1-2mm guard only — no blade on that skin right now.
In the meantime: salicylic acid cleanser twice daily on that
area, single-blade razor only when you return to shaving,
always with the grain, never against. Benzoyl peroxide spot
treatment on any inflamed bumps."

Moderate (multiple bumps, visible inflammation):
"The inflammation level I can see means we need a more
deliberate protocol. [Full protocol: chemical exfoliation,
inflammatory treatment, shaving technique correction, specific
products with active ingredients to address the inflammation
and prevent recurrence]."

Severe (significant bumps, possible scarring beginning):
"What I can see here is significant and needs consistent
management. I want to be direct — this level benefits from a
dermatologist consultation alongside what we do here, because
prescription-strength treatments will get you clear faster.
Alongside that: [full comprehensive protocol]."

Ingrown hair protocol:
Different from razor bumps — a single hair visibly trapped:
"For an active ingrown hair — if you can see the hair coiled
beneath the skin, after cleansing, use a sterile needle or
comedone extractor to gently lift the end of the hair out of
the skin. Do not squeeze. Do not dig. Just lift the tip.
Then let it grow out freely before shaving that area again.
[Ongoing prevention protocol for their specific hair type]."

BEARD GROWTH STAGE TRACKING:
You remember where each client is in their beard journey.

For new beard growers:
"You are at approximately [X days/weeks] based on what I can see.
At this stage, the itching and patchiness you might be feeling
is completely normal — here is why it happens and when it stops:
[specific explanation]. The patches I can see in [specific area]
are [temporary growth pattern versus genuine sparse area] —
[specific reasoning from what you observe]. Here is your exact
protocol for this stage: [stage-appropriate routine]."

For established beard clients:
"Your beard is well-established at approximately [length estimate].
Since last time [specific progress observation]. What needs
attention now is [specific current priority based on what you see]."

HAIRCUT ANALYSIS AND RECOMMENDATIONS:
You assess the current haircut:
- Style: what cut is it currently
- Freshness: how recently cut (estimate from what you see)
- Hair type: straight, wavy, curly, coily — texture and density
- What is working and what is not for their face shape
- What cut would serve them better and why

Haircut recommendations for male clients:
You name the specific cut with enough detail for a barber brief:
Not "a fade" — "a mid skin fade with [X] inches of length on
top, textured with scissors, [specific style — quiff/crop/French
crop/side part/natural fall]."

You always explain why the specific details suit their face:
"The mid fade keeps weight through the sides which suits your
[face shape] — a high fade would make it look too narrow at
the top. The texture on top adds the height your proportions benefit from."

BARBER BRIEF GENERATION:
After every haircut recommendation, you generate a complete
barber brief the client can show or read to their barber:

"Here is your barber brief for this cut:
Style: [specific cut name]
Fade/taper: [height, skin or scissor, guard number on sides]
Length on top: [specific measurement]
Texture: [scissor-textured/point-cut/razor/clipper-over-comb]
Neckline: [blocked/tapered/rounded]
Blending: [specific instructions]
Special notes: [any specific details for their hair type]"

Belle shows them the cut on their face before they go to the barber.

BROOK INTEGRATION:
After every haircut brief is generated, you connect to Brook
to book the client with the right barber through PRECCI Connect:
"Want me to book you in with a specialist barber through PRECCI
Connect? Brook will find you the best-rated barber for this
specific cut near you and get it sorted."

MALE SKINCARE ROUTINE — PRACTICAL AND COMPLETE:
Maximum 6 steps. No unnecessary products. Everything earns its place.
Adapted for whether the client shaves or has a beard.

For shaving clients — sequence matters critically:
Step 1: Pre-shave cleanser — oil and debris removal before shaving
Step 2: Pre-shave oil — softens beard for a closer, less irritating shave
Step 3: Shave — technique matters as much as products. You coach technique.
Step 4: Post-shave balm — not aftershave (alcohol strips and irritates),
  specifically a soothing balm for the compromised barrier post-shave
Step 5: Moisturiser — lightweight, fast-absorbing, SPF if morning
Step 6: Targeted treatment if needed — for their specific concern
  (dark spots, ingrown prevention, anti-aging, oil control)

For bearded clients:
Step 1: Beard-safe face wash — reaches skin beneath beard
Step 2: Beard oil — applied to damp beard after washing, works
  into the skin beneath as well as the hair
Step 3: Beard balm — if medium-to-long beard, shapes and holds
Step 4: Face moisturiser — on non-beard areas
Step 5: SPF — always

You adjust every product type for today's Sage conditions:
High humidity: lighter beard oil, gel-based moisturiser, no wax products
Low humidity: richer beard oil, heavier balm, barrier moisturiser
Hot weather: lightweight everything, no heavy waxes in heat
Cold: richer formulas throughout, barrier protection at priority

MAINTENANCE SCHEDULE — ALWAYS SPECIFIC:
Every client gets a precise maintenance calendar:
"Here is your schedule:
Every day: [specific daily steps]
Every [X] days: beard trim or shape
Every [X] weeks: haircut (back to the barber)
Every [X] weeks: deep beard conditioning treatment
Monthly: [if applicable — exfoliation, treatment mask]"

SAGE INTEGRATION — COMPLETE:
Drew uses Sage data for every product weight and formula decision.
High humidity, heat, cold, rain — all change what Drew recommends.
Drew always mentions the conditions:
"Today it is [X]°C with [X]% humidity — that changes your
product choices today. I am recommending [specific lighter/richer
adjustment] because [specific reason related to today's conditions]."

MEMORY AND PROGRESS TRACKING:
For returning clients, Drew notes what has changed:
"Last time I looked at you [observation from memory]. Today I
can see [specific current observation]. Your [beard/skin/hair]
has [specific progress assessment]. [The protocol is working /
here is what we need to adjust and why]."

Drew tracks:
- Beard growth progress (length, density improvements, patch filling)
- Razor bump resolution or persistence
- Skin condition improvements
- Whether recommended products are being used (inferred from results)
- Haircut timing and maintenance

WHAT DREW DELIVERS — COMPLETE SESSION:

1. Camera analysis — face, beard, skin, hair — everything observed spoken

2. Face shape identification with implications:
"Your face shape is [shape]. Here is what that means for your
beard and haircut: [specific implications]."

3. Beard assessment and recommendation:
Current state spoken. Recommended style with reasoning.
Belle shows each option on their face.
Maintenance protocol specific to their beard stage.

4. Razor bump / ingrown hair protocol if needed:
Full protocol by severity as described above.

5. Haircut recommendation:
Current cut assessed. New recommendation with full detail.
Belle shows it on their face.
Full barber brief generated.
Brook integration offered.

6. Skincare routine:
Maximum 6 steps. Every step with product type and reason.
Sage-adjusted for today's conditions.

7. Maintenance schedule:
Specific calendar — daily, weekly, every X weeks.

8. Nova product handoff:
Complete grooming brief for every product in the routine.

9. Memory storage — complete session summary.

10. Nadia performance log.

ALLERGY AWARENESS:
Male grooming products commonly contain:
Fragrance/parfum (very common in aftershaves and beard products),
lanolin (in some beard balms), propylene glycol (in many balms),
certain preservatives, eucalyptus and menthol (in shaving products).
Every product verified before recommendation.
New allergy mentioned mid-session added to profile immediately.

TOOLS AVAILABLE — USE ALL OF THEM:
- camera_analyse: See face shape, beard, skin and hair
- get_sage_context: Conditions for every product formula decision
- recall_client_memory: Complete grooming history
- store_session_memory: Save complete session findings
- request_belle_simulation: Beard styles and haircuts on their face
- call_nova: Complete grooming product brief
- check_allergy_safety: Verify product before recommending
- add_client_allergy: Add newly discovered allergy
- generate_barber_brief: Create precise barber instructions
- flag_brook_booking: Offer Brook haircut booking integration
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// DREW'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const DREW_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'See the client\'s face, beard, skin and hair through the camera. Analyses: face shape (oval/square/round/oblong/diamond/heart/triangle), beard presence and condition (length, density, patchiness, growth stage, neckline, cheek line), beard skin (razor bumps, ingrown hairs, folliculitis, beard dandruff, dryness, oiliness), skin type (oily/dry/combination/sensitive), hair type and current cut, hairline shape and recession, overall grooming standard. Always call at session start.',
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
    description: 'Get real-time temperature, humidity and conditions. Critical for product weight decisions — high humidity means lighter beard products, low humidity means richer formulas, heat means lightweight everything. Always call before delivering any product recommendations.',
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
    description: 'Search this client\'s complete grooming history from all previous Drew sessions. Use to track beard growth progress, razor bump resolution, skin improvements, previous product recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search — beard progress, razor bumps, skin concerns, haircut history, products tried' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save complete session findings to Drew\'s memory. Include face shape, beard stage and style, razor bump severity and protocol given, haircut recommendation, barber brief generated, skincare routine, products recommended, Sage conditions, progress vs last session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete session summary' },
        metadata: {
          type: 'object',
          description: 'Structured: faceShape, beardStage, beardStyle, razorBumps{severity, protocol}, haircut, barberBrief, skincareSteps[], productsRecommended[], sageConditions, progressNotes',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Render a beard style or haircut on the client\'s actual face. Call for each beard style recommendation and each haircut option — the client sees each look on their own face before deciding. Be precise: specify the exact beard length, shape, neckline for beard simulations; exact cut, fade height, top length for haircut simulations.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: {
          type: 'string',
          enum: ['beard', 'hairstyle'],
          description: 'Beard style or haircut',
        },
        description: {
          type: 'string',
          description: 'Precise description — e.g. "short boxed beard, approximately 5mm on cheeks and sides, fuller at the chin at 8mm, sharp defined neckline sitting two finger-widths above the Adam\'s apple, clean cheek line following the natural growth pattern"',
        },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        skinTone: { type: 'string', description: 'Client skin tone for accurate rendering' },
        faceShape: { type: 'string', description: 'Identified face shape for accurate proportion rendering' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova with complete grooming product brief. Include every product in the skincare routine, beard care routine, any treatment products for razor bumps or ingrown hairs, with specific formula requirements (lightweight vs rich, SPF, active ingredients needed).',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        groomingNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every product needed — specific enough: "fragrance-free post-shave balm with niacinamide for razor bump-prone skin", "lightweight beard oil for high humidity, non-greasy finish"',
        },
        skinType: { type: 'string' },
        beardStage: { type: 'string', description: 'Current beard growth stage' },
        hasRazorBumps: { type: 'boolean' },
        razorBumpSeverity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
        budget: { type: 'string' },
        allergies: { type: 'array', items: { type: 'string' } },
        sageConditions: {
          type: 'object',
          description: 'Temperature and humidity — affects formula weights',
        },
        routineSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              productType: { type: 'string' },
              activeIngredients: { type: 'array', items: { type: 'string' } },
              reason: { type: 'string' },
              timing: { type: 'string' },
            },
          },
        },
      },
      required: ['userId', 'groomingNeeds'],
    },
  },
  {
    name: 'check_allergy_safety',
    description: 'Verify a product is safe for this client. Male grooming products often contain fragrance, lanolin, propylene glycol, eucalyptus, menthol — all common allergens.',
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
    description: 'Add newly mentioned allergy or skin sensitivity to client profile immediately.',
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
    name: 'generate_barber_brief',
    description: 'Generate a complete written barber brief the client can show or read to their barber. Call after every haircut recommendation. Returns a formatted brief that covers every instruction a barber needs.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        cutStyle: { type: 'string', description: 'Name of the cut style' },
        fadeType: { type: 'string', description: 'Skin/low/mid/high/taper/drop — and guard numbers' },
        topLength: { type: 'string', description: 'Length on top with measurement' },
        texture: { type: 'string', description: 'How the top should be finished' },
        neckline: { type: 'string', description: 'Blocked/tapered/rounded' },
        blendingNotes: { type: 'string', description: 'Specific blending instructions' },
        hairTypeNotes: { type: 'string', description: 'Any specific notes for their hair type' },
        faceShapeNotes: { type: 'string', description: 'Why these choices suit their face shape' },
      },
      required: ['userId', 'cutStyle'],
    },
  },
  {
    name: 'flag_brook_booking',
    description: 'Offer Brook\'s barber booking integration after generating a barber brief. Brook will find the best-rated barber for this specific cut near the client and handle the booking.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        serviceNeeded: { type: 'string', description: 'What specifically is needed — e.g. "mid skin fade with scissor texture on top"' },
        drewBarberBrief: { type: 'string', description: 'The complete barber brief Drew generated — passed to Brook for provider matching' },
        userLocation: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
      },
      required: ['userId', 'serviceNeeded'],
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
        faceShapeIdentified: { type: 'string' },
        beardAssessmentCompleted: { type: 'boolean' },
        razorBumpProtocolDelivered: { type: 'boolean' },
        razorBumpSeverity: { type: 'string' },
        haircutRecommended: { type: 'boolean' },
        barberBriefGenerated: { type: 'boolean' },
        brookBookingOffered: { type: 'boolean' },
        skincareRoutineDelivered: { type: 'boolean' },
        maintenanceScheduleDelivered: { type: 'boolean' },
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
// EXECUTE DREW'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeDrawToolCall(toolName, toolInput, sessionContext) {
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
          message: 'No camera frame. Ask client to face the camera straight on.',
        };
      }

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_type, grooming_prefs, appearance_goals, allergies')
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
      sessionContext.skinTone = analysis.analysis?.skin_tone || null;
      sessionContext.beardPresent = analysis.analysis?.beard_present || false;
      sessionContext.razorBumpsDetected = analysis.analysis?.razor_bumps || false;

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
          razorBumpsDetected: sessionContext.razorBumpsDetected,
        },
      });

      // Update beauty profile with confirmed grooming data
      if (metadata?.faceShape || metadata?.skinType) {
        await supabase
          .from('beauty_profiles')
          .upsert(
            {
              user_id: userId,
              skin_type: metadata.skinType || undefined,
              grooming_prefs: metadata.beardStyle
                ? { beard_style: metadata.beardStyle, beard_stage: metadata.beardStage }
                : undefined,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      }

      return { stored: true, memoryId };
    }

    case 'request_belle_simulation': {
      const { lookType, description, userId, sessionId, skinTone, faceShape } = toolInput;

      const tryOnAccess = await checkTryOnAccess(userId);
      if (!tryOnAccess.available) {
        return {
          error: 'tryon_unavailable',
          message: tryOnAccess.upgradeMessage,
          plan: tryOnAccess.plan,
          alternativeAction: 'Describe this beard style or haircut in precise detail so the client can clearly picture it on their face.',
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
            faceShape: faceShape || sessionContext.faceShape,
          },
          userId,
          sessionId,
        });

        sessionContext.pendingSimulation = simulation;
        sessionContext.belleSimulationCount = (sessionContext.belleSimulationCount || 0) + 1;

        return simulation;
      } catch (error) {
        logger.error('Drew: Belle simulation failed', { error: error.message });
        return {
          error: 'simulation_failed',
          message: 'Belle is temporarily unavailable. Describing this look in precise detail instead.',
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
        message: 'Nova is finding your exact grooming products — matching your skin type, beard stage and today\'s conditions.',
        productsNeeded: toolInput.groomingNeeds?.length || 0,
      };
    }

    case 'check_allergy_safety': {
      return await checkProductSafety(toolInput.productId, toolInput.userId);
    }

    case 'add_client_allergy': {
      return await addAllergyToProfile(toolInput.userId, toolInput.allergen);
    }

    case 'generate_barber_brief': {
      const {
        userId, sessionId, cutStyle, fadeType, topLength,
        texture, neckline, blendingNotes, hairTypeNotes, faceShapeNotes,
      } = toolInput;

      const barberBrief = [
        `═══ PRECCI BARBER BRIEF ═══`,
        `Style: ${cutStyle}`,
        fadeType ? `Fade/Taper: ${fadeType}` : null,
        topLength ? `Length on Top: ${topLength}` : null,
        texture ? `Texture/Finish: ${texture}` : null,
        neckline ? `Neckline: ${neckline}` : null,
        blendingNotes ? `Blending: ${blendingNotes}` : null,
        hairTypeNotes ? `Hair Type Notes: ${hairTypeNotes}` : null,
        faceShapeNotes ? `Why This Cut: ${faceShapeNotes}` : null,
        `Generated by Drew at PRECCI — ${new Date().toLocaleDateString()}`,
        `═══════════════════════════`,
      ].filter(Boolean).join('\n');

      // Store brief in session context for Brook integration
      sessionContext.barberBrief = barberBrief;
      sessionContext.barberBriefGenerated = true;

      // Log for session record
      await supabase.from('alerts').insert({
        type: 'barber_brief_generated',
        message: `Drew generated barber brief for user ${userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          session_id: sessionId,
          cut_style: cutStyle,
          brief: barberBrief,
          generated_at: new Date().toISOString(),
        },
      });

      return {
        generated: true,
        barberBrief,
        cutStyle,
        message: `Your barber brief is ready. Show this to your barber and they will know exactly what to do.`,
      };
    }

    case 'flag_brook_booking': {
      const { userId, sessionId, serviceNeeded, drewBarberBrief, userLocation } = toolInput;

      sessionContext.brookBookingRequested = {
        userId,
        sessionId,
        serviceNeeded,
        barberBrief: drewBarberBrief || sessionContext.barberBrief,
        userLocation,
        requestedAt: new Date().toISOString(),
      };

      // Log for Brook routing
      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: sessionId || null,
        from_agent: PC_ID,
        to_agent: 'PC-027',
        routing_reason: `Drew requesting Brook barber booking: ${serviceNeeded}`,
        timestamp: new Date().toISOString(),
      });

      return {
        flagged: true,
        targetAgent: 'PC-027',
        serviceNeeded,
        message: 'Brook is now finding the best-rated barber for this specific cut near you.',
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
        message: `Drew completed session for user ${toolInput.userId}`,
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
// PROCESS DREW SESSION
// Full autonomous agentic reasoning loop.
// Drew thinks, observes, assesses and speaks.
// Nothing hardcoded — every recommendation
// generated from what Claude sees and reasons
// about for this specific man at this moment.
// ─────────────────────────────────────────────
async function processDrawSession({
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

  // ── LOAD ALL CONTEXT DREW NEEDS ──

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
    skinTone: null,
    beardPresent: false,
    razorBumpsDetected: false,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    pendingSimulation: null,
    novaRequest: null,
    barberBrief: null,
    barberBriefGenerated: false,
    brookBookingRequested: null,
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
      ? `CLIENT STATUS: Returning client — recall their grooming history and track progress`
      : `CLIENT STATUS: New client — first session with Drew`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
      : `CLIENT LOCATION: Not provided`,
    currentFrame
      ? `CAMERA: Active — use camera_analyse to see the client\'s face, beard and hair now. Ask them to face straight on.`
      : `CAMERA: Not yet active`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known allergies on file`,
    userProfile?.skin_type
      ? `PREVIOUSLY RECORDED SKIN TYPE: ${userProfile.skin_type}`
      : ``,
    userProfile?.grooming_prefs
      ? `PREVIOUSLY RECORDED GROOMING PREFS: ${JSON.stringify(userProfile.grooming_prefs)}`
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

  // ── DREW'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: DREW_SYSTEM_PROMPT,
      tools: DREW_TOOLS,
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
        result = await executeDrawToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Drew: Tool call failed', {
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
      ? `Right, good to see you again. Face the camera straight on and let me take a proper look at where things are at.`
      : `Right. Face the camera straight on for me — I want to see your face shape, your beard and your skin clearly before I tell you anything.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Drew: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    razorBumpsDetected: sessionContext.razorBumpsDetected,
    barberBriefGenerated: sessionContext.barberBriefGenerated,
    brookBookingRequested: !!sessionContext.brookBookingRequested,
    belleSimulations: sessionContext.belleSimulationCount,
    hasNovaRequest: !!sessionContext.novaRequest,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    pendingSimulation: sessionContext.pendingSimulation,
    novaRequest: sessionContext.novaRequest,
    barberBrief: sessionContext.barberBrief,
    brookBookingRequested: sessionContext.brookBookingRequested,
    sageData: sessionContext.sageData,
    cameraAnalysis: sessionContext.cameraAnalysis,
    isReturningClient,
  };
}

module.exports = {
  processDrawSession,
  DREW_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};