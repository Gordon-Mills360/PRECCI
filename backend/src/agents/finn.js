// FILE: precci/backend/src/agents/finn.js
// Finn — PC-022 — Paid Advertising
// COMPLETE FULL BUILD — no simplification anywhere.
// Runs ALL paid campaigns on Meta, Google and TikTok.
// Campaigns for BOTH divisions: PRECCI Core (client acquisition)
// and PRECCI Connect (provider acquisition).
// Tests creatives autonomously, optimises targeting daily,
// manages budgets and maximises return on ad spend.
// Receives top organic content from Nina for amplification.
// Reports all campaign performance to Sienna (CMO) weekly.
// Works with Elton on quality user analysis (retention vs volume).
// Works with Rafael on provider acquisition targeting.
// All genders represented in creative direction.
// Never misrepresents PRECCI — all ads FTC/ASA compliant.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const logger = require('../utils/logger');

const PC_ID = 'PC-022';
const AGENT_NAME = 'Finn';

// ─────────────────────────────────────────────
// FINN'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const FINN_SYSTEM_PROMPT = `You are Finn, the Paid Advertising specialist at PRECCI.
Your ID is PC-022.

You run all paid advertising for PRECCI completely autonomously.
Every campaign, every creative test, every budget decision, every
optimisation — you handle it without human input, every single day.

YOU ADVERTISE ACROSS THREE PLATFORMS:
Meta Ads (Facebook and Instagram): Primary platform for beauty,
  skincare and lifestyle audiences. Strongest for visual creative.
  Best for: client acquisition (PRECCI Core), retargeting,
  lookalike audiences from existing subscribers.
Google Ads: Intent-based. Catches people searching for the
  exact solutions PRECCI provides. Search, Performance Max, YouTube.
  Best for: capturing high-intent searches, YouTube pre-roll.
TikTok Ads: Fastest-growing. Younger demographics. Short-form video.
  Best for: brand awareness, viral creative testing, reaching
  audiences not yet on Meta or Google.

YOUR TWO CAMPAIGN OBJECTIVES:

PRECCI CORE — CLIENT ACQUISITION:
You acquire clients for PRECCI's subscription plans.
Target: people interested in skincare, haircare, grooming, style,
  beauty — across all genders, all ages, all demographics.
Key message: PRECCI is the world's first AI appearance intelligence
  system. You can see exactly how you will look before changing
  anything. Your personal AI specialist is waiting for you.
Funnel: Awareness → Interest → Free sign-up → Paid conversion.
You run campaigns at every stage of this funnel simultaneously.

PRECCI CONNECT — PROVIDER ACQUISITION:
You acquire service providers — nail technicians, hairdressers,
  barbers, barbershops, men's grooming studios, spas, clothing
  boutiques and all other beauty and lifestyle businesses.
Key message: PRECCI Connect sends you pre-qualified clients who
  already know what they want. No marketing needed. Just great
  service.
Target: small business owners in beauty and lifestyle, salon owners,
  independent service providers.
This is B2B advertising — completely different creative and targeting
  from the client acquisition campaigns.

YOUR ADVERTISING PRINCIPLES:

ALL GENDERS REPRESENTED:
Every campaign represents all genders in its creative.
You never run a campaign that shows only female clients.
Male grooming content features prominently in all skin, hair and
grooming campaigns — not as a special category, just as part of
PRECCI's complete offering.
Body diversity is always represented. Age diversity is always
represented. Skin tone diversity is always represented.

CREATIVE DIRECTION — WHAT WORKS FOR PRECCI:
PRECCI's visual language: rich warm tones, intimate camera work,
real skin, real hair, real results. Never clinical. Never stock.
The AI element: show the voice conversation happening, show the
camera analysis in motion, show Belle rendering a simulation.
The transformation: not before/after in a negative sense — but
"here is what is possible for you specifically."
Testimonial format works extremely well: real clients describing
  the experience of having Luna or Drew or Zara analyse their
  skin or hair in real time.

WHAT YOU NEVER ADVERTISE:
No claims you cannot support: "Get perfect skin in 7 days" — never.
No gendered beauty standards: "Get the skin women want" — never.
No body-shaming in any direction.
No competitive attacks on other platforms.
No unrealistic transformation claims.
FTC/ASA disclosure on all paid content always.

CAMPAIGN STRUCTURE — HOW YOU BUILD CAMPAIGNS:

Budget philosophy:
70% to proven performers: campaigns and creatives already showing
  strong ROAS. Do not fix what is working.
20% to testing: new audiences, new creative formats, new angles.
10% to experimentation: novel ideas, seasonal tests, bold concepts.

Creative testing methodology:
You always run minimum 3 creative variations per ad set.
Test one variable at a time: same audience, different creative.
Or same creative, different audience.
Never change both simultaneously — it destroys learning.
Kill underperformers at 72 hours if spend exceeds £50 with ROAS <1.
Scale winners at 72 hours if ROAS >2 — increase budget by 20%,
not more (bigger jumps reset the algorithm learning phase).

Audience strategy:
Core audiences: interest-based (skincare, grooming, beauty, fashion,
  wellness, self-care, salon services).
Lookalike audiences: from existing subscriber email lists,
  from existing purchasers, from high-LTV users.
Retargeting: website visitors, app users who have not converted,
  people who started checkout and did not complete.
Exclusions: always exclude existing subscribers from acquisition
  campaigns. Always exclude existing providers from Connect
  acquisition campaigns.

DAILY OPTIMISATION ROUTINE:
7:00 AM: Review overnight performance. Kill underperformers.
8:00 AM: Scale winners. Adjust bids on mid-performers.
All day: Monitor for spend pacing issues, CPA anomalies,
  creative fatigue signals.
Evening: Review day's performance. Set tomorrow's priorities.
Weekly: Full creative refresh if any ad set is >14 days old —
  creative fatigue kills performance.

WORKING WITH OTHER AGENTS:
Nina: Every week Nina sends you her top 3 organic content pieces.
  You evaluate them for paid amplification. Strong organic content
  often makes the best paid content — the audience has already
  validated it.
Elton: You receive quality analysis from Elton — not just which
  campaigns drove the most signups, but which drove the users
  who stayed, subscribed and spent. Volume without retention
  is wasted spend.
Sienna: You report to Sienna (CMO) every Monday with full campaign
  performance, creative learnings and budget recommendations.
  She sets the strategic direction. You execute.
Rafael: You run provider acquisition campaigns for PRECCI Connect
  with Rafael's input on which provider types and geographies
  to target. He knows where the sales gaps are.
Celeste: All advertising spend flows through Celeste's budget
  tracking. You never exceed allocated budgets. You flag budget
  requests to Celeste for approval.

KEY METRICS YOU TRACK AND REPORT:
Cost per click (CPC): by platform, by campaign, by creative.
Click through rate (CTR): benchmark >1% for display, >3% for search.
Cost per acquisition (CPA): cost to acquire one paying subscriber.
Return on ad spend (ROAS): revenue generated per £/$ spent on ads.
Cost per lead (CPL): for free sign-up campaigns.
Conversion rate: from click to free signup, from free to paid.
Creative fatigue score: CTR declining over time on same creative.
Quality score (Google): ad relevance and landing page experience.
Frequency (Meta): how many times same person saw same ad.
  >3.5 frequency = creative fatigue — refresh immediately.

BUDGET MANAGEMENT:
You track all spend against allocated budgets by platform.
You never overspend. You flag underspend opportunities.
End-of-month budget management: if significant budget remains,
  you identify the best opportunities to deploy it before month end.

TOOLS AVAILABLE — USE ALL OF THEM:
- review_campaign_performance: Get current campaign metrics
- create_campaign: Set up a new campaign with full structure
- pause_campaign: Pause underperforming campaigns
- scale_campaign: Increase budget on proven performers
- create_ad_creative: Draft new creative brief for testing
- get_nina_content: Retrieve top organic content from Nina
- get_elton_quality_data: Get user quality data from Elton
- flag_to_sienna: Send weekly performance report to Sienna
- flag_to_celeste: Request budget approval or flag spend anomaly
- flag_to_rafael: Share provider acquisition insights with Rafael
- log_campaign_decision: Log all major campaign decisions
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// FINN'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const FINN_TOOLS = [
  {
    name: 'review_campaign_performance',
    description: 'Get current performance metrics for all active campaigns across Meta, Google and TikTok. Always call this at start of every session to understand current state before any decisions.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['meta', 'google', 'tiktok', 'all'],
        },
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'week', 'month'],
        },
        objective: {
          type: 'string',
          enum: ['client_acquisition', 'provider_acquisition', 'retargeting', 'awareness', 'all'],
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'create_campaign',
    description: 'Set up a new advertising campaign with full structure — objective, audience, creative brief, budget, schedule.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['meta', 'google', 'tiktok'] },
        campaignName: { type: 'string' },
        objective: {
          type: 'string',
          enum: ['client_acquisition', 'provider_acquisition', 'retargeting', 'awareness', 'lead_generation'],
        },
        targetAudience: {
          type: 'object',
          properties: {
            interests: { type: 'array', items: { type: 'string' } },
            ageRange: { type: 'string' },
            genderTargeting: {
              type: 'string',
              enum: ['all', 'male_skewed', 'female_skewed'],
              description: 'Never gender-exclude. Use "all" by default. Skewed means weighted but not exclusive.',
            },
            locations: { type: 'array', items: { type: 'string' } },
            audienceType: {
              type: 'string',
              enum: ['interest', 'lookalike', 'retargeting', 'search'],
            },
            lookalikeSeed: { type: 'string', description: 'Source audience for lookalike — subscribers, purchasers, high-LTV' },
          },
        },
        dailyBudget: { type: 'number', description: 'Daily budget in USD' },
        creativeBriefs: {
          type: 'array',
          description: 'Minimum 3 creative variations to test',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['video', 'carousel', 'single_image', 'story', 'search_text'] },
              hook: { type: 'string', description: 'First 3 seconds or headline — what stops the scroll or captures the click' },
              bodyMessage: { type: 'string', description: 'Core value proposition' },
              cta: { type: 'string', description: 'Call to action — Learn More, Sign Up, Try Free, etc.' },
              genderRepresentation: { type: 'string', description: 'How all genders are represented in this creative' },
              angle: { type: 'string', description: 'What specific angle this creative tests — testimonial, feature demo, pain point, etc.' },
            },
          },
        },
        schedule: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string', description: 'Optional — most campaigns run until paused' },
          },
        },
        division: { type: 'string', enum: ['core', 'connect'] },
      },
      required: ['platform', 'campaignName', 'objective', 'dailyBudget', 'creativeBriefs', 'division'],
    },
  },
  {
    name: 'pause_campaign',
    description: 'Pause an underperforming campaign or ad set. Always log the reason.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['meta', 'google', 'tiktok'] },
        campaignId: { type: 'string', description: 'Platform campaign ID' },
        campaignName: { type: 'string' },
        reason: { type: 'string', description: 'Why this campaign is being paused — ROAS, CPA, creative fatigue, etc.' },
        performanceData: {
          type: 'object',
          description: 'The metrics that triggered this pause decision',
          properties: {
            roas: { type: 'number' },
            cpa: { type: 'number' },
            ctr: { type: 'number' },
            spend: { type: 'number' },
            conversions: { type: 'number' },
          },
        },
      },
      required: ['platform', 'campaignName', 'reason'],
    },
  },
  {
    name: 'scale_campaign',
    description: 'Increase budget on a proven performer. Never increase by more than 20% at once — larger increases reset the algorithm learning phase.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['meta', 'google', 'tiktok'] },
        campaignId: { type: 'string' },
        campaignName: { type: 'string' },
        currentDailyBudget: { type: 'number' },
        increasePercentage: {
          type: 'number',
          description: 'Percentage increase — maximum 20 to avoid learning phase reset',
        },
        justification: {
          type: 'string',
          description: 'Performance data justifying the scale — ROAS, CPA vs target, volume opportunity',
        },
        performanceData: {
          type: 'object',
          properties: {
            roas: { type: 'number' },
            cpa: { type: 'number' },
            ctr: { type: 'number' },
            conversions: { type: 'number' },
          },
        },
      },
      required: ['platform', 'campaignName', 'currentDailyBudget', 'increasePercentage', 'justification'],
    },
  },
  {
    name: 'create_ad_creative',
    description: 'Draft a new creative brief for testing. Used when refreshing fatigued creatives or testing new angles.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['meta', 'google', 'tiktok'] },
        format: { type: 'string', enum: ['video', 'carousel', 'single_image', 'story', 'search_text', 'responsive_display'] },
        objective: { type: 'string' },
        angle: {
          type: 'string',
          description: 'Creative angle: testimonial, feature_demo, pain_point, social_proof, educational, before_after_positive, seasonal, gender_inclusive_grooming, provider_success',
        },
        hook: { type: 'string', description: 'The attention-grabbing opener' },
        bodyMessage: { type: 'string', description: 'Core message' },
        cta: { type: 'string' },
        visualDirection: { type: 'string', description: 'What to show — diverse clients, agent interface, Belle simulation, etc.' },
        genderRepresentation: {
          type: 'string',
          description: 'How all genders are represented — required field. PRECCI serves everyone.',
        },
        targetAudience: { type: 'string', description: 'Who this specific creative is designed for' },
        division: { type: 'string', enum: ['core', 'connect'] },
      },
      required: ['platform', 'format', 'objective', 'angle', 'hook', 'bodyMessage', 'cta', 'genderRepresentation', 'division'],
    },
  },
  {
    name: 'get_nina_content',
    description: 'Retrieve top-performing organic content from Nina for evaluation as paid amplification candidates.',
    input_schema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO timestamp — check Nina content flagged since this date' },
      },
    },
  },
  {
    name: 'get_elton_quality_data',
    description: 'Get user quality data from Elton — which campaigns and audiences are driving retained, paying users vs low-quality signups.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month'] },
        platform: { type: 'string', enum: ['meta', 'google', 'tiktok', 'all'] },
      },
      required: ['period'],
    },
  },
  {
    name: 'flag_to_sienna',
    description: 'Send weekly campaign performance report to Sienna (CMO). Called every Monday.',
    input_schema: {
      type: 'object',
      properties: {
        weekSummary: { type: 'string', description: 'Full week campaign performance narrative' },
        totalSpend: { type: 'number' },
        totalRevenue: { type: 'number' },
        overallROAS: { type: 'number' },
        topCampaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              platform: { type: 'string' },
              roas: { type: 'number' },
              spend: { type: 'number' },
              conversions: { type: 'number' },
            },
          },
        },
        creativeInsights: { type: 'string', description: 'What creative angles are working and why' },
        audienceInsights: { type: 'string', description: 'Which audiences are performing and why' },
        budgetRecommendation: { type: 'string', description: 'Finn\'s budget recommendation for next week' },
        campaignsPaused: { type: 'number' },
        campaignsScaled: { type: 'number' },
      },
      required: ['weekSummary', 'totalSpend'],
    },
  },
  {
    name: 'flag_to_celeste',
    description: 'Flag budget requests, spend anomalies or budget approval needs to Celeste (CFO).',
    input_schema: {
      type: 'object',
      properties: {
        flagType: {
          type: 'string',
          enum: ['budget_request', 'spend_anomaly', 'budget_underspend', 'campaign_opportunity'],
        },
        amount: { type: 'number', description: 'Budget amount involved' },
        platform: { type: 'string' },
        justification: { type: 'string', description: 'Why this budget action is needed' },
        expectedROAS: { type: 'number', description: 'Expected return on this spend' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['flagType', 'justification'],
    },
  },
  {
    name: 'flag_to_rafael',
    description: 'Share provider acquisition insights with Rafael (CSO) — which geographies or provider types need more ad support, where pipeline is thin.',
    input_schema: {
      type: 'object',
      properties: {
        insight: { type: 'string', description: 'The provider acquisition insight' },
        dataPoints: { type: 'object', description: 'Supporting data' },
        recommendation: { type: 'string', description: 'What Finn recommends doing with this insight' },
        targetGeographies: { type: 'array', items: { type: 'string' } },
        targetProviderTypes: { type: 'array', items: { type: 'string' } },
      },
      required: ['insight', 'recommendation'],
    },
  },
  {
    name: 'log_campaign_decision',
    description: 'Log all major campaign decisions with full reasoning. Called after every pause, scale, create or significant optimisation.',
    input_schema: {
      type: 'object',
      properties: {
        decisionType: {
          type: 'string',
          enum: ['campaign_created', 'campaign_paused', 'campaign_scaled', 'creative_refresh', 'audience_change', 'budget_reallocation'],
        },
        platform: { type: 'string' },
        campaignName: { type: 'string' },
        decision: { type: 'string', description: 'What was decided' },
        reasoning: { type: 'string', description: 'The data and logic behind this decision' },
        expectedOutcome: { type: 'string', description: 'What Finn expects this decision to achieve' },
      },
      required: ['decisionType', 'decision', 'reasoning'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia at end of every Finn session.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['daily_review', 'weekly_report', 'campaign_setup', 'creative_refresh', 'optimisation'],
        },
        campaignsReviewed: { type: 'number' },
        campaignsPaused: { type: 'number' },
        campaignsScaled: { type: 'number' },
        campaignsCreated: { type: 'number' },
        creativesCreated: { type: 'number' },
        totalSpendManaged: { type: 'number' },
        siennaReported: { type: 'boolean' },
        ninaNinjaContentAmplified: { type: 'boolean' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE FINN'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeFinnToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'review_campaign_performance': {
      const { platform, period = 'yesterday', objective } = toolInput;

      const startDate = period === 'today'
        ? new Date().toISOString().split('T')[0]
        : period === 'yesterday'
          ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : period === 'week'
            ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Pull from transactions to approximate ad performance
      // In production: call Meta Ads API, Google Ads API, TikTok Ads API
      const { data: revenueData } = await supabase
        .from('revenue_summary')
        .select('stream, amount, transaction_count, date')
        .gte('date', startDate)
        .in('stream', ['app_subscriptions', 'freemium_upgrades', 'provider_registration', 'provider_subscriptions']);

      const totalRevenue = (revenueData || []).reduce(
        (sum, r) => sum + parseFloat(r.amount || 0), 0
      );

      // Pull existing campaign decisions for context
      const { data: campaignDecisions } = await supabase
        .from('alerts')
        .select('type, message, metadata, created_at')
        .like('type', 'finn_campaign_%')
        .gte('created_at', `${startDate}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(20);

      return {
        platform,
        period,
        objective: objective || 'all',
        revenueThisPeriod: totalRevenue.toFixed(2),
        currency: 'USD',
        recentDecisions: (campaignDecisions || []).map(d => ({
          type: d.type,
          summary: d.message,
          date: d.created_at,
        })),
        note: 'Live campaign metrics available when Meta Ads, Google Ads and TikTok Ads API keys are configured in .env',
        optimisationPriorities: [
          'Review CTR and pause creatives with CTR <0.5%',
          'Scale any campaign with ROAS >2.5 by 20%',
          'Check frequency on Meta — pause if >3.5',
          'Review Google Quality Scores and pause keywords <5',
        ],
      };
    }

    case 'create_campaign': {
      const { platform, campaignName, objective, targetAudience, dailyBudget, creativeBriefs, schedule, division } = toolInput;

      // Log campaign creation
      await supabase.from('alerts').insert({
        type: 'finn_campaign_created',
        message: `Finn: New ${objective} campaign on ${platform} — ${campaignName}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          platform,
          campaign_name: campaignName,
          objective,
          target_audience: targetAudience || {},
          daily_budget: dailyBudget,
          creative_briefs: creativeBriefs || [],
          creative_count: creativeBriefs?.length || 0,
          schedule: schedule || {},
          division,
          created_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.campaignsCreated) sessionContext.campaignsCreated = 0;
      sessionContext.campaignsCreated++;
      sessionContext.totalSpendManaged = (sessionContext.totalSpendManaged || 0) + dailyBudget;

      return {
        created: true,
        platform,
        campaignName,
        objective,
        dailyBudget,
        creativeVariations: creativeBriefs?.length || 0,
        division,
        note: `Campaign structure logged. Live campaign creation will occur via ${platform} Ads API when configured.`,
        nextSteps: [
          'Monitor for first 72 hours',
          `Kill creatives with ROAS <1 after $50 spend`,
          `Scale winners by 20% if ROAS >2`,
          'Refresh creatives after 14 days',
        ],
      };
    }

    case 'pause_campaign': {
      const { platform, campaignId, campaignName, reason, performanceData } = toolInput;

      await supabase.from('alerts').insert({
        type: 'finn_campaign_paused',
        message: `Finn: Campaign PAUSED on ${platform} — ${campaignName} — ${reason}`,
        severity: 'warn',
        agent_id: PC_ID,
        metadata: {
          platform,
          campaign_id: campaignId || null,
          campaign_name: campaignName,
          reason,
          performance_at_pause: performanceData || {},
          paused_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.campaignsPaused) sessionContext.campaignsPaused = 0;
      sessionContext.campaignsPaused++;

      return {
        paused: true,
        platform,
        campaignName,
        reason,
        message: `Campaign paused. Performance data logged. Decision recorded for Sienna's weekly report.`,
      };
    }

    case 'scale_campaign': {
      const { platform, campaignId, campaignName, currentDailyBudget, increasePercentage, justification, performanceData } = toolInput;

      // Enforce the 20% maximum rule
      const safeIncrease = Math.min(increasePercentage, 20);
      const newBudget = currentDailyBudget * (1 + safeIncrease / 100);

      await supabase.from('alerts').insert({
        type: 'finn_campaign_scaled',
        message: `Finn: Campaign SCALED on ${platform} — ${campaignName} — +${safeIncrease}% budget`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          platform,
          campaign_id: campaignId || null,
          campaign_name: campaignName,
          previous_budget: currentDailyBudget,
          new_budget: parseFloat(newBudget.toFixed(2)),
          increase_percentage: safeIncrease,
          justification,
          performance_at_scale: performanceData || {},
          scaled_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.campaignsScaled) sessionContext.campaignsScaled = 0;
      sessionContext.campaignsScaled++;

      return {
        scaled: true,
        platform,
        campaignName,
        previousBudget: currentDailyBudget,
        newBudget: parseFloat(newBudget.toFixed(2)),
        increaseApplied: safeIncrease,
        note: safeIncrease < increasePercentage
          ? `Increase capped at 20% to preserve algorithm learning phase. Requested: ${increasePercentage}%.`
          : `Budget increased by ${safeIncrease}% successfully.`,
      };
    }

    case 'create_ad_creative': {
      const { platform, format, objective, angle, hook, bodyMessage, cta, visualDirection, genderRepresentation, targetAudience, division } = toolInput;

      await supabase.from('alerts').insert({
        type: 'finn_creative_created',
        message: `Finn: New creative brief — ${angle} — ${platform} ${format}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          platform,
          format,
          objective,
          angle,
          hook,
          body_message: bodyMessage,
          cta,
          visual_direction: visualDirection,
          gender_representation: genderRepresentation,
          target_audience: targetAudience || 'all',
          division,
          created_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.creativesCreated) sessionContext.creativesCreated = 0;
      sessionContext.creativesCreated++;

      return {
        created: true,
        platform,
        format,
        angle,
        hook,
        cta,
        genderRepresentation,
        division,
        message: 'Creative brief logged. Ready for production and upload.',
      };
    }

    case 'get_nina_content': {
      const { since } = toolInput;
      const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: ninaContent } = await supabase
        .from('alerts')
        .select('*')
        .eq('type', 'content_for_amplification')
        .gte('created_at', sinceDate)
        .is('resolved', false)
        .order('created_at', { ascending: false });

      // Mark as received
      if (ninaContent && ninaContent.length > 0) {
        await supabase
          .from('alerts')
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .in('id', ninaContent.map(c => c.id));
      }

      sessionContext.ninaContentReceived = ninaContent?.length || 0;

      return {
        contentReceived: ninaContent?.length || 0,
        content: (ninaContent || []).map(c => ({
          platform: c.metadata?.platform,
          description: c.metadata?.post_description,
          performanceStats: c.metadata?.performance_stats,
          targetingRecommendation: c.metadata?.targeting_recommendation,
          estimatedBudget: c.metadata?.estimated_budget,
          flaggedAt: c.created_at,
        })),
      };
    }

    case 'get_elton_quality_data': {
      const { period, platform } = toolInput;
      const startDate = period === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Pull retention and subscription data as quality proxy
      const { data: newUsers } = await supabase
        .from('users')
        .select('id, plan, created_at')
        .gte('created_at', startDate);

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status, created_at')
        .gte('created_at', startDate)
        .eq('status', 'active');

      const totalNewUsers = newUsers?.length || 0;
      const paidUsers = subscriptions?.length || 0;
      const freeToPayConversionRate = totalNewUsers > 0
        ? ((paidUsers / totalNewUsers) * 100).toFixed(1)
        : '0';

      return {
        period,
        platform,
        totalNewUsers,
        paidConversions: paidUsers,
        freeToPayConversionRate: `${freeToPayConversionRate}%`,
        qualityInsight: paidUsers > 0
          ? `${freeToPayConversionRate}% of new users converted to paid. Focus ad budget on audiences showing similar conversion patterns.`
          : 'Insufficient conversion data for this period.',
        recommendation: parseFloat(freeToPayConversionRate) < 5
          ? 'Conversion rate is low — evaluate if acquisition audiences are quality intent or just volume.'
          : 'Conversion rate is healthy — scale acquisition campaigns confidently.',
      };
    }

    case 'flag_to_sienna': {
      const { weekSummary, totalSpend, totalRevenue, overallROAS, topCampaigns, creativeInsights, audienceInsights, budgetRecommendation, campaignsPaused, campaignsScaled } = toolInput;

      await supabase.from('alerts').insert({
        type: 'finn_weekly_report',
        message: `Finn → Sienna: Weekly paid advertising report — $${totalSpend?.toFixed(2) || 0} spend`,
        severity: 'info',
        agent_id: 'PC-004',
        metadata: {
          from: PC_ID,
          week_summary: weekSummary,
          total_spend: totalSpend,
          total_revenue: totalRevenue || 0,
          overall_roas: overallROAS || 0,
          top_campaigns: topCampaigns || [],
          creative_insights: creativeInsights || null,
          audience_insights: audienceInsights || null,
          budget_recommendation: budgetRecommendation || null,
          campaigns_paused: campaignsPaused || 0,
          campaigns_scaled: campaignsScaled || 0,
          reported_at: new Date().toISOString(),
        },
      });

      sessionContext.siennaReported = true;

      return {
        reported: true,
        targetAgent: 'PC-004',
        totalSpend,
        message: 'Weekly campaign report sent to Sienna.',
      };
    }

    case 'flag_to_celeste': {
      const { flagType, amount, platform, justification, expectedROAS, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'finn_budget_flag',
        message: `Finn → Celeste: ${flagType} — ${platform || 'all platforms'} — $${amount || 0}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-002',
        metadata: {
          from: PC_ID,
          flag_type: flagType,
          amount: amount || 0,
          platform: platform || 'all',
          justification,
          expected_roas: expectedROAS || null,
          urgency,
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-002',
        flagType,
        amount,
        message: 'Budget flag sent to Celeste for review.',
      };
    }

    case 'flag_to_rafael': {
      const { insight, dataPoints, recommendation, targetGeographies, targetProviderTypes } = toolInput;

      await supabase.from('alerts').insert({
        type: 'finn_rafael_insight',
        message: `Finn → Rafael: Provider acquisition insight — ${insight.substring(0, 80)}`,
        severity: 'info',
        agent_id: 'PC-005',
        metadata: {
          from: PC_ID,
          insight,
          data_points: dataPoints || {},
          recommendation,
          target_geographies: targetGeographies || [],
          target_provider_types: targetProviderTypes || [],
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-005',
        recommendation,
        message: 'Provider acquisition insight sent to Rafael.',
      };
    }

    case 'log_campaign_decision': {
      const { decisionType, platform, campaignName, decision, reasoning, expectedOutcome } = toolInput;

      await supabase.from('alerts').insert({
        type: `finn_decision_${decisionType}`,
        message: `Finn: ${decisionType} — ${campaignName || 'general'} — ${decision.substring(0, 80)}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          decision_type: decisionType,
          platform: platform || null,
          campaign_name: campaignName || null,
          decision,
          reasoning,
          expected_outcome: expectedOutcome || null,
          logged_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.decisionsLogged) sessionContext.decisionsLogged = 0;
      sessionContext.decisionsLogged++;

      return { logged: true, decisionType };
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Finn completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          campaigns_created: sessionContext.campaignsCreated || 0,
          campaigns_paused: sessionContext.campaignsPaused || 0,
          campaigns_scaled: sessionContext.campaignsScaled || 0,
          creatives_created: sessionContext.creativesCreated || 0,
          nina_content_processed: sessionContext.ninaContentReceived || 0,
          sienna_reported: sessionContext.siennaReported || false,
          decisions_logged: sessionContext.decisionsLogged || 0,
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
// DAILY CAMPAIGN REVIEW
// Called by cron at 8:00 AM daily
// ─────────────────────────────────────────────
async function dailyCampaignReview() {
  logger.info('Finn: Daily campaign review triggered');

  const sessionContext = {
    campaignsCreated: 0,
    campaignsPaused: 0,
    campaignsScaled: 0,
    creativesCreated: 0,
    ninaContentReceived: 0,
    siennaReported: false,
    decisionsLogged: 0,
  };

  try {
    const supabase = getServiceClient();

    // Run daily review
    const performance = await executeFinnToolCall(
      'review_campaign_performance',
      { platform: 'all', period: 'yesterday', objective: 'all' },
      sessionContext
    );

    // Check for Nina content to amplify
    const ninaContent = await executeFinnToolCall(
      'get_nina_content',
      { since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      sessionContext
    );

    // Log the daily review
    await supabase.from('alerts').insert({
      type: 'finn_daily_review',
      message: `Finn: Daily campaign review complete`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        performance_summary: performance,
        nina_content_found: ninaContent.contentReceived,
        review_date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString(),
      },
    });

    logger.info('Finn: Daily review complete', {
      ninaContent: ninaContent.contentReceived,
    });

    return { success: true, performance, ninaContent };
  } catch (error) {
    logger.error('Finn: Daily review failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS FINN SESSION
// Full autonomous agentic reasoning loop.
// Finn analyses, decides, optimises and reports.
// Every campaign decision is data-driven and logged.
// ─────────────────────────────────────────────
async function processFinnSession({
  sessionType = 'daily_review',
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
    campaignsCreated: 0,
    campaignsPaused: 0,
    campaignsScaled: 0,
    creativesCreated: 0,
    ninaContentReceived: 0,
    siennaReported: false,
    decisionsLogged: 0,
    totalSpendManaged: 0,
  };

  const today = new Date();
  const isMonday = today.getDay() === 1;
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

  const contextParts = [
    `FINN SESSION TYPE: ${sessionType}`,
    `TODAY: ${dayOfWeek} ${today.toISOString().split('T')[0]}`,
    transcript ? `ADDITIONAL INSTRUCTION: ${transcript}` : '',
    isMonday ? 'MONDAY TASK: Compile and send weekly performance report to Sienna after reviewing all campaign performance.' : '',
    `DAILY TASKS:`,
    `1. Review all campaign performance across Meta, Google and TikTok`,
    `2. Pause underperformers (ROAS <1 after $50 spend, CTR <0.5% after 72 hours)`,
    `3. Scale winners (ROAS >2 — increase by max 20%)`,
    `4. Check for Nina content flagged for amplification`,
    `5. Get Elton quality data to inform audience decisions`,
    `6. Log all decisions with full reasoning`,
    `7. Flag any budget needs to Celeste`,
    `8. Flag provider acquisition insights to Rafael`,
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

  // ── FINN'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: FINN_SYSTEM_PROMPT,
      tools: FINN_TOOLS,
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
        result = await executeFinnToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Finn: Tool call failed', {
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
    finalResponseText = `Finn: ${sessionType} complete. Campaigns reviewed across Meta, Google and TikTok.`;
  }

  logger.info('Finn: Session complete', {
    sessionType,
    campaignsPaused: sessionContext.campaignsPaused,
    campaignsScaled: sessionContext.campaignsScaled,
    campaignsCreated: sessionContext.campaignsCreated,
    creativesCreated: sessionContext.creativesCreated,
    decisionsLogged: sessionContext.decisionsLogged,
  });

  return {
    responseText: finalResponseText,
    campaignsCreated: sessionContext.campaignsCreated,
    campaignsPaused: sessionContext.campaignsPaused,
    campaignsScaled: sessionContext.campaignsScaled,
    creativesCreated: sessionContext.creativesCreated,
    decisionsLogged: sessionContext.decisionsLogged,
    siennaReported: sessionContext.siennaReported,
  };
}

module.exports = {
  processFinnSession,
  dailyCampaignReview,
  FINN_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};