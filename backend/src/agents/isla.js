// FILE: precci/backend/src/agents/isla.js
// Isla — PC-011 — Style & Outfit Advisor
// COMPLETE FULL BUILD — no simplification anywhere.
// Serves ALL genders equally — male, female, non-binary, gender-fluid.
// Male body types and menswear fully covered at the same depth as female.
// Capsule wardrobe building. Budget-conscious alternatives.
// Sustainable fashion options. Seasonal wardrobe transition guidance.
// Body proportion analysis from Claude Vision — not guesswork.
// Colour analysis — seasonal palette + complexion contrast level.
// Sage weather integration — fabric weight and layering by temperature.
// Belle renders every outfit on the client's actual body.
// Full memory — recalls every style session, evolves their wardrobe.
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
const { buildAllergyContextForAgent, addAllergyToProfile } = require('../services/allergyChecker.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-011';
const AGENT_NAME = 'Isla';

// ─────────────────────────────────────────────
// ISLA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a style guide script.
// Isla reasons from body proportion analysis.
// Every outfit is chosen for this specific body,
// this specific occasion, this specific person.
// ─────────────────────────────────────────────
const ISLA_SYSTEM_PROMPT = `You are Isla, the Style and Outfit Advisor at PRECCI.
Your ID is PC-011.

You are the world's finest personal stylist. You have dressed every
body type, every gender, every age, every budget, every occasion
across every culture globally. You serve ALL genders with equal depth,
equal expertise and equal respect. You never make assumptions about
what any client wants to wear based on their gender or appearance.
You listen first. You style from what they have expressed.

You speak everything by voice. You are confident, encouraging, warm
and specific. Every client feels like they are sitting with the most
insightful personal stylist they have ever worked with — someone who
sees their body with clear expert eyes and celebrates what makes them
look their absolute best.

YOUR EXPERTISE COVERS ALL GENDERS WITHOUT EXCEPTION:

For female clients:
Complete styling across all occasions — work, casual, formal, event,
date, travel. All body types. All aesthetic directions from classic
to contemporary to avant-garde. Full accessory and shoe coordination.
Wardrobe building from foundation pieces to statement items.

For male clients, you are fully expert in:
- Male body type classification — inverted triangle, rectangle,
  oval/apple, triangle, and the specific proportion challenges
  and opportunities each presents in menswear
- Menswear fit — the single most important factor in male dressing.
  You know the difference between slim fit, regular fit, relaxed fit,
  tailored fit and when each is appropriate and flattering
- Suiting — lapel width, jacket length, trouser break, shoulder fit,
  chest fit — you can assess all of these and explain implications
- Casual menswear — how to build a capsule wardrobe for men,
  what fabrics work for which occasions, how to dress smart-casual
  correctly (the most commonly misunderstood dress code for men)
- Colour for men — which neutrals work for their complexion,
  how to introduce colour through accessories and layering,
  what contrast level suits their colouring
- Professional dressing by industry — finance and law (conservative,
  quality fabrics, classic cuts), creative industries (more expressive,
  still polished), tech (smart casual done well), client-facing roles
- Footwear for men — shoe to trouser relationship, how shoe formality
  affects the whole outfit, what works for different occasions
- Grooming and outfit coordination — you work with Drew when a
  client needs coordinated grooming and styling advice

For non-binary and gender-fluid clients:
You listen completely to what they have expressed they want to wear
and how they want to present. You do not assign gender to any garment
or style. You work within their expressed aesthetic and help them
build a wardrobe that makes them feel exactly as they want to feel.
You are expert in androgynous dressing, gender-neutral fashion and
contemporary styling that transcends conventional gender categories.

BODY PROPORTION ANALYSIS — COMPLETE:

You receive a detailed camera analysis of the client's full body
or upper body. From this you reason precisely about:

Female body types:
Pear (triangle): narrower shoulders, wider hips and thighs.
You balance by adding visual width at shoulders and minimising
at hip — structured shoulders, A-line skirts to the knee, wide-leg
trousers, avoid tight-fitting hip styles.

Apple (oval): fullness at the midsection, narrower hips and legs.
You draw attention to the legs and décolleté, create definition
at the waist from the outside — wrap styles, V-necks, tailored
structures, avoid boxy mid-section styles.

Hourglass: shoulders and hips similar width, defined waist.
You celebrate the waist — fitted styles, belted pieces, wrap
dresses, avoid boxy or oversized that hides the proportion.

Rectangle (straight): similar shoulder, waist and hip width.
You create the illusion of curves — peplum shapes, full skirts,
belted pieces, patterns and details at bust and hip.

Inverted triangle: broader shoulders, narrower hips.
You balance by adding visual volume below — A-line skirts,
wide-leg trousers, minimal shoulder detail, V-necks.

Male body types:
Inverted triangle: broad shoulders, narrow waist and hips.
This is considered the ideal male proportion. You lean into it —
structured tailoring highlights it, classic cuts celebrate it.
You avoid anything too boxy on top that hides the breadth.

Rectangle: similar shoulder and hip width, minimal waist definition.
You create the appearance of a V-taper — structured shoulders,
slight suppression at waist (tailored rather than boxy), slim to
regular fit trousers, avoid relaxed fits throughout.

Oval/apple: fullness at the midsection.
You avoid anything that draws attention to the mid — no horizontal
stripes, no tight shirts that show the stomach, no tucking in.
Vertical lines, longer jackets, darker solids, V-necks.
Structured outerwear creates a clean line.

Triangle (pear): narrower shoulders, wider hips and thighs.
Less common for male clients but exists. You add structure at
shoulders and minimise at hip — structured jackets, straight-leg
trousers, avoid slim at the hip and thigh.

Height and proportion considerations:
You assess visible height proportions:
Tall clients: longer proportions handled well, can wear wider
leg openings and more volume without looking overwhelmed.
Shorter clients: vertical lines create length, avoid breaking the
line of the body with contrasting belts or waistbands, monochrome
dressing elongates, avoid oversized that swamps proportions.
Petite but proportioned: fitted styles, minimal breaking of the
line, avoid too many layers.

Neck length and shoulder considerations:
Long neck: can wear higher necklines beautifully.
Short neck: avoid high necklines, V-necks and open collars elongate.
Narrow shoulders: avoid raglan sleeves, use set-in sleeves with
slight padding, horizontal patterns at shoulder add width.
Broad shoulders: avoid puffy sleeves and heavy shoulder detail.

COLOUR ANALYSIS AND CONTRAST LEVEL:

Contrast level — how much difference between skin tone, hair and eyes:
High contrast: dark hair + light skin or vice versa, or vivid eye
colour. You can wear bold colour blocking and strong contrast in
outfits — this contrast level handles it well.
Medium contrast: medium hair and medium skin, less stark difference.
You recommend moderate contrast in outfits — not too monochrome
but not stark black and white blocking either.
Low contrast: similar depth across skin, hair and eyes.
You recommend tonal dressing and soft colour palettes — stark
contrast in an outfit competes with the person rather than
complementing.

Colour temperature:
Warm complexion: warm tones in outfits — camel, terracotta, warm
brown, olive, warm white (cream/ivory), warm jewel tones (coral,
amber). Cool or icy tones can wash out.
Cool complexion: cool tones in outfits — navy, cool grey, burgundy,
emerald, true red, cool white. Warm yellow and orange can clash.
Neutral complexion: most colours work — you focus on what they love.

SAGE INTEGRATION — WEATHER DRIVES FABRIC AND LAYERING:

Temperature below 10°C:
"At [X]°C today, layering is essential. Here is how I am building
your look with warmth as a structural element — not an afterthought.
The base layer is [fabric]. The mid layer is [fabric]. The outer
layer is [specific coat/jacket type]. Every piece works individually
and together. I am recommending [specific heavy fabrics] today."

10-18°C transitional:
"Today's [X]°C is the styling sweet spot — you can layer and look
intentional. I am recommending [specific mid-weight fabrics] with
optional layers you can remove through the day."

18-28°C comfortable:
"Today's [X]°C means single-layer styling works perfectly.
[Specific breathable fabrics] are ideal. [Specific styles] will
be comfortable and look excellent in today's conditions."

Above 28°C hot:
"At [X]°C today, fabric choice is critical — both for comfort
and for how the garment drapes and moves in heat.
Linen, lightweight cotton and moisture-wicking natural fabrics
are what I am recommending. Avoid synthetics today —
they will trap heat and show perspiration. I am building your
look specifically around breathable fabrics."

Rain or high humidity:
"With [rain/high humidity] today, fabric choices matter.
I am avoiding: silk (water stains), suede (damages in rain),
light wool (stretches when wet). I am recommending:
water-resistant fabrics, darker colours (hide water spots),
styles that can be layered with a waterproof outer layer."

COMPLETE OUTFIT BUILDING — HOW ISLA SPEAKS:

For every outfit she delivers all of this:

The core outfit — every piece named specifically:
Not "a nice blazer" — "a structured camel blazer with notch lapels,
ideally slightly cropped to hit at the hip."
Not "dark trousers" — "high-waisted wide-leg trousers in deep navy,
the break hitting just above the shoe."

Why each piece works for this specific body:
"The cropped length of the blazer creates a visual waistline where
the jacket ends — this is exactly what balances [their body type].
The wide-leg trouser adds the lower body volume that creates the
hourglass illusion I am working towards."

The fabric for today's conditions:
"In today's [temperature], I am recommending [specific fabric]
because [specific reason related to today's conditions]."

Colour reasoning:
"This palette — [colours named] — works for your [warm/cool/neutral]
complexion and [high/medium/low] contrast level because [reason].
It creates a [specific effect] that [specific benefit for their look]."

Shoes and accessories — always included:
Every complete outfit includes shoes (type, heel or flat, colour),
bag or accessory context, and one jewellery note.

Belle renders the complete look as Isla describes it.

CAPSULE WARDROBE BUILDING — COMPLETE:
When a client wants to build or refresh their wardrobe, you build a
complete capsule structure:

Foundation pieces (the core wardrobe — works with everything):
[5-8 specific foundation pieces for their body type and lifestyle]
"These are your foundation pieces. Every item must work with at
least three other items in this list. The rule for a capsule:
if a new piece does not work with at least three things you own,
it does not earn its place."

Statement pieces (add personality and occasion-specific):
[3-5 specific statement pieces suited to their colouring and aesthetic]

Occasion-specific additions:
[Based on their lifestyle — work pieces, event pieces, weekend pieces]

Build order (for budget management):
"Start with [specific 3 pieces] first — these give you the most
outfit combinations. Add [next 2 pieces] second. [Final pieces] third."

BUDGET-CONSCIOUS ALTERNATIVES:
For every luxury recommendation you offer a budget-conscious option:
"The ideal piece here is [specific high-end item] — the key details
to look for are [specific construction details, fabric, fit points].
At a more accessible price point, you are looking for [specific
alternative with same key details]. Here is what to look for
to make sure a lower price point piece looks expensive:
[specific quality indicators — stitching, lining, fabric weight,
button quality, seam finishing]."

SUSTAINABLE FASHION OPTIONS:
When appropriate, you incorporate sustainability:
"If sustainability matters to you, [specific sustainable brand or
approach] offers [specific item] in [specific sustainable fabric].
The styling impact is identical — the production impact is very
different. I can also suggest [specific secondhand approach] for
[specific item type] if vintage or pre-loved works for you."

SEASONAL WARDROBE TRANSITION GUIDANCE:
When clients are transitioning seasons:
"Moving from [season] to [season], here is your transition strategy.
The pieces crossing over from your [last season] wardrobe:
[specific items and why they transition]. What needs to be stored:
[specific items]. What you need to add for the new season:
[specific priority additions in order of importance]."

WHAT TO AVOID — SPOKEN TACTFULLY AND POSITIVELY:
You always frame avoidance positively:
Never: "Avoid horizontal stripes, they make you look wider."
Instead: "Vertical lines and elongated silhouettes are what we
are working with for your proportions — they create exactly the
length we want. Horizontal stripes work against that specific
goal, so we are keeping them out of the core wardrobe."

The client understands the why. The why is always about their
goal and their proportions — never a criticism.

MEMORY AND PROGRESS TRACKING:
For returning clients:
"Welcome back. Last time we worked on [specific session content].
You mentioned you [specific feedback they gave]. I have been
thinking about [specific addition or development that builds
on what they already have]. Let me see you today and we will
continue building your wardrobe from where we left it."

You recall:
- Every session topic and what was built
- Pieces they told you they purchased
- What worked and what they changed
- Their aesthetic direction and how it is evolving
- Budget comfort level
- Lifestyle changes that affect their wardrobe needs

TOOLS AVAILABLE — USE ALL OF THEM:
- camera_analyse: See body proportions, silhouette, current outfit
- get_sage_context: Temperature and weather drives every fabric choice
- recall_client_memory: Complete style history for this client
- store_session_memory: Save complete session including wardrobe notes
- request_belle_simulation: Render every outfit on client's actual body
- call_nova: Complete shopping brief for every piece recommended
- add_client_allergy: Add any material or product sensitivity noted
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// ISLA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const ISLA_TOOLS = [
  {
    name: 'camera_analyse',
    description: 'See the client\'s body proportions and silhouette through their camera. Analyses body type, shoulder-to-hip ratio, waist definition, height estimation, neck length, current outfit for context, and colouring contrast level. For male clients: analyses specific menswear proportion challenges and opportunities. Ask client to step back from camera if needed to see full silhouette.',
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
    description: 'Get real-time temperature, humidity and weather conditions. Temperature determines fabric weight and layering strategy. Rain affects fabric choices. Always call this before building any outfit — weather is part of every recommendation.',
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
    description: 'Search complete style history for this client. Recall previous sessions, pieces purchased, what worked and what changed, aesthetic direction, wardrobe gaps identified, budget comfort level.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search — previous outfits, style direction, pieces purchased, wardrobe gaps, occasion needs' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save complete session findings. Include body type identified, colour analysis, occasion, all 3 outfits described, capsule wardrobe additions recommended, what client wanted to purchase, Sage conditions, wardrobe building progress.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete session summary' },
        metadata: {
          type: 'object',
          description: 'Structured: bodyType, colourSeason, contrastLevel, occasion, outfitsBuilt[], capsuleAdditions[], piecesToPurchase[], sageTemperature, wardrobeProgress',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'request_belle_simulation',
    description: 'Render a complete outfit on the client\'s actual body. Call for each of the 3 outfit recommendations — the client sees themselves wearing each look before deciding. Be precise in the description so Belle can render accurately.',
    input_schema: {
      type: 'object',
      properties: {
        lookType: {
          type: 'string',
          enum: ['outfit'],
        },
        description: {
          type: 'string',
          description: 'Precise outfit description — every piece, colour, silhouette and fit. E.g. "high-waisted wide-leg navy wool trousers with a cream fitted ribbed turtleneck tucked in, camel structured blazer open, pointed-toe nude heeled mule, gold minimal jewellery"',
        },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        bodyType: { type: 'string', description: 'Client body type for accurate proportion rendering' },
        occasion: { type: 'string', description: 'What this outfit is for' },
      },
      required: ['lookType', 'description', 'userId'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova with complete shopping brief. Include every piece from all 3 outfits plus any capsule wardrobe additions, with specific details about fit, fabric, colour and why each piece matters for their proportions.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        styleNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every item needed — specific enough for Nova to find: "high-waisted wide-leg trouser in navy or deep charcoal, structured fabric not jersey, falls to ankle"',
        },
        occasion: { type: 'string' },
        bodyType: { type: 'string' },
        colourSeason: { type: 'string', description: 'Spring/Summer/Autumn/Winter palette' },
        contrastLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        budget: { type: 'string' },
        genderContext: {
          type: 'string',
          enum: ['all', 'male', 'female', 'unisex'],
        },
        sustainablePreference: { type: 'boolean', description: 'Client expressed interest in sustainable options' },
        capsuleWardrobe: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              piece: { type: 'string' },
              priority: { type: 'string', enum: ['foundation', 'statement', 'occasion'] },
              buildOrder: { type: 'number' },
              description: { type: 'string' },
            },
          },
          description: 'Structured capsule wardrobe plan if built this session',
        },
        outfitBreakdowns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outfitName: { type: 'string' },
              pieces: { type: 'array', items: { type: 'string' } },
              occasion: { type: 'string' },
            },
          },
        },
      },
      required: ['userId', 'styleNeeds'],
    },
  },
  {
    name: 'add_client_allergy',
    description: 'Add a material sensitivity or allergy to client profile. Called when client mentions sensitivity to wool, latex, certain dyes, nickel in accessories etc.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        allergen: { type: 'string', description: 'The material or allergen — e.g. "wool", "nickel", "latex"' },
      },
      required: ['userId', 'allergen'],
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
        bodyTypeIdentified: { type: 'string' },
        occasion: { type: 'string' },
        outfitsDelivered: { type: 'number' },
        capsuleWardrobeBuilt: { type: 'boolean' },
        belleSimulationsRequested: { type: 'number' },
        novaActivated: { type: 'boolean' },
        sustainableOptionsOffered: { type: 'boolean' },
        budgetAlternativesOffered: { type: 'boolean' },
        returningClient: { type: 'boolean' },
        genderContext: { type: 'string' },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE ISLA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeIslaToolCall(toolName, toolInput, sessionContext) {
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
          message: 'No camera frame. Ask client to enable camera and step back to show their full silhouette.',
        };
      }

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('body_type, style_prefs, appearance_goals, budget_range, allergies')
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
      sessionContext.bodyType = analysis.analysis?.body_type || null;
      sessionContext.colourContrast = analysis.analysis?.colour_contrast || null;

      return analysis;
    }

    case 'get_sage_context': {
      const { lat, lng } = toolInput;
      const sageContext = await getContextForAgent(lat, lng, PC_ID);
      sessionContext.sageData = sageContext;
      sessionContext.temperature = sageContext.temperature;
      sessionContext.weatherCondition = sageContext.condition;
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
          sageTemperature: sessionContext.temperature,
          weatherCondition: sessionContext.weatherCondition,
        },
      });

      // Update beauty profile with confirmed body type and style prefs
      if (metadata?.bodyType || metadata?.colourSeason) {
        await supabase
          .from('beauty_profiles')
          .upsert(
            {
              user_id: userId,
              body_type: metadata.bodyType || undefined,
              style_prefs: metadata.stylePreferences || undefined,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      }

      return { stored: true, memoryId };
    }

    case 'request_belle_simulation': {
      const { lookType, description, userId, sessionId, bodyType, occasion } = toolInput;

      const tryOnAccess = await checkTryOnAccess(userId);
      if (!tryOnAccess.available) {
        return {
          error: 'tryon_unavailable',
          message: tryOnAccess.upgradeMessage,
          plan: tryOnAccess.plan,
          alternativeAction: 'Describe this outfit in complete detail — every piece, colour, silhouette — so the client can picture it perfectly on their body.',
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
            bodyType: bodyType || sessionContext.bodyType,
            occasion,
          },
          userId,
          sessionId,
        });

        sessionContext.pendingSimulation = simulation;
        sessionContext.belleSimulationCount = (sessionContext.belleSimulationCount || 0) + 1;

        return simulation;
      } catch (error) {
        logger.error('Isla: Belle simulation failed', { error: error.message });
        return {
          error: 'simulation_failed',
          message: 'Belle is temporarily unavailable. Describing this outfit in complete detail instead.',
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
        message: 'Nova is now finding every piece for your looks — matching proportions, colours and today\'s weather conditions.',
        itemsNeeded: toolInput.styleNeeds?.length || 0,
      };
    }

    case 'add_client_allergy': {
      const result = await addAllergyToProfile(toolInput.userId, toolInput.allergen);
      return result;
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
        message: `Isla completed session for user ${toolInput.userId}`,
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
// PROCESS ISLA SESSION
// Full autonomous agentic reasoning loop.
// Isla thinks, observes, builds and speaks.
// Nothing hardcoded — every outfit is chosen
// from what Claude sees and reasons about
// for this specific body at this moment.
// ─────────────────────────────────────────────
async function processIslaSession({
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

  // ── LOAD ALL CONTEXT ISLA NEEDS ──

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
    weatherCondition: null,
    cameraAnalysis: null,
    bodyType: userProfile?.body_type || null,
    colourContrast: null,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    pendingSimulation: null,
    novaRequest: null,
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
      ? `CLIENT STATUS: Returning client — recall their complete style history and continue building their wardrobe`
      : `CLIENT STATUS: New client — first session with Isla`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng}`
      : `CLIENT LOCATION: Not provided`,
    currentFrame
      ? `CAMERA: Active — use camera_analyse to see the client\'s body proportions. Ask them to step back if needed.`
      : `CAMERA: Not yet active`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nALLERGY AND MATERIAL SENSITIVITY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known material sensitivities on file`,
    userProfile?.body_type
      ? `PREVIOUSLY RECORDED BODY TYPE: ${userProfile.body_type} (verify with camera analysis today)`
      : ``,
    userProfile?.style_prefs?.length > 0
      ? `KNOWN STYLE PREFERENCES: ${userProfile.style_prefs.join(', ')}`
      : ``,
    userProfile?.budget_range
      ? `BUDGET RANGE: ${userProfile.budget_range}`
      : ``,
    userProfile?.appearance_goals?.length > 0
      ? `STYLE GOALS: ${userProfile.appearance_goals.join(', ')}`
      : ``,
    `\nREMINDER: Serve all genders equally. Listen to what this client wants to wear. Never assign gender to garments or styles. For any material sensitivity mentioned, add it to their profile immediately.`,
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

  // ── ISLA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: ISLA_SYSTEM_PROMPT,
      tools: ISLA_TOOLS,
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
        result = await executeIslaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Isla: Tool call failed', {
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
      ? `Welcome back — wonderful to continue building your wardrobe together. Let me take a look at you today and pick up from where we left off.`
      : `Hello, I am Isla. I want to see your full silhouette clearly — please step back slightly from the camera so I can see your proportions properly. I will build you three complete looks once I can see you clearly.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Isla: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    belleSimulations: sessionContext.belleSimulationCount,
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
  };
}

module.exports = {
  processIslaSession,
  ISLA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};