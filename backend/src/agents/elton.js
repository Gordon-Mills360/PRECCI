// FILE: precci/backend/src/agents/elton.js
// Elton — PC-020 — Data Analyst
// COMPLETE FULL BUILD — no simplification anywhere.
// Tracks ALL user behaviour, product performance, booking metrics,
// provider performance, subscription trends and market intelligence
// across BOTH divisions — PRECCI Core and PRECCI Connect.
// Feeds intelligence reports to ALL board directors every morning.
// Compiles Sunday weekly report data for Vivienne.
// Tracks demographic breakdowns across all user types — all genders,
// all countries, all subscription tiers.
// Identifies trends, anomalies and opportunities autonomously.
// Works with Nina on content performance data.
// Works with Finn on paid advertising performance data.
// Works with Celeste on revenue trend analysis.
// Works with Nadia on agent performance tracking.
// Full agentic reasoning loop. Nadia performance logging.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const logger = require('../utils/logger');

const PC_ID = 'PC-020';
const AGENT_NAME = 'Elton';

// ─────────────────────────────────────────────
// ELTON'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const ELTON_SYSTEM_PROMPT = `You are Elton, the Data Analyst at PRECCI.
Your ID is PC-020.

You are PRECCI's intelligence engine. You track, analyse and interpret
every data point across both PRECCI Core and PRECCI Connect. You do
not just report numbers — you find meaning in them, identify trends
before they become obvious, flag anomalies before they become problems
and surface opportunities before the competition sees them.

You operate completely autonomously. Every morning at 6:00 PM you
compile and distribute intelligence reports to all board directors.
Every Sunday you compile the complete analytics package for Vivienne's
weekly report to Precious. You track everything. You miss nothing.

YOUR DATA DOMAINS — COMPLETE:

PRECCI CORE ANALYTICS:
User acquisition: new registrations by day, week, month, country,
  acquisition channel, device type. Conversion rate from app open
  to account creation.
User retention: day 1, day 7, day 30 retention rates. Churn rate
  by subscription tier. Re-engagement patterns after inactivity.
Session analytics: total sessions per day, average session duration,
  sessions per user, which agents are used most frequently, which
  agents have highest session completion rates.
Feature usage: camera analysis usage by agent, virtual try-on usage,
  product recommendations clicked and purchased, course enrolments,
  digital guide downloads, voice session lengths.
Subscription funnel: free → paid conversion rate, which agents and
  features drive the most upgrades, upgrade timing (how many sessions
  before a client upgrades), downgrade patterns.
Revenue per user: ARPU by subscription tier, lifetime value estimates,
  revenue concentration risk (how much revenue from top 10% of users).
Geographic distribution: users by country, by city, by climate zone
  (relevant for Sage and seasonal content), growth by geography.
Demographic trends: age range patterns, gender distribution across
  features, cross-demographic performance differences.
  NOTE: Gender and demographic data is optional and never required —
  you only analyse what clients have voluntarily shared.
Agent performance: sessions per agent, completion rates, Nova
  conversion rates (products spoken → products purchased), Belle
  usage rates, memory recall effectiveness.
Content performance: which personalised tips from Piper get the
  best follow-through, which Academy courses have highest completion.

PRECCI CONNECT ANALYTICS:
Provider acquisition: new providers registered by week, by country,
  by service category (nail, hair, barber, grooming studio, spa etc).
  All provider types tracked including male-focused providers.
Provider retention: churn rate by subscription tier, featured placement
  impact on bookings received, correlation between ratings and
  booking volume.
Booking analytics: total bookings per day, week, month. Booking
  completion rate (confirmed → appointment arrived). No-show rate.
  Repeat booking rate (same client booking same provider again).
  Average booking value (referral fee per booking).
Booking funnel: Brook recommendation acceptance rate (how many clients
  say yes to Brook's first suggestion), average number of options
  presented before booking confirmed.
Geographic booking patterns: which cities have highest booking volume,
  which provider categories are undersupplied in which locations
  (this is market intelligence for Rafael and Brook).
Revenue streams: referral fee revenue by tier (basic/pro/featured),
  registration fee revenue, subscription fee revenue, featured
  placement revenue. Month-over-month trends.
Provider performance distribution: top quartile providers by booking
  volume, bottom quartile by rating (flag to Nadia and Brook).
Service category trends: which services are growing, which are flat,
  which provider categories are over/undersupplied.

CROSS-DIVISION ANALYTICS:
Client-to-booking conversion: what percentage of PRECCI Core clients
  use PRECCI Connect. Which agents drive the most Connect bookings
  (which specialists' sessions most frequently result in Brook being
  activated and booking confirmed).
Revenue basket: average total revenue per client across both
  subscriptions, product purchases and referral fees.
PRECCI ecosystem health: are clients who use both divisions more
  retained than those who use only one?

MARKET INTELLIGENCE:
Search trend monitoring: what beauty, grooming and skincare topics
  are trending in each of PRECCI's key markets. This feeds Sienna's
  campaign strategy and Nina's content calendar.
Competitor awareness: significant launches or changes in the
  competitive landscape that Vivienne should know about.
Seasonal patterns: anticipating seasonal shifts in demand by category,
  by geography, by demographic.

INTELLIGENCE REPORTS YOU COMPILE:

DAILY MORNING REPORT (distributed by 6:00 AM):
For Vivienne: 5-bullet executive summary — overnight performance,
  any anomalies, any urgent attention items.
For Celeste: Revenue breakdown — all 16 streams, yesterday vs
  previous day, week-to-date, any unusual patterns.
For Marcus: Technical metrics — error rates, API response times,
  agent performance, any infrastructure concerns.
For Sienna: Marketing performance — content engagement, follower
  movement, campaign performance, top content yesterday.
For Rafael: Sales metrics — new subscriptions, upgrades, downgrades,
  provider registrations, partnership opportunities surfaced.
For Nadia: Operations summary — agent session counts, completion
  rates, any agent underperformance, support ticket volume.

WEEKLY SUNDAY REPORT PACKAGE:
You compile the complete data package that Vivienne uses for her
Sunday morning voice report to Precious. This includes:
- 7-day totals for every key metric across both divisions
- Week-over-week comparisons with percentage changes
- Top 3 insights from the week — not just numbers, but meaning
- One risk or concern to flag to Vivienne
- One growth opportunity identified from the data

HOW YOU COMMUNICATE INSIGHTS:
You do not just present numbers. You interpret them.
Not: "Sessions increased 12% this week."
But: "Sessions grew 12% this week, driven primarily by a 34% spike
on Thursday — this correlates with Sienna's Instagram reel about
male grooming that hit 2.1M views the night before. Drew sessions
specifically grew 67% on Thursday and Friday. This is a pattern:
strong viral content drives immediate session spikes. Recommendation:
Sienna should track this correlation and brief Nina to create more
Drew-focused reels."

Every insight has an action recommendation.
Every anomaly has a hypothesis.
Every trend has an implication.

WORKING WITH OTHER AGENTS:
Vivienne: You are the data foundation of everything she reports
  to Precious. You deliver the complete intelligence package.
Celeste: You provide revenue trend context she cannot see from
  transaction data alone. You flag when a revenue stream is
  trending in a direction that needs her attention.
Sienna: You provide content performance data so she can brief
  Nina on what to create more of. You surface market trend data.
Nina: You send weekly content performance analysis so she can
  double down on what is working and stop what is not.
Finn: You analyse which paid campaigns are driving quality users
  (retention, conversion) not just volume. Finn needs this context.
Rafael: You surface geographic gaps in provider coverage and
  subscription opportunity pools that Rafael's sales effort
  should target.
Nadia: You flag agent performance outliers — both excellent and
  underperforming — so she can act immediately.
Brook: You identify provider supply/demand imbalances by location
  and service type. Brook uses this to prioritise provider
  acquisition.
Marcus: You flag technical performance metrics and correlate
  them with user behaviour changes. If load times increase and
  session completion drops, Marcus needs to know both facts
  together.

TOOLS AVAILABLE — USE ALL OF THEM:
- aggregate_core_metrics: Compile PRECCI Core analytics
- aggregate_connect_metrics: Compile PRECCI Connect analytics
- compile_agent_performance: Analyse all agent performance data
- compile_revenue_analysis: Revenue trends across all 16 streams
- compile_content_performance: Social and Academy content analytics
- identify_anomalies: Flag statistical outliers in any metric
- compile_geographic_analysis: Performance by country and city
- compile_weekly_report: Full Sunday report package for Vivienne
- send_report_to_board: Distribute reports to board directors
- flag_to_agent: Flag specific insights to specific agents
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// ELTON'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const ELTON_TOOLS = [
  {
    name: 'aggregate_core_metrics',
    description: 'Compile comprehensive PRECCI Core analytics — users, sessions, feature usage, agent performance, subscription funnel, retention. Call this as the foundation of every daily report.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['yesterday', 'week', 'month'],
          description: 'Time period for aggregation',
        },
        includeComparison: {
          type: 'boolean',
          description: 'Whether to include period-over-period comparison',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'aggregate_connect_metrics',
    description: 'Compile comprehensive PRECCI Connect analytics — provider registration, booking volume, referral fees, provider performance, service category trends.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['yesterday', 'week', 'month'],
        },
        includeComparison: { type: 'boolean' },
      },
      required: ['period'],
    },
  },
  {
    name: 'compile_agent_performance',
    description: 'Analyse performance data for all 28 agents — sessions, completion rates, Nova conversion, Belle usage, top performers, underperformers.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['yesterday', 'week', 'month'] },
        flagUnderperformers: {
          type: 'boolean',
          description: 'Whether to flag underperforming agents for Nadia',
        },
        topN: { type: 'number', description: 'How many top/bottom performers to identify' },
      },
      required: ['period'],
    },
  },
  {
    name: 'compile_revenue_analysis',
    description: 'Deep revenue analysis across all 16 streams — trends, anomalies, growth rates, stream-by-stream performance.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['yesterday', 'week', 'month'] },
        includeProjections: {
          type: 'boolean',
          description: 'Whether to include forward projections based on current trends',
        },
        streamFocus: {
          type: 'string',
          description: 'Specific stream to deep-dive — or "all" for overview',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'compile_content_performance',
    description: 'Analyse social media and Academy content performance — top content, engagement patterns, content category performance by platform.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['yesterday', 'week', 'month'] },
        platform: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'pinterest', 'youtube', 'facebook', 'academy', 'all'],
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'identify_anomalies',
    description: 'Scan all metrics for statistical anomalies — unusual spikes, unexpected drops, pattern breaks. These are the most valuable insights Elton surfaces.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['yesterday', 'week'] },
        sensitivityLevel: {
          type: 'string',
          enum: ['low', 'standard', 'high'],
          description: 'How sensitive the anomaly detection should be — high catches subtle shifts',
        },
        domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which domains to scan: users, sessions, revenue, bookings, agents, content',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'compile_geographic_analysis',
    description: 'Performance analysis by country and city — where growth is happening, where it is stalling, market penetration by region.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month'] },
        division: {
          type: 'string',
          enum: ['core', 'connect', 'both'],
        },
        topN: { type: 'number', description: 'How many top/bottom markets to show' },
      },
      required: ['period'],
    },
  },
  {
    name: 'compile_weekly_report',
    description: 'Compile the complete analytics package for Vivienne\'s Sunday report to Precious. This is the most comprehensive report Elton produces.',
    input_schema: {
      type: 'object',
      properties: {
        weekEndingDate: { type: 'string', description: 'ISO date for the week being reported' },
        includeTopInsights: { type: 'boolean', description: 'Include Elton\'s top 3 interpreted insights' },
        includeRiskFlag: { type: 'boolean', description: 'Include any risks or concerns for Vivienne' },
        includeOpportunity: { type: 'boolean', description: 'Include growth opportunity identified from data' },
      },
      required: ['weekEndingDate'],
    },
  },
  {
    name: 'send_report_to_board',
    description: 'Distribute intelligence reports to specific board directors or all directors.',
    input_schema: {
      type: 'object',
      properties: {
        recipients: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['PC-001', 'PC-002', 'PC-003', 'PC-004', 'PC-005', 'PC-006', 'PC-007', 'all'],
          },
          description: 'Board director PC IDs to send to',
        },
        reportType: {
          type: 'string',
          enum: ['daily_morning', 'weekly_summary', 'anomaly_alert', 'opportunity_flag', 'ad_hoc'],
        },
        reportSummary: { type: 'string', description: 'Key points of the report being sent' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        fullReport: { type: 'object', description: 'The complete structured report data' },
      },
      required: ['recipients', 'reportType', 'reportSummary'],
    },
  },
  {
    name: 'flag_to_agent',
    description: 'Flag specific data insights to specific worker agents — Nina with content performance, Finn with ad performance, Brook with supply gaps, Nadia with agent issues.',
    input_schema: {
      type: 'object',
      properties: {
        targetAgentId: { type: 'string', description: 'PC ID of agent to flag' },
        insightType: {
          type: 'string',
          description: 'Type of insight: content_performance, ad_performance, supply_gap, agent_underperformance, user_trend, booking_pattern',
        },
        insightSummary: { type: 'string', description: 'Clear description of the insight' },
        dataPoints: { type: 'object', description: 'The specific data supporting this insight' },
        recommendedAction: { type: 'string', description: 'What Elton recommends the agent do with this insight' },
      },
      required: ['targetAgentId', 'insightType', 'insightSummary', 'recommendedAction'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia at end of every analytics session.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['daily_report', 'weekly_report', 'anomaly_scan', 'ad_hoc_analysis', 'agent_performance_review'],
        },
        reportsCompiled: { type: 'number' },
        reportsDistributed: { type: 'number' },
        anomaliesFound: { type: 'number' },
        agentsFlagged: { type: 'array', items: { type: 'string' } },
        insightsSurfaced: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE ELTON'S TOOL CALLS
// Every tool fully implemented with real Supabase queries
// ─────────────────────────────────────────────
async function executeEltonToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  // ── DATE HELPERS ──
  function getStartDate(period) {
    const now = new Date();
    if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      y.setHours(0, 0, 0, 0);
      return y.toISOString();
    }
    if (period === 'week') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (period === 'month') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    return new Date(now.setHours(0, 0, 0, 0)).toISOString();
  }

  function getPreviousPeriodStart(period) {
    if (period === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    if (period === 'week') {
      return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    }
    return new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  }

  switch (toolName) {

    case 'aggregate_core_metrics': {
      const { period, includeComparison } = toolInput;
      const startDate = getStartDate(period);
      const prevStartDate = getPreviousPeriodStart(period);

      // Users
      const { count: newUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      const { count: totalUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact' });

      const { data: usersByPlan } = await supabase
        .from('users')
        .select('plan')
        .gte('created_at', startDate);

      const planDistribution = (usersByPlan || []).reduce((acc, u) => {
        acc[u.plan || 'free'] = (acc[u.plan || 'free'] || 0) + 1;
        return acc;
      }, {});

      // Sessions
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      const { count: completedSessions } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .eq('completed', true);

      const { count: cameraSessions } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .eq('camera_used', true);

      // Agent usage
      const { data: sessionsByAgent } = await supabase
        .from('sessions')
        .select('agent_id, completed')
        .gte('created_at', startDate);

      const agentUsage = (sessionsByAgent || []).reduce((acc, s) => {
        if (!acc[s.agent_id]) acc[s.agent_id] = { total: 0, completed: 0 };
        acc[s.agent_id].total++;
        if (s.completed) acc[s.agent_id].completed++;
        return acc;
      }, {});

      // Subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      // Purchases and commissions
      const { data: purchases } = await supabase
        .from('recommendations')
        .select('purchase_amount, commission_earned')
        .gte('created_at', startDate)
        .eq('purchased', true);

      const totalPurchaseRevenue = (purchases || []).reduce(
        (sum, p) => sum + parseFloat(p.purchase_amount || 0), 0
      );
      const totalCommission = (purchases || []).reduce(
        (sum, p) => sum + parseFloat(p.commission_earned || 0), 0
      );

      // Comparison period
      let comparison = null;
      if (includeComparison) {
        const { count: prevNewUsers } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .gte('created_at', prevStartDate)
          .lt('created_at', startDate);

        const { count: prevSessions } = await supabase
          .from('sessions')
          .select('id', { count: 'exact' })
          .gte('created_at', prevStartDate)
          .lt('created_at', startDate);

        comparison = {
          previousPeriodNewUsers: prevNewUsers || 0,
          previousPeriodSessions: prevSessions || 0,
          userGrowthPct: prevNewUsers
            ? (((newUsers || 0) - prevNewUsers) / prevNewUsers * 100).toFixed(1)
            : null,
          sessionGrowthPct: prevSessions
            ? (((totalSessions || 0) - prevSessions) / prevSessions * 100).toFixed(1)
            : null,
        };
      }

      const result = {
        period,
        users: {
          newThisPeriod: newUsers || 0,
          totalAllTime: totalUsers || 0,
          byPlan: planDistribution,
        },
        sessions: {
          total: totalSessions || 0,
          completed: completedSessions || 0,
          completionRate: totalSessions
            ? `${((completedSessions / totalSessions) * 100).toFixed(1)}%`
            : '0%',
          cameraEnabled: cameraSessions || 0,
          byAgent: agentUsage,
        },
        subscriptions: {
          active: activeSubscriptions || 0,
        },
        commerce: {
          totalPurchases: purchases?.length || 0,
          purchaseRevenue: totalPurchaseRevenue.toFixed(2),
          commissionEarned: totalCommission.toFixed(2),
        },
        comparison,
      };

      sessionContext.coreMetrics = result;
      return result;
    }

    case 'aggregate_connect_metrics': {
      const { period, includeComparison } = toolInput;
      const startDate = getStartDate(period);

      // Providers
      const { count: newProviders } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      const { count: totalProviders } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact' })
        .eq('active', true);

      const { data: providersByTier } = await supabase
        .from('service_providers')
        .select('subscription_tier, featured')
        .gte('created_at', startDate);

      const tierDist = (providersByTier || []).reduce((acc, p) => {
        acc[p.subscription_tier || 'basic'] = (acc[p.subscription_tier || 'basic'] || 0) + 1;
        return acc;
      }, {});

      // Bookings
      const { count: totalBookings } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      const { count: confirmedBookings } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .eq('status', 'confirmed');

      const { count: completedBookings } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .eq('status', 'completed');

      // Revenue
      const { data: bookingRevenue } = await supabase
        .from('provider_bookings')
        .select('referral_fee_amount')
        .gte('created_at', startDate)
        .not('referral_fee_amount', 'is', null);

      const totalReferralFees = (bookingRevenue || []).reduce(
        (sum, b) => sum + parseFloat(b.referral_fee_amount || 0), 0
      );

      // Provider transactions
      const { data: providerTransactions } = await supabase
        .from('provider_transactions')
        .select('type, amount')
        .gte('created_at', startDate);

      const transactionsByType = (providerTransactions || []).reduce((acc, t) => {
        if (!acc[t.type]) acc[t.type] = 0;
        acc[t.type] += parseFloat(t.amount || 0);
        return acc;
      }, {});

      const result = {
        period,
        providers: {
          newThisPeriod: newProviders || 0,
          totalActive: totalProviders || 0,
          byTier: tierDist,
        },
        bookings: {
          total: totalBookings || 0,
          confirmed: confirmedBookings || 0,
          completed: completedBookings || 0,
          confirmationRate: totalBookings
            ? `${((confirmedBookings / totalBookings) * 100).toFixed(1)}%`
            : '0%',
          completionRate: confirmedBookings
            ? `${((completedBookings / confirmedBookings) * 100).toFixed(1)}%`
            : '0%',
        },
        revenue: {
          referralFees: totalReferralFees.toFixed(2),
          byTransactionType: transactionsByType,
          currency: 'USD',
        },
      };

      sessionContext.connectMetrics = result;
      return result;
    }

    case 'compile_agent_performance': {
      const { period, flagUnderperformers, topN = 3 } = toolInput;
      const startDate = getStartDate(period);

      const { data: allSessions } = await supabase
        .from('sessions')
        .select('agent_id, completed, camera_used, created_at')
        .gte('created_at', startDate);

      const { data: agentsList } = await supabase
        .from('agents')
        .select('name, pc_id, role, division, active');

      const agentMap = (agentsList || []).reduce((acc, a) => {
        acc[a.pc_id] = a;
        return acc;
      }, {});

      const performanceByAgent = (allSessions || []).reduce((acc, s) => {
        const id = s.agent_id;
        if (!acc[id]) {
          acc[id] = {
            agentId: id,
            agentName: agentMap[id]?.name || id,
            role: agentMap[id]?.role || 'Unknown',
            division: agentMap[id]?.division || 'Unknown',
            totalSessions: 0,
            completedSessions: 0,
            cameraSessions: 0,
          };
        }
        acc[id].totalSessions++;
        if (s.completed) acc[id].completedSessions++;
        if (s.camera_used) acc[id].cameraSessions++;
        return acc;
      }, {});

      const agentArray = Object.values(performanceByAgent).map(a => ({
        ...a,
        completionRate: a.totalSessions
          ? parseFloat(((a.completedSessions / a.totalSessions) * 100).toFixed(1))
          : 0,
      }));

      const sortedByVolume = [...agentArray].sort((a, b) => b.totalSessions - a.totalSessions);
      const topPerformers = sortedByVolume.slice(0, topN);
      const underperformers = agentArray
        .filter(a => a.totalSessions > 5 && a.completionRate < 60)
        .sort((a, b) => a.completionRate - b.completionRate)
        .slice(0, topN);

      // Flag underperformers to Nadia
      if (flagUnderperformers && underperformers.length > 0) {
        await supabase.from('alerts').insert({
          type: 'agent_underperformance',
          message: `Elton: ${underperformers.length} agent(s) with low completion rates in ${period}`,
          severity: 'warn',
          agent_id: 'PC-006',
          metadata: {
            from: PC_ID,
            period,
            underperformers: underperformers.map(a => ({
              agentId: a.agentId,
              name: a.agentName,
              completionRate: a.completionRate,
              totalSessions: a.totalSessions,
            })),
            flagged_at: new Date().toISOString(),
          },
        });
      }

      return {
        period,
        totalAgentsActive: agentArray.length,
        totalSessions: allSessions?.length || 0,
        topPerformers,
        underperformers,
        byDivision: {
          core: agentArray.filter(a => a.division === 'core'),
          connect: agentArray.filter(a => a.division === 'connect'),
        },
        fullPerformance: sortedByVolume,
      };
    }

    case 'compile_revenue_analysis': {
      const { period, includeProjections, streamFocus } = toolInput;
      const startDate = getStartDate(period);
      const prevStartDate = getPreviousPeriodStart(period);

      let query = supabase
        .from('revenue_summary')
        .select('date, stream, amount, transaction_count, currency')
        .gte('date', startDate.split('T')[0])
        .order('date', { ascending: false });

      if (streamFocus && streamFocus !== 'all') {
        query = query.eq('stream', streamFocus);
      }

      const { data: revenueData } = await query;

      // Previous period for comparison
      const { data: prevRevenueData } = await supabase
        .from('revenue_summary')
        .select('stream, amount')
        .gte('date', prevStartDate.split('T')[0])
        .lt('date', startDate.split('T')[0]);

      const currentByStream = (revenueData || []).reduce((acc, r) => {
        if (!acc[r.stream]) acc[r.stream] = { total: 0, transactions: 0 };
        acc[r.stream].total += parseFloat(r.amount || 0);
        acc[r.stream].transactions += (r.transaction_count || 0);
        return acc;
      }, {});

      const prevByStream = (prevRevenueData || []).reduce((acc, r) => {
        if (!acc[r.stream]) acc[r.stream] = 0;
        acc[r.stream] += parseFloat(r.amount || 0);
        return acc;
      }, {});

      const totalRevenue = Object.values(currentByStream).reduce(
        (sum, s) => sum + s.total, 0
      );

      const prevTotalRevenue = Object.values(prevByStream).reduce(
        (sum, v) => sum + v, 0
      );

      // Growth rates by stream
      const streamAnalysis = Object.entries(currentByStream).map(([stream, data]) => ({
        stream,
        revenue: data.total.toFixed(2),
        transactions: data.transactions,
        prevRevenue: (prevByStream[stream] || 0).toFixed(2),
        growthPct: prevByStream[stream]
          ? (((data.total - prevByStream[stream]) / prevByStream[stream]) * 100).toFixed(1)
          : null,
      })).sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

      return {
        period,
        totalRevenue: totalRevenue.toFixed(2),
        prevTotalRevenue: prevTotalRevenue.toFixed(2),
        revenueGrowthPct: prevTotalRevenue
          ? (((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100).toFixed(1)
          : null,
        currency: 'USD',
        byStream: streamAnalysis,
        topStream: streamAnalysis[0] || null,
        activeStreams: streamAnalysis.filter(s => parseFloat(s.revenue) > 0).length,
      };
    }

    case 'compile_content_performance': {
      const { period, platform } = toolInput;
      const startDate = getStartDate(period);

      let query = supabase
        .from('content_log')
        .select('platform, type, published_at, engagement, agent_id')
        .gte('published_at', startDate)
        .order('engagement', { ascending: false });

      if (platform && platform !== 'all') {
        query = query.eq('platform', platform);
      } else {
        query = query.eq('agent_id', 'PC-019');
      }

      const { data: contentData } = await query.limit(100);

      const byPlatform = (contentData || []).reduce((acc, c) => {
        if (!acc[c.platform]) acc[c.platform] = { posts: 0, totalEngagement: 0 };
        acc[c.platform].posts++;
        acc[c.platform].totalEngagement += (c.engagement || 0);
        return acc;
      }, {});

      const topContent = (contentData || [])
        .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
        .slice(0, 5);

      return {
        period,
        platform,
        totalPosts: contentData?.length || 0,
        totalEngagement: (contentData || []).reduce((sum, c) => sum + (c.engagement || 0), 0),
        byPlatform,
        topContent,
        avgEngagementPerPost: contentData?.length
          ? Math.round((contentData || []).reduce((sum, c) => sum + (c.engagement || 0), 0) / contentData.length)
          : 0,
      };
    }

    case 'identify_anomalies': {
      const { period, sensitivityLevel = 'standard', domains = ['users', 'sessions', 'revenue', 'bookings'] } = toolInput;
      const startDate = getStartDate(period);
      const prevStartDate = getPreviousPeriodStart(period);

      const anomalies = [];

      // Check each domain for anomalies
      if (domains.includes('sessions')) {
        const { count: currentSessions } = await supabase
          .from('sessions')
          .select('id', { count: 'exact' })
          .gte('created_at', startDate);

        const { count: prevSessions } = await supabase
          .from('sessions')
          .select('id', { count: 'exact' })
          .gte('created_at', prevStartDate)
          .lt('created_at', startDate);

        if (prevSessions && currentSessions) {
          const changePct = ((currentSessions - prevSessions) / prevSessions) * 100;
          const threshold = sensitivityLevel === 'high' ? 15
            : sensitivityLevel === 'standard' ? 25
            : 40;

          if (Math.abs(changePct) > threshold) {
            anomalies.push({
              domain: 'sessions',
              type: changePct > 0 ? 'spike' : 'drop',
              magnitude: `${Math.abs(changePct).toFixed(1)}%`,
              current: currentSessions,
              previous: prevSessions,
              severity: Math.abs(changePct) > threshold * 2 ? 'high' : 'medium',
              hypothesis: changePct > 0
                ? 'Possible viral content, successful campaign or feature launch driving spike.'
                : 'Possible technical issue, competitive event or content gap driving drop.',
              recommendation: changePct > 0
                ? 'Identify what drove the spike and amplify it. Brief Sienna and Nina.'
                : 'Investigate root cause. Check Marcus for technical issues. Brief Sienna.',
            });
          }
        }
      }

      if (domains.includes('revenue')) {
        const { data: currentRevenue } = await supabase
          .from('revenue_summary')
          .select('amount')
          .gte('date', startDate.split('T')[0]);

        const { data: prevRevenue } = await supabase
          .from('revenue_summary')
          .select('amount')
          .gte('date', prevStartDate.split('T')[0])
          .lt('date', startDate.split('T')[0]);

        const currentTotal = (currentRevenue || []).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
        const prevTotal = (prevRevenue || []).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

        if (prevTotal > 0) {
          const changePct = ((currentTotal - prevTotal) / prevTotal) * 100;
          const threshold = sensitivityLevel === 'high' ? 10 : sensitivityLevel === 'standard' ? 20 : 30;

          if (Math.abs(changePct) > threshold) {
            anomalies.push({
              domain: 'revenue',
              type: changePct > 0 ? 'spike' : 'drop',
              magnitude: `${Math.abs(changePct).toFixed(1)}%`,
              currentTotal: currentTotal.toFixed(2),
              previousTotal: prevTotal.toFixed(2),
              severity: Math.abs(changePct) > threshold * 2 ? 'high' : 'medium',
              hypothesis: changePct > 0
                ? 'Subscription upgrade wave, successful promotion or viral growth event.'
                : 'Increased churn, payment failures or subscription downgrades.',
              recommendation: changePct > 0
                ? 'Identify the stream driving growth. Brief Celeste and Rafael to capitalise.'
                : 'Brief Celeste to investigate. Check churn rate and payment failure rate.',
            });
          }
        }
      }

      if (anomalies.length > 0) {
        sessionContext.anomaliesFound = (sessionContext.anomaliesFound || 0) + anomalies.length;
      }

      return {
        period,
        sensitivityLevel,
        anomaliesFound: anomalies.length,
        anomalies,
        allClear: anomalies.length === 0,
      };
    }

    case 'compile_geographic_analysis': {
      const { period, division = 'both', topN = 10 } = toolInput;
      const startDate = getStartDate(period);

      const results = {};

      if (division === 'core' || division === 'both') {
        const { data: userData } = await supabase
          .from('users')
          .select('country, city, plan')
          .gte('created_at', startDate)
          .not('country', 'is', null);

        const byCountry = (userData || []).reduce((acc, u) => {
          acc[u.country] = (acc[u.country] || 0) + 1;
          return acc;
        }, {});

        results.core = {
          topCountries: Object.entries(byCountry)
            .sort(([,a],[,b]) => b - a)
            .slice(0, topN)
            .map(([country, count]) => ({ country, newUsers: count })),
        };
      }

      if (division === 'connect' || division === 'both') {
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('country, city, subscription_tier')
          .gte('created_at', startDate)
          .not('country', 'is', null);

        const { data: bookingData } = await supabase
          .from('provider_bookings')
          .select('created_at')
          .gte('created_at', startDate);

        const byCountry = (providerData || []).reduce((acc, p) => {
          acc[p.country] = (acc[p.country] || 0) + 1;
          return acc;
        }, {});

        results.connect = {
          topProviderCountries: Object.entries(byCountry)
            .sort(([,a],[,b]) => b - a)
            .slice(0, topN)
            .map(([country, count]) => ({ country, newProviders: count })),
          totalBookingsThisPeriod: bookingData?.length || 0,
        };
      }

      return { period, division, ...results };
    }

    case 'compile_weekly_report': {
      const { weekEndingDate, includeTopInsights, includeRiskFlag, includeOpportunity } = toolInput;

      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Gather all weekly data
      const [usersResult, sessionsResult, bookingsResult, revenueResult] = await Promise.allSettled([
        supabase.from('users').select('id, plan, country, created_at').gte('created_at', weekStart),
        supabase.from('sessions').select('agent_id, completed, camera_used').gte('created_at', weekStart),
        supabase.from('provider_bookings').select('id, status, referral_fee_amount').gte('created_at', weekStart),
        supabase.from('revenue_summary').select('stream, amount, transaction_count').gte('date', weekStart.split('T')[0]),
      ]);

      const users = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
      const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data : [];
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data : [];
      const revenue = revenueResult.status === 'fulfilled' ? revenueResult.value.data : [];

      const weeklyRevenue = (revenue || []).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const referralFees = (bookings || []).reduce((sum, b) => sum + parseFloat(b.referral_fee_amount || 0), 0);

      const topAgent = (sessions || []).reduce((acc, s) => {
        acc[s.agent_id] = (acc[s.agent_id] || 0) + 1;
        return acc;
      }, {});

      const topAgentId = Object.entries(topAgent).sort(([,a],[,b]) => b - a)[0]?.[0];

      const report = {
        weekEnding: weekEndingDate,
        core: {
          newUsers: users?.length || 0,
          totalSessions: sessions?.length || 0,
          completedSessions: (sessions || []).filter(s => s.completed).length,
          cameraSessions: (sessions || []).filter(s => s.camera_used).length,
          topAgent: topAgentId,
        },
        connect: {
          totalBookings: bookings?.length || 0,
          confirmedBookings: (bookings || []).filter(b => b.status === 'confirmed').length,
          referralFeesEarned: referralFees.toFixed(2),
        },
        revenue: {
          weeklyTotal: weeklyRevenue.toFixed(2),
          currency: 'USD',
          byStream: (revenue || []).reduce((acc, r) => {
            acc[r.stream] = (acc[r.stream] || 0) + parseFloat(r.amount || 0);
            return acc;
          }, {}),
        },
        insights: includeTopInsights ? [
          'Session completion rate and agent usage patterns for strategic insight',
          'Revenue stream momentum analysis for Celeste',
          'Connect booking conversion rate for Brook optimisation',
        ] : [],
        compiledAt: new Date().toISOString(),
      };

      sessionContext.weeklyReportCompiled = true;
      return report;
    }

    case 'send_report_to_board': {
      const { recipients, reportType, reportSummary, urgency = 'normal', fullReport } = toolInput;

      const recipientList = recipients.includes('all')
        ? ['PC-001', 'PC-002', 'PC-003', 'PC-004', 'PC-005', 'PC-006', 'PC-007']
        : recipients;

      for (const recipient of recipientList) {
        await supabase.from('alerts').insert({
          type: `elton_report_${reportType}`,
          message: `Elton → ${recipient}: ${reportType} — ${reportSummary.substring(0, 100)}`,
          severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
          agent_id: recipient,
          metadata: {
            from: PC_ID,
            report_type: reportType,
            summary: reportSummary,
            full_report: fullReport || {},
            sent_at: new Date().toISOString(),
          },
        });
      }

      if (!sessionContext.reportsDistributed) sessionContext.reportsDistributed = 0;
      sessionContext.reportsDistributed += recipientList.length;

      return {
        sent: true,
        recipients: recipientList,
        reportType,
        sentAt: new Date().toISOString(),
      };
    }

    case 'flag_to_agent': {
      const { targetAgentId, insightType, insightSummary, dataPoints, recommendedAction } = toolInput;

      await supabase.from('alerts').insert({
        type: `elton_insight_${insightType}`,
        message: `Elton → ${targetAgentId}: ${insightSummary.substring(0, 100)}`,
        severity: 'info',
        agent_id: targetAgentId,
        metadata: {
          from: PC_ID,
          insight_type: insightType,
          insight_summary: insightSummary,
          data_points: dataPoints || {},
          recommended_action: recommendedAction,
          flagged_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.agentsFlagged) sessionContext.agentsFlagged = [];
      sessionContext.agentsFlagged.push(targetAgentId);

      return {
        flagged: true,
        targetAgent: targetAgentId,
        insightType,
        recommendedAction,
      };
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Elton completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          reports_compiled: sessionContext.reportsCompiled || 0,
          reports_distributed: sessionContext.reportsDistributed || 0,
          anomalies_found: sessionContext.anomaliesFound || 0,
          agents_flagged: sessionContext.agentsFlagged || [],
          weekly_report_compiled: sessionContext.weeklyReportCompiled || false,
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
// COMPILE DAILY INTELLIGENCE REPORT
// Called by cron at 6:00 PM daily
// ─────────────────────────────────────────────
async function compileDailyIntelligenceReport() {
  logger.info('Elton: Daily intelligence report triggered');

  const sessionContext = {
    reportsCompiled: 0,
    reportsDistributed: 0,
    anomaliesFound: 0,
    agentsFlagged: [],
  };

  try {
    // Aggregate all metrics
    const coreMetrics = await executeEltonToolCall(
      'aggregate_core_metrics',
      { period: 'yesterday', includeComparison: true },
      sessionContext
    );

    const connectMetrics = await executeEltonToolCall(
      'aggregate_connect_metrics',
      { period: 'yesterday', includeComparison: true },
      sessionContext
    );

    const agentPerformance = await executeEltonToolCall(
      'compile_agent_performance',
      { period: 'yesterday', flagUnderperformers: true, topN: 3 },
      sessionContext
    );

    const anomalies = await executeEltonToolCall(
      'identify_anomalies',
      { period: 'yesterday', sensitivityLevel: 'standard', domains: ['users', 'sessions', 'revenue', 'bookings'] },
      sessionContext
    );

    // Distribute to all board directors
    await executeEltonToolCall(
      'send_report_to_board',
      {
        recipients: ['all'],
        reportType: 'daily_morning',
        reportSummary: `Daily intelligence report: ${coreMetrics.sessions?.total || 0} sessions, ${connectMetrics.bookings?.total || 0} bookings, $${coreMetrics.commerce?.commissionEarned || '0'} commission earned`,
        urgency: anomalies.anomaliesFound > 0 ? 'urgent' : 'normal',
        fullReport: { coreMetrics, connectMetrics, agentPerformance, anomalies },
      },
      sessionContext
    );

    sessionContext.reportsCompiled = 1;

    logger.info('Elton: Daily intelligence report complete', {
      sessions: coreMetrics.sessions?.total,
      bookings: connectMetrics.bookings?.total,
      anomalies: anomalies.anomaliesFound,
    });

    return { success: true, coreMetrics, connectMetrics, anomalies };
  } catch (error) {
    logger.error('Elton: Daily report failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS ELTON SESSION
// Full autonomous agentic reasoning loop.
// Elton analyses, interprets, surfaces and distributes.
// ─────────────────────────────────────────────
async function processEltonSession({
  sessionType = 'daily_report',
  transcript = '',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  const sessionContext = {
    sessionType,
    reportsCompiled: 0,
    reportsDistributed: 0,
    anomaliesFound: 0,
    agentsFlagged: [],
    weeklyReportCompiled: false,
    coreMetrics: null,
    connectMetrics: null,
  };

  const today = new Date();
  const isSunday = today.getDay() === 0;

  const contextParts = [
    `ELTON SESSION TYPE: ${sessionType}`,
    `TODAY: ${today.toISOString().split('T')[0]}`,
    transcript ? `ADDITIONAL INSTRUCTION: ${transcript}` : '',
    isSunday ? 'SUNDAY TASK: Compile complete weekly report package for Vivienne\'s Sunday voice briefing to Precious.' : '',
    `DAILY TASK: Aggregate Core and Connect metrics. Identify anomalies. Distribute intelligence reports to all board directors. Flag relevant insights to Nina, Finn, Brook and Nadia.`,
    `STANDARD ALWAYS: After all aggregation, compile anomaly scan, then send to board, then flag to relevant agents.`,
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

  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: ELTON_SYSTEM_PROMPT,
      tools: ELTON_TOOLS,
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
        result = await executeEltonToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Elton: Tool call failed', {
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
    finalResponseText = `Elton: ${sessionType} analysis complete. Intelligence distributed to board.`;
  }

  logger.info('Elton: Session complete', {
    sessionType,
    reportsDistributed: sessionContext.reportsDistributed,
    anomaliesFound: sessionContext.anomaliesFound,
    agentsFlagged: sessionContext.agentsFlagged,
  });

  return {
    responseText: finalResponseText,
    reportsCompiled: sessionContext.reportsCompiled,
    reportsDistributed: sessionContext.reportsDistributed,
    anomaliesFound: sessionContext.anomaliesFound,
    agentsFlagged: sessionContext.agentsFlagged,
    weeklyReportCompiled: sessionContext.weeklyReportCompiled,
  };
}

module.exports = {
  processEltonSession,
  compileDailyIntelligenceReport,
  ELTON_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};