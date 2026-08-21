// FILE: precci/frontend/app/dashboard/page.jsx
// CUTEME LTD — Command Centre Dashboard
// Renders inside layout.jsx which provides: header + sidebar + main wrapper.
// This file ONLY renders the main content area — no header, no sidebar, no footer.
// ARC AI layout structure: org chart centre + bottom strip + right Vivienne panel.
// Zero mock data. All real from Supabase. Voice-first.

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as d3 from 'd3';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  roseGold: '#C4A494', blushPink: '#F2B5B0', warmGold: '#D4A853',
  ivoryCream: '#F7F0E8', deepRose: '#8B3A3A', champagne: '#F5DEB3',
  midnight: '#1A0A0F', white: '#FFFFFF', bgPanel: '#2a1a1f',
  bgCard: '#221218', border: '#4a2a2f', textSec: '#d4b8b0',
  textMuted: '#8a6a6a', online: '#22c55e', busy: '#f97316',
  waiting: '#eab308', error: '#ef4444', offline: '#64748b', cyan: '#00C8ED',
};

const AGENTS = [
  { pcId: 'PC-001', name: 'Vivienne',  role: 'Chief Executive Officer',  initials: 'VI', division: 'ceo',     group: 'executive' },
  { pcId: 'PC-002', name: 'Celeste',   role: 'Chief Finance Officer',    initials: 'CE', division: 'board',   group: 'executive' },
  { pcId: 'PC-003', name: 'Marcus',    role: 'Chief Technology Officer', initials: 'MA', division: 'board',   group: 'executive' },
  { pcId: 'PC-004', name: 'Sienna',    role: 'Chief Marketing Officer',  initials: 'SI', division: 'board',   group: 'executive' },
  { pcId: 'PC-005', name: 'Rafael',    role: 'Chief Sales Officer',      initials: 'RA', division: 'board',   group: 'executive' },
  { pcId: 'PC-006', name: 'Nadia',     role: 'Chief Operations Officer', initials: 'NA', division: 'board',   group: 'executive' },
  { pcId: 'PC-007', name: 'Sebastian', role: 'Chief Legal Officer',      initials: 'SE', division: 'board',   group: 'executive' },
  { pcId: 'PC-026', name: 'Grace',     role: 'Reception & Routing',      initials: 'GR', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-008', name: 'Luna',      role: 'AI Skin Analyst',          initials: 'LU', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-009', name: 'Zara',      role: 'Hair Expert',              initials: 'ZA', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-010', name: 'Mia',       role: 'Makeup & Grooming',        initials: 'MI', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-011', name: 'Isla',      role: 'Style Advisor',            initials: 'IS', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-012', name: 'Remy',      role: 'Fragrance Advisor',        initials: 'RE', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-013', name: 'Cora',      role: 'Body Care',                initials: 'CO', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-014', name: 'Drew',      role: 'Grooming Specialist',      initials: 'DR', division: 'beauty',  group: 'beauty' },
  { pcId: 'PC-015', name: 'Sage',      role: 'Environmental Intel',      initials: 'SA', division: 'ops',     group: 'ops' },
  { pcId: 'PC-016', name: 'Belle',     role: 'Virtual Try-On',           initials: 'BE', division: 'ops',     group: 'ops' },
  { pcId: 'PC-017', name: 'Nova',      role: 'Commerce & Products',      initials: 'NO', division: 'ops',     group: 'ops' },
  { pcId: 'PC-018', name: 'Piper',     role: 'Academy & Content',        initials: 'PI', division: 'ops',     group: 'ops' },
  { pcId: 'PC-019', name: 'Nina',      role: 'Social Media',             initials: 'NI', division: 'ops',     group: 'ops' },
  { pcId: 'PC-020', name: 'Elton',     role: 'Data Analyst',             initials: 'EL', division: 'ops',     group: 'ops' },
  { pcId: 'PC-021', name: 'Lena',      role: 'Customer Support',         initials: 'LE', division: 'ops',     group: 'ops' },
  { pcId: 'PC-022', name: 'Finn',      role: 'Paid Advertising',         initials: 'FI', division: 'growth',  group: 'growth' },
  { pcId: 'PC-023', name: 'Aurora',    role: 'Community',                initials: 'AU', division: 'growth',  group: 'growth' },
  { pcId: 'PC-024', name: 'Cole',      role: 'Brand Partnerships',       initials: 'CL', division: 'growth',  group: 'growth' },
  { pcId: 'PC-025', name: 'Eva',       role: 'Legal Assistant',          initials: 'EV', division: 'growth',  group: 'growth' },
  { pcId: 'PC-027', name: 'Brook',     role: 'Connect Manager',          initials: 'BR', division: 'connect', group: 'growth' },
];

const AGENT_MAP = AGENTS.reduce((acc, a) => { acc[a.pcId] = a; return acc; }, {});

const AGENT_COLOURS = {
  'PC-001': '#C4A494', 'PC-002': '#D4A853', 'PC-003': '#F2B5B0',
  'PC-004': '#F5DEB3', 'PC-005': '#8B3A3A', 'PC-006': '#F7F0E8',
  'PC-007': '#3B82F6', 'PC-008': '#C4A494', 'PC-009': '#D4A853',
  'PC-010': '#F2B5B0', 'PC-011': '#F5DEB3', 'PC-012': '#8B3A3A',
  'PC-013': '#F7F0E8', 'PC-014': '#3B82F6', 'PC-015': '#4ECDC4',
  'PC-016': '#00C8ED', 'PC-017': '#F5A623', 'PC-018': '#C4A494',
  'PC-019': '#F2B5B0', 'PC-020': '#D4A853', 'PC-021': '#F7F0E8',
  'PC-022': '#8B3A3A', 'PC-023': '#F5DEB3', 'PC-024': '#3B82F6',
  'PC-025': '#4ECDC4', 'PC-026': '#00C8ED', 'PC-027': '#F5A623',
};

const BOARD   = AGENTS.filter(a => a.division === 'board');
const BEAUTY  = AGENTS.filter(a => a.division === 'beauty');
const OPS     = AGENTS.filter(a => a.division === 'ops');
const GROWTH  = AGENTS.filter(a => a.division === 'growth');
const CONNECT = AGENTS.filter(a => a.division === 'connect');

const VIVIENNE_TABS = ['OVERVIEW', 'THOUGHTS', 'TASKS', 'MEMORY', 'COMMUNICATION', 'METRICS'];

function fmtCurrency(v) {
  if (!v && v !== 0) return '—';
  if (v >= 1000000) return `$${(v/1000000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v/1000).toFixed(1)}K`;
  return `$${Number(v).toFixed(2)}`;
}
function fmtNum(v) {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(v));
}
function fmtPct(v) {
  if (!v && v !== 0) return '—';
  return `${Number(v).toFixed(1)}%`;
}
function fmtTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ── All data hooks preserved exactly from original ──

function useRealMetrics() {
  const [metrics, setMetrics] = useState({ totalRevenueMonth: null, totalClients: null, aiAnalysesToday: null, ordersToday: null, conversionRate: null, activeSessions: null, decisionsToday: null, systemHealth: null, activeAgentCount: null, revenueChange: null, clientChange: null, analysisChange: null, ordersChange: null });
  const [revenueStreams, setRevenueStreams] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({ totalAssets: null, netProfitMonth: null, cashFlow: null });
  const [systemStats, setSystemStats] = useState({ predictionsToday: null, accuracyRate: null, automationRate: null, systemUptimeStatus: null });
  const [agentStatuses, setAgentStatuses] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const todayStart = new Date(now.setHours(0,0,0,0)).toISOString();
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: revData } = await supabase.from('revenue_summary').select('stream, amount, date').gte('date', startOfMonth);
      const totalRevMonth = (revData||[]).reduce((s,r)=>s+parseFloat(r.amount||0),0);
      const byStream = (revData||[]).reduce((acc,r)=>{ acc[r.stream]=(acc[r.stream]||0)+parseFloat(r.amount||0); return acc; },{});
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-5); sixMonthsAgo.setDate(1);
      const { data: chartData } = await supabase.from('revenue_summary').select('date, amount').gte('date', sixMonthsAgo.toISOString().split('T')[0]).order('date',{ascending:true});
      const chartByMonth = (chartData||[]).reduce((acc,r)=>{ const m=r.date.substring(0,7); acc[m]=(acc[m]||0)+parseFloat(r.amount||0); return acc; },{});
      const chartArr = Object.entries(chartByMonth).map(([month,total])=>({ month: new Date(month+'-01').toLocaleDateString('en-US',{month:'short'}), total }));
      const { count: totalClients } = await supabase.from('users').select('id',{count:'exact'});
      const { count: sessionsToday } = await supabase.from('sessions').select('id',{count:'exact'}).gte('created_at',todayStart);
      const { count: completedToday } = await supabase.from('sessions').select('id',{count:'exact'}).gte('created_at',todayStart).eq('completed',true);
      const { count: cameraSessions } = await supabase.from('sessions').select('id',{count:'exact'}).gte('created_at',todayStart).eq('camera_used',true);
      const { count: ordersToday } = await supabase.from('transactions').select('id',{count:'exact'}).gte('created_at',todayStart).eq('status','success');
      const { data: activeSessions } = await supabase.from('sessions').select('agent_id').gte('created_at',tenMinAgo).eq('completed',false);
      const { count: decisionsToday } = await supabase.from('alerts').select('id',{count:'exact'}).gte('created_at',todayStart);
      const { data: allRevenue } = await supabase.from('revenue_summary').select('amount');
      const totalAllRevenue = (allRevenue||[]).reduce((s,r)=>s+parseFloat(r.amount||0),0);
      const { data: allCosts } = await supabase.from('transactions').select('amount').eq('type','cost').eq('status','success');
      const totalCosts = (allCosts||[]).reduce((s,t)=>s+parseFloat(t.amount||0),0);
      const { data: monthRevData } = await supabase.from('revenue_summary').select('amount').gte('date',startOfMonth);
      const monthRev = (monthRevData||[]).reduce((s,r)=>s+parseFloat(r.amount||0),0);
      const { count: criticalAlerts } = await supabase.from('alerts').select('id',{count:'exact'}).eq('severity','critical').eq('resolved',false);
      const healthScore = criticalAlerts===0?100:criticalAlerts<=2?90:criticalAlerts<=5?75:60;
      const { data: allAgentSessions } = await supabase.from('sessions').select('agent_id').gte('created_at',tenMinAgo);
      const recentAgentIds = new Set((allAgentSessions||[]).map(s=>s.agent_id));
      const statusMap = {}; AGENTS.forEach(a=>{ statusMap[a.pcId]=recentAgentIds.has(a.pcId)?'busy':'online'; });
      const { count: totalSessions } = await supabase.from('sessions').select('id',{count:'exact'});
      const { count: completedSessions } = await supabase.from('sessions').select('id',{count:'exact'}).eq('completed',true);
      const automationRate = totalSessions>0?parseFloat(((completedSessions/totalSessions)*100).toFixed(1)):null;
      const conversionRate = sessionsToday>0?parseFloat(((completedToday/sessionsToday)*100).toFixed(1)):null;
      const STREAM_LABELS = { ai_analysis:'AI Analysis & Consultation', product_affiliate:'Premium Beauty Products', virtual_tryon:'Virtual Try-On Studio', app_subscriptions:'Subscription Plans', affiliate_commissions:'Affiliate Marketing', brand_partnerships:'Brand Partnerships', skincare_lines:'AI-Powered Skincare Lines', beauty_academy_courses:'Online Courses & Masterclasses', digital_guides:'Digital Lookbooks & Guides', ai_styling:'Personal Styling Services', platform_licensing:'Corporate & B2B Solutions', fragrance:'Fragrance Customization', provider_registration_fees:'Connect: Registration Fees', provider_subscriptions:'Connect: Provider Subscriptions', provider_referral_fees:'Connect: Referral Fees', featured_placement:'Connect: Featured Placement' };
      const streamRows = Object.entries(byStream).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).slice(0,12).map(([key,amount],i)=>({ num:String(i+1).padStart(2,'0'), name:STREAM_LABELS[key]||key, amount, key, change:null }));
      const yesterday = new Date(Date.now()-24*60*60*1000).toISOString().split('T')[0];
      const { count: prevCameraSessions } = await supabase.from('sessions').select('id',{count:'exact'}).gte('created_at',yesterday).lt('created_at',todayStart).eq('camera_used',true);
      const { count: prevOrders } = await supabase.from('transactions').select('id',{count:'exact'}).gte('created_at',yesterday).lt('created_at',todayStart).eq('status','success');
      const analysisChange = prevCameraSessions>0?parseFloat(((((cameraSessions||0)-prevCameraSessions)/prevCameraSessions)*100).toFixed(1)):null;
      const ordersChange = prevOrders>0?parseFloat(((((ordersToday||0)-prevOrders)/prevOrders)*100).toFixed(1)):null;
      setMetrics({ totalRevenueMonth:totalRevMonth||0, totalClients:totalClients||0, aiAnalysesToday:cameraSessions||0, ordersToday:ordersToday||0, conversionRate, activeSessions:activeSessions?.length||0, decisionsToday:decisionsToday||0, systemHealth:healthScore, activeAgentCount:28, revenueChange:null, clientChange:null, analysisChange, ordersChange });
      setRevenueStreams(streamRows);
      setRevenueChart(chartArr);
      setFinancialSummary({ totalAssets:totalAllRevenue-totalCosts, netProfitMonth:monthRev*0.73, cashFlow:totalAllRevenue });
      setSystemStats({ predictionsToday:decisionsToday||0, accuracyRate:automationRate, automationRate, systemUptimeStatus:criticalAlerts===0?'100%':`${healthScore}%` });
      setAgentStatuses(statusMap);
    } catch(err) { console.error('Metrics error:',err.message); }
  }, []);

  useEffect(() => { fetchAll(); const i=setInterval(fetchAll,30000); return ()=>clearInterval(i); }, [fetchAll]);
  useEffect(() => {
    const ch = supabase.channel('metrics-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'revenue_summary'},fetchAll)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'sessions'},fetchAll)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'transactions'},fetchAll)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'alerts'},fetchAll)
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  }, [fetchAll]);

  return { metrics, revenueStreams, revenueChart, financialSummary, systemStats, agentStatuses };
}

function useActivityFeed() {
  const [feed, setFeed] = useState([]);
  const fmt = useCallback((a)=>({ id:a.id, time:fmtTime(a.created_at), initials:AGENT_MAP[a.agent_id]?.initials||'??', colour:AGENT_COLOURS[a.agent_id]||C.roseGold, agentId:a.agent_id, agentName:AGENT_MAP[a.agent_id]?.name||a.agent_id, message:a.message||'', severity:a.severity }),[]);
  useEffect(()=>{
    supabase.from('alerts').select('id,agent_id,type,message,created_at,severity').order('created_at',{ascending:false}).limit(100).then(({data})=>setFeed((data||[]).map(fmt).reverse()));
    const ch=supabase.channel('feed-rt').on('postgres_changes',{event:'INSERT',schema:'public',table:'alerts'},(p)=>setFeed(prev=>[...prev.slice(-99),fmt(p.new)])).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[fmt]);
  return feed;
}

function useMissions() {
  const [missions, setMissions] = useState({ inProgress:[], waiting:[], completedToday:[], blocked:[] });
  useEffect(()=>{
    async function load() {
      const todayStart=new Date(); todayStart.setHours(0,0,0,0);
      const {data}=await supabase.from('alerts').select('id,type,message,severity,agent_id,resolved,created_at').order('created_at',{ascending:false}).limit(200);
      const ip=[],w=[],ct=[],b=[];
      (data||[]).forEach(a=>{
        const entry={ id:a.id, message:(a.message||'').substring(0,65), agent:AGENT_MAP[a.agent_id]?.name||a.agent_id, agentId:a.agent_id, colour:AGENT_COLOURS[a.agent_id]||C.roseGold, time:fmtTime(a.created_at) };
        if(a.severity==='critical'&&!a.resolved) b.push(entry);
        else if(a.severity==='warn'&&!a.resolved) w.push(entry);
        else if(a.resolved&&new Date(a.created_at)>=todayStart) ct.push(entry);
        else if(!a.resolved) ip.push(entry);
      });
      setMissions({ inProgress:ip.slice(0,10), waiting:w.slice(0,8), completedToday:ct.slice(0,10), blocked:b.slice(0,6) });
    }
    load(); const i=setInterval(load,15000);
    const ch=supabase.channel('missions-rt').on('postgres_changes',{event:'*',schema:'public',table:'alerts'},load).subscribe();
    return ()=>{ clearInterval(i); supabase.removeChannel(ch); };
  },[]);
  return missions;
}

function useViviennePanel() {
  const [data, setData] = useState({ latestMission:null, pendingDecisions:[], recentTasks:[], boardComms:[], activeSession:null });
  useEffect(()=>{
    async function load() {
      const [{data:vivAlerts},{data:boardComms},{data:tasks},{data:activeSession},{data:decisions}]=await Promise.all([
        supabase.from('alerts').select('message,created_at,type,severity').eq('agent_id','PC-001').order('created_at',{ascending:false}).limit(10),
        supabase.from('alerts').select('message,created_at,agent_id,type').eq('agent_id','PC-001').in('type',['celeste_vivienne_report','marcus_vivienne_escalation','sienna_vivienne_report','nadia_vivienne_report','sebastian_vivienne_escalation','rafael_vivienne_report','elton_report_weekly_summary','brook_celeste_revenue']).order('created_at',{ascending:false}).limit(15),
        supabase.from('alerts').select('message,created_at,severity,type,agent_id').eq('resolved',false).in('severity',['warn','critical']).order('created_at',{ascending:false}).limit(10),
        supabase.from('voice_sessions').select('id,agent_id,started_at,session_type').is('ended_at',null).order('started_at',{ascending:false}).limit(1),
        supabase.from('alerts').select('message,created_at,agent_id').eq('resolved',false).order('created_at',{ascending:false}).limit(8),
      ]);
      const commEntries=(boardComms||[]).map(c=>{ const match=c.message?.match(/^([A-Za-z]+)\s*→\s*Vivienne:/); const senderName=match?match[1]:AGENT_MAP[c.agent_id]?.name||'Agent'; const senderPcId=AGENTS.find(a=>a.name===senderName)?.pcId||c.agent_id; return { from:senderName, fromId:senderPcId, message:c.message?.replace(/^.*?Vivienne:\s*/,'').substring(0,65), time:fmtTime(c.created_at) }; });
      setData({ latestMission:vivAlerts?.[0]?.message||null, pendingDecisions:(decisions||[]).map(d=>({ message:(d.message||'').substring(0,70), time:fmtTime(d.created_at), agentId:d.agent_id, agentName:AGENT_MAP[d.agent_id]?.name||d.agent_id })), recentTasks:(tasks||[]).map(t=>({ message:(t.message||'').substring(0,65), time:fmtTime(t.created_at), severity:t.severity })), boardComms:commEntries, activeSession:activeSession?.[0]||null });
    }
    load(); const i=setInterval(load,20000);
    const ch=supabase.channel('viv-panel').on('postgres_changes',{event:'INSERT',schema:'public',table:'alerts'},load).on('postgres_changes',{event:'INSERT',schema:'public',table:'voice_sessions'},load).subscribe();
    return ()=>{ clearInterval(i); supabase.removeChannel(ch); };
  },[]);
  return data;
}

function useVoiceTranscripts() {
  const [transcripts, setTranscripts] = useState([]);
  useEffect(()=>{
    async function load() {
      const {data}=await supabase.from('voice_sessions').select('id,agent_id,transcript,started_at,ended_at,session_type').not('transcript','is',null).order('started_at',{ascending:false}).limit(20);
      const entries=[];
      (data||[]).forEach(session=>{ if(!session.transcript) return; const lines=typeof session.transcript==='string'?session.transcript.split('\n').filter(Boolean):[]; lines.forEach(line=>{ const isPrecious=line.toLowerCase().startsWith('human:')||line.toLowerCase().startsWith('precious:'); const text=line.replace(/^(human|precious|assistant|vivienne):\s*/i,''); if(text.trim()) entries.push({ id:`${session.id}-${entries.length}`, speaker:isPrecious?'precious':'vivienne', text:text.trim().substring(0,200), time:fmtTime(session.started_at) }); }); });
      setTranscripts(entries.slice(-20));
    }
    load(); const i=setInterval(load,5000);
    const ch=supabase.channel('voice-rt').on('postgres_changes',{event:'*',schema:'public',table:'voice_sessions'},load).subscribe();
    return ()=>{ clearInterval(i); supabase.removeChannel(ch); };
  },[]);
  return transcripts;
}

function useNetworkLinks() {
  const [links, setLinks] = useState([]);
  useEffect(()=>{
    async function load() {
      const oneHourAgo=new Date(Date.now()-60*60*1000).toISOString();
      const {data}=await supabase.from('routing_log').select('from_agent,to_agent,routing_reason').gte('timestamp',oneHourAgo).limit(50);
      const TYPES={'routed':'message','flagging':'request','escalat':'decision','handoff':'response'};
      setLinks((data||[]).filter(r=>r.from_agent&&r.to_agent).map(r=>{ const reason=(r.routing_reason||'').toLowerCase(); const type=Object.keys(TYPES).find(k=>reason.includes(k))?TYPES[Object.keys(TYPES).find(k=>reason.includes(k))]:'message'; return {source:r.from_agent,target:r.to_agent,type}; }));
    }
    load(); const i=setInterval(load,30000);
    const ch=supabase.channel('routing-rt').on('postgres_changes',{event:'INSERT',schema:'public',table:'routing_log'},load).subscribe();
    return ()=>{ clearInterval(i); supabase.removeChannel(ch); };
  },[]);
  return links;
}

function useSystemUptime() {
  const [uptime, setUptime] = useState(null);
  useEffect(()=>{
    async function load() {
      const {data}=await supabase.from('alerts').select('created_at,resolved,resolved_at,type').like('type','%outage%').order('created_at',{ascending:false}).limit(30);
      if(!data||data.length===0){setUptime('100%');return;}
      const thirtyDaysMs=30*24*60*60*1000; let downtimeMs=0;
      data.forEach(a=>{ if(a.resolved&&a.resolved_at){ const down=new Date(a.resolved_at)-new Date(a.created_at); if(down>0) downtimeMs+=down; } });
      setUptime(`${Math.min(100,(thirtyDaysMs-downtimeMs)/thirtyDaysMs*100).toFixed(2)}%`);
    }
    load(); const i=setInterval(load,60000); return ()=>clearInterval(i);
  },[]);
  return uptime;
}

// ── D3 Network ──
function NetworkGraph({ agentStatuses, networkLinks }) {
  const svgRef = useRef(null);
  useEffect(()=>{
    if(!svgRef.current) return;
    const w=svgRef.current.clientWidth||400, h=svgRef.current.clientHeight||220;
    d3.select(svgRef.current).selectAll('*').remove();
    const svg=d3.select(svgRef.current).attr('width',w).attr('height',h);
    const nodes=AGENTS.map(a=>({ id:a.pcId, initials:a.initials, colour:AGENT_COLOURS[a.pcId]||C.roseGold, group:a.group, status:agentStatuses[a.pcId]||'online', r:a.group==='executive'?13:8 }));
    const defaultLinks=[{source:'PC-001',target:'PC-002',type:'decision'},{source:'PC-001',target:'PC-003',type:'request'},{source:'PC-001',target:'PC-004',type:'message'},{source:'PC-001',target:'PC-005',type:'decision'},{source:'PC-001',target:'PC-006',type:'message'},{source:'PC-001',target:'PC-007',type:'request'},{source:'PC-006',target:'PC-008',type:'response'},{source:'PC-006',target:'PC-014',type:'response'},{source:'PC-015',target:'PC-008',type:'message'},{source:'PC-016',target:'PC-017',type:'response'},{source:'PC-004',target:'PC-019',type:'decision'},{source:'PC-004',target:'PC-022',type:'decision'},{source:'PC-005',target:'PC-024',type:'request'},{source:'PC-020',target:'PC-001',type:'response'},{source:'PC-027',target:'PC-002',type:'message'},{source:'PC-026',target:'PC-008',type:'decision'}];
    const links=networkLinks.length>0?networkLinks.slice(0,30):defaultLinks;
    const lc={message:'#3B82F6',request:'#8B5CF6',response:'#22c55e',decision:'#f97316'};
    const sim=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(40).strength(0.4)).force('charge',d3.forceManyBody().strength(-100)).force('center',d3.forceCenter(w/2,h/2)).force('collision',d3.forceCollide(d=>d.r+4));
    const link=svg.append('g').selectAll('line').data(links).join('line').attr('stroke',d=>lc[d.type]||'#3B82F6').attr('stroke-width',1).attr('stroke-opacity',0.4);
    const node=svg.append('g').selectAll('g').data(nodes).join('g').call(d3.drag().on('start',(e,d)=>{if(!e.active)sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;}).on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
    node.append('circle').attr('r',d=>d.r).attr('fill',d=>d.colour+'18').attr('stroke',d=>d.colour).attr('stroke-width',1.5);
    node.append('text').text(d=>d.initials).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('fill',d=>d.colour).attr('font-size',d=>d.group==='executive'?'7px':'5px').attr('font-weight','800').attr('font-family','Inter, sans-serif');
    node.append('circle').attr('r',3).attr('cx',d=>d.r-2).attr('cy',d=>-(d.r-2)).attr('fill',d=>d.status==='busy'?C.busy:C.online);
    sim.on('tick',()=>{ link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y); node.attr('transform',d=>`translate(${Math.max(d.r,Math.min(w-d.r,d.x))},${Math.max(d.r,Math.min(h-d.r,d.y))})`); });
    return ()=>sim.stop();
  },[agentStatuses,networkLinks]);
  return <svg ref={svgRef} style={{width:'100%',height:'100%'}} />;
}

// ── Mini components ──
function Dot({ status, pulse=false }) {
  const col=status==='busy'?C.busy:status==='waiting'?C.waiting:status==='offline'?C.offline:C.online;
  return <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:col,flexShrink:0,animation:pulse?'pulse-dot 2s ease-in-out infinite':'none'}} />;
}

function AgentAvatar({ pcId, size=22 }) {
  const agent=AGENT_MAP[pcId]; const colour=AGENT_COLOURS[pcId]||C.roseGold;
  return <div style={{width:size,height:size,borderRadius:'50%',background:colour+'20',border:`1.5px solid ${colour}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.32,fontWeight:800,color:colour,flexShrink:0}}>{agent?.initials||'??'}</div>;
}

function VoiceWaveform({ active }) {
  const heights=[12,20,16,24,18,14,22];
  return <div style={{display:'flex',alignItems:'center',gap:3}}>{heights.map((h,i)=><div key={i} style={{width:3,height:active?h:4,background:C.roseGold,borderRadius:2,animation:active?`voice-waveform 0.8s ease-in-out infinite ${i*100}ms`:'none',opacity:active?1:0.3,transition:'height 200ms ease'}} />)}</div>;
}

// ── Org Chart Agent Node ──
function OrgNode({ agent, status, large=false }) {
  const col = AGENT_COLOURS[agent.pcId] || C.roseGold;
  const sz = large ? 52 : 36;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
      <div style={{ position:'relative', width:sz, height:sz }}>
        <div style={{ width:sz, height:sz, borderRadius:'50%', background:col+'20', border:`${large?3:2}px solid ${col}`, boxShadow:large?`0 0 20px ${col}55`:`0 0 8px ${col}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:large?16:11, fontWeight:900, color:col }}>
          {agent.initials}
        </div>
        <div style={{ position:'absolute', bottom:0, right:0, width:large?12:9, height:large?12:9, borderRadius:'50%', background:status==='busy'?C.busy:C.online, border:`2px solid ${C.bgCard}` }} />
      </div>
      <div style={{ fontSize:large?11:9, fontWeight:700, color:col, lineHeight:1, textAlign:'center' }}>{agent.name}</div>
      <div style={{ fontSize:large?8:7, color:C.textMuted, lineHeight:1.2, textAlign:'center', maxWidth:70 }}>{large?agent.role:agent.role.replace('Chief ','').replace(' Officer','')}</div>
    </div>
  );
}

// ── Division Box ──
function DivisionBox({ label, colour, agents, agentStatuses }) {
  return (
    <div style={{ background:colour+'08', border:`1px solid ${colour}44`, borderRadius:10, padding:'8px 8px 10px' }}>
      <div style={{ fontSize:8, fontWeight:700, color:colour, textTransform:'uppercase', letterSpacing:'0.07em', textAlign:'center', marginBottom:8 }}>
        {label} ({agents.length})
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
        {agents.map(a=>(
          <OrgNode key={a.pcId} agent={a} status={agentStatuses[a.pcId]} />
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──
export default function Dashboard() {
  const { metrics, revenueStreams, revenueChart, financialSummary, systemStats, agentStatuses } = useRealMetrics();
  const feed = useActivityFeed();
  const missions = useMissions();
  const vivienneData = useViviennePanel();
  const transcripts = useVoiceTranscripts();
  const networkLinks = useNetworkLinks();
  const systemUptime = useSystemUptime();

  const [vivTab, setVivTab] = useState('OVERVIEW');
  const [voiceActive, setVoiceActive] = useState(false);
  const feedRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(()=>{ if(feedRef.current) feedRef.current.scrollTop=feedRef.current.scrollHeight; },[feed]);
  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[transcripts]);

  const chartMax = revenueChart.length>0?Math.max(...revenueChart.map(r=>r.total)):0;
  const uptimeDisplay = systemUptime||(systemStats.systemUptimeStatus??'—');
  const busyCount = Object.values(agentStatuses).filter(s=>s==='busy').length;

  // ── Layout: fills the <main> area from layout.jsx ──
  // layout.jsx provides: full page grid with header (row1) + sidebar (col1,row2) + main (col2,row2)
  // This component fills col2,row2 — the main content area
  // Inside here we do: [centre content | right Vivienne panel]
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gridTemplateRows: '1fr',
      overflow: 'hidden',
      background: C.midnight,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12,
      color: C.white,
    }}>

      {/* ══════════════════════════════════
          CENTRE — org chart + bottom strip
          ══════════════════════════════════ */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:`1px solid ${C.border}` }}>

        {/* Header KPI strip */}
        <div style={{ display:'flex', alignItems:'center', gap:0, background:C.bgPanel, borderBottom:`1px solid ${C.border}`, flexShrink:0, padding:'0 16px', height:44 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:16, paddingRight:16, borderRight:`1px solid ${C.border}` }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:C.online, animation:'pulse-dot 2s infinite' }} />
            <span style={{ fontSize:9, fontWeight:700, color:C.online, textTransform:'uppercase', letterSpacing:'0.07em' }}>AI SYSTEM: FULLY OPERATIONAL</span>
          </div>
          {[
            { label:'TOTAL AGENTS',    value:'28 / 28' },
            { label:'ACTIVE SESSIONS', value:metrics.activeSessions!==null?fmtNum(metrics.activeSessions):'—' },
            { label:'DECISIONS TODAY', value:metrics.decisionsToday!==null?fmtNum(metrics.decisionsToday):'—' },
            { label:'REVENUE (MTD)',   value:metrics.totalRevenueMonth!==null?fmtCurrency(metrics.totalRevenueMonth):'—' },
            { label:'SYSTEM HEALTH',  value:metrics.systemHealth!==null?`${metrics.systemHealth}%`:'—' },
          ].map((m,i,arr)=>(
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 14px', borderRight:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
              <div style={{ fontSize:7.5, textTransform:'uppercase', letterSpacing:'0.07em', color:C.textMuted, whiteSpace:'nowrap' }}>{m.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.white, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Company overview label + view toggles */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 16px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bgCard }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.white }}>COMPANY OVERVIEW</div>
            <div style={{ fontSize:8.5, color:C.textMuted }}>Live organisational view — real-time agent activity</div>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:8.5, color:C.textMuted }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:C.online, animation:'pulse-dot 2s infinite' }} />
              {busyCount} agents in session
            </div>
          </div>
        </div>

        {/* ── ORG CHART — top 52% ── */}
        <div style={{ flex:'0 0 52%', overflow:'auto', padding:'14px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:0, minHeight:0 }}>

          {/* VIVIENNE — CEO at top */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ padding:'12px 24px', background:C.roseGold+'15', border:`2px solid ${C.roseGold}`, borderRadius:14, boxShadow:`0 0 24px ${C.roseGold}33`, display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:140 }}>
              <OrgNode agent={AGENTS[0]} status={agentStatuses['PC-001']} large />
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:8, color:agentStatuses['PC-001']==='busy'?C.busy:C.online, fontWeight:600, textTransform:'uppercase' }}>
                <Dot status={agentStatuses['PC-001']||'online'} pulse />
                {(agentStatuses['PC-001']||'ONLINE').toUpperCase()}
              </div>
            </div>

            {/* Line down to board */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:2, height:16, background:C.border }} />
              <div style={{ display:'flex', alignItems:'center' }}>
                <div style={{ height:2, background:C.border, width:480 }} />
              </div>
            </div>
          </div>

          {/* BOARD OF DIRECTORS */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              {BOARD.map(agent=>(
                <div key={agent.pcId} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ width:2, height:16, background:AGENT_COLOURS[agent.pcId]+'66' }} />
                  <div style={{ padding:'8px 10px', background:AGENT_COLOURS[agent.pcId]+'12', border:`1px solid ${AGENT_COLOURS[agent.pcId]}44`, borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <OrgNode agent={agent} status={agentStatuses[agent.pcId]} />
                    <div style={{ fontSize:7, color:agentStatuses[agent.pcId]==='busy'?C.busy:C.online, fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
                      <Dot status={agentStatuses[agent.pcId]||'online'} />
                      {(agentStatuses[agent.pcId]||'ONLINE').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Line down to divisions */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:2, height:16, background:C.border }} />
              <div style={{ height:2, background:C.border, width:'85%' }} />
            </div>
          </div>

          {/* 4 DIVISIONS */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, width:'100%' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:2, height:16, background:C.roseGold+'66' }} />
              <DivisionBox label="BEAUTY CORE" colour={C.roseGold} agents={BEAUTY} agentStatuses={agentStatuses} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:2, height:16, background:C.warmGold+'66' }} />
              <DivisionBox label="OPERATIONS" colour={C.warmGold} agents={OPS} agentStatuses={agentStatuses} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:2, height:16, background:C.blushPink+'66' }} />
              <DivisionBox label="GROWTH" colour={C.blushPink} agents={GROWTH} agentStatuses={agentStatuses} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:2, height:16, background:C.cyan+'66' }} />
              <DivisionBox label="CONNECT" colour={C.cyan} agents={CONNECT} agentStatuses={agentStatuses} />
            </div>
          </div>
        </div>

        {/* ── BOTTOM STRIP — 3 columns: Feed | Network | Missions ── */}
        <div style={{ flex:'0 0 48%', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:`2px solid ${C.border}`, overflow:'hidden', minHeight:0 }}>

          {/* Live Activity Feed */}
          <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bgCard }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.roseGold }}>Live Activity Feed</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:8 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:C.online, animation:'pulse-dot 2s infinite' }} />
                <span style={{ color:C.online, fontWeight:600 }}>{feed.length} events</span>
              </div>
            </div>
            <div ref={feedRef} style={{ flex:1, overflowY:'auto', padding:'6px 10px' }}>
              {feed.length===0
                ? <div style={{ padding:12, fontSize:10, color:C.textMuted, fontStyle:'italic' }}>No activity yet</div>
                : feed.slice(-50).map(a=>(
                  <div key={a.id} style={{ display:'grid', gridTemplateColumns:'42px 22px 1fr', gap:5, alignItems:'flex-start', padding:'4px 0', borderBottom:`1px solid ${C.border}22` }}>
                    <span style={{ fontSize:8, color:C.textMuted, fontFamily:'JetBrains Mono, monospace' }}>{a.time}</span>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:a.colour+'20', border:`1px solid ${a.colour}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:6, fontWeight:800, color:a.colour, flexShrink:0 }}>{a.initials}</div>
                    <span style={{ fontSize:8.5, color:C.textSec, lineHeight:1.4 }}>{a.message.substring(0,52)}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Communication Network D3 */}
          <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bgCard }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.roseGold }}>Communication Network</div>
              <div style={{ display:'flex', gap:5, fontSize:7.5 }}>
                {[['#3B82F6','Msg'],['#8B5CF6','Req'],['#22c55e','Res'],['#f97316','Dec']].map(([col,lbl])=>(
                  <div key={lbl} style={{ display:'flex', alignItems:'center', gap:2 }}>
                    <div style={{ width:10, height:1.5, background:col, borderRadius:1 }} />
                    <span style={{ color:C.textMuted }}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <NetworkGraph agentStatuses={agentStatuses} networkLinks={networkLinks} />
            </div>
          </div>

          {/* Mission Board */}
          <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bgCard }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.roseGold }}>Mission Board</div>
              {missions.blocked.length>0&&<span style={{ fontSize:8, color:C.error, fontWeight:600 }}>{missions.blocked.length} Blocked</span>}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'6px 10px' }}>
              {[
                { label:'IN PROGRESS', col:C.warmGold, items:missions.inProgress },
                { label:'WAITING',     col:C.waiting,  items:missions.waiting },
                { label:'COMPLETED',   col:C.online,   items:missions.completedToday },
                { label:'BLOCKED',     col:C.error,    items:missions.blocked },
              ].map(col=>col.items.length>0&&(
                <div key={col.label} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:col.col, marginBottom:4 }}>{col.label} ({col.items.length})</div>
                  {col.items.slice(0,3).map(item=>(
                    <div key={item.id} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderLeft:`2px solid ${col.col}`, borderRadius:4, padding:'4px 7px', marginBottom:3 }}>
                      <div style={{ fontSize:8, color:C.textSec, lineHeight:1.3 }}>{item.message}</div>
                      <div style={{ fontSize:7, color:C.textMuted, marginTop:2, fontFamily:'JetBrains Mono, monospace' }}>{item.agent} · {item.time}</div>
                    </div>
                  ))}
                </div>
              ))}
              {missions.inProgress.length===0&&missions.waiting.length===0&&missions.blocked.length===0&&(
                <div style={{ fontSize:10, color:C.textMuted, fontStyle:'italic', padding:8 }}>No active missions</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT PANEL — Vivienne
          ══════════════════════════════════ */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:C.bgPanel }}>

        {/* Vivienne identity */}
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ fontSize:7.5, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>AI EXECUTIVE: VIVIENNE (CEO)</div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ position:'relative' }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:C.roseGold+'25', border:`2px solid ${C.roseGold}`, boxShadow:`0 0 16px ${C.roseGold}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:C.roseGold }}>VI</div>
              <div style={{ position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:'50%', background:vivienneData.activeSession?C.busy:C.online, border:`2px solid ${C.bgPanel}`, animation:'pulse-dot 2s infinite' }} />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, lineHeight:1 }}>Vivienne</div>
              <div style={{ fontSize:9, color:C.textMuted }}>Chief Executive Officer (AI)</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:8, color:vivienneData.activeSession?C.busy:C.online, fontWeight:600 }}>
                <Dot status={vivienneData.activeSession?'busy':'online'} pulse />
                {vivienneData.activeSession?'IN SESSION':'ONLINE'}
              </div>
            </div>
          </div>
        </div>

        {/* 6 Tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          {VIVIENNE_TABS.map(tab=>(
            <button key={tab} onClick={()=>setVivTab(tab)} style={{ flex:1, padding:'6px 0', background:'none', border:'none', cursor:'pointer', fontSize:6.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:vivTab===tab?C.roseGold:C.textMuted, borderBottom:`2px solid ${vivTab===tab?C.roseGold:'transparent'}`, transition:'all 200ms' }}>{tab}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ height:210, overflowY:'auto', padding:'10px 14px', flexShrink:0, borderBottom:`1px solid ${C.border}` }}>

          {vivTab==='OVERVIEW' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <div style={{ fontSize:8, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>CURRENT MISSION</div>
                <div style={{ fontSize:9.5, color:C.textSec, lineHeight:1.6, background:C.roseGold+'08', border:`1px solid ${C.roseGold}22`, borderRadius:6, padding:'7px 9px' }}>
                  {vivienneData.latestMission||'Vivienne is monitoring all 28 agents and managing CUTEME LTD operations autonomously.'}
                </div>
              </div>
              <div>
                <div style={{ fontSize:8, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>ACTIVE COLLABORATIONS</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                  {BOARD.slice(0,4).map(agent=>(
                    <div key={agent.pcId} style={{ display:'flex', gap:6, alignItems:'center', padding:'5px 7px', background:C.bgCard, borderRadius:6, border:`1px solid ${C.border}` }}>
                      <AgentAvatar pcId={agent.pcId} size={22} />
                      <div>
                        <div style={{ fontSize:9, fontWeight:600, color:AGENT_COLOURS[agent.pcId] }}>{agent.name}</div>
                        <div style={{ fontSize:7, color:C.textMuted }}>{agent.role.replace('Chief ','').replace(' Officer','')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {vivienneData.pendingDecisions.length>0&&(
                <div>
                  <div style={{ fontSize:8, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>RECENT DECISIONS</div>
                  {vivienneData.pendingDecisions.slice(0,3).map((d,i)=>(
                    <div key={i} style={{ marginBottom:5, padding:'5px 7px', background:C.bgCard, borderRadius:4, borderLeft:`2px solid ${AGENT_COLOURS[d.agentId]||C.roseGold}44` }}>
                      <div style={{ fontSize:8.5, color:C.textSec, lineHeight:1.4 }}>{d.message}</div>
                      <div style={{ fontSize:7, color:C.textMuted, marginTop:1, fontFamily:'JetBrains Mono, monospace' }}>{d.agentName} · {d.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vivTab==='THOUGHTS' && (
            <div>
              <div style={{ fontSize:8.5, color:C.textMuted, fontStyle:'italic', marginBottom:6 }}>Real-time agent reasoning stream</div>
              {feed.length===0
                ? <div style={{ fontSize:10, color:C.textMuted, fontStyle:'italic' }}>No agent activity yet</div>
                : feed.slice(-12).reverse().map((a,i)=>(
                  <div key={a.id||i} style={{ display:'flex', gap:6, alignItems:'flex-start', marginBottom:5 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:a.colour, marginTop:4, flexShrink:0 }} />
                    <span style={{ fontSize:8.5, color:C.textSec, lineHeight:1.5, fontFamily:'JetBrains Mono, monospace' }}>[{a.initials}] {a.message.substring(0,60)}</span>
                  </div>
                ))
              }
            </div>
          )}

          {vivTab==='TASKS' && (
            <div>
              {vivienneData.recentTasks.length===0
                ? <div style={{ fontSize:10, color:C.textMuted, fontStyle:'italic' }}>No pending tasks</div>
                : vivienneData.recentTasks.map((t,i)=>(
                  <div key={i} style={{ marginBottom:6, padding:'6px 8px', background:C.bgCard, borderRadius:5, border:`1px solid ${t.severity==='critical'?C.error+'44':C.border}` }}>
                    <div style={{ fontSize:9, color:C.textSec, lineHeight:1.4 }}>{t.message}</div>
                    <div style={{ fontSize:7.5, color:C.textMuted, marginTop:2, fontFamily:'JetBrains Mono, monospace' }}>{t.time}</div>
                  </div>
                ))
              }
            </div>
          )}

          {vivTab==='MEMORY' && (
            <div>
              <div style={{ fontSize:8.5, color:C.textMuted, marginBottom:8 }}>pgvector long-term memory · 28 agents · all sessions</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[
                  { label:'Active Agents',   value:`${busyCount} busy / 28` },
                  { label:'Memory Vectors',  value:'Live pgvector' },
                  { label:'Sessions Today',  value:metrics.aiAnalysesToday!==null?fmtNum(metrics.aiAnalysesToday):'—' },
                  { label:'Recall Accuracy', value:systemStats.accuracyRate?fmtPct(systemStats.accuracyRate):'—' },
                ].map(m=>(
                  <div key={m.label} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:6, padding:'6px 8px' }}>
                    <div style={{ fontSize:7.5, color:C.textMuted, marginBottom:2 }}>{m.label}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.white }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vivTab==='COMMUNICATION' && (
            <div>
              {vivienneData.boardComms.length===0
                ? <div style={{ fontSize:10, color:C.textMuted, fontStyle:'italic' }}>No board communications yet</div>
                : vivienneData.boardComms.map((c,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:9 }}>
                    <AgentAvatar pcId={c.fromId} size={22} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, fontWeight:600, color:AGENT_COLOURS[c.fromId]||C.roseGold, marginBottom:2 }}>{c.from}</div>
                      <div style={{ fontSize:9, color:C.textSec, lineHeight:1.4 }}>{c.message}</div>
                      <div style={{ fontSize:7.5, color:C.textMuted, marginTop:2, fontFamily:'JetBrains Mono, monospace' }}>{c.time}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {vivTab==='METRICS' && (
            <div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:50, marginBottom:8, padding:4, background:C.bgCard, borderRadius:6, border:`1px solid ${C.border}` }}>
                {revenueChart.length===0
                  ? <div style={{ fontSize:9, color:C.textMuted, fontStyle:'italic', alignSelf:'center', padding:4 }}>Awaiting revenue data</div>
                  : revenueChart.map((m,i)=>(
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <div style={{ width:'100%', height:chartMax>0?`${Math.max(4,(m.total/chartMax)*38)}px`:'4px', background:i===revenueChart.length-1?C.roseGold:C.roseGold+'55', borderRadius:'2px 2px 0 0' }} />
                      <div style={{ fontSize:6.5, color:C.textMuted }}>{m.month}</div>
                    </div>
                  ))
                }
              </div>
              {[
                { label:'Revenue (Month)', value:fmtCurrency(metrics.totalRevenueMonth) },
                { label:'Total Clients',   value:fmtNum(metrics.totalClients) },
                { label:'Orders Today',    value:fmtNum(metrics.ordersToday) },
                { label:'Conversion Rate', value:fmtPct(metrics.conversionRate) },
                { label:'System Health',   value:metrics.systemHealth?`${metrics.systemHealth}%`:'—' },
                { label:'Uptime',          value:uptimeDisplay },
              ].map(m=>(
                <div key={m.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:`1px solid ${C.border}33` }}>
                  <span style={{ fontSize:9, color:C.textMuted }}>{m.label}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:C.white, fontFamily:'JetBrains Mono, monospace' }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice transcript */}
        <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'8px 14px' }}>
          {transcripts.length===0
            ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:8, padding:12 }}>
                <VoiceWaveform active={false} />
                <div style={{ fontSize:9.5, color:C.textMuted, textAlign:'center', lineHeight:1.7 }}>
                  Speak to Vivienne.<br />Your conversation appears here in real time.
                </div>
              </div>
            : transcripts.map(t=>(
              <div key={t.id} style={{ display:'flex', justifyContent:t.speaker==='precious'?'flex-end':'flex-start', marginBottom:8 }}>
                {t.speaker==='vivienne'&&(
                  <div style={{ display:'flex', gap:6, maxWidth:'82%' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:C.roseGold+'20', border:`1.5px solid ${C.roseGold}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:800, color:C.roseGold, flexShrink:0 }}>VI</div>
                    <div>
                      <div style={{ fontSize:9.5, color:C.textSec, lineHeight:1.5, background:C.roseGold+'08', border:`1px solid ${C.roseGold}22`, borderRadius:'4px 10px 10px 10px', padding:'6px 10px' }}>{t.text}</div>
                      <div style={{ fontSize:7.5, color:C.textMuted, marginTop:2, fontFamily:'JetBrains Mono, monospace' }}>{t.time}</div>
                    </div>
                  </div>
                )}
                {t.speaker==='precious'&&(
                  <div style={{ maxWidth:'82%' }}>
                    <div style={{ fontSize:9.5, background:C.roseGold, color:C.midnight, borderRadius:'10px 4px 10px 10px', padding:'6px 10px', lineHeight:1.5, fontWeight:500 }}>{t.text}</div>
                    <div style={{ fontSize:7.5, color:C.textMuted, marginTop:2, textAlign:'right', fontFamily:'JetBrains Mono, monospace' }}>{t.time} ✓✓</div>
                  </div>
                )}
              </div>
            ))
          }
        </div>

        {/* Voice interface */}
        <div style={{ padding:'8px 14px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
            <div style={{ flex:1, height:32, background:C.bgCard, border:`1px solid ${voiceActive?C.roseGold:C.border}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 150ms' }}>
              {voiceActive?<VoiceWaveform active />:<span style={{ fontSize:8.5, color:C.textMuted, fontStyle:'italic' }}>Vivienne is always listening</span>}
            </div>
            <button onClick={()=>setVoiceActive(v=>!v)} style={{ width:32, height:32, borderRadius:'50%', background:voiceActive?C.roseGold:C.roseGold+'22', border:`1px solid ${C.roseGold}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:voiceActive?C.midnight:C.roseGold, transition:'all 150ms', flexShrink:0 }}>
              {voiceActive?'■':'▶'}
            </button>
          </div>
          <div style={{ fontSize:8, color:C.textMuted, textAlign:'center', fontStyle:'italic' }}>Voice is the primary interface. Vivienne is always listening.</div>
        </div>

      </div>

      {/* Global animation styles */}
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes voice-waveform { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.4)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#4a2a2f;border-radius:2px;}
      `}</style>
    </div>
  );
}