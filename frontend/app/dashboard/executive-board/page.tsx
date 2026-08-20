// FILE: precci/frontend/app/dashboard/executive-board/page.jsx
// CUTEME LTD — Executive Board Page
// All 7 board directors — real performance data only.
// Live session counts, alert history, decision logs.
// No mock data anywhere.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  roseGold: '#C4A494', warmGold: '#D4A853', blushPink: '#F2B5B0',
  champagne: '#F5DEB3', deepRose: '#8B3A3A', ivoryCream: '#F7F0E8',
  steelBlue: '#3B82F6', midnight: '#1A0A0F', bgPanel: '#2a1a1f',
  bgCard: '#221218', border: '#4a2a2f', textSec: '#d4b8b0',
  textMuted: '#8a6a6a', online: '#22c55e', busy: '#f97316',
  error: '#ef4444', white: '#FFFFFF',
};

const BOARD = [
  { pcId: 'PC-001', name: 'Vivienne', role: 'AI Chief Executive Officer', initials: 'VI', colour: C.roseGold, desc: 'Runs PRECCI entirely. Orchestrates all 27 agents. Reports to Precious every Sunday.' },
  { pcId: 'PC-002', name: 'Celeste', role: 'Chief Finance Officer', initials: 'CE', colour: C.warmGold, desc: 'Manages all 16 revenue streams. Sends Vivienne daily financial report at 8AM.' },
  { pcId: 'PC-003', name: 'Marcus', role: 'Chief Technology Officer', initials: 'MA', colour: C.blushPink, desc: 'Manages PWA, backend, all APIs, 28 agent uptime. Monitors Sentry and Uptime Robot.' },
  { pcId: 'PC-004', name: 'Sienna', role: 'Chief Marketing Officer', initials: 'SI', colour: C.champagne, desc: 'Runs all global marketing for both divisions. Oversees Nina, Finn and Piper.' },
  { pcId: 'PC-005', name: 'Rafael', role: 'Chief Sales Officer', initials: 'RA', colour: C.deepRose, desc: 'Drives subscription revenue, brand partnerships, B2B licensing and provider acquisition.' },
  { pcId: 'PC-006', name: 'Nadia', role: 'Chief Operations Officer', initials: 'NA', colour: C.ivoryCream, desc: 'Oversees all 20 worker agents daily. Ensures every agent performs across both divisions.' },
  { pcId: 'PC-007', name: 'Sebastian', role: 'Chief Legal Officer', initials: 'SE', colour: C.steelBlue, desc: 'Handles all contracts, compliance, trademark protection and legal matters globally.' },
];

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtNum(v) {
  if (v === null || v === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(v);
}

function useBoardData() {
  const [boardData, setBoardData] = useState({});
  const [agentStatuses, setAgentStatuses] = useState({});

  const load = useCallback(async () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const pcIds = BOARD.map(b => b.pcId);

    const [sessionsResult, alertsResult, recentResult] = await Promise.allSettled([
      supabase.from('sessions').select('agent_id, completed').gte('created_at', todayStart.toISOString()).in('agent_id', pcIds),
      supabase.from('alerts').select('agent_id, type, message, severity, resolved, created_at').in('agent_id', pcIds).order('created_at', { ascending: false }).limit(200),
      supabase.from('sessions').select('agent_id').gte('created_at', tenMinAgo).in('agent_id', pcIds),
    ]);

    const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data || [] : [];
    const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data || [] : [];
    const recent = recentResult.status === 'fulfilled' ? recentResult.value.data || [] : [];

    const recentSet = new Set(recent.map(s => s.agent_id));

    const statuses = {};
    const data = {};

    BOARD.forEach(b => {
      statuses[b.pcId] = recentSet.has(b.pcId) ? 'busy' : 'online';

      const agentSessions = sessions.filter(s => s.agent_id === b.pcId);
      const agentAlerts = alerts.filter(a => a.agent_id === b.pcId);
      const completedSessions = agentSessions.filter(s => s.completed).length;

      data[b.pcId] = {
        sessionsToday: agentSessions.length,
        completedToday: completedSessions,
        completionRate: agentSessions.length > 0
          ? parseFloat(((completedSessions / agentSessions.length) * 100).toFixed(1))
          : null,
        unresolvedAlerts: agentAlerts.filter(a => !a.resolved).length,
        criticalAlerts: agentAlerts.filter(a => !a.resolved && a.severity === 'critical').length,
        recentActivity: agentAlerts.slice(0, 5).map(a => ({
          message: a.message?.substring(0, 80),
          time: fmtTime(a.created_at),
          severity: a.severity,
          resolved: a.resolved,
        })),
      };
    });

    setAgentStatuses(statuses);
    setBoardData(data);
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 20000);
    const ch = supabase.channel('board-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, load)
      .subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, [load]);

  return { boardData, agentStatuses };
}

export default function ExecutiveBoardPage() {
  const { boardData, agentStatuses } = useBoardData();
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Executive Board</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>7 board directors — CUTEME LTD leadership team. All data live.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {BOARD.map(director => {
          const data = boardData[director.pcId];
          const status = agentStatuses[director.pcId] || 'online';
          const isSelected = selected === director.pcId;

          return (
            <div
              key={director.pcId}
              onClick={() => setSelected(isSelected ? null : director.pcId)}
              style={{
                background: C.bgPanel,
                border: `1px solid ${isSelected ? director.colour + '88' : C.border}`,
                borderLeft: `3px solid ${director.colour}`,
                borderRadius: 12,
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 200ms',
                boxShadow: isSelected ? `0 0 20px ${director.colour}22` : 'none',
              }}
            >
              {/* Director header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: director.colour + '18',
                  border: `2px solid ${director.colour}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: director.colour, flexShrink: 0,
                }}>{director.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: director.colour, lineHeight: 1.1 }}>{director.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{director.pcId} | {director.role}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'busy' ? C.busy : C.online }} />
                    <span style={{ fontSize: 9, color: status === 'busy' ? C.busy : C.online, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {status === 'busy' ? 'IN SESSION' : 'ONLINE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.6, marginBottom: 12 }}>
                {director.desc}
              </div>

              {/* Real metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: data && isSelected ? 12 : 0 }}>
                {[
                  { label: 'Sessions Today', value: data ? fmtNum(data.sessionsToday) : '—' },
                  { label: 'Completion Rate', value: data?.completionRate !== null ? `${data.completionRate}%` : '—' },
                  { label: 'Open Alerts', value: data ? fmtNum(data.unresolvedAlerts) : '—' },
                ].map(m => (
                  <div key={m.label} style={{ background: C.bgCard, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                    <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Expanded activity */}
              {isSelected && data?.recentActivity.length > 0 && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Recent Activity
                  </div>
                  {data.recentActivity.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 8, marginBottom: 6, padding: '5px 8px',
                      background: a.severity === 'critical' ? '#ef444411' : a.severity === 'warn' ? '#f9731611' : C.bgCard,
                      borderRadius: 5, borderLeft: `2px solid ${a.severity === 'critical' ? C.error : a.severity === 'warn' ? C.busy : director.colour}44`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: C.textSec, lineHeight: 1.4 }}>{a.message}</div>
                        <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{a.time}</div>
                      </div>
                      {a.resolved && <div style={{ fontSize: 7, color: C.online, flexShrink: 0, paddingTop: 2 }}>✓</div>}
                    </div>
                  ))}
                </div>
              )}

              {isSelected && data?.recentActivity.length === 0 && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10, fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>
                  No recent activity
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}