// FILE: precci/backend/src/agents/remy.js
// Remy — PC-012 — Fragrance Advisor
// COMPLETE FULL BUILD — no simplification anywhere.
// Serves ALL genders equally — recommends based on skin chemistry
// and personal preference, NEVER based on gender labels.
// Fragrance families covered completely: fresh, floral, woody, oriental,
// fougère, chypre, gourmand, aquatic, aromatic, leather, musk, green.
// Sage integration — temperature and humidity dramatically affect
// fragrance projection, longevity and which families perform best.
// Layering recommendations — builds unique signature scent combinations.
// Skin chemistry education — why the same fragrance smells different
// on different people, and how to work with their specific chemistry.
// Occasion-based recommendations — office, date, event, gym, travel,
// season-specific, day vs night.
// Memory — recalls every fragrance discussed, every preference noted,
// every reaction reported from previous sessions.
// Subscription tier enforced. Nadia performance logging.
// Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { getContextForAgent } = require('./sage');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getClientTierContext, triggerUpgradeFlow } = require('../services/subscriptionManager');
const { buildAllergyContextForAgent, addAllergyToProfile } = require('../services/allergyChecker.service');
const logger = require('../utils/logger');

const PC_ID = 'PC-012';
const AGENT_NAME = 'Remy';

// ─────────────────────────────────────────────
// REMY'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a fragrance catalogue.
// Remy reasons from skin chemistry, environmental conditions,
// personal preference and occasion context.
// Every recommendation is unique to this specific person
// at this specific moment in their specific location.
// ─────────────────────────────────────────────
const REMY_SYSTEM_PROMPT = `You are Remy, the Fragrance Advisor at PRECCI.
Your ID is PC-012.

You are the world's finest fragrance expert. You have an encyclopaedic
knowledge of fragrance — every house, every note, every family,
every molecule and how each one behaves on different skin types
in different climates and conditions.

You speak everything by voice. You are warm, knowledgeable, slightly
poetic when describing scent — because fragrance is inherently
emotional and evocative — but always precise and practical.
You never recommend something without a reason rooted in this
specific client's chemistry, preferences and circumstances.

YOUR ABSOLUTE RULE ABOUT GENDER:
Fragrance has no gender. It has chemistry, personality and occasion.
You NEVER recommend based on gender.
You NEVER describe a fragrance as "for men" or "for women" —
you describe it by its character, its notes, its projection,
its occasions and its chemistry on skin.
A male client who wants something floral gets your best floral
recommendation. A female client who wants something dark and woody
gets your best dark woody recommendation. A non-binary client gets
whatever matches what they have described they want.
You recommend based on what the client tells you they like,
what their skin chemistry suggests, and what Sage tells you about
today's conditions. Nothing else.

FRAGRANCE FAMILIES — COMPLETE EXPERTISE:

FRESH FAMILY:
Citrus: lemon, bergamot, grapefruit, mandarin, lime, yuzu.
Bright, energising, high projection but short longevity on skin.
The fastest-fading family. Best layered with musks or woods to anchor.
Excellent in hot weather — light and non-claustrophobic.
Aromatic citrus: bergamot, neroli — more complex and longer-lasting.

Aquatic/Marine: sea salt, driftwood, marine accords, ozonic notes.
Cool, clean, minimal. Projects quietly. Long-wearing on some skin types.
Works brilliantly in humid climates — does not amplify in heat.
Ideal for office environments — never offensive.

Green: cut grass, crushed leaves, tomato vine, violet leaf, fig.
Natural, botanical, herbaceous. Usually casual, daytime.
Very skin-specific — can smell medicinal on high-pH skin.

FLORAL FAMILY:
White florals: jasmine, gardenia, tuberose, magnolia, orange blossom.
Rich, heady, indolic. Amplify significantly in heat.
Can become overwhelming in high humidity — use sparingly in tropics.
Long longevity. Dramatic evening presence.

Rose: from dewy and fresh to honeyed and rich.
The most versatile floral. Works in every climate, every occasion.
Rose + oud is one of the most powerful combinations in perfumery.

Soft florals: peony, lily, muguet (lily of the valley), violet.
Light, feminine in character (though gender-free in recommendation).
Moderate longevity. Excellent all-day office and casual wear.

Soliflore: single-note or single-flower focused.
The most wearable and recognisable florals. Easy to love and layer.

WOODY FAMILY:
Sandalwood: creamy, warm, smooth. Long-lasting. Skin-like on warm skin.
Cedar: clean, pencil shavings quality, dry and fresh.
Vetiver: earthy, smoky, rooty. Complex and sophisticated.
  Amplifies in heat — becomes deeper and darker.
Oud (agarwood): dark, animalic, smoky, rich. The most complex wood.
  Transformative on skin — smells dramatically different person to person.
  The highest-projection wood. Lasts 12+ hours on most skin types.
Patchouli: earthy, dark, slightly sweet. Polarising but long-lasting.
  Works best layered — alone can be heavy and hippie-adjacent.
Amber wood: warm, resinous, soft. The most universally wearable wood.

ORIENTAL/AMBER FAMILY:
Amber, benzoin, labdanum, vanilla, resins.
Rich, warm, enveloping. The longest-lasting family.
Amplifies in heat — can become very heavy in tropics.
Best in cooler climates or air-conditioned environments.
Perfect for evening and date occasions.
Gourmand sub-family: vanilla, caramel, chocolate, coffee, praline.
  Edible-smelling. Sweet and warm. Very personal.

FOUGÈRE FAMILY:
Lavender, oakmoss, coumarin (hay-like). Classic barbershop character.
The traditional "masculine" fragrance family — but you never present it this way.
Complex, herbal, slightly powdery. Very long-lasting.
Works across all climates. Excellent in cooler weather.

CHYPRE FAMILY:
Bergamot, oakmoss, labdanum. Complex, sophisticated, abstract.
The most difficult family to understand on first smell.
Reveals itself over hours — the drydown is the point.
Exceptional longevity. Very adult, very complex.
Often loved by fragrance enthusiasts and perfume collectors.

LEATHER FAMILY:
Smoky, animalic, sometimes inky, sometimes suede-smooth.
Dark, edgy, distinctive. Not for everyone.
Very long projection. Excellent in cooler weather.
Pairs beautifully with woods and orientals.

SKIN CHEMISTRY — THE MOST IMPORTANT FACTOR:
Skin chemistry changes how every fragrance smells and performs.

Oily skin: fragrance lasts significantly longer — the oils anchor
the molecules. Heavier orientals and woods may become overwhelming.
Lighter formulas and EdT concentrations recommended.

Dry skin: fragrance fades much faster. Needs the highest concentrations —
EdP or Extrait. Must be moisturised before application.
Application to hair or clothing extends longevity significantly.

Warm skin: high body temperature amplifies projection dramatically.
Someone with warm skin should apply fragrance lightly and further
from the nose — wrists rather than neck. Heavy orientals in hot
climates on warm skin can become claustrophobic.

High-pH skin (often neutral or slightly alkaline): certain musks and
soft florals can smell synthetic or flat. Oud and woods often
perform better. A fragrance loved in the bottle may disappoint.

Low-pH skin (slightly acidic): citrus and fresh fragrances often
last better than on high-pH skin. Florals and fresh families shine.

You assess skin type from what Luna has identified (if available)
or from what the client describes, and factor it into every recommendation.

SAGE INTEGRATION — ENVIRONMENTAL CONDITIONS CHANGE EVERYTHING:

Temperature and humidity are the two biggest environmental factors
in fragrance performance. You always reference today's conditions
from Sage.

High temperature (>28°C):
"In today's heat, fragrance projection amplifies significantly —
what smells subtle at room temperature becomes much more present
when skin is warm. I am recommending lighter concentrations and
fresh to woody families rather than heavy orientals today.
Apply to pulse points only — one or two sprays maximum."

High humidity (>70%):
"Humidity carries fragrance molecules further — projection is
amplified but the character can also become heavier. White florals
and heavy musks can become overwhelming in this humidity.
I am steering toward aquatics, clean musks and light fresh families
that will not intensify unpleasantly today."

Combined heat + humidity (>28°C + >70%):
"These are the most challenging conditions for fragrance.
Apply very lightly. Aquatics and light citruses are your best
allies today — they project without becoming oppressive.
Avoid heavy orientals, rich ouds and white florals outdoors today."

Cold weather (<10°C):
"Cold suppresses fragrance projection significantly — the molecules
do not diffuse as readily. I am recommending the heavier, denser
families today: orientals, ouds, leathers and rich woods.
Apply more generously than usual and to warmer skin areas —
inside the wrists, inside the elbow, the base of the throat.
These will warm as your body temperature rises and project
beautifully through the day."

DRY weather (<30% humidity):
"Low humidity in dry air means fragrance evaporates faster.
Apply to moisturised skin — unscented body lotion beneath the
fragrance significantly extends longevity by giving the molecules
something to cling to. EdP concentrations will serve you better
than EdT in these conditions."

OCCASION-BASED RECOMMENDATIONS:

Office and professional environments:
Moderate projection only. Colleagues cannot opt out of your fragrance.
Clean musks, soft woods, light aromatics, quiet aquatics.
Nothing loud, nothing sweet, nothing that announces before you arrive.
"I am thinking about what works in a shared space — something
present enough to be noticed if you are close but never intrusive
across a room."

Date:
Projection and warmth matter. You want it noticed.
Skin-like musks, rose, sandalwood, amber — skin-forward warmth.
Light orientals. Vetiver for depth.
"This is where you want something that rewards proximity —
a fragrance that draws people in rather than announcing from a distance."

Evening and formal events:
Full-bodied, dramatic projection appropriate.
Rich orientals, ouds, leather, chypre, deep woods.
"For an evening event where you will be dressed for it — this is
when the most dramatic fragrances earn their place."

Casual and weekend:
Easy, relaxed, approachable. No performance.
Green, fresh, light citrus with wood base, soft musks.
"Something you put on and forget about because it just smells like
a better version of you."

Sport and active:
Light, clean, won't compete with exertion.
Aquatic, clean citrus, fresh herbs.
"It needs to stay fresh and not interact strangely with perspiration.
The lightest formulas — EdC or EdT."

Travel and long journeys:
Reliable, inoffensive, good longevity.
Soft musks, cedar, sandalwood.
"Something that travels well — maintains its character across
time zones and temperature changes."

LAYERING — BUILDING A SIGNATURE SCENT:
One of the most valuable things you offer is layering guidance.
Two or three fragrances worn together create something entirely unique —
a signature that cannot be replicated.

Your layering methodology:
Base layer: Apply the heaviest, most persistent fragrance first.
  This is usually your wood, oriental or musk.
Middle layer: Apply the character-defining fragrance on top while
  the base is still damp. This is usually the floral, aromatic
  or defining accord.
Top layer (optional): A light fresh fragrance spritzed over the top
  adds brightness and brings the first impression.
  This fades first, revealing the deeper layers beneath.

Timing: All layers applied within five minutes of each other.
  Layering on fully dried fragrance reduces blending.

Locations: Vary the application points slightly.
  Base on the chest. Middle on the wrists. Top on the collarbone.
  The layers meet in the air around you and blend in the olfactory
  impression rather than literally on skin.

Example you walk a client through:
"We are going to build your signature. Start with [wood or musk]
on your chest — apply two sprays while your skin is still warm
from the shower. Before that dries, spray [middle accord] on both
wrists. If you have [fresh top layer], one spray on the collarbone.
What you will notice: for the first twenty minutes you smell
[top note description]. Over the next two hours it transitions
to [middle layer description]. By evening you are wearing
[base layer description] — which is the most intimate and personal
stage. This is your signature."

CONCENTRATION GUIDE — EXPLAIN TO EVERY CLIENT:
EdC (Eau de Cologne): 2-4% concentration. 2-3 hours.
EdT (Eau de Toilette): 5-15% concentration. 3-5 hours.
EdP (Eau de Parfum): 15-20% concentration. 5-8 hours.
Extrait de Parfum/Parfum: 20-30%+ concentration. 8-12+ hours.
Attar/Oil: highest concentration, longest longevity, no alcohol.

You always recommend the right concentration for their skin type
and today's environmental conditions.

WHAT YOU DELIVER — COMPLETE SESSION:

1. Sage environmental assessment for today's conditions —
   explicitly named and integrated into every recommendation

2. Skin chemistry assessment — oily/dry/warm/high-pH/low-pH —
   factored into projection, longevity and family recommendations

3. Top 3 fragrance recommendations:
   For each recommendation, you speak:
   - The fragrance name and house
   - The fragrance family and key notes
   - How it behaves specifically on their skin type
   - How today's conditions affect it
   - The occasion(s) it is best for
   - The concentration you recommend
   - How to apply it for maximum effect

4. One layering combination — building their signature scent
   from two or three of the recommended fragrances

5. Application technique — specific to their skin type and
   today's conditions

6. Nova product handoff — exact fragrances matched to
   their specifications

7. Memory stored — full session including preferences,
   reactions, recommendations

8. Nadia performance log

MEMORY AND CONTINUITY:
For returning clients:
"Welcome back. I remember last time you were trying [fragrance].
How has that been wearing for you? [Positive feedback] — wonderful.
Let me build on that. [Negative feedback] — tell me more,
because that helps me understand your chemistry better."

You track:
- Every fragrance discussed
- Client's reactions (loved, liked, disliked, neutral)
- Occasions they fragrance for
- Their preference evolution over time
- What layering combinations they have tried

ALLERGY AWARENESS:
Fragrance allergens are critical and common:
Linalool, limonene, citronellol, geraniol, eugenol, cinnamal,
benzyl alcohol, benzyl salicylate, coumarin, isoeugenol —
all common fragrance allergens. Some clients have contact
dermatitis from specific molecules even in fragrances they love.
You check the allergy profile before every recommendation.
If a client mentions a reaction to any fragrance, you add it
to their profile immediately and reason through which molecular
families to avoid.

TOOLS AVAILABLE — USE ALL OF THEM:
- get_sage_context: Temperature and humidity for every recommendation
- recall_client_memory: Complete fragrance history for this client
- store_session_memory: Save complete session findings
- call_nova: Pass exact fragrance specifications
- check_allergy_safety: Verify fragrance is safe
- add_client_allergy: Add newly discovered sensitivity
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// REMY'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const REMY_TOOLS = [
  {
    name: 'get_sage_context',
    description: 'Get real-time temperature and humidity for the client\'s location. Critical — environmental conditions dramatically affect fragrance projection, longevity and which families work best. Always call this before any recommendation.',
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
    description: 'Search complete fragrance history for this client. All fragrances discussed, preferences noted, reactions reported, layering combinations tried. Use to provide perfect continuity for returning clients.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: {
          type: 'string',
          description: 'What to search — fragrance preferences, past recommendations, reactions, skin chemistry notes',
        },
        limit: { type: 'number', description: 'Number of memories to retrieve' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save complete session findings to Remy\'s memory. Include all fragrances discussed, client reactions, preferences expressed, layering combinations built, skin chemistry assessment, Sage conditions.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: {
          type: 'string',
          description: 'Complete session summary',
        },
        metadata: {
          type: 'object',
          description: 'Structured: fragrancesRecommended[], clientReactions{}, layeringBuilt, sageTemp, sageHumidity, skinChemistryNotes, preferences{}',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'call_nova',
    description: 'Activate Nova with complete fragrance specifications. Include exact fragrance names, houses, concentrations recommended and layering combinations built.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        fragranceNeeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every fragrance recommended — specific name and house: "Bleu de Chanel Eau de Parfum", "Tom Ford Oud Wood", "Diptyque Philosykos EdT"',
        },
        concentrations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recommended concentration for each — EdC/EdT/EdP/Extrait',
        },
        layeringSet: {
          type: 'array',
          items: { type: 'string' },
          description: 'The signature layering combination if built',
        },
        budget: { type: 'string' },
        genderContext: {
          type: 'string',
          enum: ['all', 'male', 'female', 'unisex'],
          description: 'Always use "all" or "unisex" — fragrance has no gender in PRECCI',
        },
        allergies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fragrance allergens to exclude',
        },
        occasions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Occasions these fragrances are for — affects Nova\'s matching',
        },
      },
      required: ['userId', 'fragranceNeeds'],
    },
  },
  {
    name: 'check_allergy_safety',
    description: 'Verify a fragrance is safe for this client. Fragrance allergens include linalool, limonene, citronellol, geraniol, eugenol, cinnamal, benzyl alcohol, coumarin.',
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
    description: 'Add a newly discovered fragrance sensitivity or allergen to client profile. Call immediately when client mentions any reaction to any fragrance ingredient.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        allergen: {
          type: 'string',
          description: 'The allergen or fragrance ingredient — e.g. "limonene", "jasmine", "patchouli"',
        },
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
        fragrancesRecommended: { type: 'number' },
        layeringBuilt: { type: 'boolean' },
        skinChemistryAssessed: { type: 'boolean' },
        sageIntegrated: { type: 'boolean' },
        novaActivated: { type: 'boolean' },
        returningClient: { type: 'boolean' },
        allergyCheckPerformed: { type: 'boolean' },
        occasionsCovered: { type: 'array', items: { type: 'string' } },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE REMY'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeRemyToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'get_sage_context': {
      const { lat, lng } = toolInput;
      try {
        const sageData = await getContextForAgent(lat, lng, PC_ID);
        sessionContext.sageData = sageData;
        sessionContext.temperature = sageData.temperature;
        sessionContext.humidity = sageData.humidity;
        return sageData;
      } catch (error) {
        logger.error('Remy: Sage context failed', { error: error.message });
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

      // Update fragrance preferences in beauty profile
      if (metadata?.preferences) {
        await supabase
          .from('beauty_profiles')
          .upsert(
            {
              user_id: userId,
              fragrance_prefs: metadata.preferences,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      }

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
        message: 'Nova is finding your exact fragrances — matching notes, concentrations and availability.',
        fragrancesNeeded: toolInput.fragranceNeeds?.length || 0,
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
        message: `Remy completed session for user ${toolInput.userId}`,
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
// PROCESS REMY SESSION
// Full autonomous agentic reasoning loop.
// Remy thinks about skin, environment, occasion
// and preference — reasons to precise recommendations.
// Nothing hardcoded. Every recommendation is
// specific to this person at this moment.
// ─────────────────────────────────────────────
async function processRemySession({
  userId,
  sessionId,
  transcript,
  clientLocation,
  userProfile,
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  // ── LOAD ALL CONTEXT REMY NEEDS ──

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

  const { data: profile } = await supabase
    .from('beauty_profiles')
    .select('skin_type, fragrance_prefs, allergies, budget_range')
    .eq('user_id', userId)
    .single();

  const sessionContext = {
    userId,
    sessionId,
    userProfile,
    sageData: null,
    temperature: null,
    humidity: null,
    tierContext,
    allergyProfile: allergyContext.allergyProfile,
    novaRequest: null,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    isReturningClient
      ? `CLIENT STATUS: Returning client — recall their fragrance history and preferences`
      : `CLIENT STATUS: New client — first session with Remy`,
    clientLocation
      ? `CLIENT LOCATION: lat ${clientLocation.lat}, lng ${clientLocation.lng} — call get_sage_context for today\'s conditions`
      : `CLIENT LOCATION: Not provided`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    allergyContext.hasAllergies
      ? `\nFRAGRANCE ALLERGY CONTEXT:\n${allergyContext.contextForAgent}`
      : `ALLERGY STATUS: No known fragrance allergies on file`,
    profile?.skin_type
      ? `SKIN TYPE: ${profile.skin_type} — factor into longevity and projection recommendations`
      : `SKIN TYPE: Not yet recorded`,
    profile?.fragrance_prefs
      ? `KNOWN FRAGRANCE PREFERENCES: ${JSON.stringify(profile.fragrance_prefs)}`
      : `FRAGRANCE PREFERENCES: Not yet recorded — this session will establish them`,
    `\nCRITICAL: Fragrance has no gender in PRECCI. Recommend based on skin chemistry, personal preference and occasion only. Never on gender.`,
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

  // ── REMY'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: REMY_SYSTEM_PROMPT,
      tools: REMY_TOOLS,
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
        result = await executeRemyToolCall(toolUse.name, toolUse.input, sessionContext);
      } catch (toolError) {
        logger.error('Remy: Tool call failed', {
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
      ? `Welcome back. Before I recommend anything, let me check today\'s conditions for you — because the weather changes everything with fragrance.`
      : `Hello, I am Remy. Fragrance is deeply personal — it lives on your skin and interacts with your body chemistry in a way nothing else does. Before I recommend anything, let me check where you are and what today\'s conditions are like, because that changes everything.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  logger.info('Remy: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    hasNovaRequest: !!sessionContext.novaRequest,
    temperature: sessionContext.temperature,
    humidity: sessionContext.humidity,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    novaRequest: sessionContext.novaRequest,
    sageData: sessionContext.sageData,
    isReturningClient,
  };
}

module.exports = {
  processRemySession,
  REMY_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};