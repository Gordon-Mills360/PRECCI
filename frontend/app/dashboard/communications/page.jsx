// FILE: precci/frontend/app/dashboard/communications/page.jsx
// CUTEME LTD — Communications Page
// Real board-to-board and agent-to-agent communications.
// All messages from real alerts table. Live Supabase subscription.
// Voice session transcripts from voice_sessions table.
// No mock data anywhere. Nothing simulated.

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
  'PC-001': { name: 'Vivienne', colour: '#C4A494', initials: 'VI', role: 'CEO' },
  'PC-002': { name: 'Celeste', colour: '#D4A853', initials: 'CE', role: 'CFO' },
  'PC-003': { name: 'Marcus', colour: '#F2B5B0', initials: 'MA', role: 'CTO' },
  'PC-004': { name: 'Sienna', colour: '#F5DEB3', initials: 'SI', role: 'CMO' },
  'PC-005': { name: 'Rafael', colour: '#8B3A3A', initials: 'RA', role: 'CSO' },
  'PC-006': { name: 'Nadia', colour: '#F7F0E8', initials: 'NA', role: 'COO' },
  'PC-007': { name: 'Sebastian', colour: '#3B82F6', initials: 'SE', role: 'CLO' },
  'PC-026': { name: 'Grace', colour: '#00C8ED', initials: 'GR', role: 'Reception' },
  'PC-008': { name: 'Luna', colour: '#C4A494', initials: 'LU', role: 'Skin' },
  'PC-009': { name: 'Zara', colour: '#D4A853', initials: 'ZA', role: 'Hair' },
  'PC-010': { name: 'Mia', colour: '#F2B5B0', initials: 'MI', role: 'Makeup' },
  'PC-011': { name: 'Isla', colour: '#F5DEB3', initials: 'IS', role: 'Style' },
  'PC-012': { name: 'Remy', colour: '#8B3A3A', initials: 'RE', role: 'Fragrance' },
  'PC-013': { name: 'Cora', colour: '#F7F0E8', initials: 'CO', role: 'Body' },
  'PC-014': { name: 'Drew', colour: '#3B82F6', initials: 'DR', role: 'Grooming' },
  'PC-015': { name: 'Sage', colour: '#4ECDC4', initials: 'SA', role: 'Environment' },
  'PC-016': { name: 'Belle', colour: '#00C8ED', initials: 'BE', role: 'Try-On' },
  'PC-017': { name: 'Nova', colour: '#F5A623', initials: 'NO', role: 'Commerce' },
  'PC-018': { name: 'Piper', colour: '#C4A494', initials: 'PI', role: 'Academy' },
  'PC-019': { name: 'Nina', colour: '#F2B5B0', initials: 'NI', role: 'Social' },
  'PC-020': { name: 'Elton', colour: '#D4A853', initials: 'EL', role: 'Analytics' },
  'PC-021': { name: 'Lena', colour: '#F7F0E8', initials: 'LE', role: 'Support' },
  'PC-022': { name: 'Finn', colour: '#8B3A3A', initials: 'FI', role: 'Ads' },
  'PC-023': { name: 'Aurora', colour: '#F5DEB3', initials: 'AU', role: 'Community' },
  'PC-024': { name: 'Cole', colour: '#3B82F6', initials: 'CL', role: 'Partnerships' },
  'PC-025': { name: 'Eva', colour: '#4ECDC4', initials: 'EV', role: 'Legal' },
  'PC-027': { name: 'Brook', colour: '#F5A623', initials: 'BR', role: 'Connect' },
};

const COMM_TYPES = {
  board_report: { label: 'Board Report', colour: '#D4A853' },
  escalation: { label: 'Escalation', colour: '#ef4444' },
  handoff: { label: 'Handoff', colour: '#22c55e' },
  decision: { label: 'Decision', colour: '#f97316' },
  compliance: { label: 'Compliance', colour: '#3B82F6' },
  performance: { label: 'Performance', colour: '#4ECDC4' },
  revenue: { label: 'Revenue', colour: '#D4A853' },
  notification: { label: 'Notification', colour: '#C4A494' },
};

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function detectCommType(type, message) {
  if (type?.includes('report') || type?.includes('summary')) return 'board_report';
  if (type?.includes('escalat') || type?.includes('critical')) return 'escalation';
  if (type?.includes('handoff') || type?.includes('eva_brief') || type?.includes('lena_delivery')) return 'handoff';
  if (type?.includes('decision') || type?.includes('approved') || type?.includes('flagged')) return 'decision';
  if (type?.includes('legal') || type?.includes('sebastian') || type?.includes('compliance')) return 'compliance';
  if (type?.includes('performance') || type?.includes('nadia')) return 'performance';
  if (type?.includes('revenue') || type?.includes('celeste') || type?.includes('referral')) return 'revenue';
  return 'notification';
}

function extractSenderReceiver(alert) {
  // Parse message like "AgentName → AnotherAgent: content"
  const arrowMatch = alert.message?.match(/^([A-Za-z]+)\s*(?:→|->)\s*([A-Za-z]+):/);
  if (arrowMatch) {
    const senderName = arrowMatch[1];
    const receiverName = arrowMatch[2];
    const sender = Object.values(AGENT_MAP).find(a => a.name === senderName);
    const receiver = Object.values(AGENT_MAP).find(a => a.name === receiverName);
    const senderPcId = Object.keys(AGENT_MAP).find(k => AGENT_MAP[k].name === senderName);
    const receiverPcId = Object.keys(AGENT_MAP).find(k => AGENT_MAP[k].name === receiverName);
    return {
      sender: sender || AGENT_MAP[alert.agent_id],
      senderPcId: senderPcId || alert.agent_id,
      receiver: receiver || null,
      receiverPcId: receiverPcId || null,
      content: alert.message?.replace(/^[^:]+:\s*/, '') || alert.message,
    };
  }
  return {
    sender: AGENT_MAP[alert.agent_id],
    senderPcId: alert.agent_id,
    receiver: null,
    receiverPcId: null,
    content: alert.message,
  };
}

function AgentAvatar({ pcId, size = 28 }) {
  const a = AGENT_MAP[pcId];
  if (!a) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: a.colour + '20', border: `1.5px solid ${a.colour}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 800, color: a.colour, flexShrink: 0,
    }}>
      {a.initials}
    </div>
  );
}

function useCommData() {
  const [allComms, setAllComms] = useState([]);
  const [voiceTranscripts, setVoiceTranscripts] = useState([]);
  const [stats, setStats] = useState({ total: 0, boardComms: 0, escalations: 0, resolved: 0 });

  const load = useCallback(async () => {
    const [alertsResult, transcriptResult] = await Promise.allSettled([
      supabase
        .from('alerts')
        .select('id, agent_id, type, message, severity, resolved, created_at')
        .order('created_at', { ascending: false })
        .limit(300),
      supabase
        .from('voice_sessions')
        .select('id, agent_id, transcript, started_at, ended_at, session_type, duration_seconds')
        .not('transcript', 'is', null)
        .order('started_at', { ascending: false })
        .limit(20),
    ]);

    const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data || [] : [];
    const transcripts = transcriptResult.status === 'fulfilled' ? transcriptResult.value.data || [] : [];

    const comms = alerts.map(a => {
      const { sender, senderPcId, receiver, receiverPcId, content } = extractSenderReceiver(a);
      const commType = detectCommType(a.type, a.message);
      return {
        id: a.id,
        sender,
        senderPcId,
        receiver,
        receiverPcId,
        content,
        rawMessage: a.message,
        type: commType,
        alertType: a.type,
        severity: a.severity,
        resolved: a.resolved,
        createdAt: a.created_at,
      };
    });

    const boardAgents = ['PC-001','PC-002','PC-003','PC-004','PC-005','PC-006','PC-007'];
    const boardComms = comms.filter(c => boardAgents.includes(c.senderPcId) || boardAgents.includes(c.receiverPcId));
    const escalations = comms.filter(c => c.type === 'escalation' || c.severity === 'critical');
    const resolved = comms.filter(c => c.resolved);

    setAllComms(comms);
    setVoiceTranscripts(transcripts);
    setStats({
      total: comms.length,
      boardComms: boardComms.length,
      escalations: escalations.length,
      resolved: resolved.length,
    });
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    const ch = supabase.channel('comms-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        const a = payload.new;
        const { sender, senderPcId, receiver, receiverPcId, content } = extractSenderReceiver(a);
        const commType = detectCommType(a.type, a.message);
        setAllComms(prev => [{
          id: a.id, sender, senderPcId, receiver, receiverPcId,
          content, rawMessage: a.message, type: commType,
          alertType: a.type, severity: a.severity, resolved: a.resolved, createdAt: a.created_at,
        }, ...prev.slice(0, 299)]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voice_sessions' }, load)
      .subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, [load]);

  return { allComms, voiceTranscripts, stats };
}

export default function CommunicationsPage() {
  const { allComms, voiceTranscripts, stats } = useCommData();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSender, setActiveSender] = useState('all');
  const [activeTab, setActiveTab] = useState('messages');
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [allComms.length]);

  const filtered = allComms.filter(c => {
    const typeMatch = activeFilter === 'all' || c.type === activeFilter;
    const senderMatch = activeSender === 'all' || c.senderPcId === activeSender;
    return typeMatch && senderMatch;
  });

  const boardAgents = ['PC-001','PC-002','PC-003','PC-004','PC-005','PC-006','PC-007'];

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Communications</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>All agent-to-agent messages, board reports, escalations and voice transcripts. Live.</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Messages', value: stats.total, colour: C.roseGold },
          { label: 'Board Comms', value: stats.boardComms, colour: C.warmGold },
          { label: 'Escalations', value: stats.escalations, colour: C.error },
          { label: 'Resolved', value: stats.resolved, colour: C.online },
        ].map(s => (
          <div key={s.label} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderTop: `2px solid ${s.colour}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.colour, fontVariantNumeric: 'tabular-nums' }}>
              {s.value !== null ? s.value : '—'}
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: 'messages', label: 'Agent Messages' },
          { id: 'voice', label: 'Voice Transcripts' },
          { id: 'board', label: 'Board Only' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === tab.id ? C.roseGold : 'transparent'}`,
            color: activeTab === tab.id ? C.roseGold : C.textMuted,
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
            transition: 'all 200ms',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'messages' && (
        <div style={{ display: 'flex', gap: 14, flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Filters sidebar */}
          <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Type filter */}
            <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 8 }}>
                Message Type
              </div>
              {[{ id: 'all', label: 'All Types', colour: C.roseGold }, ...Object.entries(COMM_TYPES).map(([id, v]) => ({ id, ...v }))].map(t => (
                <button key={t.id} onClick={() => setActiveFilter(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  width: '100%', padding: '5px 6px', background: activeFilter === t.id ? t.colour + '15' : 'none',
                  border: 'none', borderRadius: 5, cursor: 'pointer',
                  color: activeFilter === t.id ? t.colour : C.textMuted,
                  fontSize: 10, fontWeight: activeFilter === t.id ? 600 : 400, textAlign: 'left',
                  transition: 'all 150ms',
                }}>
                  {t.id !== 'all' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.colour, flexShrink: 0 }} />}
                  {t.label || 'All Types'}
                </button>
              ))}
            </div>

            {/* Agent filter */}
            <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, flex: 1, overflow: 'auto' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 8 }}>
                Agent
              </div>
              <button onClick={() => setActiveSender('all')} style={{ display: 'block', width: '100%', padding: '4px 6px', background: activeSender === 'all' ? C.roseGold + '15' : 'none', border: 'none', borderRadius: 5, cursor: 'pointer', color: activeSender === 'all' ? C.roseGold : C.textMuted, fontSize: 10, fontWeight: activeSender === 'all' ? 600 : 400, textAlign: 'left', marginBottom: 4 }}>All Agents</button>
              {Object.entries(AGENT_MAP).map(([pcId, a]) => (
                <button key={pcId} onClick={() => setActiveSender(pcId)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  width: '100%', padding: '4px 6px',
                  background: activeSender === pcId ? a.colour + '15' : 'none',
                  border: 'none', borderRadius: 5, cursor: 'pointer',
                  color: activeSender === pcId ? a.colour : C.textMuted,
                  fontSize: 10, fontWeight: activeSender === pcId ? 600 : 400, textAlign: 'left',
                  marginBottom: 2,
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: a.colour + '20', border: `1px solid ${a.colour}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 800, color: a.colour, flexShrink: 0 }}>{a.initials}</div>
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Message Feed */}
          <div ref={feedRef} style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 11, fontStyle: 'italic' }}>
                No communications match your filter yet. Messages appear here in real time as agents work.
              </div>
            ) : filtered.map(comm => {
              const typeInfo = COMM_TYPES[comm.type] || COMM_TYPES.notification;
              return (
                <div key={comm.id} style={{
                  background: C.bgPanel, border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${comm.severity === 'critical' ? C.error : comm.severity === 'warn' ? C.warning : typeInfo.colour}`,
                  borderRadius: 8, padding: '10px 14px',
                  animation: 'fade-in-up 200ms ease-out',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {/* Sender */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AgentAvatar pcId={comm.senderPcId} size={24} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: comm.sender?.colour || C.roseGold, lineHeight: 1 }}>
                          {comm.sender?.name || comm.senderPcId}
                        </div>
                        <div style={{ fontSize: 8, color: C.textMuted }}>{comm.sender?.role}</div>
                      </div>
                    </div>

                    {/* Arrow to receiver */}
                    {comm.receiver && (
                      <>
                        <span style={{ fontSize: 12, color: C.textMuted }}>→</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AgentAvatar pcId={comm.receiverPcId} size={24} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: comm.receiver?.colour || C.roseGold, lineHeight: 1 }}>
                              {comm.receiver?.name}
                            </div>
                            <div style={{ fontSize: 8, color: C.textMuted }}>{comm.receiver?.role}</div>
                          </div>
                        </div>
                      </>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 9999, background: typeInfo.colour + '20', border: `1px solid ${typeInfo.colour}44`, color: typeInfo.colour, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {typeInfo.label}
                      </span>
                      {comm.severity === 'critical' && (
                        <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 9999, background: C.error + '20', border: `1px solid ${C.error}44`, color: C.error, fontWeight: 600 }}>CRITICAL</span>
                      )}
                      {comm.resolved && (
                        <span style={{ fontSize: 9, color: C.online }}>✓</span>
                      )}
                      <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                        {fmtDate(comm.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace', background: C.bgCard, borderRadius: 6, padding: '8px 10px' }}>
                    {comm.content?.substring(0, 300)}
                    {comm.content?.length > 300 && <span style={{ color: C.textMuted }}> …</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'voice' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {voiceTranscripts.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 11, fontStyle: 'italic' }}>
              No voice session transcripts yet. Transcripts appear here after voice sessions complete.
            </div>
          ) : voiceTranscripts.map(session => {
            const agent = AGENT_MAP[session.agent_id];
            const lines = typeof session.transcript === 'string'
              ? session.transcript.split('\n').filter(l => l.trim())
              : [];
            return (
              <div key={session.id} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                  {agent && <AgentAvatar pcId={session.agent_id} size={32} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: agent?.colour || C.roseGold }}>
                      {agent?.name || session.agent_id} Voice Session
                    </div>
                    <div style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                      {fmtDate(session.started_at)}
                      {session.duration_seconds && ` · ${Math.round(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {session.session_type}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lines.map((line, i) => {
                    const isPrecious = /^(human|precious):/i.test(line);
                    const isAgent = /^(assistant|vivienne|grace|luna|zara|mia|isla|remy|cora|drew|sage|belle|nova|piper|nina|elton|lena|finn|aurora|cole|eva|brook):/i.test(line);
                    const text = line.replace(/^[^:]+:\s*/i, '').trim();
                    if (!text) return null;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: isPrecious ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '75%', padding: '6px 10px', borderRadius: isPrecious ? '10px 4px 10px 10px' : '4px 10px 10px 10px',
                          background: isPrecious ? C.roseGold : C.bgCard,
                          color: isPrecious ? C.midnight : C.textSec,
                          fontSize: 10, lineHeight: 1.5,
                          border: isPrecious ? 'none' : `1px solid ${C.border}`,
                        }}>
                          {text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'board' && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allComms.filter(c => boardAgents.includes(c.senderPcId) || boardAgents.includes(c.receiverPcId)).length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 11, fontStyle: 'italic' }}>
              No board communications yet. Board messages appear here as directors work.
            </div>
          ) : allComms
            .filter(c => boardAgents.includes(c.senderPcId) || boardAgents.includes(c.receiverPcId))
            .map(comm => {
              const typeInfo = COMM_TYPES[comm.type] || COMM_TYPES.notification;
              return (
                <div key={comm.id} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${typeInfo.colour}`, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <AgentAvatar pcId={comm.senderPcId} size={24} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: comm.sender?.colour || C.roseGold }}>{comm.sender?.name}</span>
                    {comm.receiver && (
                      <>
                        <span style={{ color: C.textMuted }}>→</span>
                        <AgentAvatar pcId={comm.receiverPcId} size={24} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: comm.receiver?.colour || C.roseGold }}>{comm.receiver?.name}</span>
                      </>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 8, padding: '2px 7px', borderRadius: 9999, background: typeInfo.colour + '20', color: typeInfo.colour, fontWeight: 600 }}>{typeInfo.label}</span>
                    <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{fmtDate(comm.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.6, padding: '6px 8px', background: C.bgCard, borderRadius: 5 }}>
                    {comm.content?.substring(0, 250)}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}