// FILE: precci/backend/src/routes/dashboard.js
// Precious's dashboard data routes.
// SECURITY: precious_owner role required on ALL routes.
// Returns real data — no mock, no placeholder.

'use strict';

const express = require('express');
const { getServiceClient } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { asyncHandler, PrecciError } = require('../middleware/errorHandler');

const router = express.Router();

// All dashboard routes require precious_owner role
router.use(verifyToken, requireRole(['precious_owner']));

// ─────────────────────────────────────────────
// GET /api/dashboard/overview
// Complete dashboard summary for Vivienne's real-time narration
// ─────────────────────────────────────────────
router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      { data: userCount },
      { data: todayRevenue },
      { data: weekSessions },
      { data: agentStatuses },
      { data: connectBookings },
      { data: recentAlerts },
    ] = await Promise.all([
      supabase.from('users').select('id, plan, created_at', { count: 'exact' }),
      supabase.from('revenue_summary').select('stream, amount').eq('date', today),
      supabase.from('sessions').select('id', { count: 'exact' }).gte('created_at', weekAgo),
      supabase.from('agents').select('name, pc_id, division, active'),
      supabase
        .from('provider_bookings')
        .select('id, status, referral_fee_amount, created_at')
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('alerts')
        .select('type, message, severity, created_at')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const totalTodayRevenue = (todayRevenue || []).reduce(
      (sum, r) => sum + parseFloat(r.amount || 0),
      0
    );

    res.json({
      success: true,
      overview: {
        users: {
          total: userCount?.length || 0,
          byPlan: {
            free: userCount?.filter(u => u.plan === 'free').length || 0,
            glow: userCount?.filter(u => u.plan === 'glow').length || 0,
            pro: userCount?.filter(u => u.plan === 'pro').length || 0,
            elite: userCount?.filter(u => u.plan === 'elite').length || 0,
          },
        },
        revenue: {
          today: totalTodayRevenue,
          byStream: todayRevenue || [],
        },
        sessions: {
          thisWeek: weekSessions?.length || 0,
        },
        agents: {
          total: agentStatuses?.length || 0,
          active: agentStatuses?.filter(a => a.active).length || 0,
        },
        connect: {
          bookingsThisWeek: connectBookings?.length || 0,
          referralFeesThisWeek: (connectBookings || []).reduce(
            (sum, b) => sum + parseFloat(b.referral_fee_amount || 0),
            0
          ),
        },
        alerts: recentAlerts || [],
      },
    });
  })
);

// ─────────────────────────────────────────────
// GET /api/dashboard/revenue
// All 16 revenue streams with totals
// ─────────────────────────────────────────────
router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();
    const { period = 'week' } = req.query;

    const daysMap = { today: 1, week: 7, month: 30, all_time: 3650 };
    const days = daysMap[period] || 7;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('revenue_summary')
      .select('date, stream, amount, currency, transaction_count')
      .gte('date', fromDate)
      .order('date', { ascending: false });

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve revenue data', 500);
    }

    // Group by stream
    const byStream = {};
    for (const row of data || []) {
      if (!byStream[row.stream]) {
        byStream[row.stream] = { total: 0, transactions: 0, history: [] };
      }
      byStream[row.stream].total += parseFloat(row.amount || 0);
      byStream[row.stream].transactions += row.transaction_count || 0;
      byStream[row.stream].history.push(row);
    }

    const grandTotal = Object.values(byStream).reduce(
      (sum, s) => sum + s.total,
      0
    );

    res.json({
      success: true,
      period,
      grandTotal,
      byStream,
      raw: data || [],
    });
  })
);

// ─────────────────────────────────────────────
// GET /api/dashboard/users
// User growth and demographics
// ─────────────────────────────────────────────
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, plan, country, created_at, onboarding_complete');

    if (error) {
      throw new PrecciError('DATABASE_ERROR', 'Failed to retrieve user data', 500);
    }

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const newThisWeek = (users || []).filter(
      u => new Date(u.created_at) >= weekAgo
    ).length;

    const newThisMonth = (users || []).filter(
      u => new Date(u.created_at) >= monthAgo
    ).length;

    // Country breakdown
    const byCountry = {};
    for (const u of users || []) {
      if (u.country) {
        byCountry[u.country] = (byCountry[u.country] || 0) + 1;
      }
    }

    res.json({
      success: true,
      users: {
        total: users?.length || 0,
        newThisWeek,
        newThisMonth,
        byPlan: {
          free: users?.filter(u => u.plan === 'free').length || 0,
          glow: users?.filter(u => u.plan === 'glow').length || 0,
          pro: users?.filter(u => u.plan === 'pro').length || 0,
          elite: users?.filter(u => u.plan === 'elite').length || 0,
        },
        byCountry,
        onboardingComplete: users?.filter(u => u.onboarding_complete).length || 0,
      },
    });
  })
);

// ─────────────────────────────────────────────
// GET /api/dashboard/connect
// PRECCI Connect overview for Precious
// ─────────────────────────────────────────────
router.get(
  '/connect',
  asyncHandler(async (req, res) => {
    const supabase = getServiceClient();

    const [
      { data: providers },
      { data: bookings },
      { data: providerRevenue },
    ] = await Promise.all([
      supabase
        .from('service_providers')
        .select('id, subscription_tier, featured, country, services, rating, total_bookings, active'),
      supabase
        .from('provider_bookings')
        .select('id, status, referral_fee_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('provider_revenue_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(30),
    ]);

    const totalReferralFees = (bookings || []).reduce(
      (sum, b) => sum + parseFloat(b.referral_fee_amount || 0),
      0
    );

    res.json({
      success: true,
      connect: {
        providers: {
          total: providers?.length || 0,
          active: providers?.filter(p => p.active).length || 0,
          featured: providers?.filter(p => p.featured).length || 0,
          basic: providers?.filter(p => p.subscription_tier === 'basic').length || 0,
          pro: providers?.filter(p => p.subscription_tier === 'pro').length || 0,
        },
        bookings: {
          total: bookings?.length || 0,
          confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
          completed: bookings?.filter(b => b.status === 'completed').length || 0,
          totalReferralFees,
        },
        revenueHistory: providerRevenue || [],
      },
    });
  })
);

module.exports = router;