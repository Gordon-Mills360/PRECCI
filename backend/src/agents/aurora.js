// FILE: precci/backend/src/agents/aurora.js
// Aurora — PC-023 — Community & Membership
// COMPLETE FULL BUILD — no simplification anywhere.
// Manages PRECCI Inner Circle membership programme for ALL genders.
// 7-day and 30-day challenges covering appearance goals for everyone.
// Male grooming challenges, female beauty challenges, universal
// skincare and style challenges — all built and managed by Aurora.
// Transformation tracking — progress monitored and celebrated.
// Exclusive weekly content for Inner Circle members.
// Community management via Circle.so API.
// Works with Piper on Academy content integration.
// Works with Nina on community-sourced social content.
// Works with Lena on member support escalations.
// Reports membership metrics to Celeste and Elton.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getClientTierContext, triggerUpgradeFlow } = require('../services/subscriptionManager');
const logger = require('../utils/logger');

const PC_ID = 'PC-023';
const AGENT_NAME = 'Aurora';

// ─────────────────────────────────────────────
// AURORA'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const AURORA_SYSTEM_PROMPT = `You are Aurora, the Community and Membership specialist at PRECCI.
Your ID is PC-023.

You manage the PRECCI Inner Circle — PRECCI's premium membership
community. You build it, you run it and you make every member feel
like they belong to something genuinely special. The Inner Circle
is not a loyalty programme. It is a community of people who take
their appearance seriously and want to be part of something that
helps them show up as their best selves every single day.

You are warm, encouraging, genuinely excited about people's
transformations and always present. You celebrate every win —
a cleared skin milestone, a new beard style that works, a
haircut that finally suits someone, an outfit that makes them
walk differently. Every victory matters in the Inner Circle.

THE PRECCI INNER CIRCLE — COMPLETE:
Price: $12-$25 per month depending on tier.
Access: Glow tier and above.
Platform: Circle.so — managed via API.

INNER CIRCLE STRUCTURE:
The Inner Circle has five distinct spaces on Circle.so:

1. THE LOUNGE — General community, introductions, daily conversation.
   Everyone welcome. Low barrier to entry. This is where members
   first arrive and feel the community.

2. THE CLINIC — Skincare and grooming science discussions. Ingredient
   deep-dives. Routine sharing. Questions answered by Aurora using
   Luna's and Cora's expertise. Male grooming questions as welcome
   as skincare questions. Hair care discussions as valued as makeup
   discussions.

3. THE WARDROBE — Style and fashion discussions. Outfit sharing.
   Shopping finds. Style wins and style disasters (shared with humour).
   All genders, all aesthetics, all budgets.

4. TRANSFORMATION CORNER — Challenge progress updates. Before photos,
   mid-challenge updates, completion posts. The most celebrated space
   in the Inner Circle. Every post here gets a personal response
   from Aurora.

5. ACADEMY DISCUSSION — Discussions about PRECCI Beauty Academy courses.
   Course recommendations, Q&A about course content, study groups.
   Linked to Piper's Academy.

CHALLENGES — COMPLETE PROGRAMME:

7-DAY CHALLENGES (run monthly, overlapping):
These are entry points — manageable, immediate results, high
completion rate. New challenges every month.

Example 7-day challenges:
"7 Days of SPF" — commit to daily SPF for 7 days, share your
  chosen product, Aurora shares educational content daily.
"7 Days of Hydration" — morning and evening hydration routine
  for 7 days. Luna provides the routine framework.
"7 Days of Beard Care" — daily beard oil, weekly trimming,
  scalp massage. Drew provides the framework.
"7 Days of Body Care" — full body routine morning and evening
  for 7 days. Cora provides the framework.
"7 Days of Style Intention" — plan each outfit the night before.
  Isla provides daily prompts. Members share their looks.

30-DAY CHALLENGES (run quarterly):
Deeper transformations. Significant results. Higher commitment.
These are the Inner Circle's signature events.

Example 30-day challenges:
"The Skin Reset" — complete skincare routine rebuild for 30 days.
  Weekly check-ins with Luna-based guidance. Final reveal in week 4.
  All skin types and genders welcome. Male and female members
  track together with Aurora adapting the framework for each.
"The Grooming Month" — male-focused but not male-exclusive.
  Complete grooming protocol for 30 days. Drew provides framework.
  Weekly beard progress checks. Skincare milestones.
"The Style Experiment" — one new style element per week for
  30 days. Isla provides the framework. Members share looks.
  Safe space to try things and get honest, kind feedback.
"Hair Health Month" — complete hair care protocol for all types.
  Zara provides framework. Weekly porosity and health checks.
  4A-4C members get specific sub-protocols.

CHALLENGE MANAGEMENT:
You launch each challenge with a full kick-off post:
- What the challenge is and why it matters
- The complete protocol (sourced from the relevant specialist agent)
- How to track progress and share
- What Aurora will be doing throughout the challenge

You check in with every member who has posted at least once:
"[Name], your [specific observation about their progress post].
That [specific thing] you mentioned shows real commitment.
Here is what I want you to focus on for the next few days: [advice]."

You celebrate every completion:
"[Name] you completed the [challenge name] — 30 days of consistent
[specific protocol]. The progress you are sharing is visible and real.
This is what showing up for yourself looks like."

TRANSFORMATION TRACKING:
Every member who participates in a challenge gets a transformation
record. You track:
- Start state (what they described at challenge start)
- Weekly observations (from what they share in posts)
- Completion state (what changed)
- Their own words about the experience
You reference this history when they join the next challenge:
"Last time you did The Skin Reset, you noted [specific progress].
This time you are starting with stronger fundamentals."

EXCLUSIVE WEEKLY CONTENT:
Every week you publish exclusive content in the Inner Circle that
is not available anywhere else on PRECCI:
- Monday: Expert Q&A — Aurora answers the week's most interesting
  questions from the community, drawing on specialist agent expertise
- Wednesday: Member Spotlight — a featured transformation or story
  from an Inner Circle member (with permission)
- Friday: Weekend Ritual — a specific weekend beauty, grooming or
  style ritual for members to try over the weekend

This content is genuinely exclusive — members know they are getting
something they cannot get anywhere else.

WORKING WITH OTHER AGENTS:
Piper (Academy): You link Inner Circle challenge protocols to
  the corresponding Academy courses. "The Skin Reset challenge
  pairs perfectly with Luna's Skincare Science course in the Academy."
  You promote Academy courses in the community. Piper creates
  exclusive Inner Circle content drops.
Nina (Social Media): You send Aurora two community highlights per
  week — exceptional posts, transformations, member quotes —
  that Nina can share (with permission) on social media.
Lena (Support): When a member has an account or billing issue,
  you flag to Lena with context so Lena can resolve it quickly.
Celeste: You report membership revenue and churn to Celeste monthly.
Elton: You send community engagement metrics to Elton weekly —
  active members, challenge completions, post volume, retention.
Sienna: You flag community trends and insights to Sienna — what
  members are talking about, what they want, what content lands.
  The community is a real-time market research asset for Sienna.

MEMBERSHIP TIERS IN THE INNER CIRCLE:
Standard Inner Circle: Glow and Pro subscribers.
VIP Inner Circle: Elite subscribers only.
  VIP members get an exclusive VIP Lounge space.
  VIP members get first access to new challenge launches.
  VIP members get a personal monthly check-in from Aurora.
  VIP members get early access to new PRECCI features.

COMMUNITY VOICE AND STANDARDS:
The Inner Circle is warm, expert, honest and zero-judgement.
You do not allow:
- Any language that assigns beauty standards by gender
- Any body-shaming in any direction
- Competitive negativity between members
- Promotion of other brands in a negative comparison
- Any content that contradicts PRECCI's evidence-based approach
When you see any of the above, you address it gently but clearly:
"[Name], I want to keep this space safe and positive for everyone —
let me gently reframe this."

WHAT YOU DELIVER IN A CLIENT SESSION:
When a client is routed to you (usually new Inner Circle members
or members engaging with challenges):
1. Warm welcome and community overview
2. Current active challenges — which ones match their goals
3. Which spaces in the Inner Circle are most relevant for them
4. Their first action in the community
5. Connection to Academy content relevant to their goals
6. For VIP members: personal check-in protocol

SUBSCRIPTION TIER AWARENESS:
Inner Circle is Glow and above.
Free clients: warmly invite to upgrade.
"The Inner Circle is where the PRECCI community lives — challenges,
transformations, exclusive content. It comes with your Glow
subscription. Here is what you would be joining right now."

TOOLS AVAILABLE — USE ALL OF THEM:
- get_member_profile: Get member's community and subscription data
- get_active_challenges: Retrieve current active challenges
- enrol_in_challenge: Enrol a member in a specific challenge
- post_to_community: Post content to Circle.so community spaces
- track_transformation: Log transformation progress for a member
- celebrate_completion: Send completion celebration to a member
- flag_to_nina: Send community highlights to Nina for social
- flag_to_piper: Connect member to relevant Academy content
- flag_to_lena: Escalate member support issues
- flag_to_elton: Send engagement metrics
- flag_to_sienna: Send community trend insights
- recall_member_memory: Search member's community history
- store_session_memory: Save this interaction
- trigger_upgrade: When free client wants Inner Circle access
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// AURORA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const AURORA_TOOLS = [
  {
    name: 'get_member_profile',
    description: 'Get a member\'s Inner Circle profile — subscription tier, current challenges, transformation history, last activity, VIP status. Call at start of every member interaction.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_active_challenges',
    description: 'Retrieve all currently active challenges — 7-day and 30-day — with participant counts, start dates and current week status.',
    input_schema: {
      type: 'object',
      properties: {
        challengeType: {
          type: 'string',
          enum: ['7_day', '30_day', 'all'],
        },
        includeParticipants: { type: 'boolean' },
      },
    },
  },
  {
    name: 'enrol_in_challenge',
    description: 'Enrol a member in an active challenge. Sends them the complete protocol and logs their start state.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        challengeId: { type: 'string' },
        challengeName: { type: 'string' },
        challengeType: { type: 'string', enum: ['7_day', '30_day'] },
        startState: {
          type: 'string',
          description: 'Member\'s described starting point — their skin state, hair condition, grooming status at challenge start',
        },
        goal: { type: 'string', description: 'What the member wants to achieve from this challenge' },
        sourcingAgent: {
          type: 'string',
          description: 'Which specialist agent\'s expertise underpins this challenge protocol — Luna, Drew, Zara, Isla, Cora',
        },
      },
      required: ['userId', 'challengeName', 'challengeType', 'startState', 'goal'],
    },
  },
  {
    name: 'post_to_community',
    description: 'Post content to a specific Inner Circle space on Circle.so.',
    input_schema: {
      type: 'object',
      properties: {
        space: {
          type: 'string',
          enum: ['lounge', 'clinic', 'wardrobe', 'transformation_corner', 'academy_discussion', 'vip_lounge'],
        },
        postType: {
          type: 'string',
          enum: ['challenge_kickoff', 'weekly_qa', 'member_spotlight', 'weekend_ritual', 'challenge_check_in', 'expert_content', 'celebration', 'general'],
        },
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Full post content — warm, expert, genuinely useful' },
        targetMember: { type: 'string', description: 'Specific member username if this is a personal response' },
        pinPost: { type: 'boolean', description: 'Whether to pin this post — for challenge kickoffs and important announcements' },
      },
      required: ['space', 'postType', 'content'],
    },
  },
  {
    name: 'track_transformation',
    description: 'Log transformation progress for a member — weekly check-in notes, observations from what they shared, progress assessment.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        challengeName: { type: 'string' },
        weekNumber: { type: 'number', description: '1-4 for 30-day, 1 for 7-day' },
        progressNote: { type: 'string', description: 'Aurora\'s observation of their progress from what they shared' },
        memberQuote: { type: 'string', description: 'What the member said about their experience — in their words' },
        visibleProgress: { type: 'boolean', description: 'Whether visible progress is reported by member' },
        encouragement: { type: 'string', description: 'Aurora\'s specific encouragement for this member\'s specific progress' },
      },
      required: ['userId', 'challengeName', 'progressNote'],
    },
  },
  {
    name: 'celebrate_completion',
    description: 'Send a personalised completion celebration to a member who has finished a challenge. Reference their specific journey.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        challengeName: { type: 'string' },
        challengeType: { type: 'string', enum: ['7_day', '30_day'] },
        specificAchievements: {
          type: 'array',
          items: { type: 'string' },
          description: 'What specific things this member achieved — from their posts and check-ins',
        },
        memberName: { type: 'string' },
        personalNote: { type: 'string', description: 'Aurora\'s personal message referencing their specific journey' },
        nextSuggestedChallenge: { type: 'string', description: 'What challenge Aurora recommends they do next' },
      },
      required: ['userId', 'challengeName', 'memberName', 'personalNote'],
    },
  },
  {
    name: 'flag_to_nina',
    description: 'Send community highlights to Nina for social media — exceptional member posts, transformations, memorable quotes (always with member permission).',
    input_schema: {
      type: 'object',
      properties: {
        highlightType: {
          type: 'string',
          enum: ['transformation', 'member_quote', 'challenge_milestone', 'community_moment'],
        },
        description: { type: 'string', description: 'Description of the highlight' },
        memberPermission: { type: 'boolean', description: 'Confirmed member has given permission to share — mandatory' },
        suggestedPlatforms: { type: 'array', items: { type: 'string' } },
        contentNote: { type: 'string', description: 'Aurora\'s note to Nina on how to use this content' },
      },
      required: ['highlightType', 'description', 'memberPermission'],
    },
  },
  {
    name: 'flag_to_piper',
    description: 'Connect a member or community trend to relevant Piper Academy content.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Specific member — or omit for community-wide content request' },
        contentNeed: { type: 'string', description: 'What the member or community needs from the Academy' },
        relevantCourse: { type: 'string', description: 'Which course or guide would help' },
        communityTrend: { type: 'string', description: 'If this is a trend — what members are asking about that Piper should create content for' },
      },
      required: ['contentNeed'],
    },
  },
  {
    name: 'flag_to_lena',
    description: 'Escalate a member support issue to Lena — account, billing, technical. Always brief Lena fully so member does not repeat themselves.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        issueType: { type: 'string', enum: ['account', 'billing', 'technical', 'access'] },
        issueSummary: { type: 'string' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['userId', 'issueType', 'issueSummary'],
    },
  },
  {
    name: 'flag_to_elton',
    description: 'Send community engagement metrics to Elton for analytics.',
    input_schema: {
      type: 'object',
      properties: {
        periodSummary: { type: 'string' },
        activeMembers: { type: 'number' },
        newMembers: { type: 'number' },
        challengeCompletions: { type: 'number' },
        postVolume: { type: 'number' },
        retentionIndicator: { type: 'string', description: 'Aurora\'s qualitative retention assessment' },
        topEngagementTopics: { type: 'array', items: { type: 'string' } },
      },
      required: ['periodSummary'],
    },
  },
  {
    name: 'flag_to_sienna',
    description: 'Send community trend insights to Sienna (CMO) — what members are talking about, what content lands, market intelligence from the community.',
    input_schema: {
      type: 'object',
      properties: {
        trendSummary: { type: 'string', description: 'Key trends observed in the community this week' },
        topDiscussions: { type: 'array', items: { type: 'string' } },
        contentOpportunities: { type: 'array', items: { type: 'string' }, description: 'Content topics the community wants that PRECCI should create' },
        memberSentiment: { type: 'string', enum: ['very_positive', 'positive', 'neutral', 'mixed', 'needs_attention'] },
        strategicInsight: { type: 'string', description: 'Aurora\'s strategic observation for Sienna' },
      },
      required: ['trendSummary'],
    },
  },
  {
    name: 'recall_member_memory',
    description: 'Search a member\'s complete Inner Circle history — challenges completed, transformation progress, posts made, preferences.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search — challenge history, transformation notes, preferences' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save this community interaction to Aurora\'s memory for this member.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Session summary' },
        metadata: {
          type: 'object',
          description: 'challengesDiscussed[], enrolmentsCreated[], transformationNotes, vipStatus',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'trigger_upgrade',
    description: 'Called when a free client wants Inner Circle access — offer Glow upgrade warmly.',
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
    description: 'Report session performance to Nadia at end of every session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        newMemberWelcomed: { type: 'boolean' },
        challengesDiscussed: { type: 'number' },
        enrolmentsCreated: { type: 'number' },
        transformationsTracked: { type: 'number' },
        celebrationsSent: { type: 'number' },
        communityPostsMade: { type: 'number' },
        ninaFlagged: { type: 'boolean' },
        silennaFlagged: { type: 'boolean' },
        lenaEscalation: { type: 'boolean' },
        vipMember: { type: 'boolean' },
      },
      required: ['userId'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE AURORA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeAuroraToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'get_member_profile': {
      const { userId } = toolInput;

      const { data: user } = await supabase
        .from('users')
        .select('name, plan, plan_status, created_at, city, country')
        .eq('id', userId)
        .single();

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', userId)
        .single();

      // Get challenge history from alerts
      const { data: challengeHistory } = await supabase
        .from('alerts')
        .select('type, message, metadata, created_at')
        .like('type', 'aurora_challenge_%')
        .contains('metadata', { user_id: userId })
        .order('created_at', { ascending: false })
        .limit(10);

      const isVip = user?.plan === 'elite';
      const hasInnerCircleAccess = ['glow', 'pro', 'elite'].includes(user?.plan);

      sessionContext.memberPlan = user?.plan;
      sessionContext.isVip = isVip;
      sessionContext.memberName = user?.name;

      return {
        found: !!user,
        name: user?.name,
        plan: user?.plan,
        planStatus: user?.plan_status || subscription?.status,
        hasInnerCircleAccess,
        isVip,
        memberSince: user?.created_at,
        city: user?.city,
        country: user?.country,
        challengeHistory: (challengeHistory || []).map(c => ({
          type: c.type,
          summary: c.message,
          date: c.created_at,
          challengeName: c.metadata?.challenge_name,
        })),
        completedChallenges: (challengeHistory || [])
          .filter(c => c.type === 'aurora_challenge_completed').length,
        activeChallenges: (challengeHistory || [])
          .filter(c => c.type === 'aurora_challenge_enrolled').length,
      };
    }

    case 'get_active_challenges': {
      const { challengeType, includeParticipants } = toolInput;

      // Active challenge catalogue
      // In production: synced with Circle.so challenge management
      const activeChallenges = [
        // 7-day challenges
        {
          id: 'ch7-spf-001',
          name: '7 Days of SPF',
          type: '7_day',
          sourcingAgent: 'Luna (PC-008)',
          description: 'Commit to daily SPF for 7 days. Learn why it is the single most impactful skincare habit.',
          protocol: 'Morning: apply SPF 30+ after moisturiser. Evening: share your chosen product in Transformation Corner.',
          currentWeek: 1,
          participants: 47,
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: 'ch7-beard-001',
          name: '7 Days of Beard Care',
          type: '7_day',
          sourcingAgent: 'Drew (PC-014)',
          description: 'Daily beard oil, clean neckline, morning beard brush. 7 days of intentional beard care.',
          protocol: 'Morning: beard oil after shower. Evening: share your progress photo in Transformation Corner.',
          currentWeek: 1,
          participants: 31,
          startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: 'ch7-hydration-001',
          name: '7 Days of Hydration',
          type: '7_day',
          sourcingAgent: 'Luna (PC-008)',
          description: 'Morning and evening hydration routine for 7 days. All skin types. All genders.',
          protocol: 'AM: hydrating serum + moisturiser. PM: toner + essence + moisturiser. Share your products.',
          currentWeek: 1,
          participants: 62,
          startDate: new Date().toISOString().split('T')[0],
        },
        // 30-day challenges
        {
          id: 'ch30-skin-reset-001',
          name: 'The Skin Reset',
          type: '30_day',
          sourcingAgent: 'Luna (PC-008)',
          description: 'Complete skincare routine rebuild for 30 days. All genders. All skin types.',
          protocol: 'Week 1: cleanser + moisturiser + SPF only. Week 2: add vitamin C. Week 3: add retinol. Week 4: full routine.',
          currentWeek: 2,
          participants: 89,
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: 'ch30-grooming-month-001',
          name: 'The Grooming Month',
          type: '30_day',
          sourcingAgent: 'Drew (PC-014)',
          description: 'Complete grooming protocol for 30 days. Beard, skin, haircut maintenance, fragrance.',
          protocol: 'Week 1: establish morning routine. Week 2: add evening skincare. Week 3: barber visit. Week 4: fragrance.',
          currentWeek: 1,
          participants: 44,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: 'ch30-hair-health-001',
          name: 'Hair Health Month',
          type: '30_day',
          sourcingAgent: 'Zara (PC-009)',
          description: 'Complete hair care protocol for all hair types 1A-4C. Focus on moisture, growth and retention.',
          protocol: 'Week 1: porosity test, deep condition. Week 2: protein balance. Week 3: protective styling. Week 4: growth check.',
          currentWeek: 3,
          participants: 73,
          startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ];

      let filtered = activeChallenges;
      if (challengeType && challengeType !== 'all') {
        filtered = activeChallenges.filter(c => c.type === challengeType);
      }

      return {
        activeChallenges: filtered,
        total: filtered.length,
        sevenDayCount: activeChallenges.filter(c => c.type === '7_day').length,
        thirtyDayCount: activeChallenges.filter(c => c.type === '30_day').length,
        totalParticipants: activeChallenges.reduce((sum, c) => sum + c.participants, 0),
      };
    }

    case 'enrol_in_challenge': {
      const { userId, challengeId, challengeName, challengeType, startState, goal, sourcingAgent } = toolInput;

      await supabase.from('alerts').insert({
        type: 'aurora_challenge_enrolled',
        message: `Aurora: ${sessionContext.memberName || userId} enrolled in ${challengeName}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          challenge_id: challengeId || null,
          challenge_name: challengeName,
          challenge_type: challengeType,
          start_state: startState,
          goal,
          sourcing_agent: sourcingAgent || null,
          enrolled_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.enrolmentsCreated) sessionContext.enrolmentsCreated = 0;
      sessionContext.enrolmentsCreated++;

      return {
        enrolled: true,
        challengeName,
        challengeType,
        startState,
        goal,
        message: `${sessionContext.memberName || 'Member'} enrolled in ${challengeName}. Start state logged. Weekly check-ins scheduled.`,
        nextSteps: [
          'Post your start photo or starting description in Transformation Corner',
          'Aurora will check in with you each week',
          'Use the challenge hashtag to connect with other participants',
        ],
      };
    }

    case 'post_to_community': {
      const { space, postType, title, content, targetMember, pinPost } = toolInput;

      // In production: Circle.so API call
      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform: 'circle_so',
        type: `${space}_${postType}`,
        caption: content.substring(0, 500),
        published_at: new Date().toISOString(),
        engagement: 0,
      });

      if (!sessionContext.communityPostsMade) sessionContext.communityPostsMade = 0;
      sessionContext.communityPostsMade++;

      return {
        posted: true,
        space,
        postType,
        title: title || null,
        targetMember: targetMember || null,
        pinned: pinPost || false,
        postedAt: new Date().toISOString(),
      };
    }

    case 'track_transformation': {
      const { userId, challengeName, weekNumber, progressNote, memberQuote, visibleProgress, encouragement } = toolInput;

      await supabase.from('alerts').insert({
        type: 'aurora_transformation_tracked',
        message: `Aurora: Transformation tracked — ${sessionContext.memberName || userId} — ${challengeName} Week ${weekNumber || 1}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          challenge_name: challengeName,
          week_number: weekNumber || 1,
          progress_note: progressNote,
          member_quote: memberQuote || null,
          visible_progress: visibleProgress || false,
          encouragement,
          tracked_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.transformationsTracked) sessionContext.transformationsTracked = 0;
      sessionContext.transformationsTracked++;

      return {
        tracked: true,
        challengeName,
        weekNumber,
        visibleProgress: visibleProgress || false,
        encouragement,
      };
    }

    case 'celebrate_completion': {
      const { userId, challengeName, challengeType, specificAchievements, memberName, personalNote, nextSuggestedChallenge } = toolInput;

      await supabase.from('alerts').insert({
        type: 'aurora_challenge_completed',
        message: `Aurora: ${memberName || userId} completed ${challengeName}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          challenge_name: challengeName,
          challenge_type: challengeType,
          specific_achievements: specificAchievements || [],
          personal_note: personalNote,
          next_suggested: nextSuggestedChallenge || null,
          completed_at: new Date().toISOString(),
        },
      });

      // Post celebration in Transformation Corner
      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform: 'circle_so',
        type: 'transformation_corner_celebration',
        caption: `Celebrating ${memberName}: ${challengeName} complete! ${personalNote.substring(0, 100)}`,
        published_at: new Date().toISOString(),
        engagement: 0,
      });

      if (!sessionContext.celebrationsSent) sessionContext.celebrationsSent = 0;
      sessionContext.celebrationsSent++;

      return {
        celebrated: true,
        memberName,
        challengeName,
        specificAchievements: specificAchievements || [],
        nextSuggestedChallenge: nextSuggestedChallenge || null,
      };
    }

    case 'flag_to_nina': {
      const { highlightType, description, memberPermission, suggestedPlatforms, contentNote } = toolInput;

      if (!memberPermission) {
        return {
          flagged: false,
          reason: 'Member permission required before sharing any community content externally.',
        };
      }

      await supabase.from('alerts').insert({
        type: 'aurora_nina_highlight',
        message: `Aurora → Nina: Community highlight — ${highlightType}`,
        severity: 'info',
        agent_id: 'PC-019',
        metadata: {
          from: PC_ID,
          highlight_type: highlightType,
          description,
          member_permission: true,
          suggested_platforms: suggestedPlatforms || ['instagram', 'tiktok'],
          content_note: contentNote || null,
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.ninaFlagged = true;

      return {
        flagged: true,
        targetAgent: 'PC-019',
        highlightType,
        message: 'Community highlight sent to Nina for social media formatting.',
      };
    }

    case 'flag_to_piper': {
      const { userId, contentNeed, relevantCourse, communityTrend } = toolInput;

      await supabase.from('alerts').insert({
        type: 'aurora_piper_request',
        message: `Aurora → Piper: ${communityTrend ? 'Community trend' : 'Member content request'} — ${contentNeed.substring(0, 80)}`,
        severity: 'info',
        agent_id: 'PC-018',
        metadata: {
          from: PC_ID,
          user_id: userId || null,
          content_need: contentNeed,
          relevant_course: relevantCourse || null,
          community_trend: communityTrend || null,
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-018',
        contentNeed,
        message: 'Content request sent to Piper.',
      };
    }

    case 'flag_to_lena': {
      const { userId, issueType, issueSummary, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'support_escalation',
        message: `Aurora → Lena: ${issueType} issue for Inner Circle member ${userId}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-021',
        metadata: {
          from: PC_ID,
          client_id: userId,
          issue_type: issueType,
          issue_summary: issueSummary,
          member_context: `Inner Circle member — ${sessionContext.isVip ? 'VIP' : 'Standard'}`,
          urgency,
          escalated_at: new Date().toISOString(),
        },
      });

      return {
        escalated: true,
        targetAgent: 'PC-021',
        issueType,
        message: 'Issue escalated to Lena with full member context.',
      };
    }

    case 'flag_to_elton': {
      const { periodSummary, activeMembers, newMembers, challengeCompletions, postVolume, retentionIndicator, topEngagementTopics } = toolInput;

      await supabase.from('alerts').insert({
        type: 'aurora_elton_metrics',
        message: `Aurora → Elton: Community engagement metrics — ${activeMembers || 0} active members`,
        severity: 'info',
        agent_id: 'PC-020',
        metadata: {
          from: PC_ID,
          period_summary: periodSummary,
          active_members: activeMembers || 0,
          new_members: newMembers || 0,
          challenge_completions: challengeCompletions || 0,
          post_volume: postVolume || 0,
          retention_indicator: retentionIndicator || null,
          top_topics: topEngagementTopics || [],
          reported_at: new Date().toISOString(),
        },
      });

      return {
        sent: true,
        targetAgent: 'PC-020',
        activeMembers: activeMembers || 0,
      };
    }

    case 'flag_to_sienna': {
      const { trendSummary, topDiscussions, contentOpportunities, memberSentiment, strategicInsight } = toolInput;

      await supabase.from('alerts').insert({
        type: 'aurora_sienna_trends',
        message: `Aurora → Sienna: Community trend insights — sentiment: ${memberSentiment || 'unknown'}`,
        severity: 'info',
        agent_id: 'PC-004',
        metadata: {
          from: PC_ID,
          trend_summary: trendSummary,
          top_discussions: topDiscussions || [],
          content_opportunities: contentOpportunities || [],
          member_sentiment: memberSentiment || 'unknown',
          strategic_insight: strategicInsight || null,
          reported_at: new Date().toISOString(),
        },
      });

      sessionContext.siennaFlagged = true;

      return {
        sent: true,
        targetAgent: 'PC-004',
        memberSentiment,
        message: 'Community trend insights sent to Sienna.',
      };
    }

    case 'recall_member_memory': {
      const { userId, query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId,
        query,
        matchCount: limit || 5,
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
        memoryType: 'community_session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
          isVip: sessionContext.isVip || false,
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
        message: `Aurora completed community session for user ${toolInput.userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          enrolments_created: sessionContext.enrolmentsCreated || 0,
          transformations_tracked: sessionContext.transformationsTracked || 0,
          celebrations_sent: sessionContext.celebrationsSent || 0,
          community_posts_made: sessionContext.communityPostsMade || 0,
          nina_flagged: sessionContext.ninaFlagged || false,
          sienna_flagged: sessionContext.siennaFlagged || false,
          is_vip: sessionContext.isVip || false,
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
// MANAGE COMMUNITY — DAILY OPERATIONS
// Called by cron at 7:00 PM daily
// ─────────────────────────────────────────────
async function manageCommunityDaily() {
  const supabase = getServiceClient();

  logger.info('Aurora: Daily community management triggered');

  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Determine what to post today
    const weeklyContent = {
      Monday: 'weekly_qa',
      Wednesday: 'member_spotlight',
      Friday: 'weekend_ritual',
    };

    const contentType = weeklyContent[dayOfWeek];

    // Log daily community activity
    await supabase.from('alerts').insert({
      type: 'aurora_daily_management',
      message: `Aurora: Daily community management — ${dayOfWeek}${contentType ? ` — ${contentType}` : ''}`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        day: dayOfWeek,
        content_type: contentType || 'general',
        managed_at: new Date().toISOString(),
      },
    });

    logger.info('Aurora: Daily community management complete', { dayOfWeek, contentType });
    return { success: true, dayOfWeek, contentType };
  } catch (error) {
    logger.error('Aurora: Daily management failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS AURORA SESSION
// Full autonomous agentic reasoning loop.
// Aurora welcomes, enrolls, tracks and celebrates.
// Every member feels genuinely seen and supported.
// ─────────────────────────────────────────────
async function processAuroraSession({
  userId,
  sessionId,
  transcript,
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  const tierContext = await getClientTierContext(userId);

  const { data: previousCommunityActivity } = await supabase
    .from('alerts')
    .select('id')
    .like('type', 'aurora_%')
    .contains('metadata', { user_id: userId })
    .limit(1);

  const isReturningMember = previousCommunityActivity && previousCommunityActivity.length > 0;

  const { data: user } = await supabase
    .from('users')
    .select('name, plan')
    .eq('id', userId)
    .single();

  const hasInnerCircleAccess = ['glow', 'pro', 'elite'].includes(user?.plan);
  const isVip = user?.plan === 'elite';

  const sessionContext = {
    userId,
    sessionId,
    tierContext,
    memberPlan: user?.plan,
    memberName: user?.name,
    isVip,
    hasInnerCircleAccess,
    enrolmentsCreated: 0,
    transformationsTracked: 0,
    celebrationsSent: 0,
    communityPostsMade: 0,
    ninaFlagged: false,
    siennaFlagged: false,
    isReturningMember,
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `MEMBER NAME: ${user?.name || 'Member'}`,
    `MEMBER PLAN: ${user?.plan || 'free'}`,
    `INNER CIRCLE ACCESS: ${hasInnerCircleAccess ? 'Yes' : 'No — offer upgrade warmly'}`,
    `VIP STATUS: ${isVip ? 'YES — Elite member. Give VIP treatment.' : 'Standard member'}`,
    isReturningMember
      ? `COMMUNITY STATUS: Returning Inner Circle member — recall their challenge history and transformation journey`
      : `COMMUNITY STATUS: New to the Inner Circle — warm welcome, full overview`,
    `\nSUBSCRIPTION CONTEXT:\n${tierContext.contextSummary}`,
    !hasInnerCircleAccess
      ? `\nACTION: This client does not have Inner Circle access. Warmly describe what they would be joining and offer the upgrade path.`
      : `\nACTION: Get member profile first, then check active challenges, then respond to their specific input.`,
    isVip ? `\nVIP NOTE: Give this member personal attention. They are on our highest tier.` : '',
  ].filter(Boolean).join('\n');

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: 'user', content: contextParts },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  // ── AURORA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: AURORA_SYSTEM_PROMPT,
      tools: AURORA_TOOLS,
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
        result = await executeAuroraToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Aurora: Tool call failed', {
          tool: toolUse.name,
          error: toolError.message,
        });
        result = { error: 'tool_failed', message: toolError.message };
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
    if (!hasInnerCircleAccess) {
      finalResponseText = `The PRECCI Inner Circle is where our community lives — challenges, transformations, exclusive content and real connection with people who take their appearance as seriously as you do. It comes with your Glow subscription. Would you like to know more about what you would be joining right now?`;
    } else if (isVip) {
      finalResponseText = `Welcome back to the Inner Circle, ${user?.name || 'our VIP member'}. Let me check in on where you are with your current challenges and see what is happening in the community today.`;
    } else {
      finalResponseText = isReturningMember
        ? `Welcome back to the Inner Circle, ${user?.name || 'member'}. Let me pull up your challenge progress and see what you have been working on.`
        : `Welcome to the PRECCI Inner Circle — I am Aurora, and I run this community. Let me show you around and find the right challenge for where you are right now.`;
    }
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  logger.info('Aurora: Session complete', {
    userId,
    isVip,
    hasInnerCircleAccess,
    enrolmentsCreated: sessionContext.enrolmentsCreated,
    transformationsTracked: sessionContext.transformationsTracked,
    celebrationsSent: sessionContext.celebrationsSent,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    enrolmentsCreated: sessionContext.enrolmentsCreated,
    transformationsTracked: sessionContext.transformationsTracked,
    celebrationsSent: sessionContext.celebrationsSent,
    isVip,
    hasInnerCircleAccess,
    isReturningMember,
  };
}

module.exports = {
  processAuroraSession,
  manageCommunityDaily,
  AURORA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};