// FILE: precci/frontend/app/dashboard/live-operations/page.jsx
// CUTEME LTD — Live Operations Page
// Real-time view of all active sessions, voice calls,
// camera analyses, bookings in flight, cron job status.
// Everything live. Nothing simulated.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const AGENT_MAP = {
  'PC-001': { name: 'Vivienne', colour: '#C4A494', initials: 'VI' },
  'PC-002': { name: 'Celeste', colour: '#D4A853', initials: 'CE' },
  'PC-003': { name: 'Marcus', colour: '#F2B5B0', initials: 'MA' },
  'PC-004': { name: 'Sienna', colour: '#F5DEB3', initials: 'SI' },
  'PC-005': { name: 'Rafael', colour: '#8B3A3A', initials: 'RA' },
  'PC-006': { name: 'Nadia', colour: '#F7F0E8', initials: 'NA' },
  'PC-007': { name: 'Sebastian', colour: '#3B82F6', initials: 'SE' },
  'PC-026': { name: 'Grace', colour: '#00C8ED', initials: 'GR' },
  'PC-008': { name: 'Luna', colour: '#C4A494', initials: 'LU' },
  'PC-009': { name: 'Zara', colour: '#D4A853', initials: 'ZA' },
  'PC-010': { name: 'Mia', colour: '#F2B5B0', initials: 'MI' },
  'PC-011': { name: 'Isla', colour: '#F5DEB3', initials: 'IS' },
  'PC-012': { name: 'Remy', colour: '#8B3A3A', initials: 'RE' },
  'PC-013': { name: 'Cora', colour: '#F7F0E8', initials: 'CO' },
  'PC-014': { name: 'Drew', colour: '#3B82F6', initials: 'DR' },
  'PC-015': { name: 'Sage', colour: '#4ECDC4', initials: 'SA' },
  'PC-016': { name: 'Belle', colour: '#00C8ED', initials: 'BE' },
  'PC-017': { name: 'Nova', colour: '#F5A623', initials: 'NO' },
  'PC-018': { name: 'Piper', colour: '#C4A494', initials: 'PI' },
  'PC-019': { name: 'Nina', colour: '#F2B5B0', initials: 'NI' },
  'PC-020': { name: 'Elton', colour: '#D4A853', initials: 'EL' },
  'PC-021': { name: 'Lena', colour: '#F7F0E8', initials: 'LE' },
  'PC-022': { name: 'Finn', colour: '#8B3A3A', initials: 'FI' },
  'PC-023': { name: 'Aurora', colour: '#F5DEB3', initials: 'AU' },
  'PC-024': { name: 'Cole', colour: '#3B82F6', initials: 'CL' },
  'PC-025': { name: 'Eva', colour: '#4ECDC4', initials: 'EV' },
  'PC-027': { name: 'Brook', colour: '#F5A623', initials: 'BR' },
};

const CRON_SCHEDULE = [
  { name: 'Nina Morning Content', time: '07:00', agentId: 'PC-019', alertType: 'nina_morning_publish' },
  { name: 'Piper Daily Tips', time: '07:30', agentId: 'PC-018', alertType: 'daily_tips_generated' },
  { name: 'Celeste Daily Report', time: '08:00', agentId: 'PC-002', alertType: 'celeste_vivienne_report' },
  { name: 'Elton Daily Intelligence', time: '18:00', agentId: 'PC-020', alertType: 'elton_report_daily_morning' },
  { name: 'Aurora Community', time: '19:00', agentId: 'PC-023', alertType: 'aurora_daily_management' },
  { name: 'Nina Evening Content', time: '21:00', agentId: 'PC-019', alertType: 'nina_evening_publish' },
  { name: 'Marcus Monitoring', time: 'Every 6h', agentId: 'PC-003', alertType: 'marcus_routine_monitoring' },
  { name: 'Belle Cleanup', time: 'Hourly', agentId: 'PC-016', alertType: 'belle_cleanup' },
];

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function fmtDuration(startIso) {
  if (!startIso) return '';
  const diff = Date.now() - new Date(startIso).getTime();
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function useLiveOps() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [activeVoice, setActiveVoice] = useState([]);
  const [activeCamera, setActiveCamera] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [cronStatus, setCronStatus] = useState({});
  const [recentRouting, setRecentRouting] = useState([]);

  const load = useCallback(async () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [sessResult, voiceResult, cameraResult, bookResult, routeResult, cronResult] = await Promise.allSettled([
      supabase.from('sessions').select('id, agent_id, user_id, created_at, camera_used, sage_data').eq('completed', false).gte('created_at', tenMinAgo).order('created_at', { ascending: false }),
      supabase.from('voice_sessions').select('id, agent_id, session_type, started_at').is('ended_at', null).order('started_at', { ascending: false }),
      supabase.from('sessions').select('id, agent_id, user_id, created_at').eq('camera_used', true).eq('completed', false).gte('created_at', tenMinAgo),
      supabase.from('provider_bookings').select('id, appointment_code, appointment_date, appointment_time, status, services_requested, created_at').in('status', ['pending', 'confirmed']).order('created_at', { ascending: false }).limit(10),
      supabase.from('routing_log').select('from_agent, to_agent, routing_reason, timestamp').order('timestamp', { ascending: false }).limit(20),
      // Check each cron's last run
      supabase.from('alerts').select('type, created_at').gte('created_at', todayStart.toISOString()).in('type', CRON_SCHEDULE.map(c => c.alertType)).order('created_at', { ascending: false }),
    ]);

    setActiveSessions(sessResult.status === 'fulfilled' ? sessResult.value.data || [] : []);
    setActiveVoice(voiceResult.status === 'fulfilled' ? voiceResult.value.data || [] : []);
    setActiveCamera(cameraResult.status === 'fulfilled' ? cameraResult.value.data || [] : []);
    setPendingBookings(bookResult.status === 'fulfilled' ? bookResult.value.data || [] : []);
    setRecentRouting(routeResult.status === 'fulfilled' ? routeResult.value.data || [] : []);

    // Cron status
    if (cronResult.status === 'fulfilled') {
      const cronAlerts = cronResult.value.data || [];
      const status = {};
      CRON_SCHEDULE.forEach(cron => {
        const lastRun = cronAlerts.find(a => a.type === cron.alertType);
        status[cron.alertType] = {
          lastRun: lastRun?.created_at || null,
          ranToday: !!lastRun,
        };
      });
      setCronStatus(status);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 10000);

    const ch = supabase.channel('live-ops-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_sessions' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'routing_log' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_bookings' }, load)
      .subscribe();

    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, [load]);

  return { activeSessions, activeVoice, activeCamera, pendingBookings, cronStatus, recentRouting };
}

export default function LiveOperationsPage() {
  const { activeSessions, activeVoice, activeCamera, pendingBookings, cronStatus, recentRouting } = useLiveOps();
  const [, setTick] = useState(0);

  // Update durations every second
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  function AgentChip({ pcId }) {
    const a = AGENT_MAP[pcId];
    if (!a) return <span style={{ fontSize: 9, color: '#8a6a6a' }}>{pcId}</span>;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: a.colour + '20', border: `1px solid ${a.colour}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: a.colour }}>{a.initials}</div>
        <span style={{ fontSize: 9, fontWeight: 600, color: a.colour }}>{a.name}</span>
      </div>
    );
  }

  const panels = [
    { title: 'Active Sessions', count: activeSessions.length, colour: C.warmGold },
    { title: 'Live Voice Calls', count: activeVoice.length, colour: '#8B5CF6' },
    { title: 'Camera Analyses', count: activeCamera.length, colour: C.roseGold },
    { title: 'Pending Bookings', count: pendingBookings.length, colour: C.online },
  ];

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Live Operations</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>Everything happening right now. Real-time. No simulation.</div>
      </div>

      {/* Live counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {panels.map(p => (
          <div key={p.title} style={{ background: C.bgPanel, border: `1px solid ${p.colour}33`, borderTop: `2px solid ${p.colour}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: p.count > 0 ? p.colour : C.textMuted, fontVariantNumeric: 'tabular-nums' }}>
              {p.count}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{p.title}</div>
            {p.count > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.colour, marginTop: 6, animation: 'pulse-dot 2s infinite' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Active Sessions */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.warmGold, marginBottom: 10 }}>
            Active Sessions ({activeSessions.length})
          </div>
          {activeSessions.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No active sessions right now</div>
          ) : activeSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: C.bgCard, borderRadius: 6, marginBottom: 5 }}>
              <AgentChip pcId={s.agent_id} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                  {s.user_id?.substring(0, 12)}...
                </div>
              </div>
              {s.camera_used && <span style={{ fontSize: 8, color: C.roseGold }}>📷</span>}
              <span style={{ fontSize: 8, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                {fmtDuration(s.created_at)}
              </span>
            </div>
          ))}
        </div>

        {/* Live Voice */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B5CF6', marginBottom: 10 }}>
            Live Voice Calls ({activeVoice.length})
          </div>
          {activeVoice.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No active voice calls</div>
          ) : activeVoice.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: C.bgCard, borderRadius: 6, marginBottom: 5 }}>
              <AgentChip pcId={v.agent_id} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, color: C.textMuted }}>{v.session_type}</div>
              </div>
              {/* Waveform */}
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {[8, 14, 10, 16, 12].map((h, i) => (
                  <div key={i} style={{ width: 2, height: h, background: '#8B5CF6', borderRadius: 1, animation: `voice-waveform 0.8s ease-in-out infinite ${i * 100}ms` }} />
                ))}
              </div>
              <span style={{ fontSize: 8, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                {fmtDuration(v.started_at)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Pending Bookings */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.online, marginBottom: 10 }}>
            Bookings In Flight ({pendingBookings.length})
          </div>
          {pendingBookings.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No pending bookings</div>
          ) : pendingBookings.map(b => (
            <div key={b.id} style={{ padding: '7px 9px', background: C.bgCard, borderRadius: 6, marginBottom: 5, borderLeft: `2px solid ${b.status === 'confirmed' ? C.online : C.warning}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.white, fontFamily: 'JetBrains Mono, monospace' }}>
                  {b.appointment_code}
                </span>
                <span style={{ fontSize: 8, color: b.status === 'confirmed' ? C.online : C.warning, fontWeight: 600, textTransform: 'uppercase' }}>
                  {b.status}
                </span>
              </div>
              <div style={{ fontSize: 9, color: C.textSec }}>
                {Array.isArray(b.services_requested) ? b.services_requested.join(', ') : b.services_requested}
              </div>
              <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                {b.appointment_date} {b.appointment_time}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Agent Routing */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Recent Agent Routing
          </div>
          {recentRouting.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No routing activity yet</div>
          ) : recentRouting.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AgentChip pcId={r.from_agent} />
              <span style={{ fontSize: 9, color: C.textMuted }}>→</span>
              <AgentChip pcId={r.to_agent} />
              <span style={{ fontSize: 8, color: C.textMuted, marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                {fmtTime(r.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Schedule Status */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
          Scheduled Operations — Today
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {CRON_SCHEDULE.map(cron => {
            const status = cronStatus[cron.alertType];
            const ran = status?.ranToday;
            const agent = AGENT_MAP[cron.agentId];

            return (
              <div key={cron.alertType} style={{
                padding: '7px 10px', background: C.bgCard,
                borderRadius: 6, borderLeft: `2px solid ${ran ? C.online : C.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: ran ? C.white : C.textMuted }}>{cron.name}</span>
                  <span style={{ fontSize: 7, color: ran ? C.online : C.textMuted, fontWeight: 700 }}>
                    {ran ? '✓ RAN' : 'PENDING'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{cron.time}</span>
                  {agent && <span style={{ fontSize: 8, color: agent.colour, fontWeight: 600 }}>{agent.name}</span>}
                </div>
                {status?.lastRun && (
                  <div style={{ fontSize: 7, color: C.textMuted, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                    Last: {fmtTime(status.lastRun)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}