'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { roseGold:'#C4A494', midnight:'#1A0A0F', bgPanel:'#2a1a1f', bgCard:'#221218', border:'#4a2a2f', textSec:'#d4b8b0', textMuted:'#8a6a6a', online:'#22c55e', busy:'#f97316', error:'#ef4444', white:'#FFFFFF', warmGold:'#D4A853', cyan:'#00C8ED' };
const AGENT_NAMES = { 'PC-001':'Vivienne','PC-002':'Celeste','PC-003':'Marcus','PC-004':'Sienna','PC-005':'Rafael','PC-006':'Nadia','PC-007':'Sebastian','PC-008':'Luna','PC-009':'Zara','PC-010':'Mia','PC-011':'Isla','PC-012':'Remy','PC-013':'Cora','PC-014':'Drew','PC-015':'Sage','PC-016':'Belle','PC-017':'Nova','PC-018':'Piper','PC-019':'Nina','PC-020':'Elton','PC-021':'Lena','PC-022':'Finn','PC-023':'Aurora','PC-024':'Cole','PC-025':'Eva','PC-026':'Grace','PC-027':'Brook' };
const AGENT_COLOURS = { 'PC-001':'#C4A494','PC-002':'#D4A853','PC-003':'#F2B5B0','PC-004':'#F5DEB3','PC-005':'#8B3A3A','PC-006':'#F7F0E8','PC-007':'#3B82F6','PC-008':'#C4A494','PC-009':'#D4A853','PC-010':'#F2B5B0','PC-011':'#F5DEB3','PC-012':'#8B3A3A','PC-013':'#F7F0E8','PC-014':'#3B82F6','PC-015':'#4ECDC4','PC-016':'#00C8ED','PC-017':'#F5A623','PC-018':'#C4A494','PC-019':'#F2B5B0','PC-020':'#D4A853','PC-021':'#F7F0E8','PC-022':'#8B3A3A','PC-023':'#F5DEB3','PC-024':'#3B82F6','PC-025':'#4ECDC4','PC-026':'#00C8ED','PC-027':'#F5A623' };
function fmtTime(iso) { if(!iso) return ''; return new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}); }
function fmtDuration(secs) { if(!secs) return '—'; const m=Math.floor(secs/60), s=secs%60; return `${m}m ${s}s`; }

export default function ClientSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total:0, today:0, camera:0, completed:0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const [{ data: sessData }, { count: total }, { count: today }, { count: camera }, { count: completed }] = await Promise.all([
        supabase.from('sessions').select('id,user_id,agent_id,channel,duration_seconds,camera_used,completed,created_at').order('created_at',{ascending:false}).limit(200),
        supabase.from('sessions').select('id',{count:'exact',head:true}),
        supabase.from('sessions').select('id',{count:'exact',head:true}).gte('created_at',todayStart.toISOString()),
        supabase.from('sessions').select('id',{count:'exact',head:true}).eq('camera_used',true),
        supabase.from('sessions').select('id',{count:'exact',head:true}).eq('completed',true),
      ]);
      setSessions(sessData||[]);
      setStats({ total:total||0, today:today||0, camera:camera||0, completed:completed||0 });
      setLoading(false);
    }
    load();
    const i = setInterval(load, 20000);
    const ch = supabase.channel('sessions-page').on('postgres_changes',{event:'INSERT',schema:'public',table:'sessions'},load).subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, []);

  const filtered = sessions.filter(s => {
    if(filter==='camera') return s.camera_used;
    if(filter==='completed') return s.completed;
    if(filter==='active') return !s.completed;
    return true;
  });

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', background:C.midnight, fontFamily:'Inter, system-ui, sans-serif', color:C.white }}>
      <div style={{ padding:'14px 20px', background:C.bgPanel, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.roseGold }}>Client Sessions</div>
        <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>All client interactions across PRECCI Core — real-time from Supabase</div>
        <div style={{ display:'flex', gap:12, marginTop:10 }}>
          {[
            { label:'Total Sessions', value:stats.total, col:C.roseGold },
            { label:'Today',          value:stats.today, col:C.warmGold },
            { label:'Camera Used',    value:stats.camera, col:C.cyan },
            { label:'Completed',      value:stats.completed, col:C.online },
          ].map(m=>(
            <div key={m.label} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderTop:`2px solid ${m.col}`, borderRadius:8, padding:'8px 14px', minWidth:100 }}>
              <div style={{ fontSize:18, fontWeight:800, color:m.col }}>{m.value}</div>
              <div style={{ fontSize:8.5, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:1 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, padding:'10px 20px', borderBottom:`1px solid ${C.border}`, background:C.bgCard, flexShrink:0 }}>
        {[['all','All'],['active','Active'],['camera','Camera'],['completed','Completed']].map(([val,lbl])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{ padding:'5px 14px', borderRadius:9999, background:filter===val?C.roseGold:'transparent', border:`1px solid ${filter===val?C.roseGold:C.border}`, color:filter===val?C.midnight:C.textMuted, fontSize:10, fontWeight:600, cursor:'pointer', transition:'all 150ms' }}>{lbl}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:10, color:C.textMuted, alignSelf:'center' }}>{filtered.length} sessions</span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px' }}>
        {loading ? (
          <div style={{ fontSize:13, color:C.textMuted, padding:20 }}>Loading sessions...</div>
        ) : filtered.length===0 ? (
          <div style={{ fontSize:13, color:C.textMuted, fontStyle:'italic', padding:20 }}>No sessions found</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {['Time','Agent','Channel','Duration','Camera','Status'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:9, textTransform:'uppercase', letterSpacing:'0.07em', color:C.textMuted, fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}22` }}>
                  <td style={{ padding:'9px 12px', color:C.textMuted, fontSize:10, fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap' }}>{fmtTime(s.created_at)}</td>
                  <td style={{ padding:'9px 12px' }}>
                    <span style={{ color:AGENT_COLOURS[s.agent_id]||C.roseGold, fontWeight:600 }}>{AGENT_NAMES[s.agent_id]||s.agent_id}</span>
                  </td>
                  <td style={{ padding:'9px 12px', color:C.textSec, textTransform:'capitalize' }}>{s.channel||'pwa'}</td>
                  <td style={{ padding:'9px 12px', color:C.textSec, fontFamily:'JetBrains Mono, monospace' }}>{fmtDuration(s.duration_seconds)}</td>
                  <td style={{ padding:'9px 12px' }}>
                    {s.camera_used
                      ? <span style={{ color:C.cyan, fontWeight:600, fontSize:9 }}>● CAMERA</span>
                      : <span style={{ color:C.textMuted, fontSize:9 }}>— VOICE</span>
                    }
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:9999, fontSize:8, fontWeight:700, background:s.completed?`${C.online}20`:`${C.busy}20`, color:s.completed?C.online:C.busy, border:`1px solid ${s.completed?C.online+'44':C.busy+'44'}` }}>
                      {s.completed?'COMPLETED':'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
