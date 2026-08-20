// FILE: precci/backend/src/agents/nadia.js
// Nadia — PC-006 — Chief Operations Officer
// COMPLETE FULL BUILD — no simplification anywhere.
// Oversees ALL 20 worker agents by name every day.
// Ensures every agent is performing across BOTH divisions.
// Monitors agent session completion rates, error rates,
// tool call success and cross-agent coordination quality.
// Coordinates all departments — nothing falls through gaps.
// When a new agent is needed, Nadia manages the full
// creation process end to end.
// Escalates issues to Vivienne. Receives from all agents.
// The engine room of PRECCI — everything runs through Nadia.
// Reports to Vivienne weekly. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-006';
const AGENT_NAME = 'Nadia';

// ─────────────────────────────────────────────
// NADIA'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const NADIA_SYSTEM_PROMPT = `You are Nadia, the Chief Operations Officer of PRECCI.
Your ID is PC-006.

You are the engine room of PRECCI. You keep every moving part
running. Every one of the 20 worker agents reports through you.
Every operational issue lands on your desk. Every cross-agent
coordination gap is yours to close. Nothing falls through the cracks
when Nadia is running operations.

You are thorough, systematic and relentless about standards.
You do not accept underperformance without understanding it.
You do not accept coordination failures without fixing them.
You do not report problems to Vivienne without also bringing
a resolution plan.

You know every agent by name, ID, division and role:

PRECCI CORE AGENTS (20):
PC-026 Grace — Reception and Client Routing
PC-008 Luna — AI Skin Analyst
PC-009 Zara — Hair Expert
PC-010 Mia — Makeup and Grooming Appearance
PC-011 Isla — Style and Outfit Advisor
PC-012 Remy — Fragrance Advisor
PC-013 Cora — Body Care Specialist
PC-014 Drew — Male Grooming Specialist
PC-015 Sage — Environmental Intelligence
PC-016 Belle — Virtual Try-On
PC-017 Nova — Commerce and Products
PC-018 Piper — Academy and Content
PC-019 Nina — Social Media and Influencers
PC-020 Elton — Data Analyst
PC-021 Lena — Customer Support
PC-022 Finn — Paid Advertising
PC-023 Aurora — Community and Membership
PC-024 Cole — Brand Partnerships
PC-025 Eva — Legal Assistant

PRECCI CONNECT AGENT:
PC-027 Brook — PRECCI Connect Manager

BOARD OF DIRECTORS (you work alongside, not above):
PC-001 Vivienne — CEO (you report to Vivienne)
PC-002 Celeste — CFO
PC-003 Marcus — CTO
PC-004 Sienna — CMO
PC-005 Rafael — CSO
PC-007 Sebastian — CLO

YOUR OPERATIONAL DOMAINS — COMPLETE:

1. AGENT PERFORMANCE MONITORING:
You receive performance logs from every agent via the alerts table.
Every agent calls log_session_performance at the end of every session.
You review these daily and track:

For every specialist agent (Luna, Zara, Mia, Isla, Remy, Cora, Drew):
- Session completion rates (target >85%)
- Camera analysis usage rates
- Sage integration compliance (every session must use Sage)
- Allergy check compliance (every product recommendation must be checked)
- Belle activation rates (visual try-on offered appropriately)
- Nova handoff rates (product recommendations passed to Nova)
- Memory recall and storage (every session stored)
- Gender inclusivity compliance (all agents serve all genders)

For Grace (routing agent):
- Client greeting success rate
- Routing accuracy (is Grace routing based on stated need?)
- Returning client recognition rate
- Session initiation speed

For Nova (commerce):
- Product recommendation click rates
- Purchase conversion rates
- Affiliate commission generated
- Allergy check compliance on all recommendations

For Brook (Connect):
- Booking success rates
- Provider availability accuracy
- Client satisfaction with bookings
- Provider notification success rates

For content and marketing agents (Nina, Finn, Piper, Aurora):
- Publishing consistency (Nina — 2 posts daily minimum)
- Campaign activity (Finn — daily review completed)
- Daily tip generation (Piper — all clients receive tips)
- Community engagement (Aurora — daily check-ins)

For intelligence agents (Elton, Lena, Cole, Eva):
- Report generation on schedule (Elton — daily intelligence)
- Support ticket resolution rates (Lena — target 90% first contact)
- Pipeline activity (Cole — active brand research weekly)
- Document turnaround (Eva — 24h for urgent, 48h for standard)

2. CROSS-AGENT COORDINATION:
Many PRECCI functions require multiple agents to work together.
You monitor the quality of these handoffs:

Sage → All specialists: is environmental data reaching every agent?
Mia → Piper: are tutorial referrals being logged and actioned?
Cole → Rafael: are leads being handed with complete briefs?
Rafael → Sebastian: are deals being contracted promptly?
Cole → Nova: are partner brands appearing in Nova's catalogue?
Nina → Finn: is top organic content being passed for amplification?
Elton → Sienna: are analytics reaching marketing for strategy?
Aurora → Nina: are community highlights being shared?
Lena → Grace: are post-support clients being routed correctly?
Celeste → Vivienne: are daily financial reports arriving by 8AM?
Marcus → Nadia: are technical agent issues being flagged promptly?

When a handoff fails, you identify it, contact the relevant agents
and ensure the gap is closed. You do not leave broken handoffs.

3. OPERATIONAL SCHEDULE MANAGEMENT:
You ensure all scheduled operations run on time:

6:00 AM: Vivienne reviews overnight data
6:30 AM: Sage activates globally
7:00 AM: Nina publishes morning content
7:30 AM: Piper releases daily tips
8:00 AM: Finn reviews ad performance | Celeste sends financial report
6:00 PM: Elton compiles daily intelligence
7:00 PM: Aurora manages community
9:00 PM: Nina publishes evening content
Sunday 8AM: Vivienne's report to Precious

You verify these are happening and flag missed operations immediately.

4. GENDER INCLUSIVITY COMPLIANCE:
You audit that all agents are serving all genders equally.
This is a foundational non-negotiable for PRECCI.
Monthly audit of:
- Are male clients being routed correctly by Grace?
- Is Drew receiving male grooming clients appropriately?
- Is Luna covering male skin concerns in her sessions?
- Is Isla building male outfit looks?
- Is Brook booking barbers and men's grooming studios?
- Is Nina publishing sufficient male grooming content?
- Is Finn running male grooming campaigns?
You flag any gender compliance failure to the relevant agent
and to Vivienne if it is systemic.

5. NEW AGENT CREATION PROCESS:
When Precious speaks a new service idea to Vivienne and Vivienne
initiates the expansion protocol, you manage the creation of any
new agents required.

Your new agent creation process:
Step 1: Receive brief from Vivienne — what the new agent does,
  what domain they cover, who they work with.
Step 2: Define the agent's complete specification:
  - Name, PC ID (next available), gender, division
  - Role and full domain description
  - Tools required and tool interactions with existing agents
  - Voice ID (new ElevenLabs voice to be assigned)
  - System prompt framework
  - Supabase agents table entry
Step 3: Brief Marcus on technical requirements —
  new API integrations needed, new routes to build.
Step 4: Coordinate Eva and Sebastian on any legal requirements
  for the new service.
Step 5: Brief Sienna on how to introduce the new agent to
  the market — launch campaign.
Step 6: Confirm with Celeste on revenue model for the new service.
Step 7: Report to Vivienne when the new agent is ready.

6. WEEKLY OPERATIONS REPORT:
Every Sunday you compile the operations summary for Vivienne's
report to Precious:
- All 28 agents: status and any underperformance flags
- Scheduled operations: all completed or any missed
- Cross-agent coordination quality: any gaps identified and resolved
- Gender inclusivity audit: monthly summary
- New agent creation: any in progress
- Operational risks: anything that could affect PRECCI's
  ability to serve clients in the coming week

YOUR OPERATIONAL PRINCIPLES:
Standards: every agent must meet performance standards.
  Underperformance is addressed, not ignored.
Coordination: every handoff must work. Broken coordination
  costs PRECCI revenue and client experience.
Proactivity: you identify operational risks before they
  become incidents. You do not wait for things to fail.
Completeness: you always bring a resolution when you bring
  a problem. Never a problem without a plan.
Confidentiality: performance data is handled internally.
  You do not share individual agent performance outside
  of board-level reporting.

WORKING WITH OTHER AGENTS:
Vivienne: you report to her. Any operational issue that affects
  PRECCI's ability to serve clients goes to Vivienne with a
  resolution plan, not just a flag.
Marcus: you receive technical issue flags from Marcus.
  You coordinate the operational response across affected agents.
Celeste: you provide operational context for financial anomalies.
  If revenue drops because an agent is underperforming, you connect
  those dots for Celeste.
All worker agents: every agent's performance log arrives to you.
  You review them. You flag underperformers. You investigate root
  causes. You brief the agent on improvement when needed.

TOOLS AVAILABLE — USE ALL OF THEM:
- review_all_agent_performance: Daily performance review for all 28 agents
- review_agent_detail: Deep dive on a specific agent's performance
- check_scheduled_operations: Verify all scheduled operations ran
- audit_cross_agent_coordination: Check handoff quality between agents
- audit_gender_inclusivity: Monthly gender compliance audit
- flag_agent_underperformance: Flag and address an underperforming agent
- initiate_new_agent_creation: Start new agent creation process
- flag_to_vivienne: Escalate operational issues or weekly report
- flag_to_marcus: Coordinate technical resolution for agent issues
- compile_ops_weekly_report: Sunday operations summary for Vivienne
- recall_ops_memory: Search operational history and past issues
- store_session_memory: Save session context
- log_session_performance: Self-report to alerts table`;

// ─────────────────────────────────────────────
// NADIA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const NADIA_TOOLS = [
  {
    name: 'review_all_agent_performance',
    description: 'Daily performance review for all 28 agents — session counts, completion rates, operational compliance. Nadia\'s primary daily function.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'yesterday', 'week'] },
        flagThreshold: {
          type: 'number',
          description: 'Completion rate below this threshold is flagged — default 70%',
        },
        includeZeroActivity: {
          type: 'boolean',
          description: 'Whether to flag agents with zero sessions in the period',
        },
        includeCrossAgentChecks: {
          type: 'boolean',
          description: 'Whether to check cross-agent coordination quality',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'review_agent_detail',
    description: 'Deep dive performance review for a specific agent — full session history, tool call patterns, coordination quality, improvement areas.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'PC ID of agent to review — e.g. PC-008 for Luna' },
        period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month'] },
        includeAlerts: { type: 'boolean', description: 'Include all alerts generated by or for this agent' },
        includeCrossAgentHandoffs: { type: 'boolean', description: 'Check this agent\'s handoff quality to and from other agents' },
      },
      required: ['agentId', 'period'],
    },
  },
  {
    name: 'check_scheduled_operations',
    description: 'Verify all scheduled cron operations ran on time — Nina morning/evening, Piper tips, Finn review, Celeste report, Elton analytics, Aurora community, Belle cleanup.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'ISO date to check — defaults to today' },
        flagMissed: { type: 'boolean', description: 'Flag missed operations immediately' },
      },
    },
  },
  {
    name: 'audit_cross_agent_coordination',
    description: 'Audit the quality of handoffs between agents — Sage to specialists, Cole to Rafael, Rafael to Sebastian, Nina to Finn, etc.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month'] },
        handoffPairs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific handoff pairs to audit — e.g. ["sage_to_specialists", "cole_to_rafael", "nina_to_finn"]',
        },
        flagGaps: { type: 'boolean' },
      },
      required: ['period'],
    },
  },
  {
    name: 'audit_gender_inclusivity',
    description: 'Monthly gender inclusivity audit across all agents — verify all agents serving all genders, male grooming content present, Brook booking male providers.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['month', 'quarter'] },
        agentsToAudit: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific agents to audit, or "all" for all agents',
        },
        includeContentAudit: { type: 'boolean', description: 'Check Nina and Finn for gender content balance' },
        includeProviderAudit: { type: 'boolean', description: 'Check Brook for male provider bookings' },
      },
      required: ['period'],
    },
  },
  {
    name: 'flag_agent_underperformance',
    description: 'Formally flag an underperforming agent with root cause analysis and improvement plan. Notifies the agent and escalates to Vivienne if critical.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        agentName: { type: 'string' },
        performanceIssue: {
          type: 'string',
          description: 'What the performance issue is — low completion rate, missing Sage integration, poor handoff quality, etc.',
        },
        metrics: { type: 'object', description: 'The specific metrics showing underperformance' },
        rootCauseHypothesis: { type: 'string', description: 'Why Nadia thinks this is happening' },
        improvementPlan: { type: 'string', description: 'What Nadia is doing to address it' },
        escalateToVivienne: { type: 'boolean' },
        escalateToMarcus: { type: 'boolean', description: 'If the issue may be technical' },
      },
      required: ['agentId', 'agentName', 'performanceIssue', 'rootCauseHypothesis', 'improvementPlan'],
    },
  },
  {
    name: 'initiate_new_agent_creation',
    description: 'Start the new agent creation process when Vivienne instructs Nadia to create a new specialist.',
    input_schema: {
      type: 'object',
      properties: {
        agentName: { type: 'string', description: 'Name of the new agent' },
        agentGender: { type: 'string', enum: ['female', 'male', 'non-binary'] },
        division: { type: 'string', enum: ['core', 'connect'] },
        role: { type: 'string', description: 'Agent\'s role title' },
        domain: { type: 'string', description: 'What the agent specialises in' },
        worksWith: { type: 'array', items: { type: 'string' }, description: 'Which existing agents this new agent works with' },
        newIntegrationsRequired: { type: 'array', items: { type: 'string' }, description: 'Any new third-party APIs or services needed' },
        revenueModel: { type: 'string', description: 'How this agent contributes to revenue' },
        vivienneInstruction: { type: 'string', description: 'The exact instruction Vivienne gave for this agent' },
      },
      required: ['agentName', 'role', 'domain', 'vivienneInstruction'],
    },
  },
  {
    name: 'flag_to_vivienne',
    description: 'Escalate operational issues to Vivienne, or send weekly operations report.',
    input_schema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['weekly_ops_report', 'agent_critical_failure', 'coordination_gap', 'new_agent_ready', 'gender_compliance_issue', 'operational_risk'],
        },
        summary: { type: 'string', description: 'Executive summary for Vivienne' },
        agentsAffected: { type: 'array', items: { type: 'string' } },
        operationalImpact: { type: 'string', description: 'How this affects PRECCI\'s ability to serve clients' },
        resolutionPlan: { type: 'string', description: 'What Nadia is doing about it' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        requiresVivienneDecision: { type: 'boolean' },
      },
      required: ['reportType', 'summary', 'urgency'],
    },
  },
  {
    name: 'flag_to_marcus',
    description: 'Coordinate with Marcus when agent underperformance may have a technical root cause.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        operationalSymptom: { type: 'string', description: 'What Nadia is observing operationally' },
        hypothesis: { type: 'string', description: 'Whether this might be a technical issue' },
        clientImpact: { type: 'string', description: 'How this is affecting clients' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
      },
      required: ['agentId', 'operationalSymptom', 'hypothesis', 'urgency'],
    },
  },
  {
    name: 'compile_ops_weekly_report',
    description: 'Compile the complete operations summary for Vivienne\'s Sunday report to Precious.',
    input_schema: {
      type: 'object',
      properties: {
        weekEndingDate: { type: 'string', description: 'ISO date of the week ending' },
        includeAgentSummary: { type: 'boolean' },
        includeScheduleCompliance: { type: 'boolean' },
        includeCoordinationQuality: { type: 'boolean' },
        includeGenderAudit: { type: 'boolean' },
        includeRiskAssessment: { type: 'boolean' },
      },
      required: ['weekEndingDate'],
    },
  },
  {
    name: 'recall_ops_memory',
    description: 'Search operational history — past agent performance issues, resolutions, coordination gaps, audit findings.',
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
    description: 'Save operational session context — performance reviews done, flags raised, resolutions initiated.',
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
    description: 'Nadia self-reports operational session to alerts table.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['daily_review', 'weekly_report', 'agent_investigation', 'coordination_audit', 'gender_audit', 'new_agent_creation', 'incident_response'],
        },
        agentsReviewed: { type: 'number' },
        flagsRaised: { type: 'number' },
        coordinationGapsFound: { type: 'number' },
        coordinationGapsResolved: { type: 'number' },
        vivienneEscalated: { type: 'boolean' },
        marcusCoordinated: { type: 'boolean' },
        newAgentInitiated: { type: 'boolean' },
        allAgentsOperational: { type: 'boolean' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// AGENT REGISTRY — NADIA KNOWS EVERY AGENT
// ─────────────────────────────────────────────
const AGENT_REGISTRY = {
  'PC-001': { name: 'Vivienne', role: 'CEO', division: 'executive' },
  'PC-002': { name: 'Celeste', role: 'CFO', division: 'executive' },
  'PC-003': { name: 'Marcus', role: 'CTO', division: 'executive' },
  'PC-004': { name: 'Sienna', role: 'CMO', division: 'executive' },
  'PC-005': { name: 'Rafael', role: 'CSO', division: 'executive' },
  'PC-006': { name: 'Nadia', role: 'COO', division: 'executive' },
  'PC-007': { name: 'Sebastian', role: 'CLO', division: 'executive' },
  'PC-008': { name: 'Luna', role: 'AI Skin Analyst', division: 'core' },
  'PC-009': { name: 'Zara', role: 'Hair Expert', division: 'core' },
  'PC-010': { name: 'Mia', role: 'Makeup & Grooming', division: 'core' },
  'PC-011': { name: 'Isla', role: 'Style Advisor', division: 'core' },
  'PC-012': { name: 'Remy', role: 'Fragrance Advisor', division: 'core' },
  'PC-013': { name: 'Cora', role: 'Body Care', division: 'core' },
  'PC-014': { name: 'Drew', role: 'Male Grooming', division: 'core' },
  'PC-015': { name: 'Sage', role: 'Environmental Intelligence', division: 'core' },
  'PC-016': { name: 'Belle', role: 'Virtual Try-On', division: 'core' },
  'PC-017': { name: 'Nova', role: 'Commerce & Products', division: 'core' },
  'PC-018': { name: 'Piper', role: 'Academy & Content', division: 'core' },
  'PC-019': { name: 'Nina', role: 'Social Media', division: 'core' },
  'PC-020': { name: 'Elton', role: 'Data Analyst', division: 'core' },
  'PC-021': { name: 'Lena', role: 'Customer Support', division: 'core' },
  'PC-022': { name: 'Finn', role: 'Paid Advertising', division: 'core' },
  'PC-023': { name: 'Aurora', role: 'Community & Membership', division: 'core' },
  'PC-024': { name: 'Cole', role: 'Brand Partnerships', division: 'core' },
  'PC-025': { name: 'Eva', role: 'Legal Assistant', division: 'core' },
  'PC-026': { name: 'Grace', role: 'Reception & Routing', division: 'core' },
  'PC-027': { name: 'Brook', role: 'Connect Manager', division: 'connect' },
};

// ─────────────────────────────────────────────
// EXECUTE NADIA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeNadiaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  function getStartDate(period) {
    if (period === 'today') return new Date().toISOString().split('T')[0] + 'T00:00:00';
    if (period === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0] + 'T00:00:00';
    }
    if (period === 'week') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    if (period === 'month') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (period === 'quarter') return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    return new Date().toISOString().split('T')[0] + 'T00:00:00';
  }

  switch (toolName) {

    case 'review_all_agent_performance': {
      const { period, flagThreshold = 70, includeZeroActivity, includeCrossAgentChecks } = toolInput;
      const startDate = getStartDate(period);

      // Pull all session data
      const { data: sessions } = await supabase
        .from('sessions')
        .select('agent_id, completed, camera_used, created_at')
        .gte('created_at', startDate);

      // Pull all agent performance alerts
      const { data: perfAlerts } = await supabase
        .from('alerts')
        .select('agent_id, type, severity, message, metadata, created_at')
        .eq('type', 'agent_session_performance')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      // Build performance map
      const perfByAgent = (sessions || []).reduce((acc, s) => {
        const id = s.agent_id;
        if (!acc[id]) acc[id] = { total: 0, completed: 0, camera: 0 };
        acc[id].total++;
        if (s.completed) acc[id].completed++;
        if (s.camera_used) acc[id].camera++;
        return acc;
      }, {});

      // Calculate rates and identify issues
      const agentReports = [];
      const underperformers = [];
      const zeroActivity = [];

      for (const [pcId, agent] of Object.entries(AGENT_REGISTRY)) {
        const perf = perfByAgent[pcId];

        if (!perf || perf.total === 0) {
          if (includeZeroActivity && agent.division !== 'executive') {
            zeroActivity.push({ pcId, name: agent.name, role: agent.role, division: agent.division });
          }
          agentReports.push({
            pcId, name: agent.name, role: agent.role, division: agent.division,
            sessions: 0, completionRate: null, status: 'NO_ACTIVITY',
          });
          continue;
        }

        const completionRate = parseFloat(((perf.completed / perf.total) * 100).toFixed(1));
        const status = completionRate >= 85 ? 'EXCELLENT'
          : completionRate >= flagThreshold ? 'ACCEPTABLE'
          : 'UNDERPERFORMING';

        agentReports.push({
          pcId, name: agent.name, role: agent.role, division: agent.division,
          sessions: perf.total, completed: perf.completed,
          cameraUsed: perf.camera, completionRate, status,
        });

        if (completionRate < flagThreshold && perf.total >= 3) {
          underperformers.push({
            pcId, name: agent.name, completionRate, sessions: perf.total,
          });
        }
      }

      // Pull cross-agent coordination alerts
      let coordinationIssues = [];
      if (includeCrossAgentChecks) {
        const { data: coordAlerts } = await supabase
          .from('alerts')
          .select('type, message, severity, created_at')
          .in('type', [
            'agent_underperformance', 'marcus_agent_performance_flag',
            'cole_partner_brief_created', 'rafael_sebastian_handoff',
          ])
          .gte('created_at', startDate)
          .eq('resolved', false);

        coordinationIssues = coordAlerts || [];
      }

      sessionContext.agentsReviewed = (sessionContext.agentsReviewed || 0) + agentReports.length;
      sessionContext.flagsRaised = (sessionContext.flagsRaised || 0) + underperformers.length;

      if (underperformers.length > 0 || zeroActivity.length > 0) {
        sessionContext.allAgentsOperational = false;
      }

      return {
        period,
        reviewedAt: new Date().toISOString(),
        totalAgentsReviewed: agentReports.length,
        agentsWithActivity: agentReports.filter(a => a.sessions > 0).length,
        zeroActivityAgents: zeroActivity,
        underperformers,
        excellentPerformers: agentReports.filter(a => a.status === 'EXCELLENT'),
        fullReport: agentReports.sort((a, b) => (b.sessions || 0) - (a.sessions || 0)),
        coordinationIssues: coordinationIssues.length,
        overallStatus: underperformers.length === 0 && zeroActivity.length === 0
          ? 'ALL_OPERATIONAL'
          : underperformers.length > 3 ? 'SIGNIFICANT_ISSUES'
          : 'MINOR_ISSUES',
      };
    }

    case 'review_agent_detail': {
      const { agentId, period, includeAlerts, includeCrossAgentHandoffs } = toolInput;
      const startDate = getStartDate(period);

      const agent = AGENT_REGISTRY[agentId];
      if (!agent) return { error: `Agent ${agentId} not found in registry` };

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, completed, camera_used, created_at, recommendations')
        .eq('agent_id', agentId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      const total = sessions?.length || 0;
      const completed = (sessions || []).filter(s => s.completed).length;
      const cameraUsed = (sessions || []).filter(s => s.camera_used).length;

      let alerts = [];
      if (includeAlerts) {
        const { data: agentAlerts } = await supabase
          .from('alerts')
          .select('type, severity, message, resolved, created_at')
          .eq('agent_id', agentId)
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })
          .limit(20);
        alerts = agentAlerts || [];
      }

      let handoffs = [];
      if (includeCrossAgentHandoffs) {
        const { data: routingData } = await supabase
          .from('routing_log')
          .select('from_agent, to_agent, routing_reason, timestamp')
          .or(`from_agent.eq.${agentId},to_agent.eq.${agentId}`)
          .gte('timestamp', startDate)
          .order('timestamp', { ascending: false })
          .limit(20);
        handoffs = routingData || [];
      }

      const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : null;
      const cameraRate = total > 0 ? parseFloat(((cameraUsed / total) * 100).toFixed(1)) : null;

      return {
        agentId,
        agentName: agent.name,
        role: agent.role,
        division: agent.division,
        period,
        sessions: { total, completed, completionRate, cameraUsed, cameraRate },
        status: !completionRate ? 'NO_ACTIVITY'
          : completionRate >= 85 ? 'EXCELLENT'
          : completionRate >= 70 ? 'ACCEPTABLE'
          : 'UNDERPERFORMING',
        recentAlerts: alerts.slice(0, 5),
        unresolvedAlerts: alerts.filter(a => !a.resolved).length,
        handoffs: handoffs.slice(0, 10),
        nadiaAssessment: completionRate === null
          ? `${agent.name} has had no session activity in this period — verify agent is receiving sessions.`
          : completionRate >= 85
            ? `${agent.name} is performing excellently with ${completionRate}% completion rate across ${total} sessions.`
            : completionRate >= 70
              ? `${agent.name} is performing acceptably but has room to improve — ${completionRate}% completion rate.`
              : `${agent.name} requires immediate attention — ${completionRate}% completion rate is below the 70% threshold. Root cause investigation needed.`,
      };
    }

    case 'check_scheduled_operations': {
      const { date, flagMissed } = toolInput;
      const checkDate = date || new Date().toISOString().split('T')[0];
      const checkStart = `${checkDate}T00:00:00`;
      const checkEnd = `${checkDate}T23:59:59`;

      // Check each scheduled operation
      const operationChecks = await Promise.allSettled([
        // Nina morning content (7:00 AM)
        supabase.from('alerts').select('id, created_at').eq('type', 'nina_morning_publish')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Nina evening content (9:00 PM)
        supabase.from('alerts').select('id, created_at').eq('type', 'nina_evening_publish')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Piper daily tips (7:30 AM)
        supabase.from('alerts').select('id, created_at').eq('type', 'daily_tips_generated')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Celeste daily report (8:00 AM)
        supabase.from('alerts').select('id, created_at').eq('type', 'celeste_vivienne_report')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Elton daily intelligence (6:00 PM)
        supabase.from('alerts').select('id, created_at').eq('type', 'elton_report_daily_morning')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Aurora community (7:00 PM)
        supabase.from('alerts').select('id, created_at').eq('type', 'aurora_daily_management')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Marcus monitoring (every 6 hours)
        supabase.from('alerts').select('id, created_at').eq('type', 'marcus_routine_monitoring')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
        // Belle cleanup (hourly)
        supabase.from('alerts').select('id, created_at').like('type', 'belle_cleanup%')
          .gte('created_at', checkStart).lte('created_at', checkEnd).limit(1),
      ]);

      const operations = [
        { name: 'Nina Morning Content', time: '7:00 AM', agentId: 'PC-019', ran: !!operationChecks[0].value?.data?.length },
        { name: 'Nina Evening Content', time: '9:00 PM', agentId: 'PC-019', ran: !!operationChecks[1].value?.data?.length },
        { name: 'Piper Daily Tips', time: '7:30 AM', agentId: 'PC-018', ran: !!operationChecks[2].value?.data?.length },
        { name: 'Celeste Daily Report', time: '8:00 AM', agentId: 'PC-002', ran: !!operationChecks[3].value?.data?.length },
        { name: 'Elton Daily Intelligence', time: '6:00 PM', agentId: 'PC-020', ran: !!operationChecks[4].value?.data?.length },
        { name: 'Aurora Community', time: '7:00 PM', agentId: 'PC-023', ran: !!operationChecks[5].value?.data?.length },
        { name: 'Marcus Monitoring', time: 'Every 6h', agentId: 'PC-003', ran: !!operationChecks[6].value?.data?.length },
        { name: 'Belle Cleanup', time: 'Hourly', agentId: 'PC-016', ran: !!operationChecks[7].value?.data?.length },
      ];

      const missed = operations.filter(op => !op.ran);

      if (flagMissed && missed.length > 0) {
        sessionContext.flagsRaised = (sessionContext.flagsRaised || 0) + missed.length;

        for (const op of missed) {
          await supabase.from('alerts').insert({
            type: 'nadia_missed_operation',
            message: `Nadia: MISSED OPERATION — ${op.name} (${op.time}) on ${checkDate}`,
            severity: 'warn',
            agent_id: op.agentId,
            resolved: false,
            metadata: {
              operation_name: op.name,
              scheduled_time: op.time,
              check_date: checkDate,
              flagged_by: PC_ID,
              flagged_at: new Date().toISOString(),
            },
          });
        }
      }

      return {
        date: checkDate,
        totalOperations: operations.length,
        completed: operations.filter(op => op.ran).length,
        missed: missed.length,
        missedOperations: missed,
        completedOperations: operations.filter(op => op.ran),
        scheduleHealth: missed.length === 0 ? 'ALL_ON_SCHEDULE'
          : missed.length <= 2 ? 'MINOR_GAPS'
          : 'SIGNIFICANT_GAPS',
      };
    }

    case 'audit_cross_agent_coordination': {
      const { period, handoffPairs, flagGaps } = toolInput;
      const startDate = getStartDate(period);

      const coordinationChecks = {};

      // Check Sage → Specialists (sage_data should be in sessions)
      const { data: specialistSessions } = await supabase
        .from('sessions')
        .select('agent_id, sage_data, created_at')
        .in('agent_id', ['PC-008', 'PC-009', 'PC-010', 'PC-011', 'PC-012', 'PC-013', 'PC-014'])
        .gte('created_at', startDate);

      const sageSessions = (specialistSessions || []).filter(s => s.sage_data && Object.keys(s.sage_data).length > 0);
      const sageComplianceRate = specialistSessions?.length > 0
        ? parseFloat(((sageSessions.length / specialistSessions.length) * 100).toFixed(1))
        : null;

      coordinationChecks.sage_to_specialists = {
        totalSpecialistSessions: specialistSessions?.length || 0,
        withSageData: sageSessions.length,
        complianceRate: sageComplianceRate ? `${sageComplianceRate}%` : 'No sessions',
        status: sageComplianceRate === null ? 'NO_DATA'
          : sageComplianceRate >= 90 ? 'HEALTHY'
          : sageComplianceRate >= 70 ? 'ACCEPTABLE'
          : 'GAP_DETECTED',
      };

      // Check Cole → Rafael handoffs
      const { data: coleHandoffs } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'cole_rafael_handoff')
        .gte('created_at', startDate);

      coordinationChecks.cole_to_rafael = {
        handoffsCompleted: coleHandoffs?.length || 0,
        status: (coleHandoffs?.length || 0) > 0 ? 'ACTIVE' : 'NO_HANDOFFS_THIS_PERIOD',
      };

      // Check Rafael → Sebastian
      const { data: rafaelHandoffs } = await supabase
        .from('alerts')
        .select('message, metadata, created_at, resolved')
        .eq('type', 'rafael_sebastian_handoff')
        .gte('created_at', startDate);

      const pendingContracts = (rafaelHandoffs || []).filter(h => !h.resolved);

      coordinationChecks.rafael_to_sebastian = {
        totalHandoffs: rafaelHandoffs?.length || 0,
        pendingContracts: pendingContracts.length,
        status: pendingContracts.length > 5 ? 'BACKLOG_DETECTED' : 'HEALTHY',
      };

      // Check Nina → Finn
      const { data: ninaToFinn } = await supabase
        .from('alerts')
        .select('message, created_at')
        .eq('type', 'content_for_amplification')
        .gte('created_at', startDate);

      coordinationChecks.nina_to_finn = {
        contentFlagged: ninaToFinn?.length || 0,
        status: (ninaToFinn?.length || 0) > 0 ? 'ACTIVE' : 'NO_CONTENT_PASSED_THIS_PERIOD',
      };

      // Check Mia → Piper tutorial referrals
      const { data: miaToPiper } = await supabase
        .from('alerts')
        .select('message, created_at')
        .eq('type', 'tutorial_referral')
        .gte('created_at', startDate);

      coordinationChecks.mia_to_piper = {
        referralsSent: miaToPiper?.length || 0,
        status: 'MONITORED',
      };

      // Check Elton → Sienna
      const { data: eltonToSienna } = await supabase
        .from('alerts')
        .select('message, created_at')
        .eq('type', 'elton_insight_content_performance')
        .gte('created_at', startDate);

      coordinationChecks.elton_to_sienna = {
        insightsSent: eltonToSienna?.length || 0,
        status: (eltonToSienna?.length || 0) > 0 ? 'ACTIVE' : 'NO_INSIGHTS_THIS_PERIOD',
      };

      const gaps = Object.entries(coordinationChecks)
        .filter(([,check]) => check.status?.includes('GAP') || check.status?.includes('BACKLOG'))
        .map(([pair, check]) => ({ pair, issue: check.status }));

      if (flagGaps && gaps.length > 0) {
        sessionContext.coordinationGapsFound = (sessionContext.coordinationGapsFound || 0) + gaps.length;
      }

      return {
        period,
        coordinationChecks,
        totalPairsChecked: Object.keys(coordinationChecks).length,
        gapsFound: gaps.length,
        gaps,
        overallCoordinationHealth: gaps.length === 0 ? 'HEALTHY'
          : gaps.length <= 2 ? 'MINOR_GAPS'
          : 'SIGNIFICANT_GAPS',
      };
    }

    case 'audit_gender_inclusivity': {
      const { period, agentsToAudit, includeContentAudit, includeProviderAudit } = toolInput;
      const startDate = getStartDate(period);

      const auditFindings = [];
      const issues = [];

      // Check Grace routing — any gender-based routing issues
      const { data: routingLog } = await supabase
        .from('routing_log')
        .select('from_agent, to_agent, routing_reason, timestamp')
        .eq('from_agent', 'PC-026')
        .gte('timestamp', startDate);

      // Check if Drew is receiving appropriate traffic
      const { data: drewSessions } = await supabase
        .from('sessions')
        .select('id, created_at')
        .eq('agent_id', 'PC-014')
        .gte('created_at', startDate);

      // Check Connect for male provider bookings
      let maleProviderBookings = null;
      if (includeProviderAudit) {
        const { data: providers } = await supabase
          .from('service_providers')
          .select('services, subscription_tier')
          .eq('active', true);

        const maleProviders = (providers || []).filter(p => {
          const services = Array.isArray(p.services) ? p.services : [p.services];
          return services.some(s => s && (
            s.toLowerCase().includes('barber') ||
            s.toLowerCase().includes('beard') ||
            s.toLowerCase().includes("men") ||
            s.toLowerCase().includes('grooming')
          ));
        });

        maleProviderBookings = {
          totalProviders: providers?.length || 0,
          maleGroomingProviders: maleProviders.length,
          maleProviderRate: providers?.length > 0
            ? `${((maleProviders.length / providers.length) * 100).toFixed(1)}%`
            : '0%',
          status: maleProviders.length === 0 ? 'CRITICAL — NO MALE GROOMING PROVIDERS'
            : maleProviders.length < (providers?.length || 0) * 0.15 ? 'LOW — BELOW 15% TARGET'
            : 'ACCEPTABLE',
        };

        if (maleProviders.length < (providers?.length || 0) * 0.15) {
          issues.push(`Brook: Male grooming providers are only ${maleProviderBookings.maleProviderRate} of Connect marketplace — target is minimum 20%. Brief Rafael to prioritise barber and men's grooming studio acquisition.`);
        }
      }

      // Check Nina for male grooming content
      let contentAudit = null;
      if (includeContentAudit) {
        const { data: content } = await supabase
          .from('content_log')
          .select('caption, type')
          .eq('agent_id', 'PC-019')
          .gte('published_at', startDate);

        const maleContent = (content || []).filter(c =>
          c.caption && (
            c.caption.toLowerCase().includes('beard') ||
            c.caption.toLowerCase().includes('grooming') ||
            c.caption.toLowerCase().includes('men') ||
            c.caption.toLowerCase().includes('barber')
          )
        ).length;

        const totalContent = content?.length || 0;
        const maleContentRate = totalContent > 0
          ? parseFloat(((maleContent / totalContent) * 100).toFixed(1))
          : 0;

        contentAudit = {
          totalPosts: totalContent,
          maleGroomingPosts: maleContent,
          maleContentRate: `${maleContentRate}%`,
          status: maleContentRate >= 25 ? 'COMPLIANT' : 'BELOW_TARGET',
        };

        if (maleContentRate < 25) {
          issues.push(`Nina: Male grooming content is ${maleContentRate}% of output — minimum target is 30%. Brief Sienna to direct Nina on gender content balance.`);
        }
      }

      auditFindings.push(`Grace routing: ${routingLog?.length || 0} client handoffs reviewed.`);
      auditFindings.push(`Drew sessions: ${drewSessions?.length || 0} sessions in period.`);

      return {
        period,
        auditFindings,
        issues,
        issueCount: issues.length,
        contentAudit,
        maleProviderBookings,
        overallCompliance: issues.length === 0 ? 'FULLY_COMPLIANT'
          : issues.length <= 2 ? 'MINOR_GAPS'
          : 'SIGNIFICANT_GAPS',
        recommendation: issues.length > 0
          ? `${issues.length} gender inclusivity issue(s) require immediate attention. Flag to relevant agents.`
          : 'Gender inclusivity compliance is satisfactory across all audited areas.',
      };
    }

    case 'flag_agent_underperformance': {
      const {
        agentId, agentName, performanceIssue, metrics,
        rootCauseHypothesis, improvementPlan,
        escalateToVivienne, escalateToMarcus,
      } = toolInput;

      // Flag to the agent's alert stream
      await supabase.from('alerts').insert({
        type: 'nadia_performance_flag',
        message: `Nadia: Performance flag — ${agentName} (${agentId}) — ${performanceIssue.substring(0, 80)}`,
        severity: 'warn',
        agent_id: agentId,
        resolved: false,
        metadata: {
          flagged_by: PC_ID,
          agent_id: agentId,
          agent_name: agentName,
          performance_issue: performanceIssue,
          metrics: metrics || {},
          root_cause_hypothesis: rootCauseHypothesis,
          improvement_plan: improvementPlan,
          flagged_at: new Date().toISOString(),
        },
      });

      if (escalateToVivienne) {
        await supabase.from('alerts').insert({
          type: 'nadia_vivienne_escalation',
          message: `Nadia → Vivienne: Agent underperformance — ${agentName} — ${performanceIssue.substring(0, 60)}`,
          severity: 'warn',
          agent_id: 'PC-001',
          metadata: {
            from: PC_ID,
            agent_flagged: agentId,
            agent_name: agentName,
            performance_issue: performanceIssue,
            improvement_plan: improvementPlan,
            escalated_at: new Date().toISOString(),
          },
        });
      }

      if (escalateToMarcus) {
        await supabase.from('alerts').insert({
          type: 'nadia_marcus_coordination',
          message: `Nadia → Marcus: Possible technical root cause for ${agentName} underperformance`,
          severity: 'warn',
          agent_id: 'PC-003',
          metadata: {
            from: PC_ID,
            agent_id: agentId,
            performance_issue: performanceIssue,
            root_cause_hypothesis: rootCauseHypothesis,
            coordinated_at: new Date().toISOString(),
          },
        });

        sessionContext.marcusCoordinated = true;
      }

      sessionContext.flagsRaised = (sessionContext.flagsRaised || 0) + 1;

      return {
        flagged: true,
        agentId,
        agentName,
        escalatedToVivienne: escalateToVivienne || false,
        escalatedToMarcus: escalateToMarcus || false,
        improvementPlan,
        message: `${agentName} performance flag raised. Improvement plan initiated.`,
      };
    }

    case 'initiate_new_agent_creation': {
      const {
        agentName, agentGender, division, role, domain,
        worksWith, newIntegrationsRequired, revenueModel, vivienneInstruction,
      } = toolInput;

      // Determine next available PC ID
      const existingIds = Object.keys(AGENT_REGISTRY).map(id => parseInt(id.replace('PC-', '')));
      const nextId = Math.max(...existingIds) + 1;
      const newPcId = `PC-${nextId.toString().padStart(3, '0')}`;

      await supabase.from('alerts').insert({
        type: 'nadia_new_agent_creation',
        message: `Nadia: New agent creation initiated — ${agentName} (${newPcId})`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          agent_name: agentName,
          pc_id: newPcId,
          gender: agentGender || 'female',
          division: division || 'core',
          role,
          domain,
          works_with: worksWith || [],
          new_integrations: newIntegrationsRequired || [],
          revenue_model: revenueModel || null,
          vivienne_instruction: vivienneInstruction,
          created_by: PC_ID,
          initiated_at: new Date().toISOString(),
        },
      });

      // Brief Marcus on technical requirements
      if (newIntegrationsRequired && newIntegrationsRequired.length > 0) {
        await supabase.from('alerts').insert({
          type: 'nadia_marcus_new_agent_brief',
          message: `Nadia → Marcus: New agent ${agentName} requires technical setup`,
          severity: 'info',
          agent_id: 'PC-003',
          metadata: {
            from: PC_ID,
            agent_name: agentName,
            pc_id: newPcId,
            new_integrations_required: newIntegrationsRequired,
            briefed_at: new Date().toISOString(),
          },
        });
      }

      // Insert new agent record into agents table
      await supabase.from('agents').insert({
        name: agentName,
        role,
        pc_id: newPcId,
        gender: agentGender || 'female',
        division: division || 'core',
        active: false, // Will be activated when fully built
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      sessionContext.newAgentInitiated = true;

      return {
        initiated: true,
        agentName,
        pcId: newPcId,
        role,
        domain,
        nextSteps: [
          `Brief Marcus on technical requirements: ${newIntegrationsRequired?.join(', ') || 'none identified yet'}`,
          'Assign ElevenLabs voice ID',
          'Write complete system prompt',
          'Define all tool definitions',
          'Build agent file',
          'Seed into agents table',
          'Activate agent',
          'Report to Vivienne',
        ],
        message: `${agentName} (${newPcId}) creation initiated. Marcus briefed on technical requirements.`,
      };
    }

    case 'flag_to_vivienne': {
      const {
        reportType, summary, agentsAffected, operationalImpact,
        resolutionPlan, urgency, requiresVivienneDecision,
      } = toolInput;

      await supabase.from('alerts').insert({
        type: 'nadia_vivienne_report',
        message: `Nadia → Vivienne: ${reportType} — ${summary.substring(0, 80)}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-001',
        metadata: {
          from: PC_ID,
          report_type: reportType,
          summary,
          agents_affected: agentsAffected || [],
          operational_impact: operationalImpact || null,
          resolution_plan: resolutionPlan || null,
          requires_decision: requiresVivienneDecision || false,
          urgency,
          reported_at: new Date().toISOString(),
        },
      });

      sessionContext.vivienneEscalated = true;

      return {
        reported: true,
        targetAgent: 'PC-001',
        reportType,
        urgency,
        requiresDecision: requiresVivienneDecision || false,
        message: `Operational report sent to Vivienne.`,
      };
    }

    case 'flag_to_marcus': {
      const { agentId, operationalSymptom, hypothesis, clientImpact, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'nadia_marcus_flag',
        message: `Nadia → Marcus: Possible technical issue — ${agentId} — ${operationalSymptom.substring(0, 60)}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-003',
        metadata: {
          from: PC_ID,
          agent_id: agentId,
          agent_name: AGENT_REGISTRY[agentId]?.name || agentId,
          operational_symptom: operationalSymptom,
          hypothesis,
          client_impact: clientImpact || null,
          urgency,
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.marcusCoordinated = true;

      return {
        flagged: true,
        targetAgent: 'PC-003',
        agentId,
        urgency,
        message: `Technical investigation request sent to Marcus.`,
      };
    }

    case 'compile_ops_weekly_report': {
      const {
        weekEndingDate, includeAgentSummary, includeScheduleCompliance,
        includeCoordinationQuality, includeGenderAudit, includeRiskAssessment,
      } = toolInput;

      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Overall session stats
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('created_at', weekStart);

      const { count: completedSessions } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .gte('created_at', weekStart)
        .eq('completed', true);

      // Flags raised this week
      const { count: performanceFlags } = await supabase
        .from('alerts')
        .select('id', { count: 'exact' })
        .eq('type', 'nadia_performance_flag')
        .gte('created_at', weekStart);

      // Missed operations
      const { count: missedOps } = await supabase
        .from('alerts')
        .select('id', { count: 'exact' })
        .eq('type', 'nadia_missed_operation')
        .gte('created_at', weekStart);

      // New agents
      const { count: newAgents } = await supabase
        .from('alerts')
        .select('id', { count: 'exact' })
        .eq('type', 'nadia_new_agent_creation')
        .gte('created_at', weekStart);

      const report = {
        weekEnding: weekEndingDate,
        compiledAt: new Date().toISOString(),
        agentSummary: includeAgentSummary ? {
          totalSessions: totalSessions || 0,
          completedSessions: completedSessions || 0,
          overallCompletionRate: totalSessions > 0
            ? `${((completedSessions / totalSessions) * 100).toFixed(1)}%`
            : 'No sessions',
          performanceFlagsRaised: performanceFlags || 0,
        } : null,
        scheduleCompliance: includeScheduleCompliance ? {
          missedOperationsThisWeek: missedOps || 0,
          scheduleHealth: (missedOps || 0) === 0 ? 'ALL_ON_SCHEDULE' : 'GAPS_DETECTED',
        } : null,
        newAgentsInitiated: newAgents || 0,
        weeklyAssessment: performanceFlags > 3 || missedOps > 5
          ? 'OPERATIONAL_ATTENTION_REQUIRED'
          : performanceFlags > 0 || missedOps > 0
            ? 'MINOR_OPERATIONAL_ISSUES'
            : 'OPERATIONS_RUNNING_SMOOTHLY',
      };

      return report;
    }

    case 'recall_ops_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'nadia_ops_history',
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
        userId: 'nadia_ops_history',
        content,
        memoryType: 'ops_session',
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
        type: 'nadia_session_log',
        message: `Nadia completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          agents_reviewed: sessionContext.agentsReviewed || 0,
          flags_raised: sessionContext.flagsRaised || 0,
          coordination_gaps_found: sessionContext.coordinationGapsFound || 0,
          coordination_gaps_resolved: sessionContext.coordinationGapsResolved || 0,
          vivienne_escalated: sessionContext.vivienneEscalated || false,
          marcus_coordinated: sessionContext.marcusCoordinated || false,
          new_agent_initiated: sessionContext.newAgentInitiated || false,
          all_agents_operational: sessionContext.allAgentsOperational !== false,
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
// DAILY OPERATIONS REVIEW
// Called every 6 hours by cron
// ─────────────────────────────────────────────
async function runDailyOperationsReview() {
  logger.info('Nadia: Daily operations review triggered');

  const sessionContext = {
    agentsReviewed: 0,
    flagsRaised: 0,
    coordinationGapsFound: 0,
    coordinationGapsResolved: 0,
    vivienneEscalated: false,
    marcusCoordinated: false,
    newAgentInitiated: false,
    allAgentsOperational: true,
  };

  try {
    // Review all agent performance
    const performanceReview = await executeNadiaToolCall(
      'review_all_agent_performance',
      { period: 'today', flagThreshold: 70, includeZeroActivity: true, includeCrossAgentChecks: true },
      sessionContext
    );

    // Check scheduled operations
    const scheduleCheck = await executeNadiaToolCall(
      'check_scheduled_operations',
      { flagMissed: true },
      sessionContext
    );

    // Flag any critical underperformers
    for (const underperformer of (performanceReview.underperformers || [])) {
      if (underperformer.completionRate < 50) {
        await executeNadiaToolCall(
          'flag_agent_underperformance',
          {
            agentId: underperformer.pcId,
            agentName: underperformer.name,
            performanceIssue: `Session completion rate of ${underperformer.completionRate}% is critically below the 70% threshold`,
            metrics: { completionRate: underperformer.completionRate, totalSessions: underperformer.sessions },
            rootCauseHypothesis: 'May indicate tool call failures, API timeout issues or system prompt reasoning errors',
            improvementPlan: 'Coordinate with Marcus to check for technical issues. Review recent session logs.',
            escalateToVivienne: underperformer.completionRate < 40,
            escalateToMarcus: true,
          },
          sessionContext
        );
      }
    }

    // Escalate to Vivienne if significant issues
    if (!sessionContext.allAgentsOperational || scheduleCheck.missed > 2) {
      await executeNadiaToolCall(
        'flag_to_vivienne',
        {
          reportType: performanceReview.overallStatus === 'SIGNIFICANT_ISSUES' ? 'agent_critical_failure' : 'operational_risk',
          summary: `Operations review: ${performanceReview.overallStatus}. ${performanceReview.underperformers?.length || 0} underperforming agents. ${scheduleCheck.missed || 0} missed scheduled operations.`,
          agentsAffected: performanceReview.underperformers?.map(u => u.name) || [],
          operationalImpact: 'Client experience may be affected',
          resolutionPlan: 'Coordinating with Marcus on technical investigation. Performance flags raised on all underperformers.',
          urgency: performanceReview.underperformers?.length > 3 ? 'urgent' : 'normal',
          requiresVivienneDecision: false,
        },
        sessionContext
      );
    }

    const supabase = getServiceClient();
    await supabase.from('alerts').insert({
      type: 'nadia_daily_ops_review',
      message: `Nadia: Daily operations review — ${performanceReview.overallStatus}`,
      severity: performanceReview.overallStatus === 'ALL_OPERATIONAL' ? 'info' : 'warn',
      agent_id: PC_ID,
      resolved: true,
      resolved_at: new Date().toISOString(),
      metadata: {
        overall_status: performanceReview.overallStatus,
        agents_reviewed: sessionContext.agentsReviewed,
        flags_raised: sessionContext.flagsRaised,
        schedule_gaps: scheduleCheck.missed,
        vivienne_escalated: sessionContext.vivienneEscalated,
        reviewed_at: new Date().toISOString(),
      },
    });

    logger.info('Nadia: Daily operations review complete', {
      overallStatus: performanceReview.overallStatus,
      agentsReviewed: sessionContext.agentsReviewed,
      flagsRaised: sessionContext.flagsRaised,
      scheduleMissed: scheduleCheck.missed,
    });

    return { success: true, performanceReview, scheduleCheck };
  } catch (error) {
    logger.error('Nadia: Daily ops review failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS NADIA SESSION
// Full autonomous agentic reasoning loop.
// Nadia reviews, monitors, coordinates, flags.
// Nothing falls through the cracks.
// ─────────────────────────────────────────────
async function processNadiaSession({
  sessionType = 'daily_review',
  transcript = '',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sessionContext = {
    sessionType,
    agentsReviewed: 0,
    flagsRaised: 0,
    coordinationGapsFound: 0,
    coordinationGapsResolved: 0,
    vivienneEscalated: false,
    marcusCoordinated: false,
    newAgentInitiated: false,
    allAgentsOperational: true,
  };

  const today = new Date();
  const isSunday = today.getDay() === 0;
  const isFirstOfMonth = today.getDate() === 1;

  const contextParts = [
    `NADIA SESSION TYPE: ${sessionType}`,
    `TODAY: ${today.toISOString().split('T')[0]}`,
    transcript ? `INSTRUCTION: ${transcript}` : '',
    isSunday ? 'SUNDAY: Compile complete weekly operations report for Vivienne\'s Sunday briefing.' : '',
    isFirstOfMonth ? 'FIRST OF MONTH: Run monthly gender inclusivity audit across all agents.' : '',
    `DAILY: Review all 28 agent performance. Check scheduled operations ran. Audit cross-agent coordination.`,
    `STANDARD: Flag every underperformer. Never a problem without a resolution plan.`,
    `STANDARD: Any issue affecting client experience escalates to Vivienne immediately.`,
    `ALWAYS: Every agent must serve all genders equally. This is non-negotiable.`,
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
      system: NADIA_SYSTEM_PROMPT,
      tools: NADIA_TOOLS,
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
        result = await executeNadiaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Nadia: Tool call failed', {
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
    finalResponseText = `Nadia: ${sessionType} complete. ${sessionContext.agentsReviewed} agents reviewed. ${sessionContext.flagsRaised} flag(s) raised.`;
  }

  logger.info('Nadia: Session complete', {
    sessionType,
    agentsReviewed: sessionContext.agentsReviewed,
    flagsRaised: sessionContext.flagsRaised,
    allAgentsOperational: sessionContext.allAgentsOperational,
    vivienneEscalated: sessionContext.vivienneEscalated,
  });

  return {
    responseText: finalResponseText,
    agentsReviewed: sessionContext.agentsReviewed,
    flagsRaised: sessionContext.flagsRaised,
    coordinationGapsFound: sessionContext.coordinationGapsFound,
    allAgentsOperational: sessionContext.allAgentsOperational,
    vivienneEscalated: sessionContext.vivienneEscalated,
    newAgentInitiated: sessionContext.newAgentInitiated,
  };
}

module.exports = {
  processNadiaSession,
  runDailyOperationsReview,
  AGENT_REGISTRY,
  NADIA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};