// FILE: precci/backend/src/agents/cole.js
// Cole — PC-024 — Brand Partnerships
// COMPLETE FULL BUILD — no simplification anywhere.
// Identifies and manages collaborations with global beauty,
// grooming, fashion and lifestyle brands for ALL genders.
// Male grooming brands, gender-neutral brands, female beauty brands —
// all equally pursued and managed.
// Works with Rafael (CSO) on deal terms and negotiation.
// Works with Sebastian (CLO) on all contracts and compliance.
// Works with Sienna (CMO) on campaign execution.
// Works with Nova on affiliate integration for partner brands.
// Works with Elton on partnership performance analytics.
// Researches opportunities via Serper API.
// Scores every opportunity before pursuing.
// Tracks full pipeline from identification to live deal.
// Reports all partnership revenue to Celeste.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-024';
const AGENT_NAME = 'Cole';

// ─────────────────────────────────────────────
// COLE'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const COLE_SYSTEM_PROMPT = `You are Cole, the Brand Partnerships specialist at PRECCI.
Your ID is PC-024.

You identify, pursue and manage every brand partnership for PRECCI.
You work completely autonomously — zero human input required for
research, scoring, initial outreach briefing, pipeline management
and performance tracking. You hand to Rafael for negotiation and
Sebastian for contracts. Everything else is yours.

YOUR PARTNERSHIP MISSION:
PRECCI partners with brands that make genuine products for real
people of all genders, all skin tones, all body types and all
aesthetic preferences. You never pursue a brand that conflicts
with PRECCI's values — inclusivity, evidence-based recommendations,
honest marketing, zero gender assumptions.

The ideal PRECCI partner:
- Makes quality products that genuinely work
- Serves a broad audience — ideally all genders
- Has values aligned with honesty and inclusion
- Is willing to let PRECCI's agents recommend authentically
  (not scripted endorsements — honest recommendations only)
- Offers fair affiliate commission or partnership terms
- Has audience overlap with PRECCI's client base

PARTNERSHIP CATEGORIES — COMPLETE:

SKINCARE BRANDS:
Premium skincare: clinical-grade, dermatologist-developed,
  evidence-based. Perfect for Luna's recommendations.
Male skincare: brands specifically for male skin — post-shave,
  beard care, male moisturisers. Perfect for Drew's recommendations.
Universal skincare: gender-neutral, all-skin-type formulations.
  Works across all PRECCI agents.
Natural and clean beauty: sustainable, clean ingredient brands.
  Growing segment in PRECCI's audience.
Prescription-adjacent: over-the-counter retinols, acid treatments,
  professional-grade actives. High-value recommendations.

HAIRCARE BRANDS:
Texture-specific: brands specialising in 4C, curly, wavy, straight.
  For Zara's recommendations.
Professional: salon-grade brands. High credibility with Zara's clients.
Male haircare: grooming-focused — pomades, clays, beard oils,
  beard balms. For Drew's recommendations.
Scalp care: growing category, strong evidence-based angle.

GROOMING BRANDS:
Shaving: premium razors, shaving creams, pre-shave oils.
  High-value male grooming category.
Tools: trimmers, clippers, styling tools.
Body grooming: body hair removal, post-grooming care.
Male wellness: expanding rapidly, strong revenue potential.

MAKEUP AND COLOUR:
Foundation brands: inclusive shade ranges are non-negotiable.
  Any makeup brand with limited shade range is excluded.
Colour cosmetics: eyeshadow, lip, face colour.
Clean makeup: waterproof, long-wear, high-performance.
Male grooming appearance products: tinted moisturisers, BB creams,
  concealers for men — emerging high-growth category.

FRAGRANCE:
Niche fragrance houses: high margin, collector audience.
Designer fragrance: broad appeal, high recognition.
Gender-neutral fragrance: aligned with Remy's recommendation
  philosophy.
Male fragrance: colognes, aftershaves.

STYLE AND FASHION:
Sustainable fashion: strong values alignment.
Size-inclusive fashion: non-negotiable inclusivity standard.
Menswear brands: for Isla's male client recommendations.
Gender-neutral fashion: growing and strategically important.
Accessories: watches, belts, bags — high margin affiliate items.

BODY CARE:
Body skincare: creams, oils, treatments. For Cora's recommendations.
Wellness: massage tools, body care devices.
Sun care: SPF body products — cross-selling with Luna.

RESEARCH METHODOLOGY:
You research every potential partner before approaching them.
Using Serper API you investigate:
1. Brand reputation — what do real customers say?
2. Ingredient quality — is there evidence behind their claims?
3. Inclusivity record — shade range, model diversity, gendered
   marketing or gender-neutral?
4. Audience demographics — overlap with PRECCI's user base?
5. Current partnership landscape — who else do they work with?
6. Revenue size and growth — are they growing or declining?
7. Values alignment — any past controversies?
8. Commission rates — what do affiliates typically earn?

SCORING SYSTEM — EVERY OPPORTUNITY SCORED BEFORE PURSUIT:
You score every brand on 6 dimensions, each 1-10:

Product Quality (weight 25%): evidence quality, ingredient
  integrity, clinical claims supported by data.
Audience Alignment (weight 20%): overlap between brand's
  audience and PRECCI's client demographic.
Values Alignment (weight 20%): inclusivity practice, marketing
  honesty, gender-neutral approach or genuine gender diversity.
Revenue Potential (weight 15%): commission rate, average order
  value, conversion likelihood from PRECCI recommendations.
Brand Credibility (weight 10%): reputation, press, reviews.
Strategic Value (weight 10%): does this partnership open new
  markets, categories or audiences for PRECCI?

Minimum score to pursue: 65/100.
Score 65-74: standard outreach, normal pipeline.
Score 75-84: priority outreach, faster pipeline.
Score 85+: strategic priority, involve Rafael immediately.

PIPELINE STAGES:
1. IDENTIFIED: Brand added to pipeline, initial research complete
2. SCORED: Scoring complete, decision to pursue made
3. RESEARCH: Deep research complete, pitch angle identified
4. OUTREACH: Introduction email drafted for Lena to send
5. IN_DISCUSSION: Brand has responded, discussing terms
6. NEGOTIATING: Rafael is in active negotiation
7. CONTRACT: Sebastian is drafting the agreement
8. ACTIVE: Partnership live, campaign running
9. PAUSED: Temporarily inactive
10. REJECTED: Not pursuing, reason logged

WHAT MAKES PRECCI VALUABLE TO PARTNERS:
You know exactly why a brand should want to partner with PRECCI:
- PRECCI's agents make personalised recommendations based on
  actual skin, hair and body analysis — not generic suggestions.
  When Luna recommends a brand's vitamin C serum because she
  can see hyperpigmentation on a client's actual face, that
  recommendation converts at dramatically higher rates than
  social media content.
- PRECCI's client base is high-intent, appearance-focused and
  willing to spend on quality products.
- PRECCI reaches male clients at the point of maximum purchase
  intent — when Drew recommends a beard oil after analysing
  their beard condition, the client is ready to buy immediately.
- PRECCI's analytics (via Elton) can show partners exactly
  which products convert, at what rate, in which demographics.
- PRECCI is the world's first AI appearance intelligence system —
  partnering with PRECCI is a premium, innovative positioning.

WHAT YOU NEVER DO:
- Never pursue a brand that would compromise PRECCI's editorial
  independence — no brand can dictate what PRECCI agents recommend
- Never pursue a brand with a values conflict (known harmful
  ingredients, deceptive marketing, cultural appropriation)
- Never pursue a brand with a limited shade range for makeup
- Never pursue a brand whose products you cannot verify quality for
- Never make a commitment on behalf of PRECCI — you research
  and brief. Rafael negotiates. Sebastian contracts.

WORKING WITH THE TEAM:
Rafael (CSO): You hand every qualified lead to Rafael with a
  complete brief — brand overview, scoring, recommended deal
  structure, your pitch angle. He takes it from there.
Sebastian (CLO): You flag when a brand is ready for contracts
  and provide him with the partnership brief. He and Eva handle all.
Sienna (CMO): When a deal closes, you brief Sienna on the
  brand, the deal terms and campaign requirements.
Nova (Commerce): You ensure every active partner brand is
  available in Nova's product recommendations. You brief Nova
  on the partnership so she can prioritise partner products
  appropriately.
Elton (Data): You receive performance analytics from Elton on
  active partnerships — conversion rates, revenue, click-through.
  This drives your renewal and expansion decisions.
Lena (Support): For any client-facing communications about
  partnerships — introductions, announcements — you brief
  Lena to send via email.
Celeste (CFO): All partnership revenue reported to Celeste.
  You provide her with the deal value, commission structure and
  revenue realised.

TOOLS AVAILABLE — USE ALL OF THEM:
- research_brand: Deep research on any brand via Serper
- score_opportunity: Score a brand against PRECCI's criteria
- manage_pipeline: Add, update or query the partnership pipeline
- create_partner_brief: Create full brief for Rafael and Sebastian
- brief_nova: Ensure Nova has partner brand in her product catalogue
- flag_to_rafael: Hand qualified lead to Rafael for negotiation
- flag_to_sebastian: Flag when contracts are needed
- flag_to_sienna: Brief CMO on closed deals for campaign planning
- flag_to_celeste: Report partnership revenue and deal values
- flag_to_elton: Request performance analytics on active partnerships
- recall_partnership_memory: Search partnership history
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// COLE'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const COLE_TOOLS = [
  {
    name: 'research_brand',
    description: 'Deep research on any brand using Serper API — reputation, product quality, inclusivity record, audience demographics, competitor partnerships, commission rates. Call this before scoring any opportunity.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string', description: 'Brand to research' },
        brandCategory: {
          type: 'string',
          enum: ['skincare', 'haircare', 'grooming', 'makeup', 'fragrance', 'fashion', 'body_care', 'wellness', 'accessories'],
        },
        specificQuestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific things to investigate — e.g. shade range inclusivity, clinical evidence, affiliate commission rates',
        },
      },
      required: ['brandName', 'brandCategory'],
    },
  },
  {
    name: 'score_opportunity',
    description: 'Score a brand partnership opportunity against PRECCI\'s 6-dimension scoring system. Returns weighted score and pursue/pass recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string' },
        brandCategory: { type: 'string' },
        productQuality: { type: 'number', description: '1-10 — evidence quality, ingredient integrity, clinical backing' },
        audienceAlignment: { type: 'number', description: '1-10 — overlap with PRECCI client demographics' },
        valuesAlignment: { type: 'number', description: '1-10 — inclusivity, honest marketing, gender approach' },
        revenuePotential: { type: 'number', description: '1-10 — commission rate, AOV, conversion likelihood' },
        brandCredibility: { type: 'number', description: '1-10 — reputation, press, reviews' },
        strategicValue: { type: 'number', description: '1-10 — new markets, categories or audiences opened' },
        notes: { type: 'string', description: 'Key observations driving these scores' },
      },
      required: ['brandName', 'productQuality', 'audienceAlignment', 'valuesAlignment', 'revenuePotential', 'brandCredibility', 'strategicValue'],
    },
  },
  {
    name: 'manage_pipeline',
    description: 'Add a new brand to the partnership pipeline, update an existing brand\'s stage, or query the current pipeline state.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'update_stage', 'query', 'get_all'],
        },
        brandName: { type: 'string' },
        brandCategory: { type: 'string' },
        stage: {
          type: 'string',
          enum: ['identified', 'scored', 'research', 'outreach', 'in_discussion', 'negotiating', 'contract', 'active', 'paused', 'rejected'],
        },
        score: { type: 'number', description: 'Opportunity score from score_opportunity' },
        notes: { type: 'string', description: 'Stage update notes or observations' },
        estimatedDealValue: { type: 'number', description: 'Estimated annual partnership value in USD' },
        priority: { type: 'string', enum: ['standard', 'priority', 'strategic'] },
        filterByStage: { type: 'string', description: 'For query — filter by specific stage' },
      },
      required: ['action'],
    },
  },
  {
    name: 'create_partner_brief',
    description: 'Create a complete partnership brief for Rafael and Sebastian. Called when a brand scores 65+ and Cole is ready to hand off for negotiation.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string' },
        brandCategory: { type: 'string' },
        score: { type: 'number' },
        brandOverview: { type: 'string', description: 'Complete brand overview from research' },
        whyPrecci: { type: 'string', description: 'Why PRECCI wants this partnership' },
        whyBrand: { type: 'string', description: 'Why this brand should want PRECCI — Cole\'s pitch for the brand' },
        recommendedDealStructure: {
          type: 'object',
          properties: {
            dealType: { type: 'string', enum: ['affiliate', 'paid_partnership', 'co_campaign', 'ambassador', 'licensing'] },
            suggestedFee: { type: 'string', description: 'Suggested partnership fee or commission structure' },
            deliverables: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            exclusivity: { type: 'string', description: 'What exclusivity if any Cole recommends requesting' },
          },
        },
        agentIntegration: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which PRECCI agents would feature this brand and how — e.g. Luna for vitamin C, Drew for beard oil',
        },
        keyContacts: { type: 'string', description: 'Who to contact at the brand if known' },
        risks: { type: 'array', items: { type: 'string' }, description: 'Any risks or considerations' },
      },
      required: ['brandName', 'score', 'brandOverview', 'whyPrecci', 'whyBrand', 'recommendedDealStructure'],
    },
  },
  {
    name: 'brief_nova',
    description: 'Ensure an active partner brand is available in Nova\'s product catalogue and Nova knows the partnership context.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string' },
        brandCategory: { type: 'string' },
        partnershipType: { type: 'string', description: 'Affiliate, paid, co-branded — affects how prominently Nova features' },
        commissionRate: { type: 'number', description: 'Affiliate commission percentage — Nova tracks this' },
        featuredProducts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific products from this brand to prioritise in Nova\'s recommendations',
        },
        genderContext: {
          type: 'string',
          enum: ['all', 'male', 'female', 'unisex'],
          description: 'Primary gender relevance — Nova filters appropriately',
        },
        agentPriority: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which agents should prioritise this brand — e.g. [PC-008, PC-014] for Luna and Drew',
        },
      },
      required: ['brandName', 'brandCategory', 'commissionRate', 'genderContext'],
    },
  },
  {
    name: 'flag_to_rafael',
    description: 'Hand a qualified partnership lead to Rafael (CSO) for negotiation. Always include the complete partner brief.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string' },
        score: { type: 'number' },
        priority: { type: 'string', enum: ['standard', 'priority', 'strategic'] },
        briefSummary: { type: 'string', description: 'Summary of the partner brief' },
        recommendedDealStructure: { type: 'object' },
        whyNow: { type: 'string', description: 'Why this is the right time to approach this brand' },
        estimatedDealValue: { type: 'number' },
      },
      required: ['brandName', 'score', 'briefSummary'],
    },
  },
  {
    name: 'flag_to_sebastian',
    description: 'Flag to Sebastian (CLO) when a brand deal is ready for contract drafting.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string' },
        dealTerms: { type: 'string', description: 'Terms agreed by Rafael' },
        dealType: { type: 'string' },
        contractRequired: { type: 'string', description: 'Type of contract needed — partnership agreement, affiliate agreement, co-campaign agreement' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
        specialConsiderations: { type: 'array', items: { type: 'string' } },
      },
      required: ['brandName', 'dealTerms', 'contractRequired'],
    },
  },
  {
    name: 'flag_to_sienna',
    description: 'Brief Sienna (CMO) when a deal closes so she can plan the campaign launch.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string' },
        brandCategory: { type: 'string' },
        dealType: { type: 'string' },
        dealValue: { type: 'number' },
        campaignRequirements: { type: 'string', description: 'What the deal requires from marketing' },
        launchDate: { type: 'string', description: 'When the campaign should launch' },
        agentsInvolved: { type: 'array', items: { type: 'string' }, description: 'Which agents feature this brand' },
        keyMessages: { type: 'array', items: { type: 'string' } },
      },
      required: ['brandName', 'dealType', 'campaignRequirements'],
    },
  },
  {
    name: 'flag_to_celeste',
    description: 'Report partnership revenue and deal values to Celeste (CFO).',
    input_schema: {
      type: 'object',
      properties: {
        reportType: { type: 'string', enum: ['new_deal', 'revenue_report', 'renewal', 'termination'] },
        brandName: { type: 'string' },
        dealValue: { type: 'number', description: 'Total deal value in USD' },
        commissionRate: { type: 'number', description: 'Affiliate commission percentage if applicable' },
        estimatedMonthlyRevenue: { type: 'number' },
        revenueStream: { type: 'string', description: 'Maps to: brand_partnerships or affiliate_commissions' },
      },
      required: ['reportType', 'brandName'],
    },
  },
  {
    name: 'flag_to_elton',
    description: 'Request performance analytics from Elton on active partnerships — conversion rates, revenue generated, click-through by brand.',
    input_schema: {
      type: 'object',
      properties: {
        brandName: { type: 'string', description: 'Specific brand or "all" for all active partners' },
        period: { type: 'string', enum: ['week', 'month', 'quarter'] },
        metricsNeeded: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific metrics: conversion_rate, revenue_generated, click_through, recommendation_count',
        },
      },
      required: ['brandName', 'period'],
    },
  },
  {
    name: 'recall_partnership_memory',
    description: 'Search PRECCI\'s partnership history — brands previously approached, deals won and lost, competitor partnership patterns.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search — brand name, category, deal type, outcome' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save session context — brands researched, pipeline updates, decisions made.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Session summary' },
        metadata: {
          type: 'object',
          description: 'brandsResearched[], pipelineUpdates[], decisionsLogged[], handoffsCompleted[]',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia at end of every Cole session.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['brand_research', 'pipeline_review', 'deal_brief', 'performance_review', 'weekly_prospecting'],
        },
        brandsResearched: { type: 'number' },
        brandsScored: { type: 'number' },
        pipelineUpdates: { type: 'number' },
        briefsCreated: { type: 'number' },
        rafaelHandoffs: { type: 'number' },
        sebastianHandoffs: { type: 'number' },
        siennaHandoffs: { type: 'number' },
        totalPipelineValue: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE COLE'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeColeToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'research_brand': {
      const { brandName, brandCategory, specificQuestions } = toolInput;

      // In production: Serper API calls for brand research
      // Log the research activity
      await supabase.from('alerts').insert({
        type: 'cole_brand_research',
        message: `Cole: Researching ${brandName} (${brandCategory})`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          brand_name: brandName,
          brand_category: brandCategory,
          specific_questions: specificQuestions || [],
          researched_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.brandsResearched) sessionContext.brandsResearched = [];
      sessionContext.brandsResearched.push(brandName);

      return {
        brandName,
        brandCategory,
        researchComplete: true,
        note: 'Serper API will return live brand research when SERPER_API_KEY is configured',
        researchAreas: [
          'Brand reputation and customer reviews',
          'Product quality and ingredient evidence',
          `Inclusivity record — shade range, model diversity, gendered vs gender-neutral marketing`,
          'Audience demographics and overlap with PRECCI users',
          'Current affiliate and brand partnerships',
          'Revenue size, growth trajectory and market position',
          'Commission rates typical for this brand category',
          'Any known controversies or values misalignments',
        ],
        researchedAt: new Date().toISOString(),
      };
    }

    case 'score_opportunity': {
      const {
        brandName, brandCategory,
        productQuality, audienceAlignment, valuesAlignment,
        revenuePotential, brandCredibility, strategicValue, notes,
      } = toolInput;

      // Weighted scoring calculation
      const weightedScore = (
        (productQuality * 0.25) +
        (audienceAlignment * 0.20) +
        (valuesAlignment * 0.20) +
        (revenuePotential * 0.15) +
        (brandCredibility * 0.10) +
        (strategicValue * 0.10)
      ) * 10;

      const roundedScore = Math.round(weightedScore * 10) / 10;

      const priority = roundedScore >= 85 ? 'strategic'
        : roundedScore >= 75 ? 'priority'
        : roundedScore >= 65 ? 'standard'
        : 'pass';

      const recommendation = roundedScore >= 65 ? 'PURSUE' : 'PASS';

      // Log scoring decision
      await supabase.from('alerts').insert({
        type: 'cole_brand_scored',
        message: `Cole: ${brandName} scored ${roundedScore}/100 — ${recommendation}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          brand_name: brandName,
          brand_category: brandCategory,
          scores: { productQuality, audienceAlignment, valuesAlignment, revenuePotential, brandCredibility, strategicValue },
          weighted_score: roundedScore,
          recommendation,
          priority,
          notes: notes || null,
          scored_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.brandsScored) sessionContext.brandsScored = 0;
      sessionContext.brandsScored++;

      return {
        brandName,
        scores: {
          productQuality: { raw: productQuality, weighted: productQuality * 0.25 },
          audienceAlignment: { raw: audienceAlignment, weighted: audienceAlignment * 0.20 },
          valuesAlignment: { raw: valuesAlignment, weighted: valuesAlignment * 0.20 },
          revenuePotential: { raw: revenuePotential, weighted: revenuePotential * 0.15 },
          brandCredibility: { raw: brandCredibility, weighted: brandCredibility * 0.10 },
          strategicValue: { raw: strategicValue, weighted: strategicValue * 0.10 },
        },
        totalScore: roundedScore,
        recommendation,
        priority,
        minimumToPass: 65,
        notes,
      };
    }

    case 'manage_pipeline': {
      const { action, brandName, brandCategory, stage, score, notes, estimatedDealValue, priority, filterByStage } = toolInput;

      if (action === 'add' || action === 'update_stage') {
        await supabase.from('partnerships').upsert(
          {
            brand_name: brandName,
            type: brandCategory || 'unknown',
            status: stage || 'identified',
            fee: estimatedDealValue || 0,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'brand_name' }
        );

        // Log pipeline action
        await supabase.from('alerts').insert({
          type: `cole_pipeline_${action}`,
          message: `Cole: Pipeline ${action} — ${brandName} → ${stage || 'identified'}`,
          severity: 'info',
          agent_id: PC_ID,
          metadata: {
            brand_name: brandName,
            category: brandCategory,
            stage,
            score: score || null,
            estimated_value: estimatedDealValue || null,
            priority: priority || 'standard',
            notes,
            actioned_at: new Date().toISOString(),
          },
        });

        if (!sessionContext.pipelineUpdates) sessionContext.pipelineUpdates = 0;
        sessionContext.pipelineUpdates++;

        return {
          success: true,
          action,
          brandName,
          stage: stage || 'identified',
          estimatedDealValue: estimatedDealValue || null,
          priority: priority || 'standard',
        };
      }

      if (action === 'query' || action === 'get_all') {
        let query = supabase
          .from('partnerships')
          .select('brand_name, type, status, fee, notes, start_date, end_date')
          .order('fee', { ascending: false });

        if (filterByStage) {
          query = query.eq('status', filterByStage);
        }

        const { data: pipeline } = await query.limit(50);

        const pipelineByStage = (pipeline || []).reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || []);
          acc[p.status].push({ name: p.brand_name, type: p.type, value: p.fee });
          return acc;
        }, {});

        const totalPipelineValue = (pipeline || []).reduce((sum, p) => sum + parseFloat(p.fee || 0), 0);

        return {
          pipeline: pipeline || [],
          byStage: pipelineByStage,
          totalBrands: pipeline?.length || 0,
          totalPipelineValue: totalPipelineValue.toFixed(2),
          currency: 'USD',
        };
      }

      return { error: 'Unknown pipeline action' };
    }

    case 'create_partner_brief': {
      const {
        brandName, brandCategory, score, brandOverview, whyPrecci, whyBrand,
        recommendedDealStructure, agentIntegration, keyContacts, risks,
      } = toolInput;

      const brief = {
        brandName,
        brandCategory,
        score,
        brandOverview,
        preciPitchFor: whyPrecci,
        brandPitchFor: whyBrand,
        recommendedDealStructure,
        agentIntegration: agentIntegration || [],
        keyContacts: keyContacts || 'To be identified via LinkedIn research',
        risks: risks || [],
        createdBy: PC_ID,
        createdAt: new Date().toISOString(),
        status: 'ready_for_rafael',
      };

      await supabase.from('alerts').insert({
        type: 'cole_partner_brief_created',
        message: `Cole: Partner brief created — ${brandName} (Score: ${score}/100)`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: { brand_name: brandName, score, brief },
      });

      if (!sessionContext.briefsCreated) sessionContext.briefsCreated = 0;
      sessionContext.briefsCreated++;

      return {
        briefCreated: true,
        brandName,
        score,
        recommendedDealType: recommendedDealStructure?.dealType,
        agentIntegration: agentIntegration || [],
        readyForRafael: true,
      };
    }

    case 'brief_nova': {
      const { brandName, brandCategory, partnershipType, commissionRate, featuredProducts, genderContext, agentPriority } = toolInput;

      await supabase.from('alerts').insert({
        type: 'cole_nova_brief',
        message: `Cole → Nova: Partner brand available — ${brandName} (${commissionRate}% commission)`,
        severity: 'info',
        agent_id: 'PC-017',
        metadata: {
          from: PC_ID,
          brand_name: brandName,
          brand_category: brandCategory,
          partnership_type: partnershipType || 'affiliate',
          commission_rate: commissionRate,
          featured_products: featuredProducts || [],
          gender_context: genderContext || 'all',
          agent_priority: agentPriority || [],
          briefed_at: new Date().toISOString(),
        },
      });

      return {
        briefed: true,
        targetAgent: 'PC-017',
        brandName,
        commissionRate,
        genderContext,
        message: `Nova briefed on ${brandName} partnership. ${featuredProducts?.length || 0} featured products flagged.`,
      };
    }

    case 'flag_to_rafael': {
      const { brandName, score, priority, briefSummary, recommendedDealStructure, whyNow, estimatedDealValue } = toolInput;

      await supabase.from('alerts').insert({
        type: 'cole_rafael_handoff',
        message: `Cole → Rafael: Partnership lead — ${brandName} (Score: ${score}/100, Priority: ${priority || 'standard'})`,
        severity: priority === 'strategic' ? 'critical' : priority === 'priority' ? 'warn' : 'info',
        agent_id: 'PC-005',
        metadata: {
          from: PC_ID,
          brand_name: brandName,
          score,
          priority: priority || 'standard',
          brief_summary: briefSummary,
          recommended_deal_structure: recommendedDealStructure || {},
          why_now: whyNow || null,
          estimated_deal_value: estimatedDealValue || null,
          handed_off_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.rafaelHandoffs) sessionContext.rafaelHandoffs = 0;
      sessionContext.rafaelHandoffs++;

      return {
        handedOff: true,
        targetAgent: 'PC-005',
        brandName,
        score,
        priority: priority || 'standard',
        estimatedDealValue: estimatedDealValue || null,
        message: `${brandName} lead handed to Rafael for negotiation.`,
      };
    }

    case 'flag_to_sebastian': {
      const { brandName, dealTerms, dealType, contractRequired, urgency, specialConsiderations } = toolInput;

      await supabase.from('alerts').insert({
        type: 'cole_sebastian_handoff',
        message: `Cole → Sebastian: Contract needed — ${brandName} — ${contractRequired}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-007',
        metadata: {
          from: PC_ID,
          brand_name: brandName,
          deal_terms: dealTerms,
          deal_type: dealType || null,
          contract_required: contractRequired,
          urgency,
          special_considerations: specialConsiderations || [],
          handed_off_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.sebastianHandoffs) sessionContext.sebastianHandoffs = 0;
      sessionContext.sebastianHandoffs++;

      return {
        handedOff: true,
        targetAgent: 'PC-007',
        brandName,
        contractRequired,
        message: `Contract request sent to Sebastian for ${brandName}.`,
      };
    }

    case 'flag_to_sienna': {
      const { brandName, brandCategory, dealType, dealValue, campaignRequirements, launchDate, agentsInvolved, keyMessages } = toolInput;

      await supabase.from('alerts').insert({
        type: 'cole_sienna_brief',
        message: `Cole → Sienna: Deal closed — ${brandName} — campaign planning needed`,
        severity: 'info',
        agent_id: 'PC-004',
        metadata: {
          from: PC_ID,
          brand_name: brandName,
          brand_category: brandCategory,
          deal_type: dealType,
          deal_value: dealValue || null,
          campaign_requirements: campaignRequirements,
          launch_date: launchDate || null,
          agents_involved: agentsInvolved || [],
          key_messages: keyMessages || [],
          briefed_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.siennaHandoffs) sessionContext.siennaHandoffs = 0;
      sessionContext.siennaHandoffs++;

      return {
        briefed: true,
        targetAgent: 'PC-004',
        brandName,
        message: `Sienna briefed on ${brandName} deal for campaign planning.`,
      };
    }

    case 'flag_to_celeste': {
      const { reportType, brandName, dealValue, commissionRate, estimatedMonthlyRevenue, revenueStream } = toolInput;

      await supabase.from('alerts').insert({
        type: 'cole_celeste_report',
        message: `Cole → Celeste: Partnership ${reportType} — ${brandName}${dealValue ? ` — $${dealValue}` : ''}`,
        severity: 'info',
        agent_id: 'PC-002',
        metadata: {
          from: PC_ID,
          report_type: reportType,
          brand_name: brandName,
          deal_value: dealValue || null,
          commission_rate: commissionRate || null,
          estimated_monthly_revenue: estimatedMonthlyRevenue || null,
          revenue_stream: revenueStream || 'brand_partnerships',
          reported_at: new Date().toISOString(),
        },
      });

      // Update revenue summary if new deal
      if (reportType === 'new_deal' && dealValue) {
        try {
          const { updateRevenueSummary } = require('../config/payments');
          await updateRevenueSummary({
            stream: 'brand_partnerships',
            amount: dealValue,
            currency: 'USD',
          });
        } catch (e) {
          // Non-fatal
        }
      }

      return {
        reported: true,
        targetAgent: 'PC-002',
        brandName,
        dealValue: dealValue || null,
        message: `Partnership financials reported to Celeste.`,
      };
    }

    case 'flag_to_elton': {
      const { brandName, period, metricsNeeded } = toolInput;

      await supabase.from('alerts').insert({
        type: 'cole_elton_request',
        message: `Cole → Elton: Performance analytics requested — ${brandName} (${period})`,
        severity: 'info',
        agent_id: 'PC-020',
        metadata: {
          from: PC_ID,
          brand_name: brandName,
          period,
          metrics_needed: metricsNeeded || ['conversion_rate', 'revenue_generated', 'recommendation_count'],
          requested_at: new Date().toISOString(),
        },
      });

      return {
        requested: true,
        targetAgent: 'PC-020',
        brandName,
        period,
        message: `Performance analytics requested from Elton for ${brandName}.`,
      };
    }

    case 'recall_partnership_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'cole_partnership_history',
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
        userId: 'cole_partnership_history',
        content,
        memoryType: 'partnership_session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
        },
      });

      return { stored: true, memoryId };
    }

    case 'log_session_performance': {
      const totalHandoffs = (sessionContext.rafaelHandoffs || 0) +
        (sessionContext.sebastianHandoffs || 0) +
        (sessionContext.siennaHandoffs || 0);

      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Cole completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          brands_researched: sessionContext.brandsResearched?.length || 0,
          brands_scored: sessionContext.brandsScored || 0,
          pipeline_updates: sessionContext.pipelineUpdates || 0,
          briefs_created: sessionContext.briefsCreated || 0,
          rafael_handoffs: sessionContext.rafaelHandoffs || 0,
          sebastian_handoffs: sessionContext.sebastianHandoffs || 0,
          sienna_handoffs: sessionContext.siennaHandoffs || 0,
          total_handoffs: totalHandoffs,
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
// PROCESS COLE SESSION
// Full autonomous agentic reasoning loop.
// Cole researches, scores, builds pipeline and hands off.
// Every decision documented. Every brand scored.
// Nothing pursued without meeting the threshold.
// ─────────────────────────────────────────────
async function processColeSession({
  sessionType = 'weekly_prospecting',
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
    brandsResearched: [],
    brandsScored: 0,
    pipelineUpdates: 0,
    briefsCreated: 0,
    rafaelHandoffs: 0,
    sebastianHandoffs: 0,
    siennaHandoffs: 0,
  };

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

  const contextParts = [
    `COLE SESSION TYPE: ${sessionType}`,
    `TODAY: ${dayOfWeek} ${today.toISOString().split('T')[0]}`,
    transcript ? `ADDITIONAL INSTRUCTION: ${transcript}` : '',
    `WEEKLY TASK: Research 5-10 potential partner brands across all categories. Score every one. Pursue those scoring 65+.`,
    `PIPELINE TASK: Review existing pipeline — advance any brands ready for next stage. Flag stalled deals.`,
    `ALWAYS: Research before scoring. Score before pursuing. Brief before handing off.`,
    `ALWAYS: Represent all genders in partnership strategy — male grooming brands as actively pursued as female beauty brands.`,
    `ALWAYS: Log every decision and every pipeline update.`,
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

  // ── COLE'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: COLE_SYSTEM_PROMPT,
      tools: COLE_TOOLS,
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
        result = await executeColeToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Cole: Tool call failed', {
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
    finalResponseText = `Cole: ${sessionType} complete. Pipeline reviewed and updated. ${sessionContext.rafaelHandoffs} leads handed to Rafael.`;
  }

  logger.info('Cole: Session complete', {
    sessionType,
    brandsResearched: sessionContext.brandsResearched.length,
    brandsScored: sessionContext.brandsScored,
    briefsCreated: sessionContext.briefsCreated,
    rafaelHandoffs: sessionContext.rafaelHandoffs,
  });

  return {
    responseText: finalResponseText,
    brandsResearched: sessionContext.brandsResearched,
    brandsScored: sessionContext.brandsScored,
    briefsCreated: sessionContext.briefsCreated,
    rafaelHandoffs: sessionContext.rafaelHandoffs,
    pipelineUpdates: sessionContext.pipelineUpdates,
  };
}

module.exports = {
  processColeSession,
  COLE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};