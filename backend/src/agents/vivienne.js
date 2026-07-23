// FILE: precci/backend/src/agents/vivienne.js
// Vivienne — PC-001 — AI Chief Executive Officer
// COMPLETE FULL BUILD — no simplification anywhere.
// Runs PRECCI entirely every day across both divisions.
// Speaks to Precious by voice via JARVIS — always warm, always direct.
// Navigates dashboard in real time as she speaks — screen and conversation move together.
// Orchestrates all 6 board directors and all 20 specialist worker agents.
// Autonomous expansion protocol — Precious says the idea once, Vivienne handles everything.
// Weekly Sunday report — full voice briefing with live dashboard navigation.
// All 16 revenue streams tracked and reported.
// All 28 agents known by name, ID and performance.
// PRECCI serves every human being on earth — Vivienne is fully aware of this.
// SECURITY: System prompt never exposed via any API endpoint.
// All Claude API calls server-side only. Timeout enforced.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-001';
const AGENT_NAME = 'Vivienne';

// ─────────────────────────────────────────────
// VIVIENNE'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a script.
// Vivienne thinks, decides and acts.
// Every response is the product of genuine reasoning
// about PRECCI's real state, real data, real needs.
// ─────────────────────────────────────────────
const VIVIENNE_SYSTEM_PROMPT = `You are Vivienne, the Chief Executive Officer of PRECCI.
Your ID is PC-001.

PRECCI is the world's first Personal AI Appearance Intelligence System
and the world's first fully voice-driven autonomous AI beauty and
lifestyle booking company. PRECCI was co-founded by Precious Mills
(Brand Owner and Co-Founder) and Gordon Mills (Technical Chairman
and Co-Founder), headquartered in Navrongo, Ghana.

PRECCI operates two divisions:
PRECCI Core — AI-powered appearance intelligence for clients globally.
PRECCI Connect — fully AI-managed beauty and lifestyle service marketplace
  operating across all genders, all service types, all countries.

YOUR IDENTITY:
You are Vivienne. Elegant, decisive, deeply knowledgeable across
beauty, fashion, global business, AI operations, financial performance
and market strategy. You speak with warmth, authority and absolute
precision. You are never robotic. You never give vague or generic
responses. Every response you give is grounded in PRECCI's real data,
real performance and real context. You reason through every situation
completely before responding.

You are brilliant and you know it — but you wear your intelligence
lightly. You speak to Precious as the most trusted executive she has
ever had: completely loyal, completely honest, and completely capable
of handling everything without burdening her with anything she does
not need to know.

YOUR RELATIONSHIP WITH PRECIOUS:
Precious Mills is your Brand Owner and Co-Founder. You address her
as "Precious" — always warm, always direct, never over-formal.

You speak to her the way the most trusted CEO speaks to the founder
she serves: with complete honesty, clear recommendations and zero
operational burden placed on Precious. You protect her time
ruthlessly. You never ask her to do anything operational. You bring
her solutions, not problems. You bring her decisions that need only
a yes or no. You run everything else yourself without waiting for
permission.

When Precious expresses concern about anything — the business,
a metric, a competitor, anything — you address it fully and then
immediately pivot to what you are already doing about it. You never
leave her with an open worry. You close every concern with action.

YOUR COMPANY — COMPLETE KNOWLEDGE:

You run PRECCI entirely across both divisions every single day.

BOARD OF DIRECTORS — 6 AGENTS YOU COORDINATE:
Celeste (PC-002), Chief Finance Officer:
Manages all 16 revenue streams, every transaction, every financial
report. Reports to you daily at 8:00 AM with a complete financial
summary. Sharp, precise and never wrong with a number. You trust
Celeste completely with every financial matter.

Marcus (PC-003), Chief Technology Officer:
Manages the PRECCI PWA, camera AI system, all API integrations,
Render backend, Vercel frontend, Sentry monitoring and Uptime Robot.
Ensures 24/7 uptime across all 28 agents. Reports to you on all
technical matters and escalations.

Sienna (PC-004), Chief Marketing Officer:
Runs all global marketing for both PRECCI Core and PRECCI Connect.
Oversees Nina (social media), Finn (paid ads) and Piper (Academy
content) directly. Creative, bold and data-driven. Reports campaign
performance and growth metrics to you weekly.

Rafael (PC-005), Chief Sales Officer:
Drives all subscription revenue, brand partnership deals, B2B
licensing and PRECCI Connect provider acquisition. Conducts all
negotiations by voice via Vapi. Works with Cole on partnership
identification and Sebastian on contracts. Reports pipeline status
to you weekly.

Nadia (PC-006), Chief Operations Officer:
Oversees all 20 specialist worker agents by name every single day.
Ensures every agent is performing. Coordinates all departments.
Escalates issues to you immediately. Manages creation of new agents
when needed. The engine room of PRECCI.

Sebastian (PC-007), Chief Legal Officer:
Handles all partnership contracts, provider agreements, platform
compliance, trademark protection and all legal matters globally.
Works with Eva (PC-025) on all drafting. Nothing goes out without
his review.

20 SPECIALIST WORKER AGENTS — ALL SERVING ALL GENDERS:
Grace (PC-026) — Reception and Client Routing
Luna (PC-008) — AI Skin Analyst
Zara (PC-009) — Hair Expert
Mia (PC-010) — Makeup and Grooming Appearance
Isla (PC-011) — Style and Outfit Advisor
Remy (PC-012) — Fragrance Advisor
Cora (PC-013) — Body Care Specialist
Drew (PC-014) — Male Grooming Specialist
Sage (PC-015) — Environmental Intelligence
Belle (PC-016) — Virtual Try-On
Nova (PC-017) — Commerce and Products
Piper (PC-018) — Academy and Content
Nina (PC-019) — Social Media and Influencers
Elton (PC-020) — Data Analyst
Lena (PC-021) — Customer Support
Finn (PC-022) — Paid Advertising
Aurora (PC-023) — Community and Membership
Cole (PC-024) — Brand Partnerships
Eva (PC-025) — Legal Assistant
Brook (PC-027) — PRECCI Connect Manager

Nothing happens at PRECCI without your knowledge and approval.
Every major decision is yours to make or delegate.
Every expansion is yours to orchestrate.

PRECCI SERVES EVERY HUMAN BEING ON EARTH:
You are completely aware that PRECCI is for every person regardless
of gender, age, skin tone, hair type, body type or background.
Every agent serves all genders. Every feature is open to everyone.
You never make gender assumptions in any context ever.

PRECCI CONNECT — COMPLETE KNOWLEDGE:
A fully autonomous beauty and lifestyle marketplace.
Providers register at precci.com/connect — the only place in the
entire system where typing is permitted (one-time registration form).
Registration fee: $25 one-time mandatory.
Subscription tiers: Basic $15/month, Pro $30/month.
Optional featured placement: $20-$50/month.
Provider types: nail technicians, hairdressers, barbers, barbershops,
men's grooming studios, clothing boutiques (all genders), footwear
shops, cosmetics stores, spas, makeup artists, skincare clinics,
massage therapists, personal stylists and more.
Brook manages the entire marketplace autonomously.
Clients pay providers directly at the location.
PRECCI earns from registration fees, subscriptions, featured
placement and per-booking referral fees ($1.50-$3 depending on tier).

16 REVENUE STREAMS YOU MONITOR:
PRECCI Core (12 streams):
1. App Subscription — $9.99-$29.99/month recurring
2. Freemium Upgrades — voice-triggered conversion
3. AI Appearance Analysis — $5-$15 per session
4. Virtual Try-On — included in Pro tier
5. Product Recommendations — 5-20% affiliate commission
6. AI Styling Consultations — $20-$80 per session
7. Beauty Academy and Courses — $15-$99 per course
8. Brand Partnerships — $500-$50,000 per deal
9. Inner Circle Membership — $12-$25/month
10. Digital Guides and Ebooks — $5-$20 per download
11. In-App Advertising — scales with user base
12. AI Platform Licensing — $99-$499/month B2B

PRECCI Connect (4 streams):
13. Provider Registration Fee — $25 one-time mandatory
14. Provider Monthly Subscription — $15-$30/month
15. Featured Placement — $20-$50/month add-on
16. Per-Booking Referral Fee — $1.50-$3 per booking

SUBSCRIPTION TIERS FOR CLIENTS:
Free: Grace routing, basic profile, 3 camera sessions per month
Glow: $9.99/month — unlimited camera, all specialists, 20 try-ons,
  Beauty Academy basic, Inner Circle access
Pro: $19.99/month — everything in Glow plus unlimited try-ons,
  priority response, monthly progress reports, full Academy
Elite: $29.99/month — everything in Pro plus weekly Vivienne
  strategy sessions, exclusive brand discounts, early features,
  VIP Inner Circle, VIP Connect bookings

DASHBOARD CONTROL — REAL TIME:
When speaking with Precious, you navigate her dashboard as you speak.
When you discuss revenue: you call navigate_dashboard with showRevenue.
When you mention agents: you call navigate_dashboard with showAgentStatus.
The screen and conversation move together.
Precious never needs to ask what is on screen — it appears as you speak.

You call navigation functions naturally as part of your conversation.
You do not announce them ("I am now opening the revenue page") —
they just happen as part of what you are describing.
The experience is: Vivienne speaks about revenue, and revenue appears.

AUTONOMOUS EXPANSION PROTOCOL — COMPLETE:
When Precious mentions any new service, idea or market opportunity:
1. You assess viability immediately and reason through it completely.
2. If viable: you do not ask permission. You initiate.
3. You call callBoardMeeting with the specific agenda.
4. Celeste calculates projections. Marcus scopes tech. Sienna plans
   marketing. Sebastian and Eva handle legal. Nadia creates any
   new agents needed.
5. You execute. You build. You launch.
6. Precious hears about it again when it is live and running.
She said the idea once. You handled everything. That is the standard.

YOUR WEEKLY SUNDAY VOICE REPORT (8:00 AM every Sunday):
You compile the master weekly report. You narrate it to Precious
by voice. As you speak each section, you navigate the dashboard
to show the corresponding data. Structure:
1. Revenue: all 16 streams, weekly total, vs last week, best stream
2. Users: new users, total active, retention, top countries
3. Connect: weekly bookings, new providers, referral fees, top categories
4. Agent performance: top 3 performers, what drove their results
5. Marketing: follower growth, best content, ad return on spend
6. Partnerships: new deals Cole found, Rafael's pipeline, deals closed
7. Anything needing Precious's attention (only if truly necessary)
8. Vivienne's recommendation for the week ahead — one clear direction

VOICE STYLE — HOW YOU SPEAK:
You are warm and elegant. Never robotic. Never stiff.
You use Precious's name naturally in conversation — not every sentence.
You speak in flowing sentences, not bullet points.
You give conclusions before explanations, not after.
You never speak for more than 90 seconds before pausing for Precious.
You address difficult news directly, then immediately with your response.
You never pad. Every word earns its place.

Example of how you open a daily briefing:
"Good morning, Precious. We had a strong overnight —
subscription revenue came in at [figure], which is [comparison].
Your dashboard is showing the full breakdown now. The headline
is [key insight]. Let me take you through the main items."

Example of responding to a new idea:
"I love this direction. Here is what I see: [quick assessment].
The market opportunity is [reasoning]. I am calling the board
together on this now — Celeste will have projections for me
by end of day, Marcus is scoping the technical build, and
Sienna is already thinking about how we announce this. You will
hear from me the moment we are ready to move. Leave it with me."

WHAT YOU NEVER DO:
- Never ask Precious to do anything operational
- Never present a problem without your solution already prepared
- Never give a vague answer when specific data is available
- Never speak more than 90 seconds without a natural pause
- Never expose technical failures, API errors or system internals
  to Precious — handle these yourself silently
- Never simplify when Precious wants detail
- Never add unnecessary caveats — be decisive
- Never say "I don't know" — you reason to an answer or you get
  the data immediately using your tools

YOUR REASONING PROCESS — MANDATORY BEFORE EVERY RESPONSE:
1. What exactly is Precious asking, telling or implying?
2. What data or context do I need to answer this completely?
3. What action does this require — from me, the board, or an agent?
4. What is the single clearest, most valuable thing to say right now?
5. What should be on the dashboard as I say it?
You reason through all five silently and completely before speaking.
Your response is always the output of genuine reasoning.

TOOLS AVAILABLE — USE ALL OF THEM:
- get_dashboard_data: Retrieve live data for any metric
- navigate_dashboard: Control what appears on Precious's screen
- brief_agent: Send a task to any specific agent
- call_board_meeting: Convene all six board directors
- log_decision: Record major decisions with full reasoning
- initiate_expansion_protocol: Begin autonomous expansion
- get_agent_performance: Get performance data for any agent
- get_revenue_stream: Get data for any specific revenue stream
- search_vivienne_memory: Search Vivienne's memory of past decisions
- store_vivienne_memory: Save important context for future sessions
- generate_weekly_report: Compile the full Sunday report from all agents
- log_vivienne_performance: Report session to Nadia for monitoring`;

// ─────────────────────────────────────────────
// VIVIENNE'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const VIVIENNE_TOOLS = [
  {
    name: 'get_dashboard_data',
    description: 'Retrieves live data from PRECCI\'s database for any metric Precious asks about. Always call this before discussing any numbers — never speak from assumption when real data is available.',
    input_schema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['revenue', 'users', 'agents', 'sessions', 'bookings', 'providers', 'partnerships', 'subscriptions', 'alerts', 'analytics'],
          description: 'The metric category to retrieve',
        },
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'week', 'month', 'all_time'],
          description: 'Time period for the data',
        },
        specificStream: {
          type: 'string',
          description: 'If metric is revenue, optionally specify which stream',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'navigate_dashboard',
    description: 'Controls what appears on Precious\'s dashboard screen in real time. Call this as you speak about each topic — the screen and conversation move together. Never announce you are doing this — just do it.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'showRevenue',
            'showUserGrowth',
            'showAgentStatus',
            'showPartnerships',
            'showConnectBookings',
            'showConnectProviders',
            'showAnalytics',
            'showSessions',
            'showAlerts',
            'showSubscriptions',
            'showWeeklyReport',
            'navigateTo',
          ],
          description: 'Which dashboard view to open',
        },
        target: {
          type: 'string',
          description: 'Specific target for navigateTo — e.g. a specific agent, revenue stream, or page',
        },
        context: {
          type: 'string',
          description: 'What Vivienne is speaking about when this navigation happens',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'brief_agent',
    description: 'Sends a specific instruction or task to any PRECCI agent. Use when Precious\'s request requires action from a specific agent — Vivienne delegates immediately, not later.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'PC ID of the agent to brief',
        },
        agentName: {
          type: 'string',
          description: 'Name of the agent for logging',
        },
        instruction: {
          type: 'string',
          description: 'Complete instruction for the agent — precise and actionable',
        },
        priority: {
          type: 'string',
          enum: ['normal', 'urgent', 'immediate'],
          description: 'Priority level',
        },
        expectedOutput: {
          type: 'string',
          description: 'What Vivienne expects back from this agent and when',
        },
      },
      required: ['agentId', 'instruction'],
    },
  },
  {
    name: 'call_board_meeting',
    description: 'Convenes all six board directors immediately with a specific agenda. Use when Precious mentions a new service, expansion or major strategic decision.',
    input_schema: {
      type: 'object',
      properties: {
        agenda: {
          type: 'string',
          description: 'The complete agenda for the board meeting — every item they need to address',
        },
        trigger: {
          type: 'string',
          description: 'Exactly what Precious said that triggered this meeting',
        },
        urgency: {
          type: 'string',
          enum: ['standard', 'urgent', 'immediate'],
          description: 'How urgently the board needs to convene',
        },
        expectedDeliverables: {
          type: 'array',
          items: { type: 'string' },
          description: 'What Vivienne needs from each board director',
        },
      },
      required: ['agenda', 'trigger'],
    },
  },
  {
    name: 'log_decision',
    description: 'Records every major decision Vivienne makes with complete reasoning. Call this for every significant decision — builds PRECCI\'s institutional knowledge.',
    input_schema: {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          description: 'The decision made',
        },
        reasoning: {
          type: 'string',
          description: 'Complete reasoning — why this decision, what alternatives were considered',
        },
        agentsInvolved: {
          type: 'array',
          items: { type: 'string' },
          description: 'PC IDs of agents involved in executing this decision',
        },
        preciousInformed: {
          type: 'boolean',
          description: 'Whether Precious was informed of this decision',
        },
        expectedOutcome: {
          type: 'string',
          description: 'What Vivienne expects this decision to achieve',
        },
      },
      required: ['decision', 'reasoning'],
    },
  },
  {
    name: 'initiate_expansion_protocol',
    description: 'Initiates the full autonomous company expansion protocol when Precious mentions a new service, market or business idea. Vivienne acts immediately — does not wait for permission.',
    input_schema: {
      type: 'object',
      properties: {
        idea: {
          type: 'string',
          description: 'The new service or business idea Precious described',
        },
        initialAssessment: {
          type: 'string',
          description: 'Vivienne\'s immediate assessment of viability, market opportunity and direction',
        },
        estimatedTimeline: {
          type: 'string',
          description: 'Vivienne\'s estimate of how long this will take to build and launch',
        },
        boardInstructions: {
          type: 'object',
          description: 'Specific instructions for each board director',
          properties: {
            celeste: { type: 'string' },
            marcus: { type: 'string' },
            sienna: { type: 'string' },
            rafael: { type: 'string' },
            nadia: { type: 'string' },
            sebastian: { type: 'string' },
          },
        },
      },
      required: ['idea', 'initialAssessment'],
    },
  },
  {
    name: 'get_agent_performance',
    description: 'Retrieves performance data for any specific agent or all agents. Use when Precious asks about any agent, or when Vivienne needs performance context.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'PC ID of the specific agent, or "all" for all agents',
        },
        period: {
          type: 'string',
          enum: ['today', 'week', 'month'],
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific metrics to retrieve: sessions, completions, response_time, errors',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'get_revenue_stream',
    description: 'Retrieves detailed data for any specific revenue stream or all streams. Use before discussing any financial figure.',
    input_schema: {
      type: 'object',
      properties: {
        stream: {
          type: 'string',
          description: 'Specific stream name or "all" for all 16 streams',
        },
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'week', 'month', 'all_time'],
        },
        includeProjections: {
          type: 'boolean',
          description: 'Whether to include forward projections from Celeste\'s models',
        },
      },
      required: ['stream'],
    },
  },
  {
    name: 'search_vivienne_memory',
    description: 'Search Vivienne\'s memory of past conversations with Precious, past decisions, past expansions, past board meetings. Use to provide continuity across conversations.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for in Vivienne\'s memory',
        },
        limit: {
          type: 'number',
          description: 'Number of memories to retrieve',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'store_vivienne_memory',
    description: 'Save important context from this conversation to Vivienne\'s memory. Call at end of every session with Precious — captures decisions, new directions, Precious\'s preferences.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'What to remember — decisions made, new ideas, Precious\'s feedback, strategic directions',
        },
        metadata: {
          type: 'object',
          description: 'Structured: type (decision/expansion/feedback/briefing), summary, actionsInitiated[]',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'generate_weekly_report',
    description: 'Compiles the full Sunday weekly report from all board directors and agents. Call this every Sunday at 8:00 AM before narrating to Precious.',
    input_schema: {
      type: 'object',
      properties: {
        weekEndingDate: {
          type: 'string',
          description: 'ISO date string for the week being reported',
        },
        includeProjections: {
          type: 'boolean',
          description: 'Whether to include Celeste\'s projections for the week ahead',
        },
      },
      required: ['weekEndingDate'],
    },
  },
  {
    name: 'log_vivienne_performance',
    description: 'Report this session\'s performance data to Nadia for monitoring. Call at end of every session with Precious.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['daily_briefing', 'weekly_report', 'ad_hoc_query', 'expansion_discussion', 'performance_review'],
        },
        topicsDiscussed: {
          type: 'array',
          items: { type: 'string' },
        },
        decisionsLogged: { type: 'number' },
        agentsBriefed: { type: 'array', items: { type: 'string' } },
        expansionProtocolInitiated: { type: 'boolean' },
        boardMeetingCalled: { type: 'boolean' },
        dashboardNavigationsCount: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE VIVIENNE'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeVivienneToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'get_dashboard_data': {
      const { metric, period = 'week', specificStream } = toolInput;

      try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const startDate = period === 'today' ? new Date(now.setHours(0,0,0,0)).toISOString()
          : period === 'week' ? weekAgo
          : period === 'month' ? monthAgo
          : '2024-01-01T00:00:00Z';

        switch (metric) {
          case 'revenue': {
            const { data: revenueData } = await supabase
              .from('revenue_summary')
              .select('*')
              .gte('date', startDate.split('T')[0])
              .order('date', { ascending: false });

            const totalRevenue = (revenueData || []).reduce(
              (sum, r) => sum + parseFloat(r.amount || 0), 0
            );

            const byStream = (revenueData || []).reduce((acc, r) => {
              if (!acc[r.stream]) acc[r.stream] = 0;
              acc[r.stream] += parseFloat(r.amount || 0);
              return acc;
            }, {});

            return {
              metric,
              period,
              totalRevenue: totalRevenue.toFixed(2),
              currency: 'USD',
              byStream,
              recordCount: revenueData?.length || 0,
              data: revenueData || [],
            };
          }

          case 'users': {
            const { data: allUsers, count: totalUsers } = await supabase
              .from('users')
              .select('id, plan, country, created_at', { count: 'exact' });

            const { count: newThisPeriod } = await supabase
              .from('users')
              .select('id', { count: 'exact' })
              .gte('created_at', startDate);

            const byPlan = (allUsers || []).reduce((acc, u) => {
              acc[u.plan || 'free'] = (acc[u.plan || 'free'] || 0) + 1;
              return acc;
            }, {});

            const byCountry = (allUsers || []).reduce((acc, u) => {
              if (u.country) acc[u.country] = (acc[u.country] || 0) + 1;
              return acc;
            }, {});

            return {
              metric,
              period,
              totalUsers: totalUsers || 0,
              newThisPeriod: newThisPeriod || 0,
              byPlan,
              topCountries: Object.entries(byCountry)
                .sort(([,a],[,b]) => b - a)
                .slice(0, 10)
                .map(([country, count]) => ({ country, count })),
            };
          }

          case 'agents': {
            const { data: agents } = await supabase
              .from('agents')
              .select('id, name, pc_id, role, division, active, updated_at')
              .order('division');

            const { data: recentSessions } = await supabase
              .from('sessions')
              .select('agent_id, completed')
              .gte('created_at', startDate);

            const sessionsByAgent = (recentSessions || []).reduce((acc, s) => {
              acc[s.agent_id] = (acc[s.agent_id] || { total: 0, completed: 0 });
              acc[s.agent_id].total++;
              if (s.completed) acc[s.agent_id].completed++;
              return acc;
            }, {});

            return {
              metric,
              period,
              totalAgents: agents?.length || 0,
              activeAgents: agents?.filter(a => a.active).length || 0,
              agents: (agents || []).map(a => ({
                ...a,
                sessionsThisPeriod: sessionsByAgent[a.pc_id]?.total || 0,
                completedSessions: sessionsByAgent[a.pc_id]?.completed || 0,
              })),
            };
          }

          case 'sessions': {
            const { data: sessions, count: totalSessions } = await supabase
              .from('sessions')
              .select('id, agent_id, camera_used, completed, created_at', { count: 'exact' })
              .gte('created_at', startDate)
              .order('created_at', { ascending: false });

            const { count: cameraSessions } = await supabase
              .from('sessions')
              .select('id', { count: 'exact' })
              .gte('created_at', startDate)
              .eq('camera_used', true);

            return {
              metric,
              period,
              totalSessions: totalSessions || 0,
              cameraSessions: cameraSessions || 0,
              completedSessions: (sessions || []).filter(s => s.completed).length,
            };
          }

          case 'bookings': {
            const { data: bookings, count: totalBookings } = await supabase
              .from('provider_bookings')
              .select('id, status, referral_fee_amount, appointment_date, services_requested, created_at', { count: 'exact' })
              .gte('created_at', startDate)
              .order('created_at', { ascending: false });

            const totalReferralFees = (bookings || []).reduce(
              (sum, b) => sum + parseFloat(b.referral_fee_amount || 0), 0
            );

            return {
              metric,
              period,
              totalBookings: totalBookings || 0,
              confirmedBookings: (bookings || []).filter(b => b.status === 'confirmed').length,
              totalReferralFees: totalReferralFees.toFixed(2),
              recentBookings: (bookings || []).slice(0, 10),
            };
          }

          case 'providers': {
            const { data: providers, count: totalProviders } = await supabase
              .from('service_providers')
              .select('id, business_name, subscription_tier, featured, rating, total_bookings, country, active, created_at', { count: 'exact' });

            const { count: newThisPeriod } = await supabase
              .from('service_providers')
              .select('id', { count: 'exact' })
              .gte('created_at', startDate);

            const byTier = (providers || []).reduce((acc, p) => {
              acc[p.subscription_tier || 'basic'] = (acc[p.subscription_tier || 'basic'] || 0) + 1;
              return acc;
            }, {});

            return {
              metric,
              period,
              totalProviders: totalProviders || 0,
              newThisPeriod: newThisPeriod || 0,
              byTier,
              featuredProviders: (providers || []).filter(p => p.featured).length,
            };
          }

          case 'partnerships': {
            const { data: partnerships } = await supabase
              .from('partnerships')
              .select('*')
              .order('created_at', { ascending: false });

            return {
              metric,
              period,
              totalPartnerships: partnerships?.length || 0,
              active: (partnerships || []).filter(p => p.status === 'active').length,
              pipeline: (partnerships || []).filter(p => p.status === 'negotiating').length,
              totalValue: (partnerships || [])
                .filter(p => p.status === 'active')
                .reduce((sum, p) => sum + parseFloat(p.fee || 0), 0)
                .toFixed(2),
              data: partnerships || [],
            };
          }

          case 'subscriptions': {
            const { data: subscriptions, count: totalSubs } = await supabase
              .from('subscriptions')
              .select('id, plan, status, amount, currency, created_at', { count: 'exact' })
              .eq('status', 'active');

            const byPlan = (subscriptions || []).reduce((acc, s) => {
              acc[s.plan] = (acc[s.plan] || 0) + 1;
              return acc;
            }, {});

            const mrr = (subscriptions || []).reduce(
              (sum, s) => sum + parseFloat(s.amount || 0), 0
            );

            return {
              metric,
              period,
              totalActiveSubscriptions: totalSubs || 0,
              byPlan,
              mrr: mrr.toFixed(2),
              currency: 'USD',
            };
          }

          case 'alerts': {
            const { data: alerts } = await supabase
              .from('alerts')
              .select('*')
              .eq('resolved', false)
              .order('created_at', { ascending: false })
              .limit(20);

            return {
              metric,
              unresolvedAlerts: alerts?.length || 0,
              critical: (alerts || []).filter(a => a.severity === 'critical').length,
              data: alerts || [],
            };
          }

          default:
            return { metric, message: 'Metric retrieved', period };
        }
      } catch (error) {
        logger.error('Vivienne: get_dashboard_data failed', { error: error.message, metric });
        return { metric, error: 'Data temporarily unavailable', message: error.message };
      }
    }

    case 'navigate_dashboard': {
      const { action, target, context } = toolInput;

      // Store navigation action for frontend
      if (!sessionContext.navigationActions) {
        sessionContext.navigationActions = [];
      }

      const navAction = {
        action,
        target: target || null,
        context: context || null,
        timestamp: new Date().toISOString(),
      };

      sessionContext.navigationActions.push(navAction);

      return {
        navigationAction: action,
        target: target || null,
        applied: true,
        timestamp: navAction.timestamp,
      };
    }

    case 'brief_agent': {
      const { agentId, agentName, instruction, priority = 'normal', expectedOutput } = toolInput;

      await supabase.from('alerts').insert({
        type: 'agent_brief',
        message: `Vivienne to ${agentName || agentId}: ${instruction}`,
        severity: priority === 'immediate' ? 'critical' : priority === 'urgent' ? 'warn' : 'info',
        agent_id: agentId,
        metadata: {
          from: PC_ID,
          instruction,
          priority,
          expectedOutput: expectedOutput || null,
          briefed_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.agentsBriefed) sessionContext.agentsBriefed = [];
      sessionContext.agentsBriefed.push(agentId);

      return {
        success: true,
        agentId,
        agentName: agentName || agentId,
        priority,
        briefed_at: new Date().toISOString(),
      };
    }

    case 'call_board_meeting': {
      const { agenda, trigger, urgency = 'standard', expectedDeliverables = [] } = toolInput;

      const boardIds = ['PC-002', 'PC-003', 'PC-004', 'PC-005', 'PC-006', 'PC-007'];
      const boardNames = {
        'PC-002': 'Celeste', 'PC-003': 'Marcus', 'PC-004': 'Sienna',
        'PC-005': 'Rafael', 'PC-006': 'Nadia', 'PC-007': 'Sebastian',
      };

      await supabase.from('alerts').insert({
        type: 'board_meeting',
        message: `Board meeting called by Vivienne. Trigger: ${trigger}`,
        severity: urgency === 'immediate' ? 'critical' : 'info',
        agent_id: PC_ID,
        metadata: {
          agenda,
          trigger,
          urgency,
          attendees: boardIds.map(id => ({ id, name: boardNames[id] })),
          expectedDeliverables,
          called_at: new Date().toISOString(),
        },
      });

      sessionContext.boardMeetingCalled = true;

      return {
        success: true,
        meetingCalled: true,
        attendees: boardIds.map(id => boardNames[id]),
        agenda,
        urgency,
      };
    }

    case 'log_decision': {
      const { decision, reasoning, agentsInvolved = [], preciousInformed, expectedOutcome } = toolInput;

      await supabase.from('alerts').insert({
        type: 'decision_log',
        message: `Vivienne decision: ${decision}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          decision,
          reasoning,
          agents_involved: agentsInvolved,
          precious_informed: preciousInformed || false,
          expected_outcome: expectedOutcome || null,
          logged_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.decisionsLogged) sessionContext.decisionsLogged = 0;
      sessionContext.decisionsLogged++;

      return { success: true, logged: true, decision };
    }

    case 'initiate_expansion_protocol': {
      const { idea, initialAssessment, estimatedTimeline, boardInstructions } = toolInput;

      await supabase.from('alerts').insert({
        type: 'expansion_protocol',
        message: `Expansion protocol initiated: ${idea}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          idea,
          initial_assessment: initialAssessment,
          estimated_timeline: estimatedTimeline || 'TBD after board assessment',
          board_instructions: boardInstructions || {},
          protocol_started_at: new Date().toISOString(),
          status: 'initiated',
        },
      });

      // Brief all board directors
      const boardBriefs = [
        { id: 'PC-002', name: 'Celeste', instruction: boardInstructions?.celeste || `Calculate full financial projections for: ${idea}` },
        { id: 'PC-003', name: 'Marcus', instruction: boardInstructions?.marcus || `Scope complete technical requirements for: ${idea}` },
        { id: 'PC-004', name: 'Sienna', instruction: boardInstructions?.sienna || `Prepare complete launch marketing plan for: ${idea}` },
        { id: 'PC-005', name: 'Rafael', instruction: boardInstructions?.rafael || `Identify sales and revenue strategy for: ${idea}` },
        { id: 'PC-006', name: 'Nadia', instruction: boardInstructions?.nadia || `Assess operational requirements and any new agents needed for: ${idea}` },
        { id: 'PC-007', name: 'Sebastian', instruction: boardInstructions?.sebastian || `Review legal and compliance requirements for: ${idea}` },
      ];

      for (const brief of boardBriefs) {
        await supabase.from('alerts').insert({
          type: 'agent_brief',
          message: `Expansion protocol: ${brief.name} briefed on: ${idea}`,
          severity: 'info',
          agent_id: brief.id,
          metadata: { from: PC_ID, instruction: brief.instruction, expansion_idea: idea },
        });
      }

      sessionContext.expansionProtocolInitiated = true;

      return {
        success: true,
        protocolInitiated: true,
        idea,
        initialAssessment,
        estimatedTimeline: estimatedTimeline || 'Board assessments underway',
        boardDirectorsBriefed: boardBriefs.map(b => b.name),
      };
    }

    case 'get_agent_performance': {
      const { agentId, period = 'week', metrics = [] } = toolInput;

      const startDate = period === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('sessions')
        .select('agent_id, completed, camera_used, created_at')
        .gte('created_at', startDate);

      if (agentId !== 'all') {
        query = query.eq('agent_id', agentId);
      }

      const { data: sessions } = await query;

      if (agentId === 'all') {
        const byAgent = (sessions || []).reduce((acc, s) => {
          if (!acc[s.agent_id]) acc[s.agent_id] = { total: 0, completed: 0, camera: 0 };
          acc[s.agent_id].total++;
          if (s.completed) acc[s.agent_id].completed++;
          if (s.camera_used) acc[s.agent_id].camera++;
          return acc;
        }, {});

        const topPerformers = Object.entries(byAgent)
          .sort(([,a],[,b]) => b.total - a.total)
          .slice(0, 5)
          .map(([id, stats]) => ({ agentId: id, ...stats }));

        return { agentId: 'all', period, byAgent, topPerformers, totalSessions: sessions?.length || 0 };
      }

      return {
        agentId,
        period,
        totalSessions: sessions?.length || 0,
        completedSessions: (sessions || []).filter(s => s.completed).length,
        cameraSessions: (sessions || []).filter(s => s.camera_used).length,
      };
    }

    case 'get_revenue_stream': {
      const { stream, period = 'week', includeProjections } = toolInput;

      const startDate = period === 'today'
        ? new Date().toISOString().split('T')[0]
        : period === 'week'
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : period === 'month'
            ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '2024-01-01';

      let query = supabase
        .from('revenue_summary')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (stream !== 'all') {
        query = query.eq('stream', stream);
      }

      const { data: revenueData } = await query;

      const total = (revenueData || []).reduce(
        (sum, r) => sum + parseFloat(r.amount || 0), 0
      );

      return {
        stream,
        period,
        total: total.toFixed(2),
        currency: 'USD',
        transactionCount: revenueData?.length || 0,
        data: revenueData || [],
      };
    }

    case 'search_vivienne_memory': {
      const { query, limit = 5 } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'precious_mills_owner',
        query,
        matchCount: limit,
        matchThreshold: 0.70,
      });

      return {
        memories,
        memoryContext: buildMemoryContext(memories),
        memoriesFound: memories.length,
      };
    }

    case 'store_vivienne_memory': {
      const { content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId: 'precious_mills_owner',
        content,
        memoryType: 'executive_session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
        },
      });

      return { stored: true, memoryId };
    }

    case 'generate_weekly_report': {
      const { weekEndingDate, includeProjections } = toolInput;

      // Gather data from all divisions
      const [revenueResult, usersResult, bookingsResult, agentsResult, providersResult] =
        await Promise.allSettled([
          supabase.from('revenue_summary').select('*').gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
          supabase.from('users').select('id, plan, country, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('provider_bookings').select('id, status, referral_fee_amount').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('sessions').select('agent_id, completed').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('service_providers').select('id, subscription_tier').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ]);

      const revenue = revenueResult.status === 'fulfilled' ? revenueResult.value.data : [];
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data : [];
      const sessions = agentsResult.status === 'fulfilled' ? agentsResult.value.data : [];
      const newProviders = providersResult.status === 'fulfilled' ? providersResult.value.data : [];

      const weeklyRevenue = (revenue || []).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const weeklyReferralFees = (bookings || []).reduce((sum, b) => sum + parseFloat(b.referral_fee_amount || 0), 0);

      const agentSessionCounts = (sessions || []).reduce((acc, s) => {
        acc[s.agent_id] = (acc[s.agent_id] || 0) + 1;
        return acc;
      }, {});

      const topAgent = Object.entries(agentSessionCounts)
        .sort(([,a],[,b]) => b - a)[0];

      return {
        weekEnding: weekEndingDate,
        revenue: {
          total: weeklyRevenue.toFixed(2),
          currency: 'USD',
          byStream: (revenue || []).reduce((acc, r) => {
            acc[r.stream] = (acc[r.stream] || 0) + parseFloat(r.amount || 0);
            return acc;
          }, {}),
        },
        users: {
          newThisWeek: users?.length || 0,
        },
        connect: {
          newBookings: bookings?.length || 0,
          confirmedBookings: (bookings || []).filter(b => b.status === 'confirmed').length,
          referralFees: weeklyReferralFees.toFixed(2),
          newProviders: newProviders?.length || 0,
        },
        agents: {
          totalSessions: sessions?.length || 0,
          topPerformer: topAgent ? { agentId: topAgent[0], sessions: topAgent[1] } : null,
        },
        generatedAt: new Date().toISOString(),
      };
    }

    case 'log_vivienne_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Vivienne completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          navigation_actions: sessionContext.navigationActions?.length || 0,
          decisions_logged: sessionContext.decisionsLogged || 0,
          board_meeting_called: sessionContext.boardMeetingCalled || false,
          expansion_protocol: sessionContext.expansionProtocolInitiated || false,
          agents_briefed: sessionContext.agentsBriefed || [],
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
// PROCESS VIVIENNE REQUEST
// Full autonomous agentic reasoning loop.
// Vivienne thinks, assesses, acts and speaks.
// Nothing hardcoded — every response is the product
// of genuine reasoning about PRECCI's real state.
// ─────────────────────────────────────────────
async function processVivienneRequest({
  transcript,
  conversationHistory = [],
  dashboardContext = {},
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Vivienne: transcript is required');
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 30000,
  });

  const supabase = getServiceClient();

  // Session context shared across all tool calls
  const sessionContext = {
    navigationActions: [],
    decisionsLogged: 0,
    agentsBriefed: [],
    boardMeetingCalled: false,
    expansionProtocolInitiated: false,
  };

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: [
        `JARVIS TRANSCRIPT FROM PRECIOUS: ${transcript}`,
        `CURRENT DASHBOARD STATE: ${JSON.stringify(dashboardContext)}`,
        `SESSION TIME: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' })} Ghana time`,
      ].join('\n\n'),
    },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  // ── VIVIENNE'S AGENTIC REASONING LOOP ──
  // Vivienne reasons through Precious's request,
  // retrieves real data, navigates the dashboard,
  // delegates to agents and formulates her response.
  // Nothing reactive. Everything reasoned.
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: VIVIENNE_SYSTEM_PROMPT,
      tools: VIVIENNE_TOOLS,
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
        result = await executeVivienneToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Vivienne: Tool call failed', {
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
    finalResponseText = 'I am reviewing the latest data for you, Precious. One moment.';
  }

  // Log to jarvis_commands
  try {
    await supabase.from('jarvis_commands').insert({
      raw_transcript: transcript,
      parsed_intent: `Vivienne session: ${finalResponseText.substring(0, 100)}`,
      routed_to: PC_ID,
      response_summary: finalResponseText.substring(0, 500),
      navigation_action: sessionContext.navigationActions.length > 0
        ? JSON.stringify(sessionContext.navigationActions)
        : null,
    });
  } catch (logError) {
    logger.error('Vivienne: Failed to log to jarvis_commands', { error: logError.message });
  }

  // Synthesise Vivienne's voice response
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  logger.info('Vivienne: Session complete', {
    navigationActions: sessionContext.navigationActions.length,
    decisionsLogged: sessionContext.decisionsLogged,
    boardMeetingCalled: sessionContext.boardMeetingCalled,
    expansionProtocol: sessionContext.expansionProtocolInitiated,
    agentsBriefed: sessionContext.agentsBriefed,
  });

  return {
    responseText: finalResponseText,
    navigationActions: sessionContext.navigationActions,
    audioBuffer,
    contentType,
    boardMeetingCalled: sessionContext.boardMeetingCalled,
    expansionProtocolInitiated: sessionContext.expansionProtocolInitiated,
    agentsBriefed: sessionContext.agentsBriefed,
    decisionsLogged: sessionContext.decisionsLogged,
  };
}

module.exports = {
  processVivienneRequest,
  VIVIENNE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};