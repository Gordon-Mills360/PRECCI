'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { roseGold:'#C4A494', midnight:'#1A0A0F', bgPanel:'#2a1a1f', bgCard:'#221218', border:'#4a2a2f', textSec:'#d4b8b0', textMuted:'#8a6a6a', online:'#22c55e', busy:'#f97316', waiting:'#eab308', error:'#ef4444', white:'#FFFFFF', warmGold:'#D4A853' };
const AGENT_COLOURS = { 'PC-001':'#C4A494','PC-002':'#D4A853','PC-003':'#F2B5B0','PC-004':'#F5DEB3','PC-005':'#8B3A3A','PC-006':'#F7F0E8','PC-007':'#3B82F6','PC-008':'#C4A494','PC-009':'#D4A853','PC-010':'#F2B5B0','PC-011':'#F5DEB3','PC-012':'#8B3A3A','PC-013':'#F7F0E8','PC-014':'#3B82F6','PC-015':'#4ECDC4','PC-016':'#00C8ED','PC-017':'#F5A623','PC-018':'#C4A494','PC-019':'#F2B5B0','PC-020':'#D4A853','PC-021':'#F7F0E8','PC-022':'#8B3A3A','PC-023':'#F5DEB3','PC-024':'#3B82F6','PC-025':'#4ECDC4','PC-026':'#00C8ED','PC-027':'#F5A623' };
const AGENT_NAMES = { 'PC-001':'Vivienne','PC-002':'Celeste','PC-003':'Marcus','PC-004':'Sienna','PC-005':'Rafael','PC-006':'Nadia','PC-007':'Sebastian','PC-008':'Luna','PC-009':'Zara','PC-010':'Mia','PC-011':'Isla','PC-012':'Remy','PC-013':'Cora','PC-014':'Drew','PC-015':'Sage','PC-016':'Belle','PC-017':'Nova','PC-018':'Piper','PC-019':'Nina','PC-020':'Elton','PC-021':'Lena','PC-022':'Finn','PC-023':'Aurora','PC-024':'Cole','PC-025':'Eva','PC-026':'Grace','PC-027':'Brook' };
function fmtTime(iso) { if(!iso) return ''; return new Date(iso).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); }

export default function MissionBoardPage() {
  const [missions, setMissions] = useState({ inProgress:[], waiting:[], completedToday:[], blocked:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const { data } = await supabase.from('alerts').select('id,type,message,severity,agent_id,resolved,created_at').order('created_at',{ascending:false}).limit(500);
      const ip=[],w=[],ct=[],b=[];
      (data||[]).forEach(a => {
        const entry = { id:a.id, message:(a.message||'').substring(0,80), agent:AGENT_NAMES[a.agent_id]||a.agent_id, agentId:a.agent_id, colour:AGENT_COLOURS[a.agent_id]||C.roseGold, time:fmtTime(a.created_at), type:a.type, severity:a.severity };
        if(a.severity==='critical'&&!a.resolved) b.push(entry);
        else if(a.severity==='warn'&&!a.resolved) w.push(entry);
        else if(a.resolved&&new Date(a.created_at)>=todayStart) ct.push(entry);
        else if(!a.resolved) ip.push(entry);
      });
      setMissions({ inProgress:ip, waiting:w, completedToday:ct, blocked:b });
      setLoading(false);
    }
    load();
    const i = setInterval(load, 15000);
    const ch = supabase.channel('missions-page').on('postgres_changes',{event:'*',schema:'public',table:'alerts'},load).subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, []);

  const cols = [
    { key:'inProgress',    label:'IN PROGRESS',    colour:C.warmGold, items:missions.inProgress },
    { key:'waiting',       label:'WAITING',         colour:C.waiting,  items:missions.waiting },
    { key:'completedToday',label:'COMPLETED TODAY', colour:C.online,   items:missions.completedToday },
    { key:'blocked',       label:'BLOCKED',         colour:C.error,    items:missions.blocked },
  ];

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', background:C.midnight, fontFamily:'Inter, system-ui, sans-serif', color:C.white }}>
      <div style={{ padding:'14px 20px', background:C.bgPanel, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.roseGold }}>Mission Board</div>
        <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>
          Active tasks and operations across all 28 agents — real-time
        </div>
        <div style={{ display:'flex', gap:16, marginTop:8 }}>
          {cols.map(col => (
            <div key={col.key} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:col.colour }} />
              <span style={{ fontSize:10, color:C.textMuted }}>{col.label}: <strong style={{ color:col.colour }}>{col.items.length}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:C.textMuted }}>Loading missions...</div>
      ) : (
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:0, overflow:'hidden' }}>
          {cols.map(col => (
            <div key={col.key} style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:`1px solid ${C.border}` }}>
              <div style={{ padding:'10px 14px', background:C.bgCard, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:col.colour }}>
                  {col.label} ({col.items.length})
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
                {col.items.length===0 ? (
                  <div style={{ fontSize:10, color:C.textMuted, fontStyle:'italic', padding:8 }}>No items</div>
                ) : col.items.map(item => (
                  <div key={item.id} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderLeft:`3px solid ${col.colour}`, borderRadius:6, padding:'8px 10px', marginBottom:6 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:item.colour, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{item.agent}</div>
                    <div style={{ fontSize:10, color:C.textSec, lineHeight:1.5 }}>{item.message}</div>
                    <div style={{ fontSize:8, color:C.textMuted, marginTop:4, fontFamily:'JetBrains Mono, monospace' }}>{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
