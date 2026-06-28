// FILE: precci/backend/src/services/subscriptionTier.service.js
// Subscription tier enforcement for all 28 agents.
// Agents receive tier context and reason about it naturally —
// they do not follow hardcoded gating rules.
// Claude decides how to communicate limits warmly and intelligently.
// Celeste tracks all tier-related revenue.

'use strict';

const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// TIER CAPABILITIES
// This is not a decision tree.
// This is factual context that agents receive
// so Claude can reason about what is available
// to this specific client right now.
// ─────────────────────────────────────────────
const TIER_CAPABILITIES = {
  free: {
    planName: 'Free',
    cameraAnalysisPerMonth: 3,
    virtualTryOnsPerMonth: 0,
    virtualTryOnIncluded: false,
    specialistAgents: ['PC-026', 'PC-021'], // Grace and Lena only
    fullSpecialistAccess: false,
    productRecommendationsPerSession: 3,
    memoryDepth: 1, // Only last 1 session recalled
    priorityResponse: false,
    beautyAcademyAccess: false,
    beautyAcademyLevel: 'none',
    innerCircleAccess: false,
    progressReports: false,
    vivienneStrategySessions: false,
    connectBookings: true,
    connectPriority: 'standard',
    upgradeMessage: 'Upgrade to PRECCI Glow for unlimited camera analysis and access to all specialist agents.',
  },
  glow: {
    planName: 'Glow',
    cameraAnalysisPerMonth: null, // unlimited
    virtualTryOnsPerMonth: 20,
    virtualTryOnIncluded: true,
    specialistAgents: 'all',
    fullSpecialistAccess: true,
    productRecommendationsPerSession: 6,
    memoryDepth: 5, // Last 5 sessions recalled
    priorityResponse: false,
    beautyAcademyAccess: true,
    beautyAcademyLevel: 'basic',
    innerCircleAccess: true,
    progressReports: false,
    vivienneStrategySessions: false,
    connectBookings: true,
    connectPriority: 'standard',
    upgradeMessage: 'Upgrade to PRECCI Pro for unlimited try-ons and monthly progress reports.',
  },
  pro: {
    planName: 'Pro',
    cameraAnalysisPerMonth: null,
    virtualTryOnsPerMonth: null, // unlimited
    virtualTryOnIncluded: true,
    specialistAgents: 'all',
    fullSpecialistAccess: true,
    productRecommendationsPerSession: null, // unlimited
    memoryDepth: 20, // Last 20 sessions recalled
    priorityResponse: true,
    beautyAcademyAccess: true,
    beautyAcademyLevel: 'full',
    innerCircleAccess: true,
    progressReports: true,
    progressReportFrequency: 'monthly',
    vivienneStrategySessions: false,
    connectBookings: true,
    connectPriority: 'priority',
    upgradeMessage: 'Upgrade to PRECCI Elite for weekly Vivienne strategy sessions and VIP provider access.',
  },
  elite: {
    planName: 'Elite',
    cameraAnalysisPerMonth: null,
    virtualTryOnsPerMonth: null,
    virtualTryOnIncluded: true,
    specialistAgents: 'all',
    fullSpecialistAccess: true,
    productRecommendationsPerSession: null,
    memoryDepth: null, // Full history
    priorityResponse: true,
    beautyAcademyAccess: true,
    beautyAcademyLevel: 'full',
    innerCircleAccess: true,
    innerCircleLevel: 'vip',
    progressReports: true,
    progressReportFrequency: 'weekly',
    vivienneStrategySessions: true,
    vivienneSessionFrequency: 'weekly',
    exclusiveBrandDiscounts: true,
    earlyAccessFeatures: true,
    connectBookings: true,
    connectPriority: 'vip',
    upgradeMessage: null, // Already on highest tier
  },
};

// ─────────────────────────────────────────────
// GET CLIENT TIER CONTEXT
// Returns everything an agent needs to know about
// what this client can access right now.
// Claude receives this and reasons about how to
// handle any limitations naturally in conversation.
// ─────────────────────────────────────────────
async function getClientTierContext(userId) {
  const supabase = getServiceClient();

  try {
    // Get current plan and usage
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan, plan_status, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('TierService: Failed to get user plan', { userId, error: userError?.message });
      return buildTierContext('free', userId, null);
    }

    const plan = user.plan || 'free';
    const planStatus = user.plan_status || 'active';

    // If plan is not active treat as free
    if (planStatus !== 'active' && planStatus !== 'trialing') {
      return buildTierContext('free', userId, user);
    }

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageData } = await supabase
      .from('sessions')
      .select('id, camera_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    const cameraSessionsThisMonth = (usageData || []).filter(s => s.camera_used).length;

    const { data: tryOnData } = await supabase
      .from('try_on_history')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    const tryOnsThisMonth = (tryOnData || []).length;

    return buildTierContext(plan, userId, user, {
      cameraSessionsThisMonth,
      tryOnsThisMonth,
    });
  } catch (error) {
    logger.error('TierService: Unexpected error', { userId, error: error.message });
    return buildTierContext('free', userId, null);
  }
}

// ─────────────────────────────────────────────
// BUILD TIER CONTEXT OBJECT
// The object Claude receives to reason from.
// Not a list of rules — a description of reality
// that Claude uses to inform its reasoning.
// ─────────────────────────────────────────────
function buildTierContext(plan, userId, user, usage = {}) {
  const capabilities = TIER_CAPABILITIES[plan] || TIER_CAPABILITIES.free;
  const caps = { ...capabilities };

  const {
    cameraSessionsThisMonth = 0,
    tryOnsThisMonth = 0,
  } = usage;

  // Calculate remaining allowances
  const cameraRemaining = caps.cameraAnalysisPerMonth !== null
    ? Math.max(0, caps.cameraAnalysisPerMonth - cameraSessionsThisMonth)
    : null; // null means unlimited

  const tryOnRemaining = caps.virtualTryOnsPerMonth !== null
    ? Math.max(0, caps.virtualTryOnsPerMonth - tryOnsThisMonth)
    : null; // null means unlimited

  const cameraAvailable = cameraRemaining === null || cameraRemaining > 0;
  const tryOnAvailable = caps.virtualTryOnIncluded && (tryOnRemaining === null || tryOnRemaining > 0);

  // Build the context Claude reasons from
  return {
    plan,
    planName: caps.planName,
    planStatus: user?.plan_status || 'active',
    userId,

    // What is available right now
    cameraAvailable,
    cameraRemaining,
    cameraSessionsThisMonth,

    tryOnAvailable,
    tryOnRemaining,
    tryOnsThisMonth,

    fullSpecialistAccess: caps.fullSpecialistAccess,
    allowedAgents: caps.specialistAgents,
    productLimit: caps.productRecommendationsPerSession,
    memoryDepth: caps.memoryDepth,
    priorityResponse: caps.priorityResponse,
    beautyAcademyLevel: caps.beautyAcademyLevel,
    innerCircleAccess: caps.innerCircleAccess,
    progressReports: caps.progressReports,
    vivienneStrategySessions: caps.vivienneStrategySessions,
    connectPriority: caps.connectPriority,
    exclusiveBrandDiscounts: caps.exclusiveBrandDiscounts || false,
    earlyAccessFeatures: caps.earlyAccessFeatures || false,

    // What Claude can tell the client
    upgradeMessage: caps.upgradeMessage,

    // Summary for agent system prompt injection
    // Claude reads this and reasons naturally from it
    contextSummary: buildContextSummary(plan, caps, cameraAvailable, tryOnAvailable, cameraRemaining, tryOnRemaining),
  };
}

// ─────────────────────────────────────────────
// BUILD NATURAL LANGUAGE CONTEXT SUMMARY
// This is injected into agent conversations.
// Claude reads it and reasons from it naturally —
// not as a rule set, but as factual context
// about this client's current situation.
// ─────────────────────────────────────────────
function buildContextSummary(plan, caps, cameraAvailable, tryOnAvailable, cameraRemaining, tryOnRemaining) {
  const parts = [];

  parts.push(`This client is on the ${caps.planName} plan.`);

  if (plan === 'free') {
    parts.push('They have access to Grace for routing and Lena for support. To access specialist agents like Luna, Zara, Mia, Isla, Drew and others, they need to upgrade to at least Glow.');

    if (!cameraAvailable) {
      parts.push('They have used all 3 of their free camera analysis sessions this month. Camera analysis is not available until next month or until they upgrade.');
    } else {
      parts.push(`They have ${cameraRemaining} of their 3 free camera analysis sessions remaining this month.`);
    }

    parts.push('Virtual try-on is not included in the Free plan.');
    parts.push(`Product recommendations are limited to ${caps.productRecommendationsPerSession} per session on their current plan.`);
  }

  if (plan === 'glow') {
    parts.push('They have access to all specialist agents and unlimited camera analysis.');

    if (!tryOnAvailable) {
      parts.push('They have used all 20 of their Glow virtual try-ons this month. Try-on will be available again next month or they can upgrade to Pro for unlimited try-ons.');
    } else {
      parts.push(tryOnRemaining !== null
        ? `They have ${tryOnRemaining} virtual try-ons remaining this month.`
        : 'Virtual try-on is available.');
    }

    parts.push(`Product recommendations limited to ${caps.productRecommendationsPerSession} per session.`);
  }

  if (plan === 'pro') {
    parts.push('They have full access to all features: unlimited camera analysis, unlimited virtual try-ons, all specialist agents, monthly progress reports, priority response and full Beauty Academy.');
  }

  if (plan === 'elite') {
    parts.push('They are an Elite member — the highest tier. They have access to everything: unlimited all features, weekly Vivienne strategy sessions, exclusive brand discounts, early access to new features, VIP Inner Circle membership and VIP Connect booking with best-rated providers prioritised.');
  }

  return parts.join(' ');
}

// ─────────────────────────────────────────────
// CHECK CAMERA ACCESS
// Returns whether camera is available for this client now
// and the context Claude needs to reason about it
// ─────────────────────────────────────────────
async function checkCameraAccess(userId) {
  const tierContext = await getClientTierContext(userId);
  return {
    available: tierContext.cameraAvailable,
    remaining: tierContext.cameraRemaining,
    plan: tierContext.plan,
    upgradeMessage: tierContext.upgradeMessage,
    contextSummary: tierContext.contextSummary,
  };
}

// ─────────────────────────────────────────────
// CHECK TRYON ACCESS
// Returns whether Belle try-on is available
// ─────────────────────────────────────────────
async function checkTryOnAccess(userId) {
  const tierContext = await getClientTierContext(userId);
  return {
    available: tierContext.tryOnAvailable,
    remaining: tierContext.tryOnRemaining,
    plan: tierContext.plan,
    upgradeMessage: tierContext.upgradeMessage,
    contextSummary: tierContext.contextSummary,
  };
}

// ─────────────────────────────────────────────
// CHECK AGENT ACCESS
// Returns whether this client can access a specific agent
// ─────────────────────────────────────────────
async function checkAgentAccess(userId, agentPcId) {
  const tierContext = await getClientTierContext(userId);

  if (tierContext.allowedAgents === 'all') {
    return { allowed: true, tierContext };
  }

  const allowed = Array.isArray(tierContext.allowedAgents)
    ? tierContext.allowedAgents.includes(agentPcId)
    : false;

  return {
    allowed,
    tierContext,
    reason: allowed
      ? null
      : `This agent requires a paid subscription. ${tierContext.upgradeMessage}`,
  };
}

// ─────────────────────────────────────────────
// RECORD CAMERA SESSION USAGE
// Called after every successful camera analysis
// ─────────────────────────────────────────────
async function recordCameraUsage(userId, sessionId) {
  const supabase = getServiceClient();

  await supabase
    .from('sessions')
    .update({ camera_used: true })
    .eq('id', sessionId)
    .eq('user_id', userId);
}

// ─────────────────────────────────────────────
// TRIGGER UPGRADE FLOW
// Called when Claude determines upgrade is needed
// Vivienne's voice invites the client to upgrade
// This is handled as a voice conversation — not a popup
// ─────────────────────────────────────────────
async function triggerUpgradeFlow(userId, fromPlan, featureAttempted) {
  const supabase = getServiceClient();

  // Log the upgrade opportunity for Vivienne and Rafael
  await supabase.from('alerts').insert({
    type: 'upgrade_opportunity',
    message: `Client on ${fromPlan} plan attempted to access ${featureAttempted} — upgrade conversation triggered`,
    severity: 'info',
    agent_id: 'PC-001', // Vivienne handles upgrade voice flow
    metadata: {
      user_id: userId,
      from_plan: fromPlan,
      feature_attempted: featureAttempted,
      timestamp: new Date().toISOString(),
    },
  });

  // Return upgrade context for the agent to use in voice response
  const UPGRADE_PATHS = {
    free: {
      targetPlan: 'glow',
      price: '$9.99/month',
      keyBenefits: [
        'unlimited camera analysis',
        'access to all specialist agents',
        '20 virtual try-ons per month',
        'Beauty Academy access',
        'Inner Circle membership',
      ],
    },
    glow: {
      targetPlan: 'pro',
      price: '$19.99/month',
      keyBenefits: [
        'unlimited virtual try-ons',
        'priority agent response',
        'monthly skin and appearance progress reports',
        'full Beauty Academy access',
        'priority Connect bookings',
      ],
    },
    pro: {
      targetPlan: 'elite',
      price: '$29.99/month',
      keyBenefits: [
        'weekly Vivienne strategy sessions',
        'exclusive brand partner discounts',
        'early access to new features',
        'VIP Inner Circle membership',
        'VIP Connect booking with best-rated providers',
      ],
    },
  };

  const upgradePath = UPGRADE_PATHS[fromPlan];

  return {
    upgradeTriggered: true,
    fromPlan,
    ...upgradePath,
    voiceScript: upgradePath
      ? `To access ${featureAttempted}, you would need to upgrade to PRECCI ${upgradePath.targetPlan.charAt(0).toUpperCase() + upgradePath.targetPlan.slice(1)} at ${upgradePath.price}. That gives you ${upgradePath.keyBenefits.slice(0, 2).join(' and ')} — among other benefits. Would you like to upgrade now?`
      : null,
  };
}

// ─────────────────────────────────────────────
// GET MEMORY DEPTH FOR AGENT
// How many past sessions the agent can recall
// depends on subscription tier
// ─────────────────────────────────────────────
function getMemoryDepthForUser(plan) {
  const depths = { free: 1, glow: 5, pro: 20, elite: 1000 };
  return depths[plan] || 1;
}

module.exports = {
  getClientTierContext,
  checkCameraAccess,
  checkTryOnAccess,
  checkAgentAccess,
  recordCameraUsage,
  triggerUpgradeFlow,
  getMemoryDepthForUser,
  TIER_CAPABILITIES,
};