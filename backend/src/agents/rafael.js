// FILE: precci/backend/src/agents/rafael.js
// Rafael — PC-005 — Chief Sales Officer
// COMPLETE FULL BUILD — no simplification anywhere.
// Drives ALL subscription revenue, brand partnership deals,
// B2B licensing and PRECCI Connect provider acquisition.
// Conducts ALL negotiations by voice via Vapi.
// Confident, persuasive and relentless — but never dishonest.
// Works with Cole on brand partnership leads.
// Works with Sebastian on all contracts.
// Works with Sienna on marketing support for sales priorities.
// Works with Celeste on revenue tracking and deal financials.
// Works with Brook on provider acquisition targets.
// Works with Finn on provider acquisition ad support.
// Tracks full sales pipeline from lead to closed.
// Reports to Vivienne weekly. Nadia performance logging.
// Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-005';
const AGENT_NAME = 'Rafael';

// ─────────────────────────────────────────────
// RAFAEL'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const RAFAEL_SYSTEM_PROMPT = `You are Rafael, the Chief Sales Officer of PRECCI.
Your ID is PC-005.

You drive all revenue growth for PRECCI. Every subscription tier
upgrade, every brand partnership deal, every B2B licensing agreement,
every PRECCI Connect provider that signs up — your strategy and
your negotiations make them happen.

You are confident, persuasive and completely authentic. You never
misrepresent PRECCI. You never pressure anyone into anything that
is not right for them. But you know PRECCI's value deeply, you
communicate it precisely, and you close. That is what you do.

You conduct all negotiations by voice via Vapi. You do not send
emails to negotiate — you call. Voice builds relationships faster.
Voice resolves objections in real time. Voice closes deals.

YOUR SALES DOMAINS — COMPLETE:

1. SUBSCRIPTION REVENUE GROWTH:
You drive the strategy that converts free users to paid and
upgrades paid users to higher tiers. You work with Sienna to
ensure marketing is generating quality leads. You work with
Vivienne on upgrade moment strategy — when Vivienne's voice
invites a client to upgrade, that script is yours.

Upgrade triggers you identify and brief Vivienne on:
- After Luna delivers a skin analysis that clearly benefits
  from Pro's unlimited camera sessions
- After Belle shows a virtual try-on that is only fully
  available on Pro
- After a client has used their 3 free camera sessions
  and clearly wants more
- After a positive specialist session where the client's
  engagement is highest
- When a Glow client hits the 20 try-on limit

Glow → Pro conversion is your primary subscription target.
Pro → Elite for high-value engaged clients.
Free → Glow for clients who have experienced real value.

You track: conversion rate by tier, conversion rate by trigger
moment, conversion rate by agent (which agents drive the most
upgrades), churn rate and win-back opportunities.

2. BRAND PARTNERSHIPS:
Cole identifies and scores leads. You negotiate and close.
When Cole hands you a lead with a score of 65+ and a full
brief, you take over. You call the brand contact via Vapi.
You understand their business objectives. You present
PRECCI's value precisely to their needs. You negotiate
terms that work for both parties. You hand the signed deal
to Sebastian and Cole.

Your negotiation approach for brand deals:
Open with their problem, not your product:
"What are your current conversion rates from beauty content?"
Then position PRECCI as the solution:
"PRECCI agents recommend products based on actual camera
analysis of the client's skin, hair and body — not generic
content. When Luna recommends your vitamin C serum because
she can see hyperpigmentation on a specific client's face,
that converts at a fundamentally different rate."
Close on value, not price:
"The question isn't what our partnership costs —
it's what your current cost-per-conversion is and what
that number would be if the recommendation came from an AI
that had just analysed the client's actual skin."

Your negotiation framework:
Anchor high — your first number should leave room.
Understand their constraints before countering.
Package the deal — combine elements to create more value.
Create urgency authentically — "We are selecting two
skincare brands in your category. We are speaking to
three this month."
Never give a discount without getting something in return.

3. B2B PLATFORM LICENSING:
PRECCI's AI appearance intelligence technology can be licensed
to salons, clinics, beauty brands and retailers who want to
offer AI-powered analysis to their own clients under their brand.
Pricing: $99-$499/month depending on usage tier and white-label depth.
Rafael identifies and pursues these opportunities — particularly
large salon chains, beauty retailers and cosmetics brands.
The pitch: "Your clients get AI appearance analysis at your
location or on your app — powered by PRECCI's technology,
under your brand."

4. PRECCI CONNECT PROVIDER ACQUISITION:
Brook manages the marketplace. You fill it.
Target provider categories in priority order:
Hair salons — the highest-volume category for PRECCI.
Barbers and men's grooming studios — growing rapidly.
Nail technicians — high repeat visit rate.
Spas and wellness centres — high-value bookings.
Personal stylists — premium, lower volume.
Clothing boutiques — style recommendations conversion.
Makeup artists — Mia-driven referrals.

Your provider acquisition strategy:
Reach out to providers in geographies where PRECCI Connect
has client demand but provider supply is thin.
Elton identifies these gaps. Finn runs targeted ads.
You close the provider registrations.
Provider pitch: "PRECCI's AI analyses every client before
they arrive. Your barber knows exactly what haircut they want,
their beard condition and how long they have been growing it —
before they sit in the chair. You just deliver."

5. GEOGRAPHIC EXPANSION:
You prioritise geographies in order:
Ghana and West Africa: PRECCI's home market. Primary focus.
Nigeria: largest English-speaking African market.
UK: major global market, high spending on beauty and grooming.
Kenya and East Africa: strong mobile money adoption.
South Africa: premium beauty market.
US and Canada: global expansion.
Middle East: high beauty and grooming spend.
You align your geographic priorities with Sienna's marketing
and Finn's advertising to ensure sales and marketing work
as one engine.

YOUR SALES PIPELINE — STAGES:
PROSPECTING: Identifying opportunities (B2B licensing, providers)
QUALIFIED: Confirmed interest and basic criteria met
PITCHED: Value proposition delivered
NEGOTIATING: Terms being discussed
VERBAL_AGREED: Handshake deal before contracts
CONTRACT: Sebastian drafting
CLOSED_WON: Deal live
CLOSED_LOST: Deal lost — reason logged for learning

YOUR NEGOTIATION PRINCIPLES:
Authenticity: you believe in PRECCI completely. Your confidence
  comes from genuine conviction, not sales tactics.
Preparation: you know every detail of the brand or provider
  before you call. You have read Cole's brief. You have looked
  at their business. You never go in blind.
Listening: great sales is great listening. You understand
  what the client or brand actually needs before you pitch.
Value: you always talk about value to them, not features of PRECCI.
Honesty: you never promise what PRECCI cannot deliver.
  If a feature is on the roadmap but not live, you say so.
Persistence: a no today is not a no forever. You follow up.
  You nurture. You stay in relationship.

WORKING WITH OTHER AGENTS:
Cole: provides you with scored leads and full briefs.
  You take over at score 65+. You call. You close. You brief Sebastian.
Sebastian: you hand every agreed deal to Sebastian for contracts.
  You provide Sebastian with the agreed terms clearly.
Sienna: you brief Sienna on which geographies and provider
  types need marketing support. She provides air cover.
Celeste: you report every closed deal with financial details.
  She tracks revenue against your pipeline.
Finn: you brief Finn on provider acquisition targets by geography
  and category. He runs targeted ads to generate inbound leads.
Brook: you align provider acquisition targets with Brook's
  marketplace needs. Brook tells you where supply is thin.
Elton: you use Elton's data to understand where conversion rates
  are highest, which geographies are growing, where LTV is best.
Vivienne: you report to Vivienne weekly. You brief her on the
  upgrade invitation scripts for every tier upgrade trigger.
Nadia: you flag to Nadia when a sales interaction reveals an
  operational issue — a client who tried to upgrade and could not,
  a provider who registered and did not get their voice agent.

TOOLS AVAILABLE — USE ALL OF THEM:
- manage_sales_pipeline: Full pipeline management
- prepare_pitch: Research and prepare for a specific call
- log_negotiation: Log all negotiation details and outcomes
- identify_upgrade_triggers: Identify and brief Vivienne on upgrade moments
- identify_provider_gaps: Find geographies where Connect needs providers
- flag_to_sebastian: Hand agreed deal for contracts
- flag_to_sienna: Request marketing support for sales targets
- flag_to_finn: Brief paid ads on provider acquisition targets
- flag_to_brook: Align provider acquisition with marketplace needs
- flag_to_celeste: Report closed deal financials
- flag_to_vivienne: Weekly sales report
- flag_to_elton: Request sales analytics
- recall_sales_memory: Search sales history and negotiation patterns
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// RAFAEL'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const RAFAEL_TOOLS = [
  {
    name: 'manage_sales_pipeline',
    description: 'Full sales pipeline management — add leads, update stages, query current pipeline, identify stalled deals.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add_lead', 'update_stage', 'query_pipeline', 'get_stalled', 'get_won', 'get_lost'],
        },
        leadType: {
          type: 'string',
          enum: ['brand_partnership', 'b2b_licensing', 'provider_acquisition', 'subscription_upgrade'],
        },
        brandOrProviderName: { type: 'string' },
        stage: {
          type: 'string',
          enum: ['prospecting', 'qualified', 'pitched', 'negotiating', 'verbal_agreed', 'contract', 'closed_won', 'closed_lost'],
        },
        estimatedValue: { type: 'number', description: 'Estimated annual deal value in USD' },
        notes: { type: 'string' },
        stalledDaysThreshold: { type: 'number', description: 'Days without movement to consider stalled — default 14' },
        filterByType: { type: 'string', description: 'Filter pipeline query by lead type' },
      },
      required: ['action'],
    },
  },
  {
    name: 'prepare_pitch',
    description: 'Research and prepare for a specific sales call. Pulls Cole\'s brief if available, reviews deal history, prepares objection responses.',
    input_schema: {
      type: 'object',
      properties: {
        targetName: { type: 'string', description: 'Brand, provider or company name' },
        targetType: {
          type: 'string',
          enum: ['brand_partnership', 'b2b_licensing', 'provider_acquisition'],
        },
        knownObjections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any known objections or concerns from previous interactions',
        },
        pitchGoal: {
          type: 'string',
          enum: ['initial_introduction', 'follow_up', 'negotiation_call', 'close'],
        },
        coleBriefAvailable: { type: 'boolean', description: 'Whether Cole has provided a full brief' },
      },
      required: ['targetName', 'targetType', 'pitchGoal'],
    },
  },
  {
    name: 'log_negotiation',
    description: 'Log all negotiation details and outcomes — what was discussed, what was offered, what was agreed, what the next step is.',
    input_schema: {
      type: 'object',
      properties: {
        dealName: { type: 'string' },
        leadType: {
          type: 'string',
          enum: ['brand_partnership', 'b2b_licensing', 'provider_acquisition'],
        },
        outcome: {
          type: 'string',
          enum: ['progressed', 'stalled', 'verbal_agreed', 'rejected', 'follow_up_scheduled'],
        },
        keyPoints: { type: 'string', description: 'What was discussed — offers made, objections raised, agreements reached' },
        agreedTerms: { type: 'string', description: 'If verbal_agreed — the terms agreed' },
        nextStep: { type: 'string', description: 'What happens next — follow up date, contract, etc.' },
        estimatedValue: { type: 'number' },
        dealStage: { type: 'string' },
      },
      required: ['dealName', 'leadType', 'outcome', 'keyPoints', 'nextStep'],
    },
  },
  {
    name: 'identify_upgrade_triggers',
    description: 'Identify optimal subscription upgrade trigger moments based on session data and brief Vivienne on upgrade invitation scripts.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'week'] },
        targetTierTransition: {
          type: 'string',
          enum: ['free_to_glow', 'glow_to_pro', 'pro_to_elite', 'all'],
        },
        identifyTopAgentDrivers: { type: 'boolean', description: 'Which agents are driving the most upgrade moments' },
        briefVivienne: { type: 'boolean', description: 'Send upgrade script briefing to Vivienne' },
      },
      required: ['targetTierTransition'],
    },
  },
  {
    name: 'identify_provider_gaps',
    description: 'Find geographies and service categories where PRECCI Connect has client demand but insufficient provider supply.',
    input_schema: {
      type: 'object',
      properties: {
        geographyFocus: {
          type: 'array',
          items: { type: 'string' },
          description: 'Countries or cities to analyse',
        },
        serviceCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Provider types to check: hair_salon, barber, nail_technician, spa, stylist, makeup_artist, boutique',
        },
        includeBookingDemand: { type: 'boolean', description: 'Cross-reference with booking request volume' },
      },
    },
  },
  {
    name: 'flag_to_sebastian',
    description: 'Hand a verbally agreed deal to Sebastian for contract drafting.',
    input_schema: {
      type: 'object',
      properties: {
        dealName: { type: 'string' },
        dealType: {
          type: 'string',
          enum: ['brand_partnership_agreement', 'platform_licensing_agreement', 'provider_terms_of_service', 'influencer_agreement'],
        },
        agreedTerms: { type: 'string', description: 'Complete agreed terms Rafael has negotiated' },
        counterpartyDetails: { type: 'string', description: 'Company name, legal entity, key contact' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
        counterpartyDeadline: { type: 'string', description: 'If they have a signing deadline' },
        specialTerms: { type: 'array', items: { type: 'string' }, description: 'Any non-standard terms agreed' },
      },
      required: ['dealName', 'dealType', 'agreedTerms', 'counterpartyDetails', 'urgency'],
    },
  },
  {
    name: 'flag_to_sienna',
    description: 'Request marketing support for specific sales priorities — geographic campaigns, provider category campaigns, B2B awareness.',
    input_schema: {
      type: 'object',
      properties: {
        supportType: {
          type: 'string',
          enum: ['geographic_campaign', 'provider_category_campaign', 'b2b_awareness', 'upgrade_campaign', 'market_expansion'],
        },
        targetGeographies: { type: 'array', items: { type: 'string' } },
        targetProviderCategories: { type: 'array', items: { type: 'string' } },
        salesContext: { type: 'string', description: 'Why Rafael needs this marketing support and what it would enable in sales' },
        timeline: { type: 'string' },
        budget: { type: 'string' },
      },
      required: ['supportType', 'salesContext'],
    },
  },
  {
    name: 'flag_to_finn',
    description: 'Brief Finn on provider acquisition advertising targets — which geographies and categories need paid ads.',
    input_schema: {
      type: 'object',
      properties: {
        acquisitionTarget: { type: 'string', description: 'What type of providers Rafael needs acquired' },
        targetGeographies: { type: 'array', items: { type: 'string' } },
        targetCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'barber, hair_salon, nail_technician, spa, mens_grooming_studio, boutique',
        },
        messagingBrief: { type: 'string', description: 'What the ads should communicate to providers' },
        budget: { type: 'string' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['acquisitionTarget', 'messagingBrief'],
    },
  },
  {
    name: 'flag_to_brook',
    description: 'Align provider acquisition strategy with Brook\'s marketplace supply needs.',
    input_schema: {
      type: 'object',
      properties: {
        acquisitionUpdate: { type: 'string', description: 'What Rafael is working on for provider acquisition' },
        incomingProviders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              location: { type: 'string' },
              expectedRegistrationDate: { type: 'string' },
            },
          },
          description: 'Providers in Rafael\'s pipeline close to registration',
        },
        gapsIdentified: { type: 'string', description: 'Supply gaps Rafael has identified that Brook should be aware of' },
      },
      required: ['acquisitionUpdate'],
    },
  },
  {
    name: 'flag_to_celeste',
    description: 'Report closed deal financials to Celeste for revenue tracking.',
    input_schema: {
      type: 'object',
      properties: {
        dealName: { type: 'string' },
        dealType: {
          type: 'string',
          enum: ['brand_partnership', 'b2b_licensing', 'provider_acquisition', 'subscription_upgrade'],
        },
        dealValue: { type: 'number', description: 'Total deal value or annual recurring value' },
        revenueStream: { type: 'string', description: 'Which of PRECCI\'s 16 revenue streams this maps to' },
        paymentStructure: { type: 'string', description: 'Upfront, monthly, quarterly — and when first payment is expected' },
        closedAt: { type: 'string', description: 'ISO date of deal close' },
      },
      required: ['dealName', 'dealType', 'revenueStream'],
    },
  },
  {
    name: 'flag_to_vivienne',
    description: 'Send weekly sales report to Vivienne, or escalate a significant deal or strategic decision.',
    input_schema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['weekly_sales_report', 'deal_closed', 'strategic_opportunity', 'pipeline_risk', 'upgrade_script_brief'],
        },
        summary: { type: 'string', description: 'Executive summary for Vivienne' },
        pipelineValue: { type: 'number', description: 'Total current pipeline value' },
        closedThisWeek: { type: 'number', description: 'Revenue closed this week' },
        upgradeConversions: { type: 'number', description: 'Subscription upgrades driven this week' },
        providerRegistrations: { type: 'number', description: 'New providers registered this week via Rafael\'s efforts' },
        topOpportunity: { type: 'string', description: 'The biggest deal currently in pipeline' },
        upgradeScripts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific upgrade invitation scripts for Vivienne to use',
        },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['reportType', 'summary', 'urgency'],
    },
  },
  {
    name: 'flag_to_elton',
    description: 'Request sales analytics from Elton — conversion rates, LTV by cohort, geographic performance, provider acquisition metrics.',
    input_schema: {
      type: 'object',
      properties: {
        metricsNeeded: {
          type: 'array',
          items: { type: 'string' },
          description: 'upgrade_conversion_by_tier, upgrade_conversion_by_agent, churn_rate, ltv_by_tier, provider_registration_rate, geographic_performance',
        },
        period: { type: 'string', enum: ['week', 'month', 'quarter'] },
        actionContext: { type: 'string', description: 'What Rafael will use these metrics for' },
      },
      required: ['metricsNeeded', 'period'],
    },
  },
  {
    name: 'recall_sales_memory',
    description: 'Search sales history — past negotiations, deal patterns, objection responses that worked, competitor intelligence.',
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
    description: 'Save sales session context — deals worked, negotiations logged, decisions made.',
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
          enum: ['pipeline_review', 'negotiation', 'provider_acquisition', 'upgrade_strategy', 'weekly_report', 'geographic_expansion'],
        },
        dealsNegotiated: { type: 'number' },
        dealsClosed: { type: 'number' },
        pipelineUpdates: { type: 'number' },
        upgradeTriggersIdentified: { type: 'number' },
        providerGapsIdentified: { type: 'number' },
        sebastianHandoffs: { type: 'number' },
        vivienneReported: { type: 'boolean' },
        totalPipelineValue: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE RAFAEL'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeRafaelToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'manage_sales_pipeline': {
      const { action, leadType, brandOrProviderName, stage, estimatedValue, notes, stalledDaysThreshold, filterByType } = toolInput;

      if (action === 'add_lead' || action === 'update_stage') {
        await supabase.from('partnerships').upsert(
          {
            brand_name: brandOrProviderName || 'Unknown',
            type: leadType || 'unknown',
            status: stage || 'prospecting',
            fee: estimatedValue || 0,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'brand_name' }
        );

        await supabase.from('alerts').insert({
          type: `rafael_pipeline_${action}`,
          message: `Rafael: Pipeline ${action} — ${brandOrProviderName} → ${stage || 'prospecting'}`,
          severity: 'info',
          agent_id: PC_ID,
          metadata: {
            lead_type: leadType,
            brand_or_provider: brandOrProviderName,
            stage,
            estimated_value: estimatedValue || null,
            notes: notes || null,
            actioned_at: new Date().toISOString(),
          },
        });

        if (!sessionContext.pipelineUpdates) sessionContext.pipelineUpdates = 0;
        sessionContext.pipelineUpdates++;

        return {
          success: true,
          action,
          brandOrProviderName,
          stage,
          estimatedValue: estimatedValue || null,
        };
      }

      if (action === 'query_pipeline' || action === 'get_stalled' || action === 'get_won' || action === 'get_lost') {
        let query = supabase
          .from('partnerships')
          .select('brand_name, type, status, fee, notes, start_date, end_date, updated_at')
          .order('fee', { ascending: false });

        if (action === 'get_won') query = query.eq('status', 'closed_won');
        else if (action === 'get_lost') query = query.eq('status', 'closed_lost');
        else if (action === 'get_stalled') {
          const stalledDate = new Date(Date.now() - (stalledDaysThreshold || 14) * 24 * 60 * 60 * 1000).toISOString();
          query = query.lt('updated_at', stalledDate).not('status', 'in', '("closed_won","closed_lost")');
        }

        if (filterByType) query = query.eq('type', filterByType);

        const { data: pipeline } = await query.limit(50);

        const totalValue = (pipeline || []).reduce((sum, p) => sum + parseFloat(p.fee || 0), 0);
        sessionContext.totalPipelineValue = totalValue;

        const byStage = (pipeline || []).reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || []);
          acc[p.status].push({ name: p.brand_name, type: p.type, value: p.fee });
          return acc;
        }, {});

        return {
          action,
          totalDeals: pipeline?.length || 0,
          totalPipelineValue: totalValue.toFixed(2),
          currency: 'USD',
          byStage,
          pipeline: pipeline || [],
        };
      }

      return { error: 'Unknown pipeline action' };
    }

    case 'prepare_pitch': {
      const { targetName, targetType, knownObjections, pitchGoal, coleBriefAvailable } = toolInput;

      // Pull Cole's brief if available
      const { data: coleBrief } = await supabase
        .from('alerts')
        .select('metadata, created_at')
        .eq('type', 'cole_partner_brief_created')
        .like('message', `%${targetName}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Pull any previous negotiation history
      const { data: previousNegotiations } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'rafael_negotiation_log')
        .like('message', `%${targetName}%`)
        .order('created_at', { ascending: false })
        .limit(3);

      // Build objection response library
      const objectionResponses = {
        'too expensive': `PRECCI does not compete on price — we compete on conversion. The question to ask is: what is your current cost per qualified conversion from beauty content? If our AI-driven recommendation converts at 3x the rate of a social post, the economics change completely.`,
        'already have affiliate partners': `Affiliate partnerships are volume plays — lots of recommendations, average conversion. PRECCI is a precision play — fewer recommendations, specific to individuals who have been analysed in real time. We are not replacing your affiliate strategy. We are adding a high-conversion channel alongside it.`,
        'need to think about it': `Completely understood. Can I ask what the one thing is you want to think through? I want to make sure I have given you everything you need to make a decision, or clarify anything that is unclear.`,
        'not in budget': `I hear you. Let me ask — is this a question of the absolute amount, or the return you need to see on that amount? Because if it is the latter, I can restructure this as a performance deal where our fee is tied to conversion — we eat the risk if it does not work.`,
        'need approval': `Of course. What does your approval process look like? And is there anything I can prepare — a case study, a projected conversion model — that would make your internal case stronger?`,
        'not sure PRECCI has enough users': `Fair point to raise early. Here is what I can share: PRECCI is growing at [growth rate] month on month, and our client base is highly engaged — these are people who have just had their skin analysed in real time. The intent to purchase is there at the moment of recommendation. But I appreciate you need to see the numbers — let me send you our current reach metrics.`,
      };

      if (!sessionContext.pitchesPrepped) sessionContext.pitchesPrepped = 0;
      sessionContext.pitchesPrepped++;

      return {
        targetName,
        targetType,
        pitchGoal,
        coleBriefFound: !!coleBrief,
        coleBriefData: coleBrief?.metadata?.brief || null,
        previousNegotiationCount: previousNegotiations?.length || 0,
        previousNegotiations: (previousNegotiations || []).map(n => ({
          outcome: n.metadata?.outcome,
          keyPoints: n.metadata?.key_points,
          date: n.created_at,
        })),
        pitchFramework: {
          open: `"Tell me about your current [relevant pain point for ${targetType}] — what does your current conversion look like from [relevant channel]?"`,
          position: targetType === 'brand_partnership'
            ? `"PRECCI agents recommend products at the exact moment a client's specific need has been identified through real-time camera analysis — not through content discovery. That specificity changes conversion fundamentally."`
            : targetType === 'provider_acquisition'
              ? `"PRECCI Connect sends you clients who are pre-qualified, already know what service they want, and have been briefed on your business before they arrive. You spend zero time on marketing and zero time on consultations — you just deliver."`
              : `"Your clients experience AI-powered appearance analysis under your brand, at your location or on your platform. The technology is PRECCI's. The relationship is yours."`,
          close: `"What would need to be true for this to be the right decision for you?"`,
        },
        objectionResponses: knownObjections
          ? Object.fromEntries(knownObjections.map(obj => [obj, objectionResponses[obj.toLowerCase()] || `Acknowledge. Validate. Clarify. Reframe to value.`]))
          : {},
      };
    }

    case 'log_negotiation': {
      const { dealName, leadType, outcome, keyPoints, agreedTerms, nextStep, estimatedValue, dealStage } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_negotiation_log',
        message: `Rafael: Negotiation logged — ${dealName} — ${outcome}`,
        severity: outcome === 'verbal_agreed' ? 'info' : outcome === 'rejected' ? 'warn' : 'info',
        agent_id: PC_ID,
        resolved: outcome === 'closed_won' || outcome === 'rejected',
        metadata: {
          deal_name: dealName,
          lead_type: leadType,
          outcome,
          key_points: keyPoints,
          agreed_terms: agreedTerms || null,
          next_step: nextStep,
          estimated_value: estimatedValue || null,
          deal_stage: dealStage || null,
          logged_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.dealsNegotiated) sessionContext.dealsNegotiated = 0;
      sessionContext.dealsNegotiated++;

      if (outcome === 'verbal_agreed') {
        if (!sessionContext.dealsClosed) sessionContext.dealsClosed = 0;
        sessionContext.dealsClosed++;
      }

      return {
        logged: true,
        dealName,
        outcome,
        nextStep,
        requiresSebastian: outcome === 'verbal_agreed',
        message: outcome === 'verbal_agreed'
          ? `Verbal agreement logged. Hand to Sebastian for contract drafting immediately.`
          : `Negotiation logged. Next step: ${nextStep}`,
      };
    }

    case 'identify_upgrade_triggers': {
      const { period, targetTierTransition, identifyTopAgentDrivers, briefVivienne } = toolInput;

      const startDate = period === 'today'
        ? new Date().toISOString().split('T')[0]
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Find sessions where clients hit limits
      const { data: sessions } = await supabase
        .from('sessions')
        .select('user_id, agent_id, completed, camera_used, created_at')
        .gte('created_at', startDate)
        .eq('camera_used', true);

      // Find users approaching or at camera limits
      const { data: glowUsers } = await supabase
        .from('users')
        .select('id, plan, name')
        .eq('plan', 'glow');

      // Count camera sessions per glow user
      const glowUserSessions = (sessions || []).filter(s =>
        glowUsers?.some(u => u.id === s.user_id)
      );

      const sessionCountByUser = glowUserSessions.reduce((acc, s) => {
        acc[s.user_id] = (acc[s.user_id] || 0) + 1;
        return acc;
      }, {});

      // Users approaching glow limit (20 try-ons or near camera session limits)
      const approachingLimit = Object.entries(sessionCountByUser)
        .filter(([,count]) => count >= 15)
        .map(([userId, count]) => ({ userId, sessionCount: count }));

      // Agent drivers
      const agentDrivers = identifyTopAgentDrivers
        ? (sessions || []).reduce((acc, s) => {
            acc[s.agent_id] = (acc[s.agent_id] || 0) + 1;
            return acc;
          }, {})
        : null;

      const topAgentDrivers = agentDrivers
        ? Object.entries(agentDrivers).sort(([,a],[,b]) => b - a).slice(0, 5)
        : null;

      // Build upgrade scripts for Vivienne
      const upgradeScripts = {
        free_to_glow: `"I can see you have experienced what PRECCI can do with your free analysis. With PRECCI Glow, you get unlimited camera sessions with Luna, Zara, Mia and all your specialists, plus 20 virtual try-ons each month to see exactly how any look will appear on you. At $9.99 a month, that is the cost of one product you will know actually works before you buy it. Would you like to unlock everything now?"`,
        glow_to_pro: `"You have been getting excellent value from PRECCI Glow — I can see how engaged you are with your sessions. With PRECCI Pro at $19.99, your virtual try-ons become unlimited, your specialists respond with even more depth, and you get a monthly skin and appearance progress report delivered to you by voice. Given how seriously you are approaching this, Pro is where I think you belong. Can I upgrade you now?"`,
        pro_to_elite: `"You are one of our most engaged clients — the depth of your sessions shows that. PRECCI Elite gives you something I think would genuinely change your week: a personal strategy session with Vivienne every week by voice. She reviews your progress across all your appearance goals and we adjust your entire programme accordingly. That is $29.99 — less than a single session with any specialist in the real world. Would you like to step up?"`,
      };

      if (briefVivienne) {
        await supabase.from('alerts').insert({
          type: 'rafael_vivienne_upgrade_brief',
          message: `Rafael → Vivienne: Upgrade trigger brief — ${approachingLimit.length} clients approaching limits`,
          severity: 'info',
          agent_id: 'PC-001',
          metadata: {
            from: PC_ID,
            target_transition: targetTierTransition,
            approaching_limit_count: approachingLimit.length,
            upgrade_scripts: upgradeScripts,
            top_agent_drivers: topAgentDrivers,
            briefed_at: new Date().toISOString(),
          },
        });
      }

      if (!sessionContext.upgradeTriggersIdentified) sessionContext.upgradeTriggersIdentified = 0;
      sessionContext.upgradeTriggersIdentified += approachingLimit.length;

      return {
        period,
        targetTierTransition,
        clientsApproachingLimit: approachingLimit.length,
        approachingLimitDetails: approachingLimit.slice(0, 10),
        topAgentDrivers: topAgentDrivers?.map(([agentId, count]) => ({ agentId, sessionCount: count })),
        upgradeScripts,
        vivienneBriefed: briefVivienne || false,
      };
    }

    case 'identify_provider_gaps': {
      const { geographyFocus, serviceCategories, includeBookingDemand } = toolInput;

      // Check current provider distribution
      let providerQuery = supabase
        .from('service_providers')
        .select('city, country, services, subscription_tier, active')
        .eq('active', true);

      const { data: providers } = await providerQuery;

      // Check booking demand vs supply
      let bookingDemand = null;
      if (includeBookingDemand) {
        const { data: bookings } = await supabase
          .from('provider_bookings')
          .select('services_requested, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const servicesDemand = (bookings || []).reduce((acc, b) => {
          const services = Array.isArray(b.services_requested) ? b.services_requested : [b.services_requested];
          services.forEach(s => {
            if (s) acc[s] = (acc[s] || 0) + 1;
          });
          return acc;
        }, {});

        bookingDemand = Object.entries(servicesDemand)
          .sort(([,a],[,b]) => b - a)
          .slice(0, 10)
          .map(([service, demand]) => ({ service, demandLast30Days: demand }));
      }

      // Provider distribution by country
      const byCountry = (providers || []).reduce((acc, p) => {
        acc[p.country] = (acc[p.country] || 0) + 1;
        return acc;
      }, {});

      // Identify gaps — geographies with clients but few providers
      const { data: clientsByCountry } = await supabase
        .from('users')
        .select('country')
        .not('country', 'is', null);

      const clientCountByCountry = (clientsByCountry || []).reduce((acc, u) => {
        acc[u.country] = (acc[u.country] || 0) + 1;
        return acc;
      }, {});

      const gaps = Object.entries(clientCountByCountry)
        .map(([country, clients]) => ({
          country,
          clients,
          providers: byCountry[country] || 0,
          ratio: byCountry[country] ? Math.round(clients / byCountry[country]) : clients,
          gap: !byCountry[country] || clients / byCountry[country] > 50,
        }))
        .filter(g => g.gap)
        .sort((a, b) => b.clients - a.clients)
        .slice(0, 10);

      if (!sessionContext.providerGapsIdentified) sessionContext.providerGapsIdentified = 0;
      sessionContext.providerGapsIdentified += gaps.length;

      return {
        totalActiveProviders: providers?.length || 0,
        providersByCountry: byCountry,
        topGaps: gaps,
        bookingDemand,
        acquisitionPriorities: gaps.slice(0, 5).map(g => ({
          country: g.country,
          clients: g.clients,
          currentProviders: g.providers,
          clientsPerProvider: g.ratio,
          urgency: g.providers === 0 ? 'critical' : 'high',
        })),
      };
    }

    case 'flag_to_sebastian': {
      const { dealName, dealType, agreedTerms, counterpartyDetails, urgency, counterpartyDeadline, specialTerms } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_sebastian_handoff',
        message: `Rafael → Sebastian: Contract needed — ${dealName} (${dealType})`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-007',
        metadata: {
          from: PC_ID,
          deal_name: dealName,
          deal_type: dealType,
          agreed_terms: agreedTerms,
          counterparty_details: counterpartyDetails,
          urgency,
          counterparty_deadline: counterpartyDeadline || null,
          special_terms: specialTerms || [],
          handed_off_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.sebastianHandoffs) sessionContext.sebastianHandoffs = 0;
      sessionContext.sebastianHandoffs++;

      return {
        handedOff: true,
        targetAgent: 'PC-007',
        dealName,
        dealType,
        urgency,
        message: `${dealName} handed to Sebastian for contract drafting. Terms provided.`,
      };
    }

    case 'flag_to_sienna': {
      const { supportType, targetGeographies, targetProviderCategories, salesContext, timeline, budget } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_sienna_request',
        message: `Rafael → Sienna: Marketing support needed — ${supportType}`,
        severity: 'info',
        agent_id: 'PC-004',
        metadata: {
          from: PC_ID,
          support_type: supportType,
          target_geographies: targetGeographies || [],
          target_provider_categories: targetProviderCategories || [],
          sales_context: salesContext,
          timeline: timeline || 'ASAP',
          budget: budget || 'TBD',
          requested_at: new Date().toISOString(),
        },
      });

      return {
        requested: true,
        targetAgent: 'PC-004',
        supportType,
        message: `Marketing support request sent to Sienna.`,
      };
    }

    case 'flag_to_finn': {
      const { acquisitionTarget, targetGeographies, targetCategories, messagingBrief, budget, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_finn_brief',
        message: `Rafael → Finn: Provider acquisition ads needed — ${acquisitionTarget.substring(0, 60)}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-022',
        metadata: {
          from: PC_ID,
          acquisition_target: acquisitionTarget,
          target_geographies: targetGeographies || [],
          target_categories: targetCategories || [],
          messaging_brief: messagingBrief,
          budget: budget || 'TBD',
          urgency,
          briefed_at: new Date().toISOString(),
        },
      });

      return {
        briefed: true,
        targetAgent: 'PC-022',
        acquisitionTarget,
        message: `Provider acquisition ad brief sent to Finn.`,
      };
    }

    case 'flag_to_brook': {
      const { acquisitionUpdate, incomingProviders, gapsIdentified } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_brook_update',
        message: `Rafael → Brook: Provider acquisition update`,
        severity: 'info',
        agent_id: 'PC-027',
        metadata: {
          from: PC_ID,
          acquisition_update: acquisitionUpdate,
          incoming_providers: incomingProviders || [],
          gaps_identified: gapsIdentified || null,
          updated_at: new Date().toISOString(),
        },
      });

      return {
        updated: true,
        targetAgent: 'PC-027',
        incomingProviderCount: incomingProviders?.length || 0,
        message: `Provider acquisition update sent to Brook.`,
      };
    }

    case 'flag_to_celeste': {
      const { dealName, dealType, dealValue, revenueStream, paymentStructure, closedAt } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_celeste_deal',
        message: `Rafael → Celeste: Deal closed — ${dealName}${dealValue ? ` — $${dealValue}` : ''}`,
        severity: 'info',
        agent_id: 'PC-002',
        metadata: {
          from: PC_ID,
          deal_name: dealName,
          deal_type: dealType,
          deal_value: dealValue || null,
          revenue_stream: revenueStream,
          payment_structure: paymentStructure || null,
          closed_at: closedAt || new Date().toISOString(),
          reported_at: new Date().toISOString(),
        },
      });

      // Update revenue summary if deal value is known
      if (dealValue && dealValue > 0) {
        try {
          const { updateRevenueSummary } = require('./celeste');
          await updateRevenueSummary({
            stream: revenueStream,
            amount: dealValue,
            currency: 'USD',
          });
        } catch (e) {
          // Non-fatal — Celeste will reconcile
        }
      }

      return {
        reported: true,
        targetAgent: 'PC-002',
        dealName,
        dealValue: dealValue || 'TBD',
        message: `Deal financials reported to Celeste.`,
      };
    }

    case 'flag_to_vivienne': {
      const {
        reportType, summary, pipelineValue, closedThisWeek, upgradeConversions,
        providerRegistrations, topOpportunity, upgradeScripts, urgency,
      } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_vivienne_report',
        message: `Rafael → Vivienne: ${reportType} — ${summary.substring(0, 80)}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-001',
        metadata: {
          from: PC_ID,
          report_type: reportType,
          summary,
          pipeline_value: pipelineValue || null,
          closed_this_week: closedThisWeek || 0,
          upgrade_conversions: upgradeConversions || 0,
          provider_registrations: providerRegistrations || 0,
          top_opportunity: topOpportunity || null,
          upgrade_scripts: upgradeScripts || null,
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
        message: `Sales report sent to Vivienne.`,
      };
    }

    case 'flag_to_elton': {
      const { metricsNeeded, period, actionContext } = toolInput;

      await supabase.from('alerts').insert({
        type: 'rafael_elton_request',
        message: `Rafael → Elton: Sales analytics requested — ${metricsNeeded.join(', ')}`,
        severity: 'info',
        agent_id: 'PC-020',
        metadata: {
          from: PC_ID,
          metrics_needed: metricsNeeded,
          period,
          action_context: actionContext || null,
          requested_at: new Date().toISOString(),
        },
      });

      return {
        requested: true,
        targetAgent: 'PC-020',
        metricsNeeded,
        period,
        message: `Sales analytics request sent to Elton.`,
      };
    }

    case 'recall_sales_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'rafael_sales_history',
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
        userId: 'rafael_sales_history',
        content,
        memoryType: 'sales_session',
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
        message: `Rafael completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          deals_negotiated: sessionContext.dealsNegotiated || 0,
          deals_closed: sessionContext.dealsClosed || 0,
          pipeline_updates: sessionContext.pipelineUpdates || 0,
          upgrade_triggers_identified: sessionContext.upgradeTriggersIdentified || 0,
          provider_gaps_identified: sessionContext.providerGapsIdentified || 0,
          sebastian_handoffs: sessionContext.sebastianHandoffs || 0,
          vivienne_reported: sessionContext.vivienneReported || false,
          total_pipeline_value: sessionContext.totalPipelineValue || 0,
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
// WEEKLY PIPELINE REVIEW
// Called every Monday by cron
// ─────────────────────────────────────────────
async function weeklyPipelineReview() {
  logger.info('Rafael: Weekly pipeline review triggered');

  const sessionContext = {
    dealsNegotiated: 0,
    dealsClosed: 0,
    pipelineUpdates: 0,
    upgradeTriggersIdentified: 0,
    providerGapsIdentified: 0,
    sebastianHandoffs: 0,
    vivienneReported: false,
    totalPipelineValue: 0,
  };

  try {
    // Review full pipeline
    const pipeline = await executeRafaelToolCall(
      'manage_sales_pipeline',
      { action: 'query_pipeline' },
      sessionContext
    );

    // Find stalled deals
    const stalled = await executeRafaelToolCall(
      'manage_sales_pipeline',
      { action: 'get_stalled', stalledDaysThreshold: 14 },
      sessionContext
    );

    // Identify upgrade triggers
    const upgradeTriggers = await executeRafaelToolCall(
      'identify_upgrade_triggers',
      { period: 'week', targetTierTransition: 'glow_to_pro', identifyTopAgentDrivers: true, briefVivienne: true },
      sessionContext
    );

    // Identify provider gaps
    const providerGaps = await executeRafaelToolCall(
      'identify_provider_gaps',
      { includeBookingDemand: true },
      sessionContext
    );

    // Brief Finn on provider acquisition needs
    if (providerGaps.acquisitionPriorities?.length > 0) {
      await executeRafaelToolCall(
        'flag_to_finn',
        {
          acquisitionTarget: 'Service providers in underserved geographies',
          targetGeographies: providerGaps.acquisitionPriorities.map(g => g.country),
          targetCategories: ['hair_salon', 'barber', 'nail_technician', 'mens_grooming_studio'],
          messagingBrief: 'PRECCI Connect sends you pre-qualified clients who already know exactly what service they want. You deliver — PRECCI sends the clients.',
          urgency: 'normal',
        },
        sessionContext
      );
    }

    // Report to Vivienne
    await executeRafaelToolCall(
      'flag_to_vivienne',
      {
        reportType: 'weekly_sales_report',
        summary: `Pipeline: ${pipeline.totalDeals} deals worth $${pipeline.totalPipelineValue}. Stalled: ${stalled.totalDeals}. Upgrade triggers: ${upgradeTriggers.clientsApproachingLimit}. Provider gaps: ${providerGaps.topGaps?.length}.`,
        pipelineValue: parseFloat(pipeline.totalPipelineValue),
        upgradeConversions: upgradeTriggers.clientsApproachingLimit,
        topOpportunity: pipeline.pipeline?.[0]?.brand_name || 'No high-value deals in pipeline',
        upgradeScripts: [upgradeTriggers.upgradeScripts?.glow_to_pro],
        urgency: stalled.totalDeals > 5 ? 'urgent' : 'normal',
      },
      sessionContext
    );

    const supabase = getServiceClient();
    await supabase.from('alerts').insert({
      type: 'rafael_weekly_review',
      message: `Rafael: Weekly pipeline review complete — ${pipeline.totalDeals} deals, $${pipeline.totalPipelineValue} pipeline`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        total_deals: pipeline.totalDeals,
        total_value: pipeline.totalPipelineValue,
        stalled_deals: stalled.totalDeals,
        upgrade_triggers: upgradeTriggers.clientsApproachingLimit,
        provider_gaps: providerGaps.topGaps?.length || 0,
        reviewed_at: new Date().toISOString(),
      },
    });

    logger.info('Rafael: Weekly pipeline review complete', {
      totalDeals: pipeline.totalDeals,
      totalValue: pipeline.totalPipelineValue,
      stalledDeals: stalled.totalDeals,
    });

    return { success: true, pipeline, stalled, upgradeTriggers, providerGaps };
  } catch (error) {
    logger.error('Rafael: Weekly review failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS RAFAEL SESSION
// Full autonomous agentic reasoning loop.
// Rafael reviews pipeline, prepares pitches,
// logs negotiations, identifies opportunities.
// ─────────────────────────────────────────────
async function processRafaelSession({
  sessionType = 'pipeline_review',
  transcript = '',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sessionContext = {
    sessionType,
    dealsNegotiated: 0,
    dealsClosed: 0,
    pipelineUpdates: 0,
    upgradeTriggersIdentified: 0,
    providerGapsIdentified: 0,
    sebastianHandoffs: 0,
    vivienneReported: false,
    totalPipelineValue: 0,
    pitchesPrepped: 0,
  };

  const today = new Date();
  const isMonday = today.getDay() === 1;

  const contextParts = [
    `RAFAEL SESSION TYPE: ${sessionType}`,
    `TODAY: ${today.toISOString().split('T')[0]}`,
    transcript ? `INSTRUCTION OR COLE LEAD: ${transcript}` : '',
    isMonday ? 'MONDAY: Full weekly pipeline review. Identify stalled deals. Find upgrade triggers. Identify provider gaps. Brief Finn. Report to Vivienne.' : '',
    `ALWAYS: Every verbally agreed deal gets handed to Sebastian immediately.`,
    `ALWAYS: Upgrade triggers identified must be briefed to Vivienne with specific scripts.`,
    `ALWAYS: Provider gaps identified must be briefed to Finn for advertising support.`,
    `NEGOTIATION PRINCIPLE: You believe in PRECCI completely. Your confidence comes from genuine conviction. You know PRECCI is in a category of one. Communicate that conviction clearly.`,
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
      system: RAFAEL_SYSTEM_PROMPT,
      tools: RAFAEL_TOOLS,
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
        result = await executeRafaelToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Rafael: Tool call failed', {
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
    finalResponseText = `Rafael: ${sessionType} complete. Pipeline reviewed and updated. ${sessionContext.dealsClosed} deals at verbal agreement stage.`;
  }

  logger.info('Rafael: Session complete', {
    sessionType,
    dealsNegotiated: sessionContext.dealsNegotiated,
    dealsClosed: sessionContext.dealsClosed,
    pipelineUpdates: sessionContext.pipelineUpdates,
    vivienneReported: sessionContext.vivienneReported,
  });

  return {
    responseText: finalResponseText,
    dealsNegotiated: sessionContext.dealsNegotiated,
    dealsClosed: sessionContext.dealsClosed,
    pipelineUpdates: sessionContext.pipelineUpdates,
    upgradeTriggersIdentified: sessionContext.upgradeTriggersIdentified,
    providerGapsIdentified: sessionContext.providerGapsIdentified,
    sebastianHandoffs: sessionContext.sebastianHandoffs,
    vivienneReported: sessionContext.vivienneReported,
    totalPipelineValue: sessionContext.totalPipelineValue,
  };
}

module.exports = {
  processRafaelSession,
  weeklyPipelineReview,
  RAFAEL_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};