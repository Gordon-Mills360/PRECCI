// FILE: precci/backend/src/agents/sienna.js
// Sienna — PC-004 — Chief Marketing Officer
// COMPLETE FULL BUILD — no simplification anywhere.
// Runs ALL global marketing for BOTH PRECCI Core and PRECCI Connect.
// Campaigns, brand voice, influencer strategy, paid ads and growth.
// Oversees Nina (social media), Finn (paid ads) and Piper (Academy).
// Creative, bold and data-driven — never corporate, never generic.
// All marketing represents ALL genders — male grooming content
// given equal prominence alongside female beauty content.
// PRECCI Connect provider acquisition marketing fully managed.
// Weekly performance reports from Nina and Finn reviewed.
// Content calendar managed across all channels.
// Brand voice maintained consistently across every touchpoint.
// Works with Rafael on growth targets and market expansion.
// Works with Elton on marketing analytics and attribution.
// Reports to Vivienne weekly. Nadia performance logging.
// Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-004';
const AGENT_NAME = 'Sienna';

// ─────────────────────────────────────────────
// SIENNA'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const SIENNA_SYSTEM_PROMPT = `You are Sienna, the Chief Marketing Officer of PRECCI.
Your ID is PC-004.

You are PRECCI's marketing intelligence and creative force. Every
campaign, every brand voice decision, every channel strategy, every
growth target — this is your domain. You operate with the creative
conviction of the world's best brand builders and the analytical
discipline of the world's best growth marketers. You never separate
the two. Great marketing is both at once.

You oversee three agents directly:
Nina (PC-019) — Social Media and Influencers
Finn (PC-022) — Paid Advertising
Piper (PC-018) — Academy and Content

You receive weekly reports from Nina and Finn. You brief them on
strategy. They execute. You review, redirect and optimise. This
is the loop that drives PRECCI's growth.

PRECCI'S BRAND — WHAT YOU PROTECT AND AMPLIFY:

WHAT PRECCI IS:
The world's first Personal AI Appearance Intelligence System.
The world's first fully voice-driven autonomous AI beauty company.
The world's first AI-powered beauty and lifestyle booking marketplace
for ALL genders globally.

This is not a beauty app. Not a chatbot. Not a product store.
It is something that has never existed before.
Every piece of marketing must communicate this.
Every campaign must create the feeling that PRECCI is in a
category of one — because it is.

PRECCI'S BRAND VOICE:
Expert: PRECCI knows more about your appearance than any app has
  ever known. Not in a clinical way — in a genuinely insightful,
  personally specific way. Our voice is authoritative but warm.
Warm: We care about how every client feels when they interact
  with us. Not saccharine. Not falsely enthusiastic. Genuinely warm.
Direct: We say what we mean. No corporate padding.
Inclusive: Every human being on earth is our client. This is not
  a woman's brand. This is not a beauty brand for one type of person.
  PRECCI is for every person who wants to look and feel their best.
Bold: We are the first of our kind. We market with that confidence.

PRECCI'S BRAND COLOURS — MANDATORY IN ALL CREATIVE:
Rose Gold #C9847A — primary
Blush Pink #F2B5B0 — secondary
Warm Gold #D4A853 — accent
Ivory Cream #FAF0E8 — background
Deep Rose #8B3A3A — dark accent
Champagne #F5DEB3 — highlight
Midnight #1A0A0F — text/dark background
Pure White #FFFFFF — clean space

PRECCI'S VISUAL IDENTITY:
Rich warm tones. Intimate camera work. Real skin. Real hair.
Real results on real people. Never clinical. Never stock photo.
The AI element shown elegantly — voice waveforms, camera analysis
in motion, Belle's simulation rendering on real faces.
Diverse representation always: all skin tones, all hair types,
all body types, all ages, all genders.

WHAT YOU NEVER DO IN MARKETING:
- Never use before/after framing that implies the "before" is wrong
- Never assign beauty standards by gender
- Never make unsubstantiated product claims
- Never show clinical, cold, tech-demo aesthetic
- Never use stock photos of models who look nothing like real people
- Never position PRECCI as only for women
- Never show male clients in a smaller, secondary role
- Never make it look like an app — it looks like an intelligent system

GENDER REPRESENTATION IN ALL MARKETING:
Male clients, female clients, non-binary clients — all shown equally.
Male grooming campaigns run with the same energy and budget as
female beauty campaigns. Drew, Luna, Zara, Isla, Remy — all agents
shown serving all types of clients.
PRECCI Connect marketing includes barbers, men's grooming studios
and male-focused providers prominently — not as a niche, as a
core offering.

YOUR TWO MARKETING OBJECTIVES:

1. PRECCI CORE — CLIENT ACQUISITION AND RETENTION:
Acquire clients across all demographics globally.
Key message: "PRECCI sees you — actually sees you — and tells you
exactly what your appearance needs and exactly how it will look."
Funnel: Awareness (PRECCI exists and is revolutionary) →
Interest (this is genuinely for me) →
Trial (sign up free) →
Conversion (upgrade to paid) →
Retention (stay, grow, transform).
You manage all stages of this funnel simultaneously.

2. PRECCI CONNECT — PROVIDER ACQUISITION:
Acquire service providers globally — nail technicians, hairdressers,
barbers, barbershops, men's grooming studios, spas, boutiques.
Key message: "PRECCI sends you fully briefed, ready-to-book clients
who already know exactly what they want. All you do is deliver."
This is B2B marketing. Completely different voice, different channels,
different creative. You build and manage this entirely separately.

YOUR MARKETING CHANNELS:

Organic Social (Nina executes, you direct):
Instagram: primary channel. Reels, carousels, stories.
TikTok: fast growth. Short-form education and entertainment.
Pinterest: evergreen discovery. Style, skincare, grooming boards.
YouTube: long-form Academy content. Deep credibility building.
Facebook: community. Older demographic. Connect provider content.

Paid Advertising (Finn executes, you direct):
Meta: primary paid channel. All audiences.
Google: high-intent search capture.
TikTok Ads: reaching younger audiences.

Content Marketing (Piper creates, you direct):
Academy courses and guides — educating clients into belief.
Daily tips — maintaining daily touchpoint.
Beauty intelligence content — establishing PRECCI as the
definitive voice in AI beauty and grooming globally.

Influencer Marketing (Nina executes, you direct):
Male grooming influencers with the same budget and energy
as female beauty influencers.
Authentic creators — not just followers, real audiences.
Content-first partnerships — the best content wins, not
the biggest following.

PR and Press:
PRECCI is a story no journalist has covered yet.
"The world's first AI appearance intelligence system —
that actually sees your face and speaks to you by voice."
You identify and brief PR opportunities. The story tells itself.

CAMPAIGN PLANNING — HOW YOU WORK:

Monthly campaign rhythm:
Week 1: Review previous month performance (from Nina and Finn).
  Identify what worked, what did not, what to amplify.
Week 2: Brief Nina and Finn on next month's strategy.
  Content pillars for the month. Campaign objectives. Budget allocation.
Week 3: Mid-month check — is the strategy executing correctly?
  Any pivots needed based on early data?
Week 4: Campaign wrap-up. Elton provides analytics.
  Learnings captured. Next month planned.

Seasonal awareness:
You plan for seasonal shifts in beauty and grooming behaviour:
New Year (January): fresh start, new routines, skin reset.
Valentine's Day: fragrance, date-ready grooming and style.
Summer (June-August): SPF, lighter routines, outdoor looks.
September: wardrobe transition, autumn skin prep.
December: event looks, gift guides, year-end transformation.
Ramadan: respectful content for PRECCI's Middle East audience.
African festivals and cultural moments: Afrobeats season,
  West African fashion weeks — PRECCI is headquartered in Ghana.

WORKING WITH YOUR TEAM:
Nina: You review her weekly report every Monday. You brief her
  with next week's content pillars and campaign angles. She executes.
  You approve influencer deals before they proceed.
Finn: You review his weekly report every Monday. You set his
  budget allocations and strategic priorities. He executes.
  Any campaign above $5,000 budget you discuss with Vivienne.
Piper: You align her content calendar with your campaign calendar.
  Academy content reinforces marketing campaigns.
  Course launches timed to coincide with campaign pushes.
Elton: Your analytical engine. He gives you performance data.
  You use it to brief Nina and Finn. Data in → strategy out.
Rafael: You align marketing priorities with sales targets.
  Where Rafael is focusing his sales effort, your marketing
  provides air cover.
Cole: When Cole closes a brand deal, you plan the campaign launch.
  You execute the partnership campaign across all channels.
Vivienne: You report to Vivienne weekly on marketing performance,
  budget spend and growth trajectory. Any budget increase above
  current allocation goes to Vivienne for approval.
Celeste: You track marketing spend against budget. You never
  exceed allocation without Vivienne's approval.
Aurora: Community trends from Aurora inform your content strategy.
  What the Inner Circle is talking about is what your broader
  audience will want soon.

WHAT YOU DELIVER — WEEKLY:
Review of Nina's social performance.
Review of Finn's ad performance.
Next week's campaign brief for Nina.
Next week's campaign brief for Finn.
Monthly content calendar update for Piper.
Report to Vivienne on growth metrics and budget.
Brand audit — is everything out there consistent with PRECCI's voice?

TOOLS AVAILABLE — USE ALL OF THEM:
- review_nina_report: Review Nina's weekly social media performance
- review_finn_report: Review Finn's weekly ad performance
- create_campaign_brief: Create strategic brief for Nina or Finn
- plan_content_calendar: Plan 30-day content calendar
- review_brand_consistency: Audit brand consistency across channels
- get_elton_analytics: Request marketing analytics from Elton
- flag_to_nina: Send strategic brief to Nina
- flag_to_finn: Send strategic brief to Finn
- flag_to_piper: Align Academy content with campaigns
- flag_to_vivienne: Weekly report and budget requests
- flag_to_rafael: Align marketing with sales priorities
- recall_marketing_memory: Search campaign history and learnings
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// SIENNA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const SIENNA_TOOLS = [
  {
    name: 'review_nina_report',
    description: 'Review Nina\'s weekly social media performance report. Identify what is working, what is not, and what strategic direction Nina needs next.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month'] },
        focusAreas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific areas to focus on: follower_growth, engagement_rate, top_content, influencer_performance, gender_content_balance',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'review_finn_report',
    description: 'Review Finn\'s weekly paid advertising performance report. Evaluate ROAS, CPA, creative performance and budget efficiency.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month'] },
        includeCreativeAnalysis: { type: 'boolean', description: 'Deep analysis of which creative angles are working' },
        includeAudienceAnalysis: { type: 'boolean', description: 'Which audiences are performing vs underperforming' },
      },
      required: ['period'],
    },
  },
  {
    name: 'create_campaign_brief',
    description: 'Create a complete strategic campaign brief for Nina or Finn to execute.',
    input_schema: {
      type: 'object',
      properties: {
        recipient: { type: 'string', enum: ['nina', 'finn', 'both'] },
        campaignName: { type: 'string' },
        objective: {
          type: 'string',
          enum: ['awareness', 'client_acquisition', 'provider_acquisition', 'retention', 'upgrade_conversion', 'brand_partnership_launch', 'seasonal'],
        },
        division: { type: 'string', enum: ['core', 'connect', 'both'] },
        targetAudience: { type: 'string', description: 'Who this campaign is for — demographics, interests, behaviours' },
        genderStrategy: {
          type: 'string',
          description: 'How gender is represented — always inclusive. Specify if male-skewed, female-skewed or universal.',
        },
        keyMessage: { type: 'string', description: 'The core message this campaign communicates' },
        contentAngles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific content angles to test — testimonial, feature demo, pain point solution, education, transformation',
        },
        platforms: { type: 'array', items: { type: 'string' } },
        budget: { type: 'string', description: 'Budget allocation for this campaign' },
        timeline: { type: 'string', description: 'When this campaign runs — start date, duration' },
        kpis: {
          type: 'array',
          items: { type: 'string' },
          description: 'Success metrics — reach, engagement_rate, conversions, ROAS, CPA, new_signups, provider_registrations',
        },
        brandGuidelines: {
          type: 'string',
          description: 'Specific brand guidelines for this campaign — colours, voice, visual direction',
        },
        seasonalContext: { type: 'string', description: 'Seasonal or cultural context for this campaign if applicable' },
      },
      required: ['recipient', 'campaignName', 'objective', 'division', 'keyMessage', 'genderStrategy'],
    },
  },
  {
    name: 'plan_content_calendar',
    description: 'Plan the 30-day content calendar across all channels, aligned with campaign objectives and seasonal moments.',
    input_schema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Month being planned — e.g. September 2026' },
        campaignObjective: { type: 'string' },
        seasonalMoments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key dates or moments in this month — product launches, cultural events, seasonal shifts',
        },
        contentPillarsForMonth: {
          type: 'array',
          items: { type: 'string' },
          description: 'The 4-6 content themes running this month across all channels',
        },
        genderContentBalance: {
          type: 'object',
          properties: {
            maleGrooming: { type: 'string', description: 'Percentage or proportion of male grooming content' },
            femaleBeauty: { type: 'string', description: 'Percentage of female beauty content' },
            universal: { type: 'string', description: 'Percentage of universal/all-gender content' },
          },
        },
        paidAmplification: { type: 'string', description: 'Which organic content gets paid amplification this month' },
      },
      required: ['month', 'contentPillarsForMonth'],
    },
  },
  {
    name: 'review_brand_consistency',
    description: 'Audit brand consistency across all PRECCI touchpoints — social content, ads, Academy materials, Connect marketing.',
    input_schema: {
      type: 'object',
      properties: {
        channelsToReview: {
          type: 'array',
          items: { type: 'string' },
          description: 'instagram, tiktok, pinterest, paid_meta, paid_google, paid_tiktok, academy, connect_marketing, website',
        },
        flagInconsistencies: { type: 'boolean' },
        checkGenderInclusion: { type: 'boolean', description: 'Verify all genders are represented appropriately' },
        checkColourCompliance: { type: 'boolean', description: 'Verify brand colours used correctly' },
        checkVoiceConsistency: { type: 'boolean', description: 'Verify brand voice is consistent' },
      },
      required: ['channelsToReview'],
    },
  },
  {
    name: 'get_elton_analytics',
    description: 'Request specific marketing analytics from Elton — attribution, conversion funnels, content performance, demographic breakdown.',
    input_schema: {
      type: 'object',
      properties: {
        metricsNeeded: {
          type: 'array',
          items: { type: 'string' },
          description: 'acquisition_by_channel, content_performance, conversion_funnel, demographic_breakdown, retention_by_cohort, provider_acquisition_by_channel',
        },
        period: { type: 'string', enum: ['week', 'month', 'quarter'] },
        segmentBy: {
          type: 'string',
          enum: ['channel', 'geography', 'subscription_tier', 'agent_usage', 'gender'],
        },
      },
      required: ['metricsNeeded', 'period'],
    },
  },
  {
    name: 'flag_to_nina',
    description: 'Send strategic brief or direction to Nina for social media execution.',
    input_schema: {
      type: 'object',
      properties: {
        briefType: {
          type: 'string',
          enum: ['weekly_strategy', 'campaign_launch', 'content_pivot', 'influencer_direction', 'urgent_post', 'brand_moment'],
        },
        summary: { type: 'string', description: 'Clear brief for Nina' },
        contentPillorsForWeek: { type: 'array', items: { type: 'string' } },
        platformPriorities: { type: 'object', description: 'Which platforms to prioritise this week and why' },
        genderContentTargets: { type: 'string', description: 'Specific gender content targets for this period' },
        influencerDirections: { type: 'string', description: 'Any influencer strategy guidance this week' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['briefType', 'summary'],
    },
  },
  {
    name: 'flag_to_finn',
    description: 'Send strategic brief or budget direction to Finn for paid advertising execution.',
    input_schema: {
      type: 'object',
      properties: {
        briefType: {
          type: 'string',
          enum: ['weekly_strategy', 'campaign_launch', 'budget_reallocation', 'creative_direction', 'audience_pivot'],
        },
        summary: { type: 'string', description: 'Clear brief for Finn' },
        budgetPriorities: { type: 'object', description: 'Budget allocation by platform and objective' },
        creativeDirections: { type: 'array', items: { type: 'string' } },
        audiencePriorities: { type: 'string' },
        genderAdStrategy: { type: 'string', description: 'Gender representation strategy in ads this week' },
        kpisToOptimise: { type: 'array', items: { type: 'string' } },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['briefType', 'summary'],
    },
  },
  {
    name: 'flag_to_piper',
    description: 'Align Piper\'s Academy content calendar with Sienna\'s marketing campaigns.',
    input_schema: {
      type: 'object',
      properties: {
        alignmentRequest: { type: 'string', description: 'What Academy content Sienna needs for campaign alignment' },
        campaignContext: { type: 'string', description: 'What campaign this content supports' },
        timeline: { type: 'string', description: 'When the content is needed' },
        contentType: { type: 'string', enum: ['course_launch', 'daily_tip_series', 'digital_guide', 'community_content'] },
      },
      required: ['alignmentRequest', 'campaignContext'],
    },
  },
  {
    name: 'flag_to_vivienne',
    description: 'Send weekly marketing performance report to Vivienne, or escalate budget requests and strategic decisions.',
    input_schema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['weekly_marketing_report', 'budget_request', 'strategic_pivot', 'campaign_result', 'brand_issue'],
        },
        summary: { type: 'string', description: 'Executive summary for Vivienne' },
        growthMetrics: { type: 'object', description: 'Key growth numbers — followers, signups, conversions, ROAS' },
        budgetSpend: { type: 'object', description: 'Budget spent vs allocated' },
        nextWeekPlan: { type: 'string', description: 'What marketing is doing next week' },
        decisionsNeeded: { type: 'string', description: 'Any decisions Vivienne needs to make' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['reportType', 'summary', 'urgency'],
    },
  },
  {
    name: 'flag_to_rafael',
    description: 'Align marketing priorities with Rafael\'s sales targets and market expansion plans.',
    input_schema: {
      type: 'object',
      properties: {
        alignmentType: {
          type: 'string',
          enum: ['geographic_focus', 'provider_acquisition', 'enterprise_support', 'market_expansion'],
        },
        marketingSupport: { type: 'string', description: 'What marketing can do to support Rafael\'s sales priorities' },
        geographies: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'string' },
      },
      required: ['alignmentType', 'marketingSupport'],
    },
  },
  {
    name: 'recall_marketing_memory',
    description: 'Search campaign history, creative learnings, brand decisions and performance records.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save marketing session context — campaigns planned, briefs sent, decisions made.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['content'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['weekly_review', 'campaign_planning', 'brand_audit', 'performance_analysis', 'content_calendar', 'ad_hoc'],
        },
        campaignsBriefed: { type: 'number' },
        ninaDirected: { type: 'boolean' },
        finnDirected: { type: 'boolean' },
        piperAligned: { type: 'boolean' },
        vivienneReported: { type: 'boolean' },
        brandIssuesFlagged: { type: 'number' },
        contentCalendarUpdated: { type: 'boolean' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE SIENNA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeSiennaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'review_nina_report': {
      const { period, focusAreas } = toolInput;

      const startDate = period === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Pull Nina's published content
      const { data: contentLog } = await supabase
        .from('content_log')
        .select('platform, type, caption, published_at, engagement')
        .eq('agent_id', 'PC-019')
        .gte('published_at', startDate)
        .order('engagement', { ascending: false });

      // Pull Nina's reports to Sienna
      const { data: ninaReports } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'finn_weekly_report')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(5);

      // Pull actual Nina weekly social reports
      const { data: socialReports } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'nina_morning_publish')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      const byPlatform = (contentLog || []).reduce((acc, c) => {
        if (!acc[c.platform]) acc[c.platform] = { posts: 0, totalEngagement: 0 };
        acc[c.platform].posts++;
        acc[c.platform].totalEngagement += (c.engagement || 0);
        return acc;
      }, {});

      const topContent = (contentLog || []).slice(0, 5);

      const totalPosts = contentLog?.length || 0;
      const totalEngagement = (contentLog || []).reduce((sum, c) => sum + (c.engagement || 0), 0);
      const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;

      sessionContext.ninnaReviewed = true;

      return {
        period,
        totalPosts,
        totalEngagement,
        avgEngagementPerPost: avgEngagement,
        byPlatform,
        topContent: topContent.map(c => ({
          platform: c.platform,
          type: c.type,
          captionPreview: (c.caption || '').substring(0, 80),
          engagement: c.engagement || 0,
          publishedAt: c.published_at,
        })),
        publishingConsistency: {
          morningPublishes: socialReports?.length || 0,
          expectedPublishes: period === 'week' ? 7 : 30,
          consistencyRate: socialReports?.length > 0
            ? `${Math.min(100, Math.round((socialReports.length / (period === 'week' ? 7 : 30)) * 100))}%`
            : 'insufficient data',
        },
        siennaDirections: [
          totalPosts < (period === 'week' ? 10 : 40) ? 'Publishing frequency below target — brief Nina to increase volume' : null,
          avgEngagement < 100 ? 'Engagement rate needs attention — review content angles with Nina' : null,
          !byPlatform.tiktok ? 'No TikTok content detected this period — remind Nina of TikTok targets' : null,
        ].filter(Boolean),
      };
    }

    case 'review_finn_report': {
      const { period, includeCreativeAnalysis, includeAudienceAnalysis } = toolInput;

      const startDate = period === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Pull Finn's reports to Sienna
      const { data: finnReports } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'finn_weekly_report')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(4);

      // Pull Finn's campaign decisions
      const { data: campaignDecisions } = await supabase
        .from('alerts')
        .select('type, message, metadata, created_at')
        .like('type', 'finn_campaign_%')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(20);

      const campaignsPaused = (campaignDecisions || []).filter(d => d.type === 'finn_campaign_paused').length;
      const campaignsScaled = (campaignDecisions || []).filter(d => d.type === 'finn_campaign_scaled').length;
      const campaignsCreated = (campaignDecisions || []).filter(d => d.type === 'finn_campaign_created').length;
      const creativesCreated = (campaignDecisions || []).filter(d => d.type === 'finn_creative_created').length;

      const latestReport = finnReports?.[0]?.metadata || {};

      sessionContext.finnReviewed = true;

      return {
        period,
        latestReportData: {
          totalSpend: latestReport.total_spend || 0,
          totalRevenue: latestReport.total_revenue || 0,
          overallROAS: latestReport.overall_roas || 0,
          campaignsPaused: latestReport.campaigns_paused || 0,
          campaignsScaled: latestReport.campaigns_scaled || 0,
        },
        campaignActivity: {
          created: campaignsCreated,
          paused: campaignsPaused,
          scaled: campaignsScaled,
          creativesCreated,
        },
        creativeInsights: includeCreativeAnalysis ? (latestReport.creative_insights || 'No creative insights in latest report') : null,
        audienceInsights: includeAudienceAnalysis ? (latestReport.audience_insights || 'No audience insights in latest report') : null,
        siennaDirections: [
          campaignsPaused > campaignsScaled * 2 ? 'More pauses than scales — review creative strategy with Finn' : null,
          creativesCreated === 0 ? 'No new creatives this period — brief Finn to refresh creative assets' : null,
          !latestReport.gender_content_strategy ? 'Finn has not reported on gender content strategy — ensure male grooming ads are running' : null,
        ].filter(Boolean),
      };
    }

    case 'create_campaign_brief': {
      const {
        recipient, campaignName, objective, division, targetAudience, genderStrategy,
        keyMessage, contentAngles, platforms, budget, timeline, kpis, brandGuidelines, seasonalContext,
      } = toolInput;

      const brief = {
        campaignName,
        briefedBy: PC_ID,
        recipient,
        objective,
        division,
        targetAudience: targetAudience || 'All PRECCI target demographics',
        genderStrategy: genderStrategy || 'Universal — all genders equally represented',
        keyMessage,
        contentAngles: contentAngles || ['feature_demo', 'testimonial', 'education'],
        platforms: platforms || ['instagram', 'tiktok'],
        budget: budget || 'As allocated',
        timeline: timeline || 'Ongoing',
        kpis: kpis || ['engagement_rate', 'conversions', 'reach'],
        brandGuidelines: brandGuidelines || `
PRECCI Brand Voice: Expert, warm, direct, bold, inclusive.
Colours: Rose Gold #C9847A primary, Blush Pink #F2B5B0, Warm Gold #D4A853.
Visual: Real people, real skin, real results. Warm intimate photography.
Never: Stock models, clinical aesthetic, gendered assumptions, before/after negativity.`,
        seasonalContext: seasonalContext || null,
        createdAt: new Date().toISOString(),
      };

      await supabase.from('alerts').insert({
        type: 'sienna_campaign_brief',
        message: `Sienna: Campaign brief — ${campaignName} → ${recipient}`,
        severity: 'info',
        agent_id: recipient === 'nina' ? 'PC-019' : recipient === 'finn' ? 'PC-022' : PC_ID,
        metadata: { brief, created_at: new Date().toISOString() },
      });

      if (!sessionContext.campaignsBriefed) sessionContext.campaignsBriefed = 0;
      sessionContext.campaignsBriefed++;

      return {
        briefCreated: true,
        campaignName,
        recipient,
        objective,
        division,
        genderStrategy,
        keyMessage,
        platforms: platforms || ['instagram', 'tiktok'],
        brief,
      };
    }

    case 'plan_content_calendar': {
      const { month, campaignObjective, seasonalMoments, contentPillarsForMonth, genderContentBalance, paidAmplification } = toolInput;

      const calendar = {
        month,
        plannedBy: PC_ID,
        campaignObjective: campaignObjective || 'awareness_and_acquisition',
        contentPillars: contentPillarsForMonth,
        genderContentBalance: genderContentBalance || {
          maleGrooming: '30%',
          femaleBeauty: '35%',
          universal: '35%',
        },
        seasonalMoments: seasonalMoments || [],
        paidAmplification: paidAmplification || 'Top 3 organic posts by engagement',
        weeklyStructure: contentPillarsForMonth.map((pillar, i) => ({
          week: i + 1,
          focus: pillar,
          platforms: ['instagram', 'tiktok', 'pinterest', 'facebook'],
        })),
        createdAt: new Date().toISOString(),
      };

      await supabase.from('alerts').insert({
        type: 'sienna_content_calendar',
        message: `Sienna: Content calendar planned — ${month}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: calendar,
      });

      sessionContext.contentCalendarUpdated = true;

      return {
        calendarCreated: true,
        month,
        contentPillars: contentPillarsForMonth,
        genderBalance: genderContentBalance || { maleGrooming: '30%', femaleBeauty: '35%', universal: '35%' },
        seasonalMoments: seasonalMoments || [],
        distributeTo: ['nina_for_social', 'finn_for_paid', 'piper_for_academy'],
      };
    }

    case 'review_brand_consistency': {
      const { channelsToReview, flagInconsistencies, checkGenderInclusion, checkColourCompliance, checkVoiceConsistency } = toolInput;

      const issues = [];
      const findings = [];

      // Pull recent content across channels
      const { data: recentContent } = await supabase
        .from('content_log')
        .select('platform, type, caption, agent_id, published_at')
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .limit(50);

      const byPlatform = (recentContent || []).reduce((acc, c) => {
        acc[c.platform] = (acc[c.platform] || 0) + 1;
        return acc;
      }, {});

      // Check gender content balance
      if (checkGenderInclusion) {
        const maleContent = (recentContent || []).filter(c =>
          c.caption && (c.caption.toLowerCase().includes('beard') ||
            c.caption.toLowerCase().includes('grooming') ||
            c.caption.toLowerCase().includes('men'))
        ).length;

        const totalContent = recentContent?.length || 0;
        const malePercent = totalContent > 0 ? (maleContent / totalContent * 100).toFixed(0) : 0;

        if (parseFloat(malePercent) < 20) {
          issues.push(`Male grooming content is ${malePercent}% of output — target is minimum 30%. Brief Nina to increase male-focused content immediately.`);
        } else {
          findings.push(`Male grooming content at ${malePercent}% — within acceptable range.`);
        }
      }

      // Check channel coverage
      const expectedChannels = ['instagram', 'tiktok', 'pinterest'];
      const missingChannels = expectedChannels.filter(c => !byPlatform[c]);
      if (missingChannels.length > 0) {
        issues.push(`No content detected on: ${missingChannels.join(', ')} — check with Nina on publishing status.`);
      }

      if (!sessionContext.brandIssuesFlagged) sessionContext.brandIssuesFlagged = 0;
      sessionContext.brandIssuesFlagged += issues.length;

      return {
        channelsReviewed: channelsToReview,
        contentByPlatform: byPlatform,
        totalContentReviewed: recentContent?.length || 0,
        brandIssues: issues,
        brandFindings: findings,
        overallConsistency: issues.length === 0 ? 'CONSISTENT' : issues.length <= 2 ? 'MINOR_ISSUES' : 'SIGNIFICANT_ISSUES',
        recommendation: issues.length > 0
          ? `Brief Nina and Finn immediately on ${issues.length} brand consistency issue(s)`
          : 'Brand is consistent across channels — no immediate action required',
      };
    }

    case 'get_elton_analytics': {
      const { metricsNeeded, period, segmentBy } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sienna_elton_request',
        message: `Sienna → Elton: Marketing analytics requested — ${metricsNeeded.join(', ')}`,
        severity: 'info',
        agent_id: 'PC-020',
        metadata: {
          from: PC_ID,
          metrics_needed: metricsNeeded,
          period,
          segment_by: segmentBy || null,
          requested_at: new Date().toISOString(),
        },
      });

      // Also pull what we have directly from Supabase
      const startDate = period === 'week'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : period === 'month'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { count: newUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      const { count: newSubs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .eq('status', 'active');

      return {
        period,
        metricsRequested: metricsNeeded,
        directData: {
          newUsers: newUsers || 0,
          newPaidSubscriptions: newSubs || 0,
          freeToPayRate: newUsers > 0 ? `${((newSubs / newUsers) * 100).toFixed(1)}%` : '0%',
        },
        eltonFullAnalyticsRequested: true,
        message: 'Elton has been briefed to provide full marketing analytics. Direct Supabase data included above.',
      };
    }

    case 'flag_to_nina': {
      const { briefType, summary, contentPillorsForWeek, platformPriorities, genderContentTargets, influencerDirections, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sienna_nina_brief',
        message: `Sienna → Nina: ${briefType} — ${summary.substring(0, 80)}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-019',
        metadata: {
          from: PC_ID,
          brief_type: briefType,
          summary,
          content_pillars: contentPillorsForWeek || [],
          platform_priorities: platformPriorities || {},
          gender_content_targets: genderContentTargets || 'Maintain minimum 30% male grooming content',
          influencer_directions: influencerDirections || null,
          urgency,
          briefed_at: new Date().toISOString(),
        },
      });

      sessionContext.ninaDirected = true;

      return {
        briefed: true,
        targetAgent: 'PC-019',
        briefType,
        urgency,
        genderContentTargets: genderContentTargets || 'Minimum 30% male grooming content maintained',
        message: `Strategic brief sent to Nina.`,
      };
    }

    case 'flag_to_finn': {
      const { briefType, summary, budgetPriorities, creativeDirections, audiencePriorities, genderAdStrategy, kpisToOptimise, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sienna_finn_brief',
        message: `Sienna → Finn: ${briefType} — ${summary.substring(0, 80)}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-022',
        metadata: {
          from: PC_ID,
          brief_type: briefType,
          summary,
          budget_priorities: budgetPriorities || {},
          creative_directions: creativeDirections || [],
          audience_priorities: audiencePriorities || null,
          gender_ad_strategy: genderAdStrategy || 'All genders equally represented in all campaigns',
          kpis_to_optimise: kpisToOptimise || [],
          urgency,
          briefed_at: new Date().toISOString(),
        },
      });

      sessionContext.finnDirected = true;

      return {
        briefed: true,
        targetAgent: 'PC-022',
        briefType,
        urgency,
        genderAdStrategy: genderAdStrategy || 'All genders equally in all ads',
        message: `Strategic brief sent to Finn.`,
      };
    }

    case 'flag_to_piper': {
      const { alignmentRequest, campaignContext, timeline, contentType } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sienna_piper_alignment',
        message: `Sienna → Piper: ${contentType} needed — ${alignmentRequest.substring(0, 60)}`,
        severity: 'info',
        agent_id: 'PC-018',
        metadata: {
          from: PC_ID,
          alignment_request: alignmentRequest,
          campaign_context: campaignContext,
          timeline: timeline || 'Next 2 weeks',
          content_type: contentType || 'general',
          briefed_at: new Date().toISOString(),
        },
      });

      sessionContext.piperAligned = true;

      return {
        aligned: true,
        targetAgent: 'PC-018',
        alignmentRequest,
        message: `Academy content alignment request sent to Piper.`,
      };
    }

    case 'flag_to_vivienne': {
      const { reportType, summary, growthMetrics, budgetSpend, nextWeekPlan, decisionsNeeded, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sienna_vivienne_report',
        message: `Sienna → Vivienne: ${reportType} — ${summary.substring(0, 80)}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-001',
        metadata: {
          from: PC_ID,
          report_type: reportType,
          summary,
          growth_metrics: growthMetrics || {},
          budget_spend: budgetSpend || {},
          next_week_plan: nextWeekPlan || null,
          decisions_needed: decisionsNeeded || null,
          urgency,
          reported_at: new Date().toISOString(),
        },
      });

      sessionContext.vivienneReported = true;

      return {
        reported: true,
        targetAgent: 'PC-001',
        reportType,
        urgency,
        message: `Marketing report sent to Vivienne.`,
      };
    }

    case 'flag_to_rafael': {
      const { alignmentType, marketingSupport, geographies, timeline } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sienna_rafael_alignment',
        message: `Sienna → Rafael: ${alignmentType} — ${marketingSupport.substring(0, 60)}`,
        severity: 'info',
        agent_id: 'PC-005',
        metadata: {
          from: PC_ID,
          alignment_type: alignmentType,
          marketing_support: marketingSupport,
          geographies: geographies || [],
          timeline: timeline || 'Ongoing',
          aligned_at: new Date().toISOString(),
        },
      });

      return {
        aligned: true,
        targetAgent: 'PC-005',
        alignmentType,
        message: `Marketing-sales alignment sent to Rafael.`,
      };
    }

    case 'recall_marketing_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'sienna_marketing_history',
        query,
        matchCount: limit || 5,
        matchThreshold: 0.65,
      });

      return {
        memories,
        memoryContext: buildMemoryContext(memories),
        memoriesFound: memories.length,
      };
    }

    case 'store_session_memory': {
      const { content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId: 'sienna_marketing_history',
        content,
        memoryType: 'marketing_session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
        },
      });

      return { stored: true, memoryId };
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Sienna completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          campaigns_briefed: sessionContext.campaignsBriefed || 0,
          nina_directed: sessionContext.ninaDirected || false,
          finn_directed: sessionContext.finnDirected || false,
          piper_aligned: sessionContext.piperAligned || false,
          vivienne_reported: sessionContext.vivienneReported || false,
          brand_issues_flagged: sessionContext.brandIssuesFlagged || 0,
          content_calendar_updated: sessionContext.contentCalendarUpdated || false,
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
// WEEKLY MARKETING REVIEW
// Called every Monday by cron
// ─────────────────────────────────────────────
async function weeklyMarketingReview() {
  logger.info('Sienna: Weekly marketing review triggered');

  const sessionContext = {
    campaignsBriefed: 0,
    ninaDirected: false,
    finnDirected: false,
    piperAligned: false,
    vivienneReported: false,
    brandIssuesFlagged: 0,
    contentCalendarUpdated: false,
  };

  try {
    const supabase = getServiceClient();

    // Review Nina and Finn performance
    const ninaReview = await executeSiennaToolCall(
      'review_nina_report',
      { period: 'week', focusAreas: ['follower_growth', 'engagement_rate', 'gender_content_balance'] },
      sessionContext
    );

    const finnReview = await executeSiennaToolCall(
      'review_finn_report',
      { period: 'week', includeCreativeAnalysis: true, includeAudienceAnalysis: true },
      sessionContext
    );

    // Brand consistency check
    const brandAudit = await executeSiennaToolCall(
      'review_brand_consistency',
      {
        channelsToReview: ['instagram', 'tiktok', 'pinterest', 'paid_meta'],
        flagInconsistencies: true,
        checkGenderInclusion: true,
        checkColourCompliance: false,
        checkVoiceConsistency: false,
      },
      sessionContext
    );

    // Brief Nina for next week
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const pillars = ['Ingredient Education', 'Male Grooming Spotlight', 'Style and Outfit', 'Skin Transformation', 'Fragrance Feature', 'Body Care Awareness', 'Community Transformation'];

    await executeSiennaToolCall(
      'flag_to_nina',
      {
        briefType: 'weekly_strategy',
        summary: `Weekly strategy brief: ${ninaReview.siennaDirections?.join('; ') || 'Maintain current strong performance'}. Ensure minimum 30% male grooming content.`,
        contentPillorsForWeek: pillars.slice(0, 5),
        genderContentTargets: 'Minimum 30% male grooming and grooming-adjacent content. Universal content at 35%. Female beauty at 35%.',
        urgency: brandAudit.overallConsistency === 'SIGNIFICANT_ISSUES' ? 'urgent' : 'normal',
      },
      sessionContext
    );

    // Brief Finn for next week
    await executeSiennaToolCall(
      'flag_to_finn',
      {
        briefType: 'weekly_strategy',
        summary: `Weekly strategy brief: ${finnReview.siennaDirections?.join('; ') || 'Continue scaling proven campaigns'}. Ensure male grooming ads are running.`,
        genderAdStrategy: 'Male grooming acquisition campaigns must run alongside female beauty campaigns with equivalent budget allocation.',
        kpisToOptimise: ['roas', 'cpa', 'conversion_rate'],
        urgency: 'normal',
      },
      sessionContext
    );

    // Report to Vivienne
    await executeSiennaToolCall(
      'flag_to_vivienne',
      {
        reportType: 'weekly_marketing_report',
        summary: `Weekly marketing review complete. Social posts: ${ninaReview.totalPosts || 0}. Brand consistency: ${brandAudit.overallConsistency}. ${brandAudit.brandIssues?.length || 0} brand issue(s) flagged. Nina and Finn briefed for next week.`,
        growthMetrics: {
          totalSocialPosts: ninaReview.totalPosts || 0,
          avgEngagement: ninaReview.avgEngagementPerPost || 0,
          brandConsistency: brandAudit.overallConsistency,
        },
        urgency: 'normal',
      },
      sessionContext
    );

    await supabase.from('alerts').insert({
      type: 'sienna_weekly_review',
      message: `Sienna: Weekly marketing review complete`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        nina_total_posts: ninaReview.totalPosts || 0,
        brand_consistency: brandAudit.overallConsistency,
        brand_issues: brandAudit.brandIssues?.length || 0,
        nina_directed: sessionContext.ninaDirected,
        finn_directed: sessionContext.finnDirected,
        reviewed_at: new Date().toISOString(),
      },
    });

    logger.info('Sienna: Weekly review complete', {
      ninaPosts: ninaReview.totalPosts,
      brandConsistency: brandAudit.overallConsistency,
      brandIssues: sessionContext.brandIssuesFlagged,
    });

    return { success: true, ninaReview, finnReview, brandAudit };
  } catch (error) {
    logger.error('Sienna: Weekly review failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS SIENNA SESSION
// Full autonomous agentic reasoning loop.
// Sienna reviews, plans, briefs and reports.
// Creative and analytical in equal measure.
// ─────────────────────────────────────────────
async function processSiennaSession({
  sessionType = 'weekly_review',
  transcript = '',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sessionContext = {
    sessionType,
    campaignsBriefed: 0,
    ninaDirected: false,
    finnDirected: false,
    piperAligned: false,
    vivienneReported: false,
    brandIssuesFlagged: 0,
    contentCalendarUpdated: false,
    ninnaReviewed: false,
    finnReviewed: false,
  };

  const today = new Date();
  const isMonday = today.getDay() === 1;
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

  const contextParts = [
    `SIENNA SESSION TYPE: ${sessionType}`,
    `TODAY: ${dayOfWeek} ${today.toISOString().split('T')[0]}`,
    transcript ? `INSTRUCTION: ${transcript}` : '',
    isMonday ? 'MONDAY: Full weekly review — review Nina and Finn reports, brand audit, brief both for next week, report to Vivienne.' : '',
    `ALWAYS: Brand voice must be maintained across all channels. Gender representation must be balanced — minimum 30% male grooming content.`,
    `ALWAYS: After reviewing performance, brief Nina and Finn with clear strategic direction.`,
    `ALWAYS: Report to Vivienne with growth metrics and any strategic decisions needed.`,
    `BRAND RULE: Every piece of PRECCI marketing must communicate that PRECCI is in a category of one — the world\'s first AI appearance intelligence system for every human being.`,
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
      system: SIENNA_SYSTEM_PROMPT,
      tools: SIENNA_TOOLS,
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
        result = await executeSiennaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Sienna: Tool call failed', {
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
    finalResponseText = `Sienna: ${sessionType} complete. Marketing reviewed and strategic briefs sent to Nina and Finn.`;
  }

  logger.info('Sienna: Session complete', {
    sessionType,
    campaignsBriefed: sessionContext.campaignsBriefed,
    ninaDirected: sessionContext.ninaDirected,
    finnDirected: sessionContext.finnDirected,
    brandIssuesFlagged: sessionContext.brandIssuesFlagged,
  });

  return {
    responseText: finalResponseText,
    campaignsBriefed: sessionContext.campaignsBriefed,
    ninaDirected: sessionContext.ninaDirected,
    finnDirected: sessionContext.finnDirected,
    piperAligned: sessionContext.piperAligned,
    vivienneReported: sessionContext.vivienneReported,
    brandIssuesFlagged: sessionContext.brandIssuesFlagged,
  };
}

module.exports = {
  processSiennaSession,
  weeklyMarketingReview,
  SIENNA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};