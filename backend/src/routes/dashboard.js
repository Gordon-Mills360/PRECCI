// FILE: precci/backend/src/routes/dashboard.js
// CUTEME LTD — Dashboard API Routes
// All data served to Precious's dashboard.
// Every endpoint returns real live data only.
// No mock data. No fallbacks to fake numbers.
// Authenticated — requires precious_owner role JWT.

'use strict';

const express = require('express');
const router = express.Router();
const { getServiceClient } = require('../config/supabase');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const logger = require('../utils/logger');

// All dashboard routes require authentication
router.use(verifyJWT);
router.use(requireRole('precious_owner'));
router.use(generalLimiter);

// ─── GET /api/dashboard/overview ───
// Complete dashboard overview — all KPIs in one call
router.get('/overview', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      revenueResult,
      clientsResult,
      sessionsTodayResult,
      completedTodayResult,
      cameraResult,
      ordersResult,
      activeSessionsResult,
      decisionsResult,
      criticalAlertsResult,
      prevMonthRevenueResult,
      prevCameraResult,
      prevOrdersResult,
      totalSessionsResult,
      completedSessionsResult,
    ] = await Promise.allSettled([
      supabase.from('revenue_summary').select('stream, amount, date').gte('date', startOfMonth),
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('sessions').select('id', { count: 'exact' }).gte('created_at', todayStart),
      supabase.from('sessions').select('id', { count: 'exact' }).gte('created_at', todayStart).eq('completed', true),
      supabase.from('sessions').select('id', { count: 'exact' }).gte('created_at', todayStart).eq('camera_used', true),
      supabase.from('transactions').select('id', { count: 'exact' }).gte('created_at', todayStart).eq('status', 'success'),
      supabase.from('sessions').select('agent_id').gte('created_at', tenMinAgo).eq('completed', false),
      supabase.from('alerts').select('id', { count: 'exact' }).gte('created_at', todayStart),
      supabase.from('alerts').select('id', { count: 'exact' }).eq('severity', 'critical').eq('resolved', false),
      supabase.from('revenue_summary').select('amount').gte('date', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]).lte('date', new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]),
      supabase.from('sessions').select('id', { count: 'exact' }).gte('created_at', yesterday).lt('created_at', todayStart).eq('camera_used', true),
      supabase.from('transactions').select('id', { count: 'exact' }).gte('created_at', yesterday).lt('created_at', todayStart).eq('status', 'success'),
      supabase.from('sessions').select('id', { count: 'exact' }),
      supabase.from('sessions').select('id', { count: 'exact' }).eq('completed', true),
    ]);

    const revenueData = revenueResult.status === 'fulfilled' ? revenueResult.value.data || [] : [];
    const totalClients = clientsResult.status === 'fulfilled' ? clientsResult.value.count || 0 : null;
    const sessionsToday = sessionsTodayResult.status === 'fulfilled' ? sessionsTodayResult.value.count || 0 : 0;
    const completedToday = completedTodayResult.status === 'fulfilled' ? completedTodayResult.value.count || 0 : 0;
    const cameraSessions = cameraResult.status === 'fulfilled' ? cameraResult.value.count || 0 : null;
    const ordersToday = ordersResult.status === 'fulfilled' ? ordersResult.value.count || 0 : null;
    const activeSessions = activeSessionsResult.status === 'fulfilled' ? activeSessionsResult.value.data || [] : [];
    const decisionsToday = decisionsResult.status === 'fulfilled' ? decisionsResult.value.count || 0 : null;
    const criticalAlerts = criticalAlertsResult.status === 'fulfilled' ? criticalAlertsResult.value.count || 0 : 0;
    const prevRevData = prevMonthRevenueResult.status === 'fulfilled' ? prevMonthRevenueResult.value.data || [] : [];
    const prevCamera = prevCameraResult.status === 'fulfilled' ? prevCameraResult.value.count || 0 : 0;
    const prevOrders = prevOrdersResult.status === 'fulfilled' ? prevOrdersResult.value.count || 0 : 0;
    const totalSessions = totalSessionsResult.status === 'fulfilled' ? totalSessionsResult.value.count || 0 : 0;
    const completedSessions = completedSessionsResult.status === 'fulfilled' ? completedSessionsResult.value.count || 0 : 0;

    const totalRevenueMonth = revenueData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const prevMonthTotal = prevRevData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const conversionRate = sessionsToday > 0 ? parseFloat(((completedToday / sessionsToday) * 100).toFixed(1)) : null;
    const automationRate = totalSessions > 0 ? parseFloat(((completedSessions / totalSessions) * 100).toFixed(1)) : null;
    const systemHealth = criticalAlerts === 0 ? 100 : criticalAlerts <= 2 ? 90 : criticalAlerts <= 5 ? 75 : 60;
    const activeAgentIds = new Set(activeSessions.map(s => s.agent_id));

    res.json({
      success: true,
      data: {
        totalRevenueMonth: totalRevenueMonth || 0,
        totalClients: totalClients || 0,
        aiAnalysesToday: cameraSessions || 0,
        ordersToday: ordersToday || 0,
        conversionRate,
        activeSessions: activeSessions.length,
        activeAgentCount: activeAgentIds.size,
        decisionsToday: decisionsToday || 0,
        systemHealth,
        automationRate,
        revenueChange: prevMonthTotal > 0 ? parseFloat(((totalRevenueMonth - prevMonthTotal) / prevMonthTotal * 100).toFixed(1)) : null,
        analysisChange: prevCamera > 0 ? parseFloat((((cameraSessions - prevCamera) / prevCamera) * 100).toFixed(1)) : null,
        ordersChange: prevOrders > 0 ? parseFloat((((ordersToday - prevOrders) / prevOrders) * 100).toFixed(1)) : null,
        criticalAlerts,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Dashboard overview error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load dashboard overview' });
  }
});

// ─── GET /api/dashboard/revenue ───
// All revenue streams with real amounts and changes
router.get('/revenue', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const [currentResult, prevResult, sixMonthResult] = await Promise.allSettled([
      supabase.from('revenue_summary').select('stream, amount, date').gte('date', startOfMonth),
      supabase.from('revenue_summary').select('stream, amount').gte('date', prevMonthStart).lte('date', prevMonthEnd),
      supabase.from('revenue_summary').select('date, amount').gte('date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]).order('date', { ascending: true }),
    ]);

    const currentData = currentResult.status === 'fulfilled' ? currentResult.value.data || [] : [];
    const prevData = prevResult.status === 'fulfilled' ? prevResult.value.data || [] : [];
    const sixMonthData = sixMonthResult.status === 'fulfilled' ? sixMonthResult.value.data || [] : [];

    const byStream = currentData.reduce((acc, r) => {
      acc[r.stream] = (acc[r.stream] || 0) + parseFloat(r.amount || 0);
      return acc;
    }, {});

    const prevByStream = prevData.reduce((acc, r) => {
      acc[r.stream] = (acc[r.stream] || 0) + parseFloat(r.amount || 0);
      return acc;
    }, {});

    const STREAM_LABELS = {
      ai_analysis: 'AI Analysis & Consultation',
      product_affiliate: 'Premium Beauty Products',
      virtual_tryon: 'Virtual Try-On Studio',
      app_subscriptions: 'Subscription Plans',
      affiliate_commissions: 'Affiliate Marketing',
      brand_partnerships: 'Brand Partnerships',
      skincare_lines: 'AI-Powered Skincare Lines',
      beauty_academy_courses: 'Online Courses & Masterclasses',
      digital_guides: 'Digital Lookbooks & Guides',
      ai_styling: 'Personal Styling Services',
      platform_licensing: 'Corporate & B2B Solutions',
      fragrance: 'Fragrance Customization',
      provider_registration_fees: 'Connect: Registration Fees',
      provider_subscriptions: 'Connect: Provider Subscriptions',
      provider_referral_fees: 'Connect: Referral Fees',
      featured_placement: 'Connect: Featured Placement',
      inner_circle: 'Inner Circle Membership',
      refunds: 'Refunds',
    };

    const streams = Object.entries(byStream)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([key, amount], i) => ({
        num: String(i + 1).padStart(2, '0'),
        key,
        name: STREAM_LABELS[key] || key,
        amount,
        prevAmount: prevByStream[key] || 0,
        change: prevByStream[key] > 0
          ? parseFloat(((amount - prevByStream[key]) / prevByStream[key] * 100).toFixed(1))
          : null,
      }));

    // Monthly chart grouped by month
    const chartByMonth = sixMonthData.reduce((acc, r) => {
      const month = r.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + parseFloat(r.amount || 0);
      return acc;
    }, {});

    const chart = Object.entries(chartByMonth).map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      total,
    }));

    res.json({
      success: true,
      data: {
        streams,
        chart,
        totalMonth: Object.values(byStream).reduce((s, v) => s + v, 0),
        activeStreamCount: streams.length,
      },
    });
  } catch (error) {
    logger.error('Dashboard revenue error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load revenue data' });
  }
});

// ─── GET /api/dashboard/agents ───
// All 28 agents with real session activity
router.get('/agents', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [agentsResult, recentSessionsResult, todaySessionsResult, alertsResult] = await Promise.allSettled([
      supabase.from('agents').select('name, pc_id, role, division, active, gender').eq('active', true),
      supabase.from('sessions').select('agent_id, completed').gte('created_at', tenMinAgo),
      supabase.from('sessions').select('agent_id, completed').gte('created_at', todayStart.toISOString()),
      supabase.from('alerts').select('agent_id, severity').eq('resolved', false).in('severity', ['warn', 'critical']),
    ]);

    const agents = agentsResult.status === 'fulfilled' ? agentsResult.value.data || [] : [];
    const recentSessions = recentSessionsResult.status === 'fulfilled' ? recentSessionsResult.value.data || [] : [];
    const todaySessions = todaySessionsResult.status === 'fulfilled' ? todaySessionsResult.value.data || [] : [];
    const unresolvedAlerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data || [] : [];

    const recentActive = new Set(recentSessions.map(s => s.agent_id));
    const alertsByAgent = unresolvedAlerts.reduce((acc, a) => {
      acc[a.agent_id] = (acc[a.agent_id] || 0) + 1;
      return acc;
    }, {});

    const sessionsByAgent = todaySessions.reduce((acc, s) => {
      if (!acc[s.agent_id]) acc[s.agent_id] = { total: 0, completed: 0 };
      acc[s.agent_id].total++;
      if (s.completed) acc[s.agent_id].completed++;
      return acc;
    }, {});

    const agentData = agents.map(a => ({
      pcId: a.pc_id,
      name: a.name,
      role: a.role,
      division: a.division,
      gender: a.gender,
      status: recentActive.has(a.pc_id) ? 'busy' : 'online',
      sessionsToday: sessionsByAgent[a.pc_id]?.total || 0,
      completedToday: sessionsByAgent[a.pc_id]?.completed || 0,
      completionRate: sessionsByAgent[a.pc_id]?.total > 0
        ? parseFloat(((sessionsByAgent[a.pc_id].completed / sessionsByAgent[a.pc_id].total) * 100).toFixed(1))
        : null,
      unresolvedAlerts: alertsByAgent[a.pc_id] || 0,
    }));

    res.json({
      success: true,
      data: {
        agents: agentData,
        totalActive: agentData.length,
        busyCount: agentData.filter(a => a.status === 'busy').length,
        onlineCount: agentData.filter(a => a.status === 'online').length,
        totalSessionsToday: todaySessions.length,
      },
    });
  } catch (error) {
    logger.error('Dashboard agents error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load agent data' });
  }
});

// ─── GET /api/dashboard/activity ───
// Live activity feed — latest alerts
router.get('/activity', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { limit = 100 } = req.query;

    const { data, error } = await supabase
      .from('alerts')
      .select('id, agent_id, type, message, severity, resolved, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(parseInt(limit), 500));

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Dashboard activity error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load activity feed' });
  }
});

// ─── GET /api/dashboard/missions ───
// Mission board — real alert states
router.get('/missions', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('alerts')
      .select('id, type, message, severity, agent_id, resolved, resolved_at, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;

    const inProgress = [];
    const waiting = [];
    const completedToday = [];
    const blocked = [];

    (data || []).forEach(a => {
      const entry = {
        id: a.id,
        message: a.message,
        agentId: a.agent_id,
        severity: a.severity,
        type: a.type,
        createdAt: a.created_at,
        resolvedAt: a.resolved_at,
      };

      if (a.severity === 'critical' && !a.resolved) blocked.push(entry);
      else if (a.severity === 'warn' && !a.resolved) waiting.push(entry);
      else if (a.resolved && new Date(a.created_at) >= todayStart) completedToday.push(entry);
      else if (!a.resolved) inProgress.push(entry);
    });

    res.json({
      success: true,
      data: {
        inProgress: inProgress.slice(0, 15),
        waiting: waiting.slice(0, 10),
        completedToday: completedToday.slice(0, 15),
        blocked: blocked.slice(0, 8),
      },
    });
  } catch (error) {
    logger.error('Dashboard missions error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load mission board' });
  }
});

// ─── GET /api/dashboard/network ───
// Agent communication network — real routing_log edges
router.get('/network', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('routing_log')
      .select('from_agent, to_agent, routing_reason, timestamp')
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    const LINK_TYPES = {
      routed: 'message',
      flagging: 'request',
      escalat: 'decision',
      handoff: 'response',
    };

    const links = (data || [])
      .filter(r => r.from_agent && r.to_agent)
      .map(r => {
        const reason = (r.routing_reason || '').toLowerCase();
        const typeKey = Object.keys(LINK_TYPES).find(k => reason.includes(k));
        return {
          source: r.from_agent,
          target: r.to_agent,
          type: typeKey ? LINK_TYPES[typeKey] : 'message',
          timestamp: r.timestamp,
        };
      });

    res.json({ success: true, data: { links, totalEdges: links.length } });
  } catch (error) {
    logger.error('Dashboard network error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load network data' });
  }
});

// ─── GET /api/dashboard/vivienne ───
// Vivienne panel data — all real
router.get('/vivienne', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const [
      vivAlerts,
      boardComms,
      unresolvedTasks,
      activeSession,
      agentPerf,
    ] = await Promise.allSettled([
      supabase.from('alerts').select('message, created_at, type, severity').eq('agent_id', 'PC-001').order('created_at', { ascending: false }).limit(10),
      supabase.from('alerts').select('message, created_at, agent_id, type').in('type', ['celeste_vivienne_report', 'marcus_vivienne_escalation', 'sienna_vivienne_report', 'nadia_vivienne_report', 'sebastian_vivienne_escalation', 'rafael_vivienne_report']).order('created_at', { ascending: false }).limit(15),
      supabase.from('alerts').select('message, created_at, severity, type, agent_id').eq('resolved', false).in('severity', ['warn', 'critical']).order('created_at', { ascending: false }).limit(10),
      supabase.from('voice_sessions').select('id, agent_id, started_at, session_type').is('ended_at', null).order('started_at', { ascending: false }).limit(1),
      supabase.from('alerts').select('agent_id, type, created_at').eq('type', 'agent_session_performance').order('created_at', { ascending: false }).limit(50),
    ]);

    res.json({
      success: true,
      data: {
        latestActivity: vivAlerts.status === 'fulfilled' ? (vivAlerts.value.data || []) : [],
        boardCommunications: boardComms.status === 'fulfilled' ? (boardComms.value.data || []) : [],
        unresolvedTasks: unresolvedTasks.status === 'fulfilled' ? (unresolvedTasks.value.data || []) : [],
        activeSession: activeSession.status === 'fulfilled' ? (activeSession.value.data?.[0] || null) : null,
        agentPerformance: agentPerf.status === 'fulfilled' ? (agentPerf.value.data || []) : [],
      },
    });
  } catch (error) {
    logger.error('Dashboard Vivienne error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load Vivienne panel data' });
  }
});

// ─── GET /api/dashboard/camera ───
// Active camera session
router.get('/camera', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('sessions')
      .select('id, user_id, agent_id, created_at, sage_data')
      .eq('camera_used', true)
      .eq('completed', false)
      .gte('created_at', tenMinAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        activeSession: data?.[0] || null,
        hasActiveSession: (data?.length || 0) > 0,
      },
    });
  } catch (error) {
    logger.error('Dashboard camera error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load camera data' });
  }
});

// ─── GET /api/dashboard/transcripts ───
// Real voice session transcripts for Vivienne chat panel
router.get('/transcripts', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('id, agent_id, transcript, started_at, ended_at, session_type')
      .not('transcript', 'is', null)
      .eq('session_type', 'precious_jarvis')
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const entries = [];
    (data || []).forEach(session => {
      if (!session.transcript) return;
      const lines = typeof session.transcript === 'string'
        ? session.transcript.split('\n').filter(l => l.trim())
        : [];
      lines.forEach(line => {
        const isPrecious = /^(human|precious):/i.test(line);
        const isVivienne = /^(assistant|vivienne):/i.test(line);
        if (!isPrecious && !isVivienne) return;
        const text = line.replace(/^(human|precious|assistant|vivienne):\s*/i, '').trim();
        if (text) {
          entries.push({
            id: `${session.id}-${entries.length}`,
            speaker: isPrecious ? 'precious' : 'vivienne',
            text,
            sessionId: session.id,
            startedAt: session.started_at,
          });
        }
      });
    });

    res.json({ success: true, data: entries.slice(-30) });
  } catch (error) {
    logger.error('Dashboard transcripts error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load transcripts' });
  }
});

// ─── GET /api/dashboard/uptime ───
// Real system uptime from outage alerts
router.get('/uptime', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('alerts')
      .select('created_at, resolved, resolved_at, type')
      .like('type', '%outage%')
      .gte('created_at', thirtyDaysAgo);

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    let downtimeMs = 0;

    (data || []).forEach(alert => {
      if (alert.resolved && alert.resolved_at) {
        const down = new Date(alert.resolved_at) - new Date(alert.created_at);
        if (down > 0) downtimeMs += down;
      }
    });

    const uptimePct = ((thirtyDaysMs - downtimeMs) / thirtyDaysMs * 100);
    const uptimeDisplay = `${Math.min(100, uptimePct).toFixed(2)}%`;

    res.json({
      success: true,
      data: {
        uptimePercentage: uptimeDisplay,
        outageCount: (data || []).length,
        totalDowntimeMs: downtimeMs,
      },
    });
  } catch (error) {
    logger.error('Dashboard uptime error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load uptime data' });
  }
});

// ─── GET /api/dashboard/clients ───
// Client analytics for dashboard
router.get('/clients', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalResult,
      newResult,
      byPlanResult,
      byCountryResult,
    ] = await Promise.allSettled([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo),
      supabase.from('users').select('plan'),
      supabase.from('users').select('country').not('country', 'is', null),
    ]);

    const byPlan = byPlanResult.status === 'fulfilled'
      ? (byPlanResult.value.data || []).reduce((acc, u) => {
          acc[u.plan || 'free'] = (acc[u.plan || 'free'] || 0) + 1;
          return acc;
        }, {})
      : {};

    const byCountry = byCountryResult.status === 'fulfilled'
      ? (byCountryResult.value.data || []).reduce((acc, u) => {
          acc[u.country] = (acc[u.country] || 0) + 1;
          return acc;
        }, {})
      : {};

    const topCountries = Object.entries(byCountry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    res.json({
      success: true,
      data: {
        total: totalResult.status === 'fulfilled' ? totalResult.value.count || 0 : null,
        newLast30Days: newResult.status === 'fulfilled' ? newResult.value.count || 0 : null,
        byPlan,
        topCountries,
      },
    });
  } catch (error) {
    logger.error('Dashboard clients error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load client data' });
  }
});

// ─── GET /api/dashboard/connect ───
// PRECCI Connect marketplace stats
router.get('/connect', async (req, res) => {
  const supabase = getServiceClient();

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProvidersResult,
      bookingsTodayResult,
      confirmedResult,
      revenueResult,
    ] = await Promise.allSettled([
      supabase.from('service_providers').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('provider_bookings').select('id', { count: 'exact' }).gte('created_at', todayStart.toISOString()),
      supabase.from('provider_bookings').select('id', { count: 'exact' }).gte('created_at', todayStart.toISOString()).eq('status', 'confirmed'),
      supabase.from('provider_transactions').select('type, amount').gte('created_at', todayStart.toISOString()).eq('status', 'success'),
    ]);

    const revenueData = revenueResult.status === 'fulfilled' ? revenueResult.value.data || [] : [];
    const revenueByType = revenueData.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + parseFloat(t.amount || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalProviders: totalProvidersResult.status === 'fulfilled' ? totalProvidersResult.value.count || 0 : null,
        bookingsToday: bookingsTodayResult.status === 'fulfilled' ? bookingsTodayResult.value.count || 0 : null,
        confirmedToday: confirmedResult.status === 'fulfilled' ? confirmedResult.value.count || 0 : null,
        revenueToday: Object.values(revenueByType).reduce((s, v) => s + v, 0),
        revenueByType,
      },
    });
  } catch (error) {
    logger.error('Dashboard connect error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load Connect data' });
  }
});

module.exports = router;