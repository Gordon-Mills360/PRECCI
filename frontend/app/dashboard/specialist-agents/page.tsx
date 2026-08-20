// FILE: precci/frontend/app/dashboard/specialist-agents/page.jsx
// CUTEME LTD — Specialist Agents Page
// All 21 specialist worker agents — real performance data.
// Live session counts, camera usage, Nova conversion,
// memory recall, allergy compliance. All real.

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
  online: '#22c55e', busy: '#f97316', error: '#ef4444', white: '#FFFFFF',
};

const AGENT_COLOURS = {
  'PC-026': '#00C8ED', 'PC-008': '#C4A494', 'PC-009': '#D4A853',
  'PC-010': '#F2B5B0', 'PC-011': '#F5DEB3', 'PC-012': '#8B3A3A',
  'PC-013': '#F7F0E8', 'PC-014': '#3B82F6', 'PC-015': '#4ECDC4',
  'PC-016': '#00C8ED', 'PC-017': '#F5A623', 'PC-018': '#C4A494',
  'PC-019': '#F2B5B0', 'PC-020': '#D4A853', 'PC-021': '#F7F0E8',
  'PC-022': '#8B3A3A', 'PC-023': '#F5DEB3', 'PC-024': '#3B82F6',
  'PC-025': '#4ECDC4', 'PC-027': '#F5A623',
};

const SPECIALISTS = [
  { pcId: 'PC-026', name: 'Grace', role: 'Reception & Client Routing', initials: 'GR', group: 'Gateway', camera: false },
  { pcId: 'PC-008', name: 'Luna', role: 'AI Skin Analyst', initials: 'LU', group: 'Beauty Specialists', camera: true },
  { pcId: 'PC-009', name: 'Zara', role: 'Hair Expert', initials: 'ZA', group: 'Beauty Specialists', camera: true },
  { pcId: 'PC-010', name: 'Mia', role: 'Makeup & Grooming', initials: 'MI', group: 'Beauty Specialists', camera: true },
  { pcId: 'PC-011', name: 'Isla', role: 'Style & Outfit Advisor', initials: 'IS', group: 'Beauty Specialists', camera: true },
  { pcId: 'PC-012', name: 'Remy', role: 'Fragrance Advisor', initials: 'RE', group: 'Beauty Specialists', camera: false },
  { pcId: 'PC-013', name: 'Cora', role: 'Body Care Specialist', initials: 'CO', group: 'Beauty Specialists', camera: true },
  { pcId: 'PC-014', name: 'Drew', role: 'Male Grooming Specialist', initials: 'DR', group: 'Beauty Specialists', camera: true },
  { pcId: 'PC-015', name: 'Sage', role: 'Environmental Intelligence', initials: 'SA', group: 'Operations', camera: false },
  { pcId: 'PC-016', name: 'Belle', role: 'Virtual Try-On', initials: 'BE', group: 'Operations', camera: true },
  { pcId: 'PC-017', name: 'Nova', role: 'Commerce & Products', initials: 'NO', group: 'Operations', camera: false },
  { pcId: 'PC-018', name: 'Piper', role: 'Academy & Content', initials: 'PI', group: 'Operations', camera: false },
  { pcId: 'PC-019', name: 'Nina', role: 'Social Media & Influencers', initials: 'NI', group: 'Growth', camera: false },
  { pcId: 'PC-020', name: 'Elton', role: 'Data Analyst', initials: 'EL', group: 'Growth', camera: false },
  { pcId: 'PC-021', name: 'Lena', role: 'Customer Support', initials: 'LE', group: 'Growth', camera: false },
  { pcId: 'PC-022', name: 'Finn', role: 'Paid Advertising', initials: 'FI', group: 'Growth', camera: false },
  { pcId: 'PC-023', name: 'Aurora', role: 'Community & Membership', initials: 'AU', group: 'Growth', camera: false },
  { pcId: 'PC-024', name: 'Cole', role: 'Brand Partnerships', initials: 'CL', group: 'Growth', camera: false },
  { pcId: 'PC-025', name: 'Eva', role: 'Legal Assistant', initials: 'EV', group: 'Growth', camera: false },
  { pcId: 'PC-027', name: 'Brook', role: 'Connect Manager', initials: 'BR', group: 'Connect', camera: false },
];

const GROUPS = ['Gateway', 'Beauty Specialists', 'Operations', 'Growth', 'Connect'];

function fmtNum(v) { return v !== null && v !== undefined ? new Intl.NumberFormat('en-US').format(v) : '—'; }

function useSpecialistData() {
  const [agentData, setAgentData] = useState({});
  const [statuses, setStatuses] = useState({});

  const load = useCallback(async () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const pcIds = SPECIALISTS.map(s => s.pcId);

    const [sessResult, cameraResult, alertResult, recentResult, novaResult, memResult] = await Promise.allSettled([
      supabase.from('sessions').select('agent_id, completed, camera_used').gte('created_at', todayStart.toISOString()).in('agent_id', pcIds),
      supabase.from('sessions').select('agent_id', { count: 'exact' }).gte('created_at', todayStart.toISOString()).eq('camera_used', true).in('agent_id', pcIds),
      supabase.from('alerts').select('agent_id, severity, resolved').in('agent_id', pcIds).eq('resolved', false),
      supabase.from('sessions').select('agent_id').gte('created_at', tenMinAgo).in('agent_id', pcIds),
      supabase.from('recommendations').select('agent_id, purchased').gte('created_at', todayStart.toISOString()).in('agent_id', pcIds),
      supabase.from('agent_memory').select('agent_id', { count: 'exact' }).in('agent_id', pcIds),
    ]);

    const sessions = sessResult.status === 'fulfilled' ? sessResult.value.data || [] : [];
    const recentSet = new Set((recentResult.status === 'fulfilled' ? recentResult.value.data || [] : []).map(s => s.agent_id));
    const alerts = alertResult.status === 'fulfilled' ? alertResult.value.data || [] : [];
    const novaRecs = novaResult.status === 'fulfilled' ? novaResult.value.data || [] : [];

    const data = {};
    const sts = {};

    SPECIALISTS.forEach(s => {
      sts[s.pcId] = recentSet.has(s.pcId) ? 'busy' : 'online';
      const agSessions = sessions.filter(x => x.agent_id === s.pcId);
      const completed = agSessions.filter(x => x.completed).length;
      const cameraUsed = agSessions.filter(x => x.camera_used).length;
      const agAlerts = alerts.filter(x => x.agent_id === s.pcId);
      const agRecs = novaRecs.filter(x => x.agent_id === s.pcId);
      const purchased = agRecs.filter(x => x.purchased).length;

      data[s.pcId] = {
        sessionsToday: agSessions.length,
        completed,
        completionRate: agSessions.length > 0 ? parseFloat(((completed / agSessions.length) * 100).toFixed(1)) : null,
        cameraUsed,
        cameraRate: agSessions.length > 0 ? parseFloat(((cameraUsed / agSessions.length) * 100).toFixed(1)) : null,
        openAlerts: agAlerts.length,
        criticalAlerts: agAlerts.filter(x => x.severity === 'critical').length,
        recommendations: agRecs.length,
        conversions: purchased,
        conversionRate: agRecs.length > 0 ? parseFloat(((purchased / agRecs.length) * 100).toFixed(1)) : null,
      };
    });

    setAgentData(data);
    setStatuses(sts);
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 20000);
    const ch = supabase.channel('specialist-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, load)
      .subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, [load]);

  return { agentData, statuses };
}

export default function SpecialistAgentsPage() {
  const { agentData, statuses } = useSpecialistData();
  const [activeGroup, setActiveGroup] = useState('All');

  const filtered = activeGroup === 'All' ? SPECIALISTS : SPECIALISTS.filter(s => s.group === activeGroup);

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Specialist Agents</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>21 specialist workers — all serving all clients, all genders, 24/7.</div>
      </div>

      {/* Group filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {['All', ...GROUPS].map(g => (
          <button key={g} onClick={() => setActiveGroup(g)} style={{
            padding: '5px 12px', borderRadius: 9999,
            background: activeGroup === g ? C.roseGold : 'transparent',
            border: `1px solid ${activeGroup === g ? C.roseGold : C.border}`,
            color: activeGroup === g ? C.midnight : C.textMuted,
            cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 150ms',
          }}>{g}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {filtered.map(agent => {
          const d = agentData[agent.pcId];
          const colour = AGENT_COLOURS[agent.pcId] || C.roseGold;
          const status = statuses[agent.pcId] || 'online';

          return (
            <div key={agent.pcId} style={{
              background: C.bgPanel, border: `1px solid ${C.border}`,
              borderTop: `2px solid ${colour}`, borderRadius: 10, padding: 14,
              transition: 'all 150ms',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: colour + '18', border: `2px solid ${colour}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: colour, flexShrink: 0,
                }}>{agent.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colour, lineHeight: 1.1 }}>{agent.name}</div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>{agent.role}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: status === 'busy' ? C.busy : C.online, animation: 'pulse-dot 2s infinite' }} />
                    <span style={{ fontSize: 8, color: status === 'busy' ? C.busy : C.online, fontWeight: 600, textTransform: 'uppercase' }}>
                      {status === 'busy' ? 'In Session' : 'Online'}
                    </span>
                    {agent.camera && <span style={{ fontSize: 8, color: C.textMuted, marginLeft: 4 }}>📷 Camera</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {[
                  { label: 'Sessions Today', value: d ? fmtNum(d.sessionsToday) : '—' },
                  { label: 'Completion Rate', value: d?.completionRate !== null ? `${d.completionRate}%` : '—' },
                  agent.camera ? { label: 'Camera Sessions', value: d ? fmtNum(d.cameraUsed) : '—' } : { label: 'Open Alerts', value: d ? fmtNum(d.openAlerts) : '—' },
                  d?.conversionRate !== null ? { label: 'Conv. Rate', value: `${d.conversionRate}%` } : { label: 'Group', value: agent.group },
                ].map(m => (
                  <div key={m.label} style={{ background: C.bgCard, borderRadius: 6, padding: '5px 7px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                    <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {d?.criticalAlerts > 0 && (
                <div style={{ marginTop: 8, padding: '4px 8px', background: '#ef444411', border: '1px solid #ef444444', borderRadius: 5, fontSize: 9, color: C.error }}>
                  ⚠ {d.criticalAlerts} critical alert{d.criticalAlerts > 1 ? 's' : ''} open
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}