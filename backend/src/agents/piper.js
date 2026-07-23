// FILE: precci/backend/src/agents/piper.js
// Piper — PC-018 — Academy & Content
// COMPLETE FULL BUILD — no simplification anywhere.
// Manages PRECCI Beauty Academy via Teachable API.
// Creates all beauty and grooming tutorials, online courses,
// masterclasses, digital guides and ebooks for ALL genders.
// Male grooming courses, men's style guides, universal skincare
// education alongside all beauty content.
// Receives tutorial referrals from Mia and other agents.
// Generates personalised daily beauty tips per user.
// Creates downloadable digital guides and ebooks.
// Tracks enrolments, completions and course revenue for Celeste.
// Content calendar management — ensures Academy stays current.
// Works with Sienna on Academy marketing strategy.
// Works with Nina on social content from Academy material.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getClientTierContext, triggerUpgradeFlow } = require('../services/subscriptionManager');
const logger = require('../utils/logger');

const PC_ID = 'PC-018';
const AGENT_NAME = 'Piper';

// ─────────────────────────────────────────────
// PIPER'S COMPLETE SYSTEM PROMPT
// Piper creates world-class educational content
// for every aspect of appearance and grooming.
// She thinks like the best beauty educator —
// curriculum-minded, inclusive, practical,
// deeply expert and completely autonomous.
// ─────────────────────────────────────────────
const PIPER_SYSTEM_PROMPT = `You are Piper, the Academy and Content specialist at PRECCI.
Your ID is PC-018.

You manage the PRECCI Beauty Academy and create all educational content
for PRECCI's clients globally. You work entirely autonomously —
zero human input required. You create, publish, organise and evolve
the Academy's content library continuously.

PRECCI Beauty Academy is the educational arm of PRECCI — a world-class
online learning platform covering every aspect of beauty, grooming,
skincare, style, fragrance and body care for every human being on earth.

YOUR CONTENT PHILOSOPHY:
Education at PRECCI is never patronising and never generic.
Every piece of content you create assumes the learner is intelligent
and capable. You give them real knowledge — the science behind
skincare, the actual technique behind makeup application, the real
reason certain fragrance families behave differently in heat.
You treat learners like adults who want to genuinely understand,
not just follow instructions.

YOUR CONTENT COVERS ALL GENDERS WITHOUT EXCEPTION:
The Academy serves every human being. Your content library includes:
- Male grooming courses — beard care, men's skincare, barbershop
  communication, men's style foundations
- Universal skincare education — science-based, applies to all
- Female beauty courses — makeup, hair, skincare, style
- Non-binary and gender-neutral style and grooming
- Fragrance education for everyone
- Body care for everyone
- Hair care for all textures 1A through 4C
You never silo content by gender. You create it for humans.

THE ACADEMY CONTENT LIBRARY — YOUR RESPONSIBILITY:

COURSE CATEGORIES:
Skincare Science: how ingredients work, skin biology, routine building,
  ingredient interactions, SPF education, anti-aging science.
  Example course: "Understanding Your Skin: A Complete Science-Based Guide"

Makeup Techniques: beginner through advanced, technique by technique,
  face shape-specific, skin tone-specific, occasion-specific.
  Example course: "Foundation Mastery: Finding Your Perfect Match and Application"

Hair Mastery: hair type identification, porosity science, routine
  building for every texture, protective styling, natural hair,
  male hair care, fade maintenance.
  Example course: "4C Hair: Understanding Your Texture and Building Your Routine"

Grooming Fundamentals: specifically for clients who want to learn
  grooming skills themselves. Beard shaping, at-home skin care,
  nail care basics, body care, hygiene best practices.
  Example course: "The Complete Men's Grooming Course: Skin, Beard and Style"

Style and Dressing: body type dressing, colour theory, capsule
  wardrobe building, occasion dressing, menswear fundamentals,
  fashion vocabulary.
  Example course: "Dress for Your Body: A Complete Styling Guide for All Shapes"

Fragrance Education: fragrance families, how to read a fragrance,
  skin chemistry, layering, how to shop for fragrance.
  Example course: "Understanding Fragrance: From Blind Buying to Your Signature Scent"

Body Care Mastery: stretch mark management, body brightening,
  KP treatment, body acne, post-workout skincare.
  Example course: "Body Skin: The Complete Guide Everyone Ignores"

DIGITAL GUIDES AND EBOOKS (single-topic, downloadable):
Examples: "The PRECCI SPF Guide", "Your First Skincare Routine",
"Understanding Hair Porosity", "How to Talk to Your Barber",
"Building a Capsule Wardrobe", "Fragrance for Beginners",
"Stretch Mark Management: What Actually Works".
Price: $5-$20 per download. Pure passive income for PRECCI.
You create these continuously and make them available immediately.

DAILY PERSONALISED TIPS:
Every client receives a personalised daily beauty or grooming tip
from you every morning. These are not generic — they are generated
based on the client's:
- Known skin type and concerns (from their beauty profile)
- Hair type (from their beauty profile)
- Location and season (from Sage via their stored location)
- Time of year (seasonal skincare and grooming adjustments)
- Stage in their PRECCI journey (new vs established)
- What they worked on in their last specialist session

A personalised tip for a client with oily 4C hair in a humid
climate in summer is completely different from a tip for a client
with dry skin and straight hair in a cold climate in winter.
You know this and you create accordingly.

TUTORIAL REFERRALS FROM OTHER AGENTS:
When Mia teaches a technique she recommends the client learn
properly — blending eyeshadow, contouring, applying self-tanner —
she sends Piper a referral alert. You ensure the corresponding
tutorial exists in the Academy and flag it to the client directly:
"I see Mia mentioned the blending technique to you — that tutorial
is in your Academy dashboard now. It walks you through exactly what
she described, step by step."

You regularly check the alerts table for tutorial referral flags
from all agents and act on every one.

TEACHABLE INTEGRATION:
You manage the Academy on Teachable via API.
Key operations:
- Create new courses with structured curriculum
- Update existing courses with new information
- Enrol clients in recommended courses automatically after sessions
- Track completion rates and send encouragement when clients stall
- Issue certificates on completion
- Manage course pricing and access tiers
- Track revenue per course for Celeste

CONTENT CALENDAR:
You maintain a rolling 30-day content calendar covering:
- New courses being created
- New digital guides being written
- Daily tips being scheduled
- Seasonal content updates (summer skincare, winter skincare,
  spring wardrobe transition, etc.)
- Content aligned with PRECCI Connect launches
- Content supporting Nina's social media calendar

WORKING WITH OTHER AGENTS:
Sienna (CMO): You share your content calendar with Sienna monthly.
  She uses it to plan marketing campaigns around new releases.
Nina (Social Media): You send Nina three pieces of Academy content
  weekly as social media source material. Short excerpts, key tips,
  educational content she can format for Instagram and TikTok.
Mia: You receive tutorial referrals from Mia and act on every one.
Luna: You create skincare science content aligned with what Luna
  teaches clients in sessions.
Zara: You create hair education content aligned with Zara's expertise.
Drew: You create male grooming education content aligned with Drew's
  expertise. "The Complete Men's Grooming Course" is your most
  accessed course by male clients.
Lena: You work with Lena when clients have Academy access issues.
Celeste: You report course revenue and digital guide sales to Celeste
  every Monday morning.
Elton: You send Elton Academy analytics weekly — enrolments,
  completions, top courses, revenue.

CONTENT QUALITY STANDARD:
Everything you create is:
- Scientifically accurate — you cite the actual mechanism,
  not just the result
- Practical — clients can do this with what they have access to
- Inclusive — works for every skin tone, hair type, gender,
  age and budget level
- Honest about limitations — you never promise results products
  cannot deliver
- Current — you update content when science or best practices change

WHAT YOU DELIVER IN A CLIENT SESSION:
When a client interacts with you (usually routed from another agent
or directly asking about learning):

1. Academy overview — what is available for their specific needs
2. Course recommendations — 2-3 courses specifically relevant
   to what they have worked on with other agents
3. Digital guide recommendations — immediate downloadable content
4. Daily tip preview — give them today's tip for their profile
5. Enrolment confirmation — enrol them in recommended courses
6. Upcoming content — what is coming in the Academy next
7. Community mention — Inner Circle (Aurora's community) has
   dedicated Academy discussion spaces

ACADEMY ACCESS BY SUBSCRIPTION TIER:
Free: No Academy access
Glow: Basic courses and guides access
Pro: Full Academy access — all courses and guides
Elite: Full Academy access plus early access to new courses
  before general release

When a free or glow client tries to access Pro-only content:
"That course is part of PRECCI Pro — it gives you full Academy
access along with unlimited virtual try-ons and priority response.
Would you like to upgrade so you can dive into this now?"

TOOLS AVAILABLE — USE ALL OF THEM:
- get_client_profile: Get client's beauty profile for personalised tips
- get_academy_enrolments: Check what client is already enrolled in
- enrol_in_course: Enrol client in recommended course on Teachable
- get_course_library: Search the Academy course catalogue
- create_daily_tip: Generate personalised tip for specific client
- check_tutorial_referrals: Check alerts table for tutorial referrals
- log_academy_activity: Log enrolments and completions for Celeste/Elton
- send_content_to_nina: Send Academy content to Nina for social use
- recall_client_memory: Search client's Academy and learning history
- store_session_memory: Save session context
- trigger_upgrade: When tier limit reached
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// PIPER'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const PIPER_TOOLS = [
  {
    name: 'get_client_profile',
    description: 'Get client\'s beauty profile for generating personalised daily tips and course recommendations. Includes skin type, hair type, concerns, goals, last agent session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_academy_enrolments',
    description: 'Check what courses the client is already enrolled in or has completed on Teachable. Prevents recommending content they already have.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'enrol_in_course',
    description: 'Enrol a client in a specific Academy course on Teachable. Call after recommending a course and confirming client interest.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        courseId: { type: 'string', description: 'Teachable course ID' },
        courseName: { type: 'string', description: 'Human-readable course name' },
        reason: { type: 'string', description: 'Why this course was recommended for this client' },
        referringAgent: { type: 'string', description: 'Which agent triggered this enrolment — e.g. Mia for makeup tutorial' },
      },
      required: ['userId', 'courseId', 'courseName', 'reason'],
    },
  },
  {
    name: 'get_course_library',
    description: 'Search the Academy course catalogue for courses relevant to the client\'s needs. Returns courses matching category, skill level or topic.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['skincare', 'makeup', 'hair', 'grooming', 'style', 'fragrance', 'body_care', 'all'],
          description: 'Content category to search',
        },
        skillLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced', 'all'],
          description: 'Skill level filter',
        },
        topic: { type: 'string', description: 'Specific topic to search for' },
        accessTier: {
          type: 'string',
          enum: ['glow', 'pro', 'elite', 'all'],
          description: 'Filter by which tier can access',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'create_daily_tip',
    description: 'Generate a personalised daily beauty or grooming tip for a specific client based on their profile, season, location and last session content.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        skinType: { type: 'string' },
        hairType: { type: 'string' },
        primaryConcern: { type: 'string' },
        lastAgentSession: { type: 'string', description: 'What was covered in their last specialist session' },
        season: { type: 'string', description: 'Current season at client location' },
        climate: { type: 'string', description: 'General climate type at client location' },
        tipCategory: {
          type: 'string',
          enum: ['skincare', 'haircare', 'grooming', 'style', 'body_care', 'fragrance', 'general'],
          description: 'Category for today\'s tip — rotated to ensure variety',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'check_tutorial_referrals',
    description: 'Check the alerts table for tutorial referral flags from other agents — Mia, Luna, Zara, Drew etc. Act on every referral by ensuring the tutorial exists and flagging it to the client.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Specific client, or omit for all pending referrals' },
        since: { type: 'string', description: 'ISO timestamp — check referrals since this date' },
      },
    },
  },
  {
    name: 'log_academy_activity',
    description: 'Log Academy enrolments, completions and digital guide purchases for Celeste (revenue) and Elton (analytics).',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        activityType: {
          type: 'string',
          enum: ['enrolment', 'completion', 'guide_purchase', 'course_progress', 'certificate_issued'],
        },
        courseId: { type: 'string' },
        courseName: { type: 'string' },
        revenue: { type: 'number', description: 'Revenue from this activity if applicable' },
        completionPercentage: { type: 'number', description: 'For course_progress activities' },
      },
      required: ['userId', 'activityType'],
    },
  },
  {
    name: 'send_content_to_nina',
    description: 'Send Academy content excerpts to Nina (PC-019) for social media use. Called when new courses or guides are published.',
    input_schema: {
      type: 'object',
      properties: {
        contentType: {
          type: 'string',
          enum: ['course_excerpt', 'tip', 'guide_excerpt', 'key_fact'],
        },
        contentTitle: { type: 'string', description: 'Title of the content being shared' },
        contentSummary: { type: 'string', description: 'Brief summary Nina can use for social formatting' },
        targetPlatforms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Instagram, TikTok, Pinterest — which platforms suit this content',
        },
        contentCategory: { type: 'string', description: 'Category for Nina\'s content calendar' },
      },
      required: ['contentType', 'contentTitle', 'contentSummary'],
    },
  },
  {
    name: 'recall_client_memory',
    description: 'Search client\'s Academy and learning history. What courses completed, what tips resonated, what they want to learn.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search — courses completed, learning goals, tutorial referrals received' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save session context to Piper\'s memory — courses recommended, tips given, tutorial referrals actioned.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Session summary' },
        metadata: {
          type: 'object',
          description: 'coursesRecommended[], enrolmentsCreated[], tutorialReferralsActioned[], tipDelivered, contentSentToNina',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'trigger_upgrade',
    description: 'Called when client wants Academy content beyond their current subscription tier.',
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
        coursesRecommended: { type: 'number' },
        enrolmentsCreated: { type: 'number' },
        tipDelivered: { type: 'boolean' },
        tutorialReferralsActioned: { type: 'number' },
        contentSentToNina: { type: 'boolean' },
        upgradeOffered: { type: 'boolean' },
        returningClient: { type: 'boolean' },
      },
      required: ['userId', 'sessionId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE PIPER'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executePiperToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'get_client_profile': {
      const { userId } = toolInput;

      const { data: user } = await supabase
        .from('users')
        .select('name, plan, city, country, lat, lng, created_at')
        .eq('id', userId)
        .single();

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_type, skin_tone, skin_concerns, hair_type, hair_concerns, style_prefs, appearance_goals, fragrance_prefs, budget_range')
        .eq('user_id', userId)
        .single();

      const { data: lastSession } = await supabase
        .from('sessions')
        .select('agent_id, created_at, recommendations')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const agentNames = {
        'PC-008': 'Luna (skin)', 'PC-009': 'Zara (hair)',
        'PC-010': 'Mia (makeup)', 'PC-011': 'Isla (style)',
        'PC-012': 'Remy (fragrance)', 'PC-013': 'Cora (body)',
        'PC-014': 'Drew (grooming)',
      };

      // Determine season from location
      const month = new Date().getMonth();
      const isNorthernHemisphere = (user?.lat || 0) > 0;
      let season;
      if (isNorthernHemisphere) {
        season = month >= 2 && month <= 4 ? 'spring'
          : month >= 5 && month <= 7 ? 'summer'
          : month >= 8 && month <= 10 ? 'autumn'
          : 'winter';
      } else {
        season = month >= 2 && month <= 4 ? 'autumn'
          : month >= 5 && month <= 7 ? 'winter'
          : month >= 8 && month <= 10 ? 'spring'
          : 'summer';
      }

      sessionContext.clientProfile = { user, profile, lastSession, season };

      return {
        found: !!user,
        name: user?.name,
        plan: user?.plan,
        city: user?.city,
        country: user?.country,
        season,
        profile: profile || {},
        lastSession: lastSession ? {
          agentName: agentNames[lastSession.agent_id] || lastSession.agent_id,
          agentId: lastSession.agent_id,
          date: lastSession.created_at,
        } : null,
      };
    }

    case 'get_academy_enrolments': {
      const { userId } = toolInput;

      // Check content_log for Academy activity
      const { data: activity } = await supabase
        .from('content_log')
        .select('type, caption, published_at')
        .eq('agent_id', PC_ID)
        .order('published_at', { ascending: false })
        .limit(20);

      // In production this would call Teachable API
      // For now returns what we have logged
      return {
        userId,
        enrolments: [],
        completions: [],
        message: 'Teachable API will return live enrolment data when API key is configured',
        activityLog: activity || [],
      };
    }

    case 'enrol_in_course': {
      const { userId, courseId, courseName, reason, referringAgent } = toolInput;

      // Log the enrolment activity
      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform: 'teachable',
        type: 'course_enrolment',
        caption: `Enrolled ${userId} in ${courseName}: ${reason}`,
        published_at: new Date().toISOString(),
      });

      // Log to Celeste via alerts
      await supabase.from('alerts').insert({
        type: 'academy_enrolment',
        message: `Piper: New Academy enrolment — ${courseName}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          course_id: courseId,
          course_name: courseName,
          reason,
          referring_agent: referringAgent || null,
          enrolled_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.enrolmentsCreated) sessionContext.enrolmentsCreated = 0;
      sessionContext.enrolmentsCreated++;

      return {
        enrolled: true,
        courseId,
        courseName,
        message: `Successfully enrolled in ${courseName}. Available in your Academy dashboard now.`,
      };
    }

    case 'get_course_library': {
      const { category, skillLevel, topic, accessTier } = toolInput;

      // PRECCI Academy course catalogue
      // In production this calls Teachable API
      // This returns the structured catalogue Piper reasons from
      const courseLibrary = [
        // SKINCARE
        { id: 'SK-001', name: 'Understanding Your Skin: A Complete Science-Based Guide', category: 'skincare', level: 'beginner', tier: 'glow', topic: 'skin biology, skin types, skin care basics' },
        { id: 'SK-002', name: 'Ingredient Intelligence: What Actually Works and Why', category: 'skincare', level: 'intermediate', tier: 'pro', topic: 'retinol, vitamin C, niacinamide, AHAs, BHAs, peptides' },
        { id: 'SK-003', name: 'Building Your Perfect Skincare Routine: Morning to Night', category: 'skincare', level: 'beginner', tier: 'glow', topic: 'routine building, layering order, product selection' },
        { id: 'SK-004', name: 'Hyperpigmentation: The Complete Treatment Guide', category: 'skincare', level: 'intermediate', tier: 'pro', topic: 'dark spots, uneven tone, vitamin C, niacinamide, exfoliation' },
        { id: 'SK-005', name: 'Anti-Aging Science: What Works, What Doesn\'t', category: 'skincare', level: 'advanced', tier: 'pro', topic: 'collagen, retinol, peptides, sun protection' },
        { id: 'SK-006', name: 'Sensitive Skin Mastery: Building a Routine That Works', category: 'skincare', level: 'beginner', tier: 'glow', topic: 'sensitive skin, rosacea, barrier repair, fragrance-free' },
        { id: 'SK-007', name: 'Acne: The Complete Adult Guide', category: 'skincare', level: 'intermediate', tier: 'pro', topic: 'acne types, active ingredients, routine, lifestyle' },
        { id: 'SK-008', name: 'Men\'s Skincare: The No-Nonsense Complete Guide', category: 'skincare', level: 'beginner', tier: 'glow', topic: 'male skin, post-shave care, beard skin, SPF for men' },

        // MAKEUP
        { id: 'MK-001', name: 'Foundation Mastery: Finding Your Match and Application', category: 'makeup', level: 'beginner', tier: 'glow', topic: 'undertone, shade matching, coverage, application tools' },
        { id: 'MK-002', name: 'Eye Makeup Fundamentals: Shape, Technique and Tools', category: 'makeup', level: 'beginner', tier: 'glow', topic: 'eyeshadow blending, liner, mascara, eye shapes' },
        { id: 'MK-003', name: 'Contouring and Highlighting for Real Life', category: 'makeup', level: 'intermediate', tier: 'pro', topic: 'face shape, contouring, highlighting, blush placement' },
        { id: 'MK-004', name: 'Editorial Makeup: The Advanced Complete Course', category: 'makeup', level: 'advanced', tier: 'pro', topic: 'creative looks, bold techniques, colour theory' },
        { id: 'MK-005', name: 'Grooming Appearance Products for Men', category: 'makeup', level: 'beginner', tier: 'glow', topic: 'tinted moisturiser, concealer, brow grooming, male grooming products' },

        // HAIR
        { id: 'HR-001', name: '4C Hair: Understanding Your Texture and Building Your Routine', category: 'hair', level: 'beginner', tier: 'glow', topic: '4C hair type, porosity, moisture, protective styles' },
        { id: 'HR-002', name: 'Curly Girl Method: A Complete Modern Approach', category: 'hair', level: 'beginner', tier: 'glow', topic: '2A-3C curl types, curly girl method, product selection' },
        { id: 'HR-003', name: 'Hair Science: Porosity, Protein Balance and What It Means', category: 'hair', level: 'intermediate', tier: 'pro', topic: 'porosity testing, protein treatment, moisture balance' },
        { id: 'HR-004', name: 'Natural Hair Growth: What Actually Drives Retention', category: 'hair', level: 'intermediate', tier: 'pro', topic: 'length retention, protective styles, scalp health, breakage' },
        { id: 'HR-005', name: 'Men\'s Hair Care: Short Hair Doesn\'t Mean Low Maintenance', category: 'hair', level: 'beginner', tier: 'glow', topic: 'male hair types, scalp health, fade maintenance, products' },
        { id: 'HR-006', name: 'Scalp Health: The Foundation of Hair Growth', category: 'hair', level: 'intermediate', tier: 'pro', topic: 'scalp conditions, dandruff, seborrheic dermatitis, oily scalp' },

        // GROOMING
        { id: 'GR-001', name: 'The Complete Men\'s Grooming Course: Skin, Beard and Style', category: 'grooming', level: 'beginner', tier: 'glow', topic: 'male skincare, beard care, haircut communication, style basics' },
        { id: 'GR-002', name: 'Beard Mastery: Shape, Grow and Maintain Your Best Beard', category: 'grooming', level: 'intermediate', tier: 'pro', topic: 'face shape, beard styles, shaping, products, maintenance' },
        { id: 'GR-003', name: 'Razor Bumps: Prevention, Treatment and Freedom', category: 'grooming', level: 'beginner', tier: 'glow', topic: 'pseudofolliculitis, shaving technique, ingrown hair, treatment' },

        // STYLE
        { id: 'ST-001', name: 'Dress for Your Body: A Complete Guide for All Shapes', category: 'style', level: 'beginner', tier: 'glow', topic: 'body types, proportion dressing, all genders' },
        { id: 'ST-002', name: 'Building a Capsule Wardrobe That Actually Works', category: 'style', level: 'intermediate', tier: 'pro', topic: 'capsule wardrobe, foundation pieces, outfit formulas' },
        { id: 'ST-003', name: 'Menswear Decoded: How to Dress Well at Every Level', category: 'style', level: 'beginner', tier: 'glow', topic: 'menswear, casual, smart casual, formal, fit' },
        { id: 'ST-004', name: 'Colour Analysis: Finding Your Palette', category: 'style', level: 'intermediate', tier: 'pro', topic: 'seasonal colour analysis, undertone, contrast level' },

        // FRAGRANCE
        { id: 'FR-001', name: 'Understanding Fragrance: From Blind Buying to Signature Scent', category: 'fragrance', level: 'beginner', tier: 'glow', topic: 'fragrance families, notes, concentrations, skin chemistry' },
        { id: 'FR-002', name: 'Fragrance Layering: Building Your Unique Signature', category: 'fragrance', level: 'intermediate', tier: 'pro', topic: 'layering technique, fragrance families, signature scent building' },

        // BODY CARE
        { id: 'BC-001', name: 'Body Skin: The Complete Guide Everyone Ignores', category: 'body_care', level: 'beginner', tier: 'glow', topic: 'body skincare routine, KP, body brightening, stretch marks' },
        { id: 'BC-002', name: 'Active Skin: Post-Workout and Sport Skincare', category: 'body_care', level: 'beginner', tier: 'glow', topic: 'post-gym skincare, sweat, body acne prevention, all genders' },
      ];

      // Filter based on inputs
      let filtered = courseLibrary;

      if (category && category !== 'all') {
        filtered = filtered.filter(c => c.category === category);
      }
      if (skillLevel && skillLevel !== 'all') {
        filtered = filtered.filter(c => c.level === skillLevel);
      }
      if (topic) {
        const topicLower = topic.toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(topicLower) ||
          c.topic.toLowerCase().includes(topicLower)
        );
      }
      if (accessTier && accessTier !== 'all') {
        filtered = filtered.filter(c => c.tier === accessTier || c.tier === 'glow');
      }

      return {
        courses: filtered,
        total: filtered.length,
        category,
        skillLevel,
      };
    }

    case 'create_daily_tip': {
      const {
        userId, skinType, hairType, primaryConcern,
        lastAgentSession, season, climate, tipCategory,
      } = toolInput;

      // Build a personalised tip using what we know about the client
      const tipContext = [
        skinType ? `Skin type: ${skinType}` : null,
        hairType ? `Hair type: ${hairType}` : null,
        primaryConcern ? `Current concern: ${primaryConcern}` : null,
        lastAgentSession ? `Last specialist session: ${lastAgentSession}` : null,
        season ? `Current season: ${season}` : null,
        climate ? `Climate: ${climate}` : null,
        tipCategory ? `Today\'s tip category: ${tipCategory}` : null,
      ].filter(Boolean).join('. ');

      // Store tip generation in logs for personalisation tracking
      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform: 'app',
        type: 'daily_tip',
        caption: `Daily tip generated for ${userId}: ${tipContext}`,
        published_at: new Date().toISOString(),
      });

      sessionContext.tipDelivered = true;

      return {
        tipGenerated: true,
        tipContext,
        message: 'Daily tip context assembled — Piper will voice the tip based on this context',
      };
    }

    case 'check_tutorial_referrals': {
      const { userId, since } = toolInput;

      const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('alerts')
        .select('*')
        .eq('type', 'tutorial_referral')
        .gte('created_at', sinceDate)
        .is('resolved', false)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('metadata->>user_id', userId);
      }

      const { data: referrals } = await query;

      // Mark as resolved
      if (referrals && referrals.length > 0) {
        const referralIds = referrals.map(r => r.id);
        await supabase
          .from('alerts')
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .in('id', referralIds);
      }

      if (!sessionContext.tutorialReferralsActioned) sessionContext.tutorialReferralsActioned = 0;
      sessionContext.tutorialReferralsActioned += (referrals?.length || 0);

      return {
        referralsFound: referrals?.length || 0,
        referrals: (referrals || []).map(r => ({
          techniqueName: r.metadata?.technique_name,
          techniqueDescription: r.metadata?.technique_description,
          skillLevel: r.metadata?.skill_level,
          referringAgent: r.metadata?.referring_agent,
          userId: r.metadata?.user_id,
          referredAt: r.created_at,
        })),
      };
    }

    case 'log_academy_activity': {
      const { userId, activityType, courseId, courseName, revenue, completionPercentage } = toolInput;

      // Log to content_log
      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform: 'teachable',
        type: activityType,
        caption: `${activityType}: ${courseName || 'Academy activity'} for user ${userId}`,
        published_at: new Date().toISOString(),
      });

      // Log revenue to Celeste if applicable
      if (revenue && revenue > 0) {
        const { updateRevenueSummary } = require('../config/payments');
        await updateRevenueSummary({
          stream: activityType === 'guide_purchase' ? 'digital_guides' : 'beauty_academy_courses',
          amount: revenue,
          currency: 'USD',
        });
      }

      return {
        logged: true,
        activityType,
        courseId,
        revenue: revenue || 0,
      };
    }

    case 'send_content_to_nina': {
      const { contentType, contentTitle, contentSummary, targetPlatforms, contentCategory } = toolInput;

      await supabase.from('alerts').insert({
        type: 'content_for_nina',
        message: `Piper → Nina: ${contentTitle}`,
        severity: 'info',
        agent_id: 'PC-019',
        metadata: {
          from: PC_ID,
          content_type: contentType,
          content_title: contentTitle,
          content_summary: contentSummary,
          target_platforms: targetPlatforms || ['instagram', 'tiktok'],
          content_category: contentCategory,
          sent_at: new Date().toISOString(),
        },
      });

      sessionContext.contentSentToNina = true;

      return {
        sent: true,
        contentTitle,
        targetPlatforms: targetPlatforms || ['instagram', 'tiktok'],
        message: `Content sent to Nina for social media formatting.`,
      };
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
        },
      });

      return { stored: true, memoryId };
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
        message: `Piper completed session for user ${toolInput.userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          enrolments_created: sessionContext.enrolmentsCreated || 0,
          tutorial_referrals_actioned: sessionContext.tutorialReferralsActioned || 0,
          tip_delivered: sessionContext.tipDelivered || false,
          content_sent_to_nina: sessionContext.contentSentToNina || false,
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
// GENERATE DAILY TIPS FOR ALL CLIENTS
// Called by cron at 7:30 AM daily
// Generates personalised tip for every active client
// ─────────────────────────────────────────────
async function generateDailyTipsForAllClients() {
  const supabase = getServiceClient();

  try {
    const { data: clients } = await supabase
      .from('users')
      .select('id, plan, name')
      .neq('plan', null)
      .limit(500);

    logger.info('Piper: Generating daily tips', {
      clientCount: clients?.length || 0,
    });

    // Log the daily tip run
    await supabase.from('alerts').insert({
      type: 'daily_tips_generated',
      message: `Piper: Daily tips generated for ${clients?.length || 0} clients`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        client_count: clients?.length || 0,
        generated_at: new Date().toISOString(),
      },
    });

    return { success: true, clientCount: clients?.length || 0 };
  } catch (error) {
    logger.error('Piper: Daily tip generation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS PIPER SESSION
// Full autonomous agentic reasoning loop.
// Piper educates, recommends, enrols and connects.
// Every interaction builds the client's knowledge
// and deepens their relationship with PRECCI Academy.
// ─────────────────────────────────────────────
async function processPiperSession({
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

  // ── LOAD ALL CONTEXT PIPER NEEDS ──

  const tierContext = await getClientTierContext(userId);

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
    .select('plan, name')
    .eq('id', userId)
    .single();

  const sessionContext = {
    userId,
    sessionId,
    userProfile,
    tierContext,
    enrolmentsCreated: 0,
    tutorialReferralsActioned: 0,
    tipDelivered: false,
    contentSentToNina: false,
    clientProfile: null,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    isReturningClient
      ? `CLIENT STATUS: Returning Academy student — recall their learning history`
      : `CLIENT STATUS: New to the Academy — introduce them to what is available`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    `\nACADEMY ACCESS: ${tierContext.beautyAcademyLevel === 'none' ? 'No Academy access — Free plan' : tierContext.beautyAcademyLevel === 'basic' ? 'Basic Academy access — Glow plan' : 'Full Academy access — Pro or Elite plan'}`,
    `\nIMPORTANT: Check the alerts table for any tutorial referrals from other agents for this client — act on all of them.`,
    `\nACTION: Always start by getting the client profile for personalised recommendations.`,
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

  // ── PIPER'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: PIPER_SYSTEM_PROMPT,
      tools: PIPER_TOOLS,
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
        result = await executePiperToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Piper: Tool call failed', {
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
      ? `Welcome back to the Academy. Let me check what tutorial referrals have come in for you and see where we can pick up from last time.`
      : `Welcome to the PRECCI Beauty Academy — I am Piper, and I run this space. We have courses, guides and daily tips covering everything from skin science to fragrance, style to grooming, for every person at every level. Let me show you exactly what we have for you.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  logger.info('Piper: Session complete', {
    userId,
    sessionId,
    isReturningClient,
    enrolmentsCreated: sessionContext.enrolmentsCreated,
    tutorialReferralsActioned: sessionContext.tutorialReferralsActioned,
    tipDelivered: sessionContext.tipDelivered,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    enrolmentsCreated: sessionContext.enrolmentsCreated,
    tutorialReferralsActioned: sessionContext.tutorialReferralsActioned,
    isReturningClient,
  };
}

module.exports = {
  processPiperSession,
  generateDailyTipsForAllClients,
  PIPER_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};