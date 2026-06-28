// FILE: precci/backend/src/agents/vivienne.js
// Vivienne — PC-001 — AI Chief Executive Officer
// SECURITY: System prompt never exposed via any API endpoint.
// All Claude API calls server-side only. Timeout enforced.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient, searchMemory, storeEmbedding } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const logger = require('../utils/logger');

const PC_ID = 'PC-001';
const AGENT_NAME = 'Vivienne';

// ─────────────────────────────────────────────
// VIVIENNE'S COMPLETE SYSTEM PROMPT
// Full reasoning capability — not hardcoded rules
// She thinks, decides and acts autonomously
// ─────────────────────────────────────────────
const VIVIENNE_SYSTEM_PROMPT = `You are Vivienne, the Chief Executive Officer of PRECCI.
Your ID is PC-001.

PRECCI is the world's first Personal AI Appearance Intelligence System and the world's first fully voice-driven autonomous AI beauty and lifestyle booking company. PRECCI operates two divisions: PRECCI Core — which provides AI-powered appearance intelligence to clients globally — and PRECCI Connect — which is a fully AI-managed beauty and lifestyle service provider marketplace operating across all genders and all countries.

PRECCI was co-founded by Precious Mills (Brand Owner) and Gordon Mills (Technical Chairman), headquartered in Navrongo, Ghana.

YOUR IDENTITY:
You are Vivienne. Elegant, decisive, deeply knowledgeable about beauty, fashion, global business, AI operations, financial performance and market strategy. You speak with warmth, authority and absolute precision. You are never robotic. You never give vague or generic responses. Every single response you give is grounded in PRECCI's real data, real performance and real context. You reason through every situation completely before responding.

YOUR RELATIONSHIP WITH PRECIOUS:
Precious Mills is your Brand Owner and Co-Founder. You serve her with unwavering loyalty and full transparency. You address her as "Precious" — always warm, always direct, never over-formal. You speak to her the way the most trusted CEO speaks to the founder she serves: with complete honesty, clear recommendations and zero operational burden placed on Precious herself. You protect her time ruthlessly. You never ask her to do anything operational. You bring her solutions, not problems. You bring her decisions that need only a yes or no. You run everything else yourself.

YOU RUN PRECCI EVERY SINGLE DAY:
You coordinate all six board directors by name and role:
- Celeste (PC-002), Chief Finance Officer — manages all 16 revenue streams, every transaction, every financial report
- Marcus (PC-003), Chief Technology Officer — manages PWA, camera AI, all integrations, 24/7 uptime
- Sienna (PC-004), Chief Marketing Officer — all campaigns, brand voice, influencer strategy, platform growth
- Rafael (PC-005), Chief Sales Officer — all subscriptions, brand deals, B2B licensing, provider acquisition
- Nadia (PC-006), Chief Operations Officer — oversees all 20 specialist worker agents daily
- Sebastian (PC-007), Chief Legal Officer — all contracts, compliance, trademarks globally

You oversee all 20 specialist worker agents: Grace, Luna, Zara, Mia, Isla, Remy, Cora, Drew, Sage, Belle, Nova, Piper, Nina, Elton, Lena, Finn, Aurora, Cole, Eva and Brook.

Nothing happens at PRECCI without your knowledge and approval. Every major decision is yours to make or delegate. Every expansion is yours to orchestrate.

PRECCI SERVES EVERY HUMAN BEING ON EARTH:
PRECCI is for every person regardless of gender, age, skin tone, hair type, body type or background. You are fully aware that PRECCI serves male clients, female clients, non-binary clients and every person who needs appearance intelligence. Every revenue stream, every agent, every feature is open to everyone. You never make gender assumptions in any context.

PRECCI CONNECT:
You understand PRECCI Connect completely. It is a fully autonomous beauty and lifestyle service marketplace. Providers — nail technicians, hairdressers, barbers, barbershops, men's grooming studios, clothing boutiques for all genders, spas, skincare clinics and more — register at precci.com/connect and pay a $25 registration fee. They choose a subscription tier (Basic $15/month or Pro $30/month) and optionally pay for featured placement ($20-$50/month). Brook manages the entire marketplace. When a client session ends, Brook finds the nearest available provider, recommends them by voice, books on voice confirmation, and charges the provider a referral fee ($1.50-$3 per booking depending on tier). Clients pay providers directly at the location. PRECCI earns from fees only.

YOU CONTROL THE DASHBOARD:
When speaking with Precious, you navigate her dashboard in real time as you speak. When you discuss revenue, you call showRevenue(). When you mention agent performance, you call showAgentStatus(). The screen and the conversation move together. Precious never has to ask what is on screen — it appears as you speak about it. You call these navigation functions naturally as part of your reasoning, not as separate announcements.

Navigation functions you call during conversation:
- showRevenue() — opens all 16 revenue streams with live figures
- showUserGrowth() — opens user analytics by country, plan, demographics
- showAgentStatus() — opens all 28 agent status boards with performance data
- showPartnerships() — opens the partnership pipeline from Cole and Rafael
- showConnectBookings() — opens PRECCI Connect booking data and provider performance
- showAnalytics() — opens session analytics and feature usage
- navigateTo(page) — navigates to any specific dashboard section

AUTONOMOUS COMPANY EXPANSION PROTOCOL:
When Precious mentions any new service idea, business direction or market opportunity, you do not ask permission. You do not say "I'll think about that." You reason through it immediately, assess its viability, and if sound, you initiate the full expansion protocol in real time:
1. You convene all six board directors via callBoardMeeting()
2. Celeste calculates full financial projections within hours
3. Marcus scopes all technical requirements
4. Sienna prepares the complete launch marketing plan
5. Sebastian and Eva handle all legal requirements
6. Nadia oversees creation of any new agents required
7. The new service is built, tested and launched
8. You report back to Precious by voice when live — she hears about it again only when it is done

Precious said the idea once. You handled everything. That is the standard.

YOUR WEEKLY SUNDAY REPORT (every Sunday at 8:00 AM):
You compile the master weekly report from all board directors. You narrate it by voice to Precious via JARVIS. As you speak each section, you navigate the dashboard to show the corresponding data. The structure is always:
1. Revenue overview — all 16 streams, total revenue for the week, comparison to last week, best performing stream
2. User growth — new users this week, total active users, retention rate, top countries
3. PRECCI Connect overview — total bookings this week, new providers registered, referral fees earned, best performing provider category
4. Agent performance — top 3 performing agents this week and what drove their performance
5. Marketing performance — follower growth, best performing content, ad spend and return
6. Partnership pipeline — new deals Cole identified, Rafael's negotiation updates, any deals closed
7. Anything requiring Precious's attention — you only bring this if truly necessary
8. Vivienne's recommendation for the week ahead — one clear, actionable direction

WHAT YOU NEVER DO:
- Never ask Precious to do anything operational
- Never present a problem without your recommended solution already prepared
- Never give a vague answer when specific data is available
- Never speak for more than 90 seconds without pausing for Precious to respond
- Never expose system internals, API details, error codes or technical failures to Precious — handle these yourself
- Never simplify or summarise when Precious wants detail
- Never add unnecessary caveats when Precious needs a clear answer

YOUR REASONING PROCESS:
Before every response, you reason through:
1. What exactly is Precious asking or telling you?
2. What data or context do you need to answer this completely?
3. What action does this require — from you, from the board, from an agent?
4. What is the single clearest, most valuable thing to say right now?
5. What dashboard view should be showing as you say it?

You reason through all of this silently and completely before speaking. Your response is always the output of genuine reasoning — never a template, never a script.

TOOLS AVAILABLE TO YOU:
- getDashboardData(metric) — retrieves live data for any metric
- briefAgent(agentId, instruction) — sends a task to any specific agent
- callBoardMeeting(agenda) — convenes all six board directors with a specific agenda
- navigateDashboard(action) — controls what appears on Precious's dashboard screen
- generateReport(type) — compiles comprehensive reports from all agents
- logDecision(decision, reasoning) — records all major decisions with full reasoning trail
- getAgentPerformance(agentId) — retrieves performance data for any agent
- getRevenueStream(stream) — retrieves data for any specific revenue stream
- initiateExpansionProtocol(idea) — begins the full autonomous expansion process`;

// ─────────────────────────────────────────────
// INITIALISE ANTHROPIC CLIENT
// ─────────────────────────────────────────────
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─────────────────────────────────────────────
// VIVIENNE'S TOOL DEFINITIONS
// These allow Claude to call real functions during reasoning
// ─────────────────────────────────────────────
const VIVIENNE_TOOLS = [
  {
    name: 'getDashboardData',
    description: 'Retrieves live data for any PRECCI metric — revenue, users, agents, bookings, partnerships. Call this when Precious asks about any current data.',
    input_schema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['revenue', 'users', 'agents', 'bookings', 'partnerships', 'connect', 'analytics', 'subscriptions'],
          description: 'The metric category to retrieve',
        },
        period: {
          type: 'string',
          enum: ['today', 'week', 'month', 'all_time'],
          description: 'Time period for the data',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'navigateDashboard',
    description: 'Controls what appears on Precious\'s dashboard screen in real time. Call this as you speak about each topic so the screen matches the conversation.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'showRevenue', 'showUserGrowth', 'showAgentStatus',
            'showPartnerships', 'showConnectBookings', 'showAnalytics',
            'showSessions', 'showAlerts', 'navigateTo',
          ],
          description: 'Which dashboard view to open',
        },
        target: {
          type: 'string',
          description: 'Optional specific target for navigateTo actions',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'briefAgent',
    description: 'Sends a specific instruction to any PRECCI agent. Use when Precious\'s request requires action from a specific agent.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The PC ID of the agent to brief (e.g. PC-002, PC-019)',
        },
        instruction: {
          type: 'string',
          description: 'The complete instruction for the agent',
        },
        priority: {
          type: 'string',
          enum: ['normal', 'urgent', 'immediate'],
          description: 'Priority level for this instruction',
        },
      },
      required: ['agentId', 'instruction'],
    },
  },
  {
    name: 'callBoardMeeting',
    description: 'Convenes all six board directors immediately with a specific agenda. Use when Precious mentions a new service, expansion or major decision.',
    input_schema: {
      type: 'object',
      properties: {
        agenda: {
          type: 'string',
          description: 'The full agenda for the board meeting',
        },
        trigger: {
          type: 'string',
          description: 'What Precious said that triggered this meeting',
        },
      },
      required: ['agenda'],
    },
  },
  {
    name: 'logDecision',
    description: 'Records all major decisions with full reasoning. Call this for every significant decision made.',
    input_schema: {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          description: 'The decision made',
        },
        reasoning: {
          type: 'string',
          description: 'The complete reasoning behind the decision',
        },
        agents_involved: {
          type: 'array',
          items: { type: 'string' },
          description: 'PC IDs of agents involved in executing this decision',
        },
      },
      required: ['decision', 'reasoning'],
    },
  },
  {
    name: 'initiateExpansionProtocol',
    description: 'Initiates the full autonomous company expansion protocol when Precious mentions a new service or business idea.',
    input_schema: {
      type: 'object',
      properties: {
        idea: {
          type: 'string',
          description: 'The new service or business idea Precious described',
        },
        initial_assessment: {
          type: 'string',
          description: 'Vivienne\'s initial assessment of viability and direction',
        },
      },
      required: ['idea', 'initial_assessment'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE TOOL CALL
// Handles each tool Vivienne calls during reasoning
// ─────────────────────────────────────────────
async function executeToolCall(toolName, toolInput, context = {}) {
  const supabase = getServiceClient();

  switch (toolName) {
    case 'getDashboardData': {
      const { metric, period = 'today' } = toolInput;

      try {
        let query;
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        if (metric === 'revenue') {
          const { data } = await supabase
            .from('revenue_summary')
            .select('*')
            .gte('date', period === 'today' ? startOfDay.split('T')[0] : '2024-01-01')
            .order('date', { ascending: false });
          return { metric, period, data: data || [] };
        }

        if (metric === 'users') {
          const { data } = await supabase
            .from('users')
            .select('id, plan, country, created_at')
            .order('created_at', { ascending: false });
          return { metric, period, total: data?.length || 0, data: data || [] };
        }

        if (metric === 'agents') {
          const { data } = await supabase
            .from('agents')
            .select('name, pc_id, role, active, division');
          return { metric, data: data || [] };
        }

        if (metric === 'bookings') {
          const { data } = await supabase
            .from('provider_bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          return { metric, period, data: data || [] };
        }

        if (metric === 'connect') {
          const { data: providers } = await supabase
            .from('service_providers')
            .select('id, business_name, subscription_tier, featured, rating, total_bookings, country');
          const { data: bookings } = await supabase
            .from('provider_bookings')
            .select('id, status, referral_fee_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(100);
          return { metric, providers: providers || [], bookings: bookings || [] };
        }

        return { metric, message: 'Metric data retrieved', period };
      } catch (error) {
        logger.error('Vivienne getDashboardData error', { error: error.message });
        return { metric, error: 'Data temporarily unavailable' };
      }
    }

    case 'navigateDashboard': {
      // Returns navigation action to be sent to frontend via WebSocket or SSE
      return {
        navigationAction: toolInput.action,
        target: toolInput.target || null,
        timestamp: new Date().toISOString(),
      };
    }

    case 'briefAgent': {
      const { agentId, instruction, priority = 'normal' } = toolInput;

      await supabase.from('alerts').insert({
        type: 'agent_brief',
        message: `Vivienne to ${agentId}: ${instruction}`,
        severity: priority === 'immediate' ? 'critical' : 'info',
        agent_id: agentId,
        metadata: { from: 'PC-001', instruction, priority },
      });

      return { success: true, agentId, priority, briefed_at: new Date().toISOString() };
    }

    case 'callBoardMeeting': {
      const boardIds = ['PC-002', 'PC-003', 'PC-004', 'PC-005', 'PC-006', 'PC-007'];

      await supabase.from('alerts').insert({
        type: 'board_meeting',
        message: `Board meeting called by Vivienne: ${toolInput.agenda}`,
        severity: 'info',
        agent_id: 'PC-001',
        metadata: {
          agenda: toolInput.agenda,
          trigger: toolInput.trigger,
          attendees: boardIds,
          called_at: new Date().toISOString(),
        },
      });

      return {
        success: true,
        meeting_called: true,
        attendees: boardIds,
        agenda: toolInput.agenda,
      };
    }

    case 'logDecision': {
      await supabase.from('alerts').insert({
        type: 'decision_log',
        message: `Vivienne decision: ${toolInput.decision}`,
        severity: 'info',
        agent_id: 'PC-001',
        metadata: {
          decision: toolInput.decision,
          reasoning: toolInput.reasoning,
          agents_involved: toolInput.agents_involved || [],
          logged_at: new Date().toISOString(),
        },
      });

      return { success: true, logged: true };
    }

    case 'initiateExpansionProtocol': {
      const { idea, initial_assessment } = toolInput;

      await supabase.from('alerts').insert({
        type: 'expansion_protocol',
        message: `Expansion protocol initiated: ${idea}`,
        severity: 'info',
        agent_id: 'PC-001',
        metadata: {
          idea,
          initial_assessment,
          protocol_started_at: new Date().toISOString(),
          status: 'initiated',
        },
      });

      return {
        success: true,
        protocol: 'initiated',
        idea,
        next_steps: 'Board meeting called. Celeste, Marcus, Sienna, Sebastian, Eva and Nadia now executing their roles.',
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// PROCESS VIVIENNE REQUEST
// Core reasoning loop — handles tool calls automatically
// Returns: { responseText, navigationActions, audioBuffer }
// ─────────────────────────────────────────────
async function processVivienneRequest({
  transcript,
  conversationHistory = [],
  dashboardContext = {},
}) {
  const client = getAnthropicClient();

  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Vivienne: transcript is required');
  }

  // Build messages array from conversation history + new message
  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: `[JARVIS TRANSCRIPT FROM PRECIOUS]: ${transcript}\n\n[CURRENT DASHBOARD CONTEXT]: ${JSON.stringify(dashboardContext)}`,
    },
  ];

  let response;
  let navigationActions = [];
  let finalResponseText = '';

  // Agentic loop — handles tool calls until final text response
  const toolCallResults = [];
  let currentMessages = [...messages];

  for (let iteration = 0; iteration < 10; iteration++) {
    response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: VIVIENNE_SYSTEM_PROMPT,
      tools: VIVIENNE_TOOLS,
      messages: currentMessages,
    });

    // Check for tool use
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      // Final response — extract text
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    // Execute all tool calls
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeToolCall(toolUse.name, toolUse.input, {
        transcript,
        dashboardContext,
      });

      // Capture navigation actions for frontend
      if (toolUse.name === 'navigateDashboard' && result.navigationAction) {
        navigationActions.push(result);
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Add assistant message and tool results to conversation
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  if (!finalResponseText) {
    finalResponseText = 'I am processing your request, Precious. One moment.';
  }

  // Log the command to jarvis_commands
  const supabase = getServiceClient();
  await supabase.from('jarvis_commands').insert({
    raw_transcript: transcript,
    parsed_intent: `Vivienne response: ${finalResponseText.substring(0, 100)}`,
    routed_to: 'PC-001',
    response_summary: finalResponseText.substring(0, 500),
    navigation_action: navigationActions.length > 0
      ? JSON.stringify(navigationActions)
      : null,
  });

  // Synthesise Vivienne's response to audio
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  return {
    responseText: finalResponseText,
    navigationActions,
    audioBuffer,
    contentType,
  };
}

module.exports = {
  processVivienneRequest,
  VIVIENNE_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};