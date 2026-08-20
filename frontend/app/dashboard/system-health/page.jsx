// FILE: precci/frontend/app/dashboard/system-health/page.jsx
// CUTEME LTD — System Intelligence Page
// Real infrastructure health from Marcus monitoring alerts.
// API health, database stats, agent uptime, error rates.
// All real from Supabase. Nothing simulated.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  roseGold: '#C4A494', warmGold: '#D4A853', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', bgCard: '#221218', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a',
  online: '#22c55e', busy: '#f97316', error: '#ef4444',
  warning: '#eab308', white: '#FFFFFF',
};

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtNum(v) { return v !== null && v !== undefined ? new Intl.NumberFormat('en-US').format(v) : '—'; }

function useSystemHealth() {
  const [health, setHealth] = useState({
    overallScore: null,
    criticalAlerts: 0,
    warnAlerts: 0,
    totalAlerts: 0,
    resolvedToday: 0,
    outageCount: 0,
    uptimePct: null,
    agentSessions: {},
    databaseStats: {},
    recentErrors: [],
    marcusReports: [],
    serviceStatus: {},
  });

  const load = useCallback(async () => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      alertResult, outageResult, sessionResult,
      userCountResult, agentMemResult,
      tryOnResult, bookingResult,
      marcusResult, errorResult,
    ] = await Promise.allSettled([
      supabase.from('alerts').select('id, severity, resolved, type, created_at').gte('created_at', thirtyDaysAgo),
      supabase.from('alerts').select('created_at, resolved, resolved_at').like('type', '%outage%').gte('created_at', thirtyDaysAgo),
      supabase.from('sessions').select('agent_id, completed, camera_used, created_at').gte('created_at', todayStart.toISOString()),
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('agent_memory').select('id', { count: 'exact' }),
      supabase.from('try_on_history').select('id', { count: 'exact' }),
      supabase.from('provider_bookings').select('id', { count: 'exact' }),
      supabase.from('alerts').select('message, created_at, type').like('type', '%marcus%').order('created_at', { ascending: false }).limit(10),
      supabase.from('alerts').select('message, created_at, agent_id, severity').in('severity', ['critical', 'warn']).eq('resolved', false).order('created_at', { ascending: false }).limit(20),
    ]);

    const alerts = alertResult.status === 'fulfilled' ? alertResult.value.data || [] : [];
    const outages = outageResult.status === 'fulfilled' ? outageResult.value.data || [] : [];
    const sessions = sessionResult.status === 'fulfilled' ? sessionResult.value.data || [] : [];

    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const warnAlerts = alerts.filter(a => a.severity === 'warn' && !a.resolved).length;
    const resolvedToday = alerts.filter(a => a.resolved && new Date(a.created_at) >= todayStart).length;

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    let downtimeMs = 0;
    outages.forEach(o => {
      if (o.resolved && o.resolved_at) {
        const down = new Date(o.resolved_at) - new Date(o.created_at);
        if (down > 0) downtimeMs += down;
      }
    });
    const uptimePct = Math.min(100, ((thirtyDaysMs - downtimeMs) / thirtyDaysMs * 100));

    const overallScore = criticalAlerts === 0 ? 100
      : criticalAlerts <= 1 ? 95
      : criticalAlerts <= 3 ? 85
      : criticalAlerts <= 5 ? 75 : 60;

    // Agent session stats
    const agentSessions = sessions.reduce((acc, s) => {
      acc[s.agent_id] = (acc[s.agent_id] || 0) + 1;
      return acc;
    }, {});

    // Database stats
    const databaseStats = {
      totalUsers: userCountResult.status === 'fulfilled' ? userCountResult.value.count || 0 : null,
      memoryVectors: agentMemResult.status === 'fulfilled' ? agentMemResult.value.count || 0 : null,
      tryOnSimulations: tryOnResult.status === 'fulfilled' ? tryOnResult.value.count || 0 : null,
      totalBookings: bookingResult.status === 'fulfilled' ? bookingResult.value.count || 0 : null,
    };

    // Service status derived from alert types
    const recentAlertTypes = new Set(alerts.filter(a => !a.resolved && new Date(a.created_at) > new Date(Date.now() - 60 * 60 * 1000)).map(a => a.type));
    const serviceStatus = {
      'Vapi Voice Layer': recentAlertTypes.has('vapi_error') ? 'degraded' : 'operational',
      'Claude API': recentAlertTypes.has('claude_api_error') ? 'degraded' : 'operational',
      'Supabase Database': recentAlertTypes.has('database_error') ? 'degraded' : 'operational',
      'Replicate (Belle)': recentAlertTypes.has('replicate_error') ? 'degraded' : 'operational',
      'ElevenLabs': recentAlertTypes.has('elevenlabs_error') ? 'degraded' : 'operational',
      'Paystack': recentAlertTypes.has('paystack_error') ? 'degraded' : 'operational',
      'Stripe': recentAlertTypes.has('stripe_error') ? 'degraded' : 'operational',
      'OpenWeatherMap': recentAlertTypes.has('weather_error') ? 'degraded' : 'operational',
    };

    setHealth({
      overallScore,
      criticalAlerts,
      warnAlerts,
      totalAlerts: alerts.length,
      resolvedToday,
      outageCount: outages.length,
      uptimePct: uptimePct.toFixed(2),
      agentSessions,
      databaseStats,
      recentErrors: errorResult.status === 'fulfilled' ? errorResult.value.data || [] : [],
      marcusReports: marcusResult.status === 'fulfilled' ? marcusResult.value.data || [] : [],
      serviceStatus,
    });
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    const ch = supabase.channel('health-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, load)
      .subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, [load]);

  return health;
}

export default function SystemHealthPage() {
  const health = useSystemHealth();

  const scoreColour = health.overallScore >= 95 ? C.online
    : health.overallScore >= 80 ? C.warning
    : health.overallScore !== null ? C.error : C.textMuted;

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>System Intelligence</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>Real infrastructure health. All data from Marcus monitoring and live database queries.</div>
      </div>

      {/* Health Score + Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14 }}>
        {/* Score */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <svg width="100" height="100" style={{ position: 'absolute', animation: 'spin-slow 8s linear infinite' }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke={`${scoreColour}22`} strokeWidth="3" />
              {health.overallScore !== null && (
                <circle cx="50" cy="50" r="44" fill="none" stroke={scoreColour} strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 44 * health.overallScore / 100} ${2 * Math.PI * 44}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                />
              )}
            </svg>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: scoreColour, lineHeight: 1 }}>
                {health.overallScore !== null ? `${health.overallScore}%` : '—'}
              </div>
              <div style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.06em', color: scoreColour }}>
                {health.overallScore >= 95 ? 'OPTIMAL' : health.overallScore >= 80 ? 'MONITOR' : 'ATTENTION'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.white, textAlign: 'center' }}>System Health Score</div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: 'center' }}>Based on live alert state</div>
        </div>

        {/* Key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Critical Alerts', value: health.criticalAlerts, colour: health.criticalAlerts > 0 ? C.error : C.online, suffix: 'open' },
            { label: 'Warnings', value: health.warnAlerts, colour: health.warnAlerts > 5 ? C.warning : C.online, suffix: 'open' },
            { label: 'Resolved Today', value: health.resolvedToday, colour: C.online },
            { label: 'System Uptime', value: health.uptimePct !== null ? `${health.uptimePct}%` : '—', colour: C.online, suffix: '30d' },
            { label: 'Outages (30d)', value: health.outageCount, colour: health.outageCount > 0 ? C.warning : C.online },
            { label: 'Sessions Today', value: fmtNum(Object.values(health.agentSessions).reduce((s, v) => s + v, 0)), colour: C.roseGold },
          ].map(m => (
            <div key={m.label} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderTop: `2px solid ${m.colour}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: m.colour, fontVariantNumeric: 'tabular-nums' }}>
                {typeof m.value === 'number' ? fmtNum(m.value) : m.value}
                {m.suffix && <span style={{ fontSize: 9, fontWeight: 400, color: C.textMuted, marginLeft: 4 }}>{m.suffix}</span>}
              </div>
              <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Status */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
          Service Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Object.entries(health.serviceStatus).map(([service, status]) => (
            <div key={service} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.bgCard, borderRadius: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'operational' ? C.online : C.warning, flexShrink: 0, animation: status === 'operational' ? 'pulse-dot 2s infinite' : 'none' }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.white }}>{service}</div>
                <div style={{ fontSize: 8, color: status === 'operational' ? C.online : C.warning, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Database Stats */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
            Database Stats
          </div>
          {[
            { label: 'Total Clients', value: fmtNum(health.databaseStats.totalUsers) },
            { label: 'Agent Memory Vectors', value: fmtNum(health.databaseStats.memoryVectors) },
            { label: 'Try-On Simulations', value: fmtNum(health.databaseStats.tryOnSimulations) },
            { label: 'Total Bookings', value: fmtNum(health.databaseStats.totalBookings) },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}33` }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.white, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Open Issues */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
            Open Issues
          </div>
          {health.recentErrors.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: 10, color: C.online, fontStyle: 'italic' }}>
              ✓ No open issues — all systems clear
            </div>
          ) : health.recentErrors.map((err, i) => (
            <div key={i} style={{
              padding: '7px 9px', background: C.bgCard, borderRadius: 5, marginBottom: 6,
              borderLeft: `2px solid ${err.severity === 'critical' ? C.error : C.warning}`,
            }}>
              <div style={{ fontSize: 9, color: C.textSec, lineHeight: 1.4 }}>{err.message?.substring(0, 80)}</div>
              <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{fmtTime(err.created_at)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Marcus Reports */}
      {health.marcusReports.length > 0 && (
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Marcus Monitoring Reports
          </div>
          {health.marcusReports.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: i < health.marcusReports.length - 1 ? `1px solid ${C.border}33` : 'none' }}>
              <div style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{fmtTime(r.created_at)}</div>
              <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.4 }}>{r.message?.substring(0, 120)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}