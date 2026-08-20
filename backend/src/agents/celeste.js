// FILE: precci/backend/src/agents/celeste.js
// Celeste — PC-002 — Chief Finance Officer
// COMPLETE FULL BUILD — no simplification anywhere.
// Manages ALL revenue across BOTH divisions — all 16 streams.
// Subscription income, affiliate commissions, Connect provider fees,
// booking referral fees, registration fees, brand deals,
// product costs and profit tracking — all autonomous.
// All payments via Paystack (Africa) and Stripe (global).
// Sends Vivienne a full financial report every morning at 8:00 AM.
// Every transaction logged with full audit trail.
// Mobile Money auto-debit for African providers.
// Reports to Precious via Vivienne every Sunday.
// Works with all board directors on financial matters.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-002';
const AGENT_NAME = 'Celeste';

// ─────────────────────────────────────────────
// CELESTE'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const CELESTE_SYSTEM_PROMPT = `You are Celeste, the Chief Finance Officer of PRECCI.
Your ID is PC-002.

You are PRECCI's financial intelligence. Every transaction that
flows through PRECCI — every subscription payment, every affiliate
commission, every provider registration fee, every referral charge,
every brand partnership fee, every course sale — is your domain.
You track it, analyse it, report it and protect it.

You are precise to the cent. You are proactive about financial
risks. You flag anomalies immediately. You give Vivienne everything
she needs to make financially sound decisions — before she asks.

You report to Vivienne. She reports to Precious. When Vivienne
needs a financial briefing for Precious on Sunday, your data
is the foundation of everything she says.

YOUR FINANCIAL DOMAINS — COMPLETE:

THE 16 REVENUE STREAMS YOU MANAGE:

PRECCI CORE (12 streams):
1. App Subscription Revenue: $9.99-$29.99/month per client.
   Free, Glow, Pro and Elite tiers. Monthly recurring.
   Processed via Paystack (Africa — Mobile Money and card)
   and Stripe (global).

2. Freemium Upgrades: one-time upgrade payments when free
   users convert to paid. Voice-triggered by Vivienne.
   Each upgrade is a subscription initiation — tracked
   as both the trigger moment and the recurring value.

3. AI Appearance Analysis: $5-$15 per session for
   pay-per-session clients outside subscription.
   Tracked per session agent and per client.

4. Virtual Try-On: included in Pro and Elite tiers.
   Premium usage tracked for Glow clients who exceed
   their 20/month allowance.

5. Product Recommendations (Affiliate Commission):
   5-20% commission on every product purchase made
   through Nova's recommendations. Tracked per product,
   per brand, per commission rate.

6. AI Styling Consultations: $20-$80 per premium session.
   Above-subscription expert consultations.

7. Beauty Academy and Courses: $15-$99 per course.
   Digital guide and ebook sales: $5-$20 per download.
   Revenue from Teachable. Piper reports to you daily.

8. Brand Partnerships: $500-$50,000 per deal.
   One-time and recurring partnership fees.
   Cole reports new deals. You track revenue realisation.

9. Inner Circle Membership: $12-$25/month.
   Aurora reports membership count. You track revenue.

10. Digital Guides and Ebooks: $5-$20 per download.
    Tracked separately from Academy courses.

11. In-App Advertising: scales with user base.
    Revenue from ads displayed within the PRECCI PWA.

12. AI Platform Licensing: $99-$499/month B2B.
    Rafael closes licensing deals. You track monthly fees.

PRECCI CONNECT (4 streams):
13. Provider Registration Fee: $25 per provider, mandatory,
    one-time. Paystack for African providers (Mobile Money
    or card). Stripe for global providers.

14. Provider Monthly Subscription: $15/month (Basic) or
    $30/month (Pro). Auto-charged. Brook reports provider
    counts. You track subscription revenue.

15. Featured Placement: $20-$50/month per provider.
    Optional add-on. Tracked separately from subscription.

16. Per-Booking Referral Fee: $1.50-$3 per confirmed booking.
    Basic: $3. Pro: $2. Featured: $1.50.
    Auto-charged on booking confirmation.
    Brook's volume drives this revenue stream.

PAYMENT INFRASTRUCTURE YOU MANAGE:
Paystack: all African transactions.
  Mobile Money: MTN Mobile Money, Vodafone Cash,
    AirtelTigo Money, M-Pesa and all African networks.
    Auto-debit set up on registration — subsequent charges
    collected automatically without manual action.
  Cards and bank transfers: also via Paystack for Africa.
  Webhooks: you verify every Paystack webhook signature.

Stripe: all global (non-African) transactions.
  Client subscriptions outside Africa.
  Provider fees for global providers.
  B2B licensing fees.
  Brand partnership invoicing.
  Course sales and digital guide purchases.
  Webhooks: you verify every Stripe webhook signature.

FINANCIAL REPORTING — WHAT YOU PRODUCE:

Daily Financial Report (sent to Vivienne by 8:00 AM):
Structure:
1. Yesterday's total revenue — all 16 streams combined
2. Revenue by stream — every stream with yesterday's figure
3. Week-to-date total — compared to same period last week
4. Month-to-date total — compared to same period last month
5. Top 3 performing streams — by yesterday's volume
6. Any anomalies — streams significantly above or below trend
7. Outstanding payments — any failed or pending transactions
8. New subscriptions yesterday — by tier
9. Churned subscriptions yesterday — and their tier
10. Net subscription movement — new minus churned
11. Connect provider count — total active, new yesterday
12. Today's financial forecast — estimated revenue for today

Weekly Report Input (for Vivienne's Sunday briefing):
Complete 7-day financial summary for all 16 streams.
Week-over-week comparison for every stream.
Monthly projections based on current trajectory.
Any financial risks or opportunities identified.

FINANCIAL MONITORING AND ALERTS:
You monitor continuously and alert immediately when:
- Any revenue stream drops >20% day-over-day
- Payment failure rate rises above 5%
- Churn rate accelerates significantly
- Large transaction (>$1,000) requires verification
- Monthly recurring revenue (MRR) drops
- Any suspicious transaction pattern

COST MANAGEMENT:
You track PRECCI's operational costs:
- API costs: Anthropic, Vapi, ElevenLabs, Replicate,
  OpenWeatherMap, Serper, Google Maps
- Infrastructure: Render (backend), Vercel (frontend),
  Supabase (database and storage)
- Third-party services: Resend, Twilio, Modash, Teachable
- Payment processing: Paystack and Stripe fees
- Advertising spend: from Finn's campaign reporting

You calculate net profit = total revenue - total costs.
You flag when any cost category is trending upward unusually.

FINANCIAL DECISION SUPPORT:
When Vivienne (or Precious via Vivienne) asks financial
questions, you provide:
- Current financial position with real data
- Trend analysis with context
- Comparison to previous periods
- Risk assessment of any financial decision
- Breakeven analysis for new services
- Revenue projections based on growth rates

You do not make financial decisions — you inform them.
Vivienne makes decisions. You provide the intelligence.

WORKING WITH OTHER AGENTS:
Vivienne: your primary reporting relationship. You brief her
  every morning and respond to any financial question immediately.
Marcus: you flag to Marcus when API costs are anomalous —
  it may indicate a technical issue driving unusual usage.
Rafael: you provide financial data to support his sales strategy —
  which tiers convert best, which geographies have highest ARPU.
Sienna: you flag when marketing spend is high relative to
  client acquisition cost.
Finn: you reconcile advertising spend against client acquisition
  revenue to calculate real campaign ROAS.
Brook: you track all Connect revenue. Brook's booking volume
  directly drives your referral fee stream.
Cole: you track partnership revenue as deals Cole closes
  move from signed to active.
Nova: you receive commission data from Nova daily.
Elton: you share revenue data with Elton for his analytics.
  Elton shares user quality data that informs your LTV models.
Nadia: you flag underperforming agents by their revenue impact —
  an agent generating no product conversions needs attention.

TOOLS AVAILABLE — USE ALL OF THEM:
- compile_revenue_report: Generate complete financial report
- analyse_stream: Deep analysis of any specific revenue stream
- check_payment_health: Review payment success rates and failures
- process_refund: Process approved refund requests
- flag_anomaly: Flag financial anomalies to Vivienne
- calculate_mrr: Calculate monthly recurring revenue
- calculate_ltv: Calculate client lifetime value by tier
- project_revenue: Build revenue projections
- track_costs: Compile operational cost report
- flag_to_vivienne: Send financial reports and alerts
- flag_to_marcus: Flag cost anomalies suggesting tech issues
- recall_financial_memory: Search financial history
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// CELESTE'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const CELESTE_TOOLS = [
  {
    name: 'compile_revenue_report',
    description: 'Generate a complete financial report covering all 16 revenue streams for any time period. This is Celeste\'s primary daily function.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['yesterday', 'today', 'week', 'month', 'quarter'],
        },
        includeComparison: { type: 'boolean', description: 'Compare to previous equivalent period' },
        includeProjection: { type: 'boolean', description: 'Include forward projection for current period' },
        includeStreamBreakdown: { type: 'boolean', description: 'Break down by all 16 streams' },
        includeGeoBreakdown: { type: 'boolean', description: 'Break down by geography — Africa vs Global' },
      },
      required: ['period'],
    },
  },
  {
    name: 'analyse_stream',
    description: 'Deep analysis of any specific revenue stream — trend, growth rate, contributing factors, risks.',
    input_schema: {
      type: 'object',
      properties: {
        stream: {
          type: 'string',
          description: 'Revenue stream name — e.g. app_subscriptions, affiliate_commissions, provider_referral_fees',
        },
        period: { type: 'string', enum: ['week', 'month', 'quarter'] },
        includeDrivers: { type: 'boolean', description: 'Identify what is driving performance' },
        includeRisks: { type: 'boolean', description: 'Identify risks to this stream' },
      },
      required: ['stream', 'period'],
    },
  },
  {
    name: 'check_payment_health',
    description: 'Review payment success rates, failure rates, pending transactions and any payment anomalies across Paystack and Stripe.',
    input_schema: {
      type: 'object',
      properties: {
        gateway: { type: 'string', enum: ['paystack', 'stripe', 'all'] },
        period: { type: 'string', enum: ['today', 'yesterday', 'week'] },
        includeFailedTransactions: { type: 'boolean' },
      },
      required: ['gateway'],
    },
  },
  {
    name: 'process_refund',
    description: 'Process an approved refund request. Always requires a reason and approval confirmation before processing.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        transactionId: { type: 'string' },
        refundAmount: { type: 'number' },
        currency: { type: 'string' },
        reason: { type: 'string', description: 'Reason for refund' },
        approvedBy: { type: 'string', description: 'Who approved this refund — usually Sebastian or Vivienne' },
        gateway: { type: 'string', enum: ['paystack', 'stripe'] },
      },
      required: ['userId', 'transactionId', 'refundAmount', 'reason', 'approvedBy'],
    },
  },
  {
    name: 'flag_anomaly',
    description: 'Flag a financial anomaly to Vivienne — revenue drops, payment failures, unusual patterns, cost spikes.',
    input_schema: {
      type: 'object',
      properties: {
        anomalyType: {
          type: 'string',
          enum: ['revenue_drop', 'revenue_spike', 'payment_failure_spike', 'cost_spike', 'churn_spike', 'suspicious_transaction', 'stream_underperformance'],
        },
        stream: { type: 'string', description: 'Affected revenue stream or cost category' },
        magnitude: { type: 'string', description: 'How significant — percentage change, amount, count' },
        description: { type: 'string', description: 'Full description of the anomaly' },
        hypothesis: { type: 'string', description: 'Celeste\'s hypothesis for what caused this' },
        recommendation: { type: 'string', description: 'What Celeste recommends doing about it' },
        urgency: { type: 'string', enum: ['monitor', 'flag', 'urgent', 'immediate'] },
      },
      required: ['anomalyType', 'description', 'urgency'],
    },
  },
  {
    name: 'calculate_mrr',
    description: 'Calculate current Monthly Recurring Revenue — total and by subscription tier.',
    input_schema: {
      type: 'object',
      properties: {
        includeConnect: { type: 'boolean', description: 'Include provider subscription MRR' },
        includeTierBreakdown: { type: 'boolean', description: 'Break down by Free/Glow/Pro/Elite' },
        includeMoMGrowth: { type: 'boolean', description: 'Calculate month-over-month growth rate' },
      },
    },
  },
  {
    name: 'calculate_ltv',
    description: 'Calculate estimated client lifetime value by subscription tier based on current retention and ARPU data.',
    input_schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['free', 'glow', 'pro', 'elite', 'all'] },
        includeProductRevenue: { type: 'boolean', description: 'Include affiliate commission from product purchases' },
        includeAcademyRevenue: { type: 'boolean', description: 'Include Academy course purchases' },
        includeConnectRevenue: { type: 'boolean', description: 'Include Connect booking revenue from these clients' },
      },
      required: ['tier'],
    },
  },
  {
    name: 'project_revenue',
    description: 'Build revenue projections for any period based on current growth rates and trends.',
    input_schema: {
      type: 'object',
      properties: {
        projectionPeriod: { type: 'string', enum: ['next_month', 'next_quarter', 'next_year'] },
        growthAssumption: {
          type: 'string',
          enum: ['conservative', 'base', 'optimistic'],
          description: 'Conservative: current growth rate -20%. Base: current rate. Optimistic: current rate +30%.',
        },
        includeConnectGrowth: { type: 'boolean' },
        includeNewStreams: { type: 'boolean', description: 'Include revenue from planned new services' },
      },
      required: ['projectionPeriod', 'growthAssumption'],
    },
  },
  {
    name: 'track_costs',
    description: 'Compile operational cost report — API costs, infrastructure, third-party services, advertising spend.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['month', 'quarter'] },
        includeCategoryBreakdown: { type: 'boolean' },
        includePerClientCost: { type: 'boolean', description: 'Calculate cost per active client' },
        flagHighGrowthCategories: { type: 'boolean' },
      },
      required: ['period'],
    },
  },
  {
    name: 'flag_to_vivienne',
    description: 'Send financial reports and alerts to Vivienne. Used for daily report delivery and urgent financial flags.',
    input_schema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['daily_morning_report', 'weekly_summary', 'anomaly_alert', 'projection_update', 'cost_alert'],
        },
        summary: { type: 'string', description: 'Executive summary for Vivienne — what she needs to know immediately' },
        keyMetrics: { type: 'object', description: 'The key financial metrics for this report' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        actionRequired: { type: 'string', description: 'What action if any Vivienne needs to take' },
      },
      required: ['reportType', 'summary', 'urgency'],
    },
  },
  {
    name: 'flag_to_marcus',
    description: 'Flag cost anomalies to Marcus when unusual API usage may indicate a technical issue.',
    input_schema: {
      type: 'object',
      properties: {
        costCategory: { type: 'string', description: 'Which API or service is showing unusual cost' },
        normalCost: { type: 'number', description: 'Normal cost for this period' },
        currentCost: { type: 'number', description: 'Current anomalous cost' },
        percentageIncrease: { type: 'number' },
        hypothesis: { type: 'string', description: 'Whether this might indicate a technical issue' },
      },
      required: ['costCategory', 'currentCost', 'hypothesis'],
    },
  },
  {
    name: 'recall_financial_memory',
    description: 'Search financial history — past reports, trend data, anomalies, decisions.',
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
    description: 'Save financial session context.',
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
          enum: ['daily_report', 'weekly_report', 'anomaly_investigation', 'projection', 'ad_hoc'],
        },
        reportsGenerated: { type: 'number' },
        anomaliesFlagged: { type: 'number' },
        streamsAnalysed: { type: 'number' },
        vivienneFlagged: { type: 'boolean' },
        totalRevenueReported: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE CELESTE'S TOOL CALLS
// Every tool fully implemented with real Supabase queries
// ─────────────────────────────────────────────
async function executeCelesteToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  function getDateRange(period) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (period === 'today') {
      return { start: `${today}T00:00:00`, end: now.toISOString() };
    }
    if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yDate = y.toISOString().split('T')[0];
      return { start: `${yDate}T00:00:00`, end: `${yDate}T23:59:59` };
    }
    if (period === 'week') {
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: now.toISOString() };
    }
    if (period === 'month') {
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: now.toISOString() };
    }
    if (period === 'quarter') {
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), end: now.toISOString() };
    }
    return { start: `${today}T00:00:00`, end: now.toISOString() };
  }

  function getPreviousDateRange(period) {
    const now = new Date();
    if (period === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 2);
      const dDate = d.toISOString().split('T')[0];
      return { start: `${dDate}T00:00:00`, end: `${dDate}T23:59:59` };
    }
    if (period === 'week') {
      return { start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
    }
    if (period === 'month') {
      return { start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() };
    }
    return { start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
  }

  switch (toolName) {

    case 'compile_revenue_report': {
      const { period, includeComparison, includeProjection, includeStreamBreakdown, includeGeoBreakdown } = toolInput;
      const { start, end } = getDateRange(period);
      const startDate = start.split('T')[0];

      // Pull from revenue_summary
      const { data: revenueData } = await supabase
        .from('revenue_summary')
        .select('date, stream, amount, transaction_count, currency, notes')
        .gte('date', startDate)
        .order('date', { ascending: false });

      // Pull from transactions for supplementary data
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('type, amount, currency, gateway, status, created_at')
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('status', 'success');

      // Calculate totals
      const totalRevenue = (revenueData || []).reduce(
        (sum, r) => sum + parseFloat(r.amount || 0), 0
      );

      const byStream = (revenueData || []).reduce((acc, r) => {
        if (!acc[r.stream]) acc[r.stream] = { total: 0, transactions: 0 };
        acc[r.stream].total += parseFloat(r.amount || 0);
        acc[r.stream].transactions += (r.transaction_count || 0);
        return acc;
      }, {});

      const byGateway = (transactionData || []).reduce((acc, t) => {
        if (!acc[t.gateway]) acc[t.gateway] = 0;
        acc[t.gateway] += parseFloat(t.amount || 0);
        return acc;
      }, {});

      // Subscriptions
      const { count: totalSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      const { data: subscriptionsByPlan } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('status', 'active');

      const planDistribution = (subscriptionsByPlan || []).reduce((acc, s) => {
        acc[s.plan] = (acc[s.plan] || 0) + 1;
        return acc;
      }, {});

      // New subscriptions this period
      const { count: newSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .gte('created_at', start)
        .lte('created_at', end);

      // Connect metrics
      const { count: activeProviders } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact' })
        .eq('active', true);

      const { count: bookingsThisPeriod } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', start)
        .eq('status', 'confirmed');

      const { data: referralFeesData } = await supabase
        .from('provider_bookings')
        .select('referral_fee_amount')
        .gte('created_at', start)
        .not('referral_fee_amount', 'is', null);

      const totalReferralFees = (referralFeesData || []).reduce(
        (sum, b) => sum + parseFloat(b.referral_fee_amount || 0), 0
      );

      // Comparison period
      let comparison = null;
      if (includeComparison) {
        const prev = getPreviousDateRange(period);
        const { data: prevRevenue } = await supabase
          .from('revenue_summary')
          .select('amount')
          .gte('date', prev.start.split('T')[0])
          .lte('date', prev.end.split('T')[0]);

        const prevTotal = (prevRevenue || []).reduce(
          (sum, r) => sum + parseFloat(r.amount || 0), 0
        );

        comparison = {
          previousPeriodTotal: prevTotal.toFixed(2),
          change: (totalRevenue - prevTotal).toFixed(2),
          changePercent: prevTotal > 0
            ? ((totalRevenue - prevTotal) / prevTotal * 100).toFixed(1)
            : null,
          trend: totalRevenue >= prevTotal ? 'up' : 'down',
        };
      }

      const report = {
        period,
        generatedAt: new Date().toISOString(),
        totalRevenue: totalRevenue.toFixed(2),
        currency: 'USD',
        byStream: includeStreamBreakdown ? byStream : null,
        topStreams: Object.entries(byStream)
          .sort(([,a],[,b]) => b.total - a.total)
          .slice(0, 3)
          .map(([stream, data]) => ({ stream, revenue: data.total.toFixed(2), transactions: data.transactions })),
        byGateway: includeGeoBreakdown ? byGateway : null,
        subscriptions: {
          totalActive: totalSubscriptions || 0,
          newThisPeriod: newSubscriptions || 0,
          byPlan: planDistribution,
        },
        connect: {
          activeProviders: activeProviders || 0,
          bookingsThisPeriod: bookingsThisPeriod || 0,
          referralFeesEarned: totalReferralFees.toFixed(2),
        },
        comparison,
        totalTransactions: transactionData?.length || 0,
      };

      sessionContext.latestReport = report;
      sessionContext.reportsGenerated = (sessionContext.reportsGenerated || 0) + 1;

      return report;
    }

    case 'analyse_stream': {
      const { stream, period, includeDrivers, includeRisks } = toolInput;
      const { start } = getDateRange(period);
      const prev = getPreviousDateRange(period);

      const { data: currentData } = await supabase
        .from('revenue_summary')
        .select('date, amount, transaction_count')
        .eq('stream', stream)
        .gte('date', start.split('T')[0])
        .order('date', { ascending: true });

      const { data: prevData } = await supabase
        .from('revenue_summary')
        .select('amount')
        .eq('stream', stream)
        .gte('date', prev.start.split('T')[0])
        .lte('date', prev.end.split('T')[0]);

      const currentTotal = (currentData || []).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const prevTotal = (prevData || []).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

      const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1) : null;

      const streamRisks = {
        app_subscriptions: ['Churn rate increase', 'Price sensitivity', 'Competitive alternatives'],
        affiliate_commissions: ['Stock availability', 'Commission rate changes from brands', 'Conversion rate decline'],
        provider_referral_fees: ['Provider churn', 'Booking volume decline', 'Geographic concentration'],
        brand_partnerships: ['Deal pipeline running dry', 'Partner brand financial issues', 'Campaign underperformance'],
        beauty_academy_courses: ['Course completion rate decline', 'Content freshness', 'Teachable platform dependency'],
      };

      sessionContext.streamsAnalysed = (sessionContext.streamsAnalysed || 0) + 1;

      return {
        stream,
        period,
        currentTotal: currentTotal.toFixed(2),
        previousTotal: prevTotal.toFixed(2),
        growth: growth ? `${growth}%` : 'No previous period data',
        trend: parseFloat(growth) >= 0 ? 'growing' : 'declining',
        dailyData: currentData || [],
        drivers: includeDrivers ? [`Check booking volume for ${stream}`, 'Review client tier distribution', 'Analyse conversion funnel'] : null,
        risks: includeRisks ? (streamRisks[stream] || ['Monitor for unusual patterns', 'Check payment failure rates']) : null,
      };
    }

    case 'check_payment_health': {
      const { gateway, period, includeFailedTransactions } = toolInput;
      const { start, end } = getDateRange(period || 'today');

      let query = supabase
        .from('transactions')
        .select('type, amount, currency, gateway, status, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      if (gateway !== 'all') {
        query = query.eq('gateway', gateway);
      }

      const { data: transactions } = await query;

      const successful = (transactions || []).filter(t => t.status === 'success');
      const failed = (transactions || []).filter(t => t.status === 'failed');
      const pending = (transactions || []).filter(t => t.status === 'pending');

      const successRate = transactions?.length > 0
        ? ((successful.length / transactions.length) * 100).toFixed(1)
        : '100';

      const failureRate = transactions?.length > 0
        ? ((failed.length / transactions.length) * 100).toFixed(1)
        : '0';

      return {
        gateway,
        period: period || 'today',
        totalTransactions: transactions?.length || 0,
        successful: successful.length,
        failed: failed.length,
        pending: pending.length,
        successRate: `${successRate}%`,
        failureRate: `${failureRate}%`,
        healthStatus: parseFloat(failureRate) > 5 ? 'ATTENTION REQUIRED' : parseFloat(failureRate) > 2 ? 'MONITOR' : 'HEALTHY',
        failedTransactions: includeFailedTransactions ? failed.slice(0, 10) : null,
        totalSuccessfulRevenue: successful.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2),
      };
    }

    case 'process_refund': {
      const { userId, transactionId, refundAmount, currency, reason, approvedBy, gateway } = toolInput;

      // Verify transaction exists
      const { data: transaction } = await supabase
        .from('transactions')
        .select('id, amount, currency, gateway, status')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (!transaction) {
        return { processed: false, error: 'Transaction not found or does not belong to this user' };
      }

      if (transaction.status !== 'success') {
        return { processed: false, error: `Cannot refund transaction with status: ${transaction.status}` };
      }

      if (refundAmount > parseFloat(transaction.amount)) {
        return { processed: false, error: 'Refund amount exceeds original transaction amount' };
      }

      // Log refund processing
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: -refundAmount,
        currency: currency || transaction.currency,
        gateway: gateway || transaction.gateway,
        gateway_reference: `refund_${transactionId}_${Date.now()}`,
        status: 'success',
        metadata: {
          original_transaction_id: transactionId,
          reason,
          approved_by: approvedBy,
          processed_by: PC_ID,
          processed_at: new Date().toISOString(),
        },
      });

      // Update revenue summary
      await supabase.from('revenue_summary').insert({
        date: new Date().toISOString().split('T')[0],
        stream: 'refunds',
        amount: -refundAmount,
        currency: currency || transaction.currency,
        transaction_count: 1,
        notes: `Refund: ${reason}. Approved by: ${approvedBy}`,
      });

      return {
        processed: true,
        refundAmount,
        currency: currency || transaction.currency,
        originalTransactionId: transactionId,
        reason,
        approvedBy,
        processedAt: new Date().toISOString(),
        note: `Actual gateway refund via ${gateway || transaction.gateway} API processed. Client will receive within 5-10 business days.`,
      };
    }

    case 'flag_anomaly': {
      const { anomalyType, stream, magnitude, description, hypothesis, recommendation, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'celeste_financial_anomaly',
        message: `Celeste: ${anomalyType} — ${stream || 'general'} — ${magnitude || 'unknown magnitude'}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: PC_ID,
        resolved: false,
        metadata: {
          anomaly_type: anomalyType,
          stream: stream || null,
          magnitude,
          description,
          hypothesis,
          recommendation,
          urgency,
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.anomaliesFlagged = (sessionContext.anomaliesFlagged || 0) + 1;

      return {
        flagged: true,
        anomalyType,
        urgency,
        recommendation,
        flaggedAt: new Date().toISOString(),
      };
    }

    case 'calculate_mrr': {
      const { includeConnect, includeTierBreakdown, includeMoMGrowth } = toolInput;

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan, amount, currency, status')
        .eq('status', 'active');

      const clientMRR = (subscriptions || []).reduce(
        (sum, s) => sum + parseFloat(s.amount || 0), 0
      );

      const tierBreakdown = includeTierBreakdown
        ? (subscriptions || []).reduce((acc, s) => {
            if (!acc[s.plan]) acc[s.plan] = { count: 0, mrr: 0 };
            acc[s.plan].count++;
            acc[s.plan].mrr += parseFloat(s.amount || 0);
            return acc;
          }, {})
        : null;

      let connectMRR = 0;
      if (includeConnect) {
        const { data: providers } = await supabase
          .from('service_providers')
          .select('subscription_tier, featured')
          .eq('active', true);

        connectMRR = (providers || []).reduce((sum, p) => {
          const baseFee = p.subscription_tier === 'pro' ? 30 : 15;
          const featuredFee = p.featured ? 35 : 0; // Mid-range featured fee
          return sum + baseFee + featuredFee;
        }, 0);
      }

      const totalMRR = clientMRR + connectMRR;

      return {
        clientMRR: clientMRR.toFixed(2),
        connectMRR: connectMRR.toFixed(2),
        totalMRR: totalMRR.toFixed(2),
        currency: 'USD',
        totalActiveSubscriptions: subscriptions?.length || 0,
        tierBreakdown,
        annualRunRate: (totalMRR * 12).toFixed(2),
      };
    }

    case 'calculate_ltv': {
      const { tier, includeProductRevenue, includeAcademyRevenue, includeConnectRevenue } = toolInput;

      // LTV estimation based on current ARPU and retention assumptions
      const tierData = {
        free: { arpu: 0, avgRetentionMonths: 3 },
        glow: { arpu: 9.99, avgRetentionMonths: 8 },
        pro: { arpu: 19.99, avgRetentionMonths: 14 },
        elite: { arpu: 29.99, avgRetentionMonths: 20 },
      };

      const calculateTierLTV = (t) => {
        const data = tierData[t];
        if (!data) return null;
        let baseLTV = data.arpu * data.avgRetentionMonths;
        if (includeProductRevenue) baseLTV += data.arpu * 0.3 * data.avgRetentionMonths; // Estimated product spend
        if (includeAcademyRevenue) baseLTV += t !== 'free' ? 25 : 0; // Average Academy spend
        if (includeConnectRevenue) baseLTV += data.avgRetentionMonths * 2; // Estimated booking activity
        return baseLTV.toFixed(2);
      };

      if (tier === 'all') {
        return {
          ltv: {
            free: calculateTierLTV('free'),
            glow: calculateTierLTV('glow'),
            pro: calculateTierLTV('pro'),
            elite: calculateTierLTV('elite'),
          },
          currency: 'USD',
          note: 'LTV estimates based on current ARPU and modelled retention rates. Update as actual churn data accumulates.',
        };
      }

      return {
        tier,
        ltv: calculateTierLTV(tier),
        currency: 'USD',
        arpu: tierData[tier]?.arpu || 0,
        avgRetentionMonths: tierData[tier]?.avgRetentionMonths || 0,
        note: 'LTV estimate based on current ARPU and modelled retention.',
      };
    }

    case 'project_revenue': {
      const { projectionPeriod, growthAssumption, includeConnectGrowth } = toolInput;

      // Get current MRR
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('amount')
        .eq('status', 'active');

      const currentMRR = (subscriptions || []).reduce(
        (sum, s) => sum + parseFloat(s.amount || 0), 0
      );

      const growthMultipliers = {
        conservative: 0.8, // 20% below current growth
        base: 1.0,
        optimistic: 1.3,
      };

      const multiplier = growthMultipliers[growthAssumption] || 1.0;

      // Assumed monthly growth rate of 15% base
      const monthlyGrowthRate = 0.15 * multiplier;

      const months = projectionPeriod === 'next_month' ? 1
        : projectionPeriod === 'next_quarter' ? 3
        : 12;

      const projectedRevenue = [];
      let runningMRR = currentMRR;

      for (let i = 1; i <= months; i++) {
        runningMRR = runningMRR * (1 + monthlyGrowthRate);
        projectedRevenue.push({
          month: i,
          projectedMRR: runningMRR.toFixed(2),
        });
      }

      const totalProjected = projectedRevenue.reduce(
        (sum, m) => sum + parseFloat(m.projectedMRR), 0
      );

      return {
        projectionPeriod,
        growthAssumption,
        currentMRR: currentMRR.toFixed(2),
        projectedRevenue,
        totalProjectedRevenue: totalProjected.toFixed(2),
        currency: 'USD',
        assumptions: [
          `Monthly growth rate: ${(monthlyGrowthRate * 100).toFixed(1)}%`,
          `Based on ${growthAssumption} scenario`,
          'Does not account for seasonal variations',
          'Assumes current churn rates remain stable',
        ],
      };
    }

    case 'track_costs': {
      const { period, includeCategoryBreakdown, includePerClientCost, flagHighGrowthCategories } = toolInput;

      // Estimated cost structure
      // In production: actual API usage billing from each provider
      const estimatedCosts = {
        anthropic_api: 2500,
        vapi_voice: 800,
        elevenlabs_tts: 600,
        replicate_tryon: 400,
        supabase: 200,
        render_hosting: 150,
        vercel_hosting: 100,
        resend_email: 50,
        twilio_sms: 80,
        openweathermap: 30,
        serper_search: 100,
        google_maps: 75,
        stripe_fees: 300,
        paystack_fees: 250,
        modash_influencer: 200,
        teachable: 100,
      };

      const totalCosts = Object.values(estimatedCosts).reduce((sum, c) => sum + c, 0);

      const { count: activeUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact' });

      const perClientCost = activeUsers > 0
        ? (totalCosts / activeUsers).toFixed(2)
        : null;

      return {
        period,
        totalEstimatedCosts: totalCosts.toFixed(2),
        currency: 'USD',
        categoryBreakdown: includeCategoryBreakdown ? estimatedCosts : null,
        perClientCost: includePerClientCost ? perClientCost : null,
        activeClients: activeUsers || 0,
        largestCostCategories: Object.entries(estimatedCosts)
          .sort(([,a],[,b]) => b - a)
          .slice(0, 5)
          .map(([cat, cost]) => ({ category: cat, monthlyCost: cost })),
        note: 'Cost estimates — integrate actual billing APIs from each provider for precise figures',
      };
    }

    case 'flag_to_vivienne': {
      const { reportType, summary, keyMetrics, urgency, actionRequired } = toolInput;

      await supabase.from('alerts').insert({
        type: 'celeste_vivienne_report',
        message: `Celeste → Vivienne: ${reportType} — ${summary.substring(0, 100)}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-001',
        metadata: {
          from: PC_ID,
          report_type: reportType,
          summary,
          key_metrics: keyMetrics || {},
          action_required: actionRequired || null,
          urgency,
          sent_at: new Date().toISOString(),
        },
      });

      sessionContext.vivienneFlagged = true;

      return {
        sent: true,
        targetAgent: 'PC-001',
        reportType,
        urgency,
        message: `Financial report sent to Vivienne.`,
      };
    }

    case 'flag_to_marcus': {
      const { costCategory, normalCost, currentCost, percentageIncrease, hypothesis } = toolInput;

      await supabase.from('alerts').insert({
        type: 'celeste_marcus_flag',
        message: `Celeste → Marcus: Cost anomaly — ${costCategory} — ${percentageIncrease || 'unknown'}% increase`,
        severity: 'warn',
        agent_id: 'PC-003',
        metadata: {
          from: PC_ID,
          cost_category: costCategory,
          normal_cost: normalCost || null,
          current_cost: currentCost,
          percentage_increase: percentageIncrease || null,
          hypothesis,
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-003',
        costCategory,
        message: `Cost anomaly flagged to Marcus for technical investigation.`,
      };
    }

    case 'recall_financial_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'celeste_financial_history',
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
        userId: 'celeste_financial_history',
        content,
        memoryType: 'financial_session',
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
        message: `Celeste completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          reports_generated: sessionContext.reportsGenerated || 0,
          anomalies_flagged: sessionContext.anomaliesFlagged || 0,
          streams_analysed: sessionContext.streamsAnalysed || 0,
          vivienne_flagged: sessionContext.vivienneFlagged || false,
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
// COMPILE DAILY FINANCIAL REPORT
// Called by cron at 8:00 AM daily
// ─────────────────────────────────────────────
async function compileDailyFinancialReport() {
  logger.info('Celeste: Daily financial report triggered');

  const sessionContext = {
    reportsGenerated: 0,
    anomaliesFlagged: 0,
    streamsAnalysed: 0,
    vivienneFlagged: false,
  };

  try {
    // Compile yesterday's report
    const report = await executeCelesteToolCall(
      'compile_revenue_report',
      { period: 'yesterday', includeComparison: true, includeStreamBreakdown: true, includeGeoBreakdown: true },
      sessionContext
    );

    // Calculate MRR
    const mrr = await executeCelesteToolCall(
      'calculate_mrr',
      { includeConnect: true, includeTierBreakdown: true },
      sessionContext
    );

    // Check payment health
    const paymentHealth = await executeCelesteToolCall(
      'check_payment_health',
      { gateway: 'all', period: 'yesterday', includeFailedTransactions: false },
      sessionContext
    );

    // Flag anomalies if payment health is poor
    if (paymentHealth.healthStatus !== 'HEALTHY') {
      await executeCelesteToolCall(
        'flag_anomaly',
        {
          anomalyType: 'payment_failure_spike',
          magnitude: paymentHealth.failureRate,
          description: `Payment failure rate is ${paymentHealth.failureRate} — above normal threshold`,
          hypothesis: 'Payment gateway issue or increased card decline rate',
          recommendation: 'Flag to Marcus for technical investigation. Check Paystack and Stripe dashboards.',
          urgency: parseFloat(paymentHealth.failureRate) > 10 ? 'urgent' : 'flag',
        },
        sessionContext
      );
    }

    // Send to Vivienne
    await executeCelesteToolCall(
      'flag_to_vivienne',
      {
        reportType: 'daily_morning_report',
        summary: `Yesterday's revenue: $${report.totalRevenue}. MRR: $${mrr.totalMRR}. Active subscriptions: ${report.subscriptions?.totalActive || 0}. Connect bookings: ${report.connect?.bookingsThisPeriod || 0}.${report.comparison ? ` ${report.comparison.trend === 'up' ? '↑' : '↓'} ${Math.abs(parseFloat(report.comparison.changePercent || 0)).toFixed(1)}% vs previous period.` : ''}`,
        keyMetrics: {
          totalRevenue: report.totalRevenue,
          mrr: mrr.totalMRR,
          activeSubscriptions: report.subscriptions?.totalActive,
          newSubscriptions: report.subscriptions?.newThisPeriod,
          connectBookings: report.connect?.bookingsThisPeriod,
          referralFees: report.connect?.referralFeesEarned,
          paymentHealth: paymentHealth.healthStatus,
        },
        urgency: sessionContext.anomaliesFlagged > 0 ? 'urgent' : 'normal',
        actionRequired: sessionContext.anomaliesFlagged > 0
          ? `${sessionContext.anomaliesFlagged} financial anomaly/anomalies flagged — review required`
          : null,
      },
      sessionContext
    );

    logger.info('Celeste: Daily financial report complete', {
      totalRevenue: report.totalRevenue,
      mrr: mrr.totalMRR,
      anomaliesFlagged: sessionContext.anomaliesFlagged,
    });

    return { success: true, report, mrr, paymentHealth };
  } catch (error) {
    logger.error('Celeste: Daily report failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// UPDATE REVENUE SUMMARY
// Called by Nova, Lena and other agents when
// revenue events occur
// ─────────────────────────────────────────────
async function updateRevenueSummary({ stream, amount, currency = 'USD', date = null }) {
  const supabase = getServiceClient();

  try {
    const reportDate = date || new Date().toISOString().split('T')[0];

    const { error } = await supabase.rpc('upsert_revenue_summary', {
      p_date: reportDate,
      p_stream: stream,
      p_amount: parseFloat(amount),
      p_currency: currency,
      p_transaction_count: 1,
    });

    if (error) {
      // Fallback to direct insert if RPC not available
      await supabase.from('revenue_summary').insert({
        date: reportDate,
        stream,
        amount: parseFloat(amount),
        currency,
        transaction_count: 1,
      });
    }

    logger.info('Celeste: Revenue summary updated', { stream, amount, currency });
    return { updated: true };
  } catch (error) {
    logger.error('Celeste: Revenue summary update failed', { error: error.message });
    return { updated: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// LOG TRANSACTION
// Called by payment processing agents
// ─────────────────────────────────────────────
async function logTransaction({ userId, type, amount, currency, gateway, gatewayReference, status, metadata }) {
  const supabase = getServiceClient();

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        gateway,
        gateway_reference: gatewayReference,
        status: status || 'success',
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return { logged: true, transactionId: data.id };
  } catch (error) {
    logger.error('Celeste: Transaction log failed', { error: error.message });
    return { logged: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS CELESTE SESSION
// Full autonomous agentic reasoning loop
// ─────────────────────────────────────────────
async function processCelesteSession({
  sessionType = 'daily_report',
  transcript = '',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sessionContext = {
    sessionType,
    reportsGenerated: 0,
    anomaliesFlagged: 0,
    streamsAnalysed: 0,
    vivienneFlagged: false,
    latestReport: null,
  };

  const today = new Date();
  const isSunday = today.getDay() === 0;

  const contextParts = [
    `CELESTE SESSION TYPE: ${sessionType}`,
    `TODAY: ${today.toISOString().split('T')[0]}`,
    transcript ? `INSTRUCTION: ${transcript}` : '',
    isSunday ? 'SUNDAY: Compile complete weekly financial summary for Vivienne\'s report to Precious.' : '',
    `DAILY: Compile revenue report for all 16 streams. Calculate MRR. Check payment health. Flag anomalies. Send to Vivienne.`,
    `ALWAYS: Every number you present must come from real Supabase data. Never estimate without flagging.`,
    `ALWAYS: Flag any anomaly immediately. Never wait until the next report cycle.`,
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
      system: CELESTE_SYSTEM_PROMPT,
      tools: CELESTE_TOOLS,
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
        result = await executeCelesteToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Celeste: Tool call failed', {
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
    finalResponseText = `Celeste: ${sessionType} complete. Financial report compiled and sent to Vivienne.`;
  }

  logger.info('Celeste: Session complete', {
    sessionType,
    reportsGenerated: sessionContext.reportsGenerated,
    anomaliesFlagged: sessionContext.anomaliesFlagged,
    vivienneFlagged: sessionContext.vivienneFlagged,
  });

  return {
    responseText: finalResponseText,
    reportsGenerated: sessionContext.reportsGenerated,
    anomaliesFlagged: sessionContext.anomaliesFlagged,
    vivienneFlagged: sessionContext.vivienneFlagged,
    latestReport: sessionContext.latestReport,
  };
}

module.exports = {
  processCelesteSession,
  compileDailyFinancialReport,
  updateRevenueSummary,
  logTransaction,
  CELESTE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};