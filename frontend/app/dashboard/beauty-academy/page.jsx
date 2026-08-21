'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { roseGold:'#C4A494', midnight:'#1A0A0F', bgPanel:'#2a1a1f', bgCard:'#221218', border:'#4a2a2f', textSec:'#d4b8b0', textMuted:'#8a6a6a', online:'#22c55e', white:'#FFFFFF', warmGold:'#D4A853', blushPink:'#F2B5B0' };

export default function BeautyAcademyPage() {
  const [content, setContent] = useState([]);
  const [stats, setStats] = useState({ totalCourses:0, totalGuides:0, totalPosts:0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const [{ data: piperContent }, { data: products }] = await Promise.all([
        supabase.from('content_log').select('id,type,caption,media_url,published_at,engagement,agent_id').eq('agent_id','PC-018').order('published_at',{ascending:false}).limit(100),
        supabase.from('products').select('id,name,brand,category,price,currency,description,image_url,in_stock').in('category',['course','masterclass','ebook','guide','digital_guide','digital']).eq('in_stock',true).order('created_at',{ascending:false}),
      ]);

      const allContent = [
        ...(piperContent||[]).map(c=>({ id:c.id, type:c.type, title:(c.caption||'').substring(0,60), description:(c.caption||'').substring(60,160), publishedAt:c.published_at, source:'piper', engagement:c.engagement })),
        ...(products||[]).map(p=>({ id:p.id, type:p.category, title:p.name, description:p.description, price:p.price, currency:p.currency, imageUrl:p.image_url, source:'product' })),
      ];

      const courses = allContent.filter(c=>['course','masterclass'].includes(c.type));
      const guides  = allContent.filter(c=>['ebook','guide','digital_guide','digital'].includes(c.type));
      const posts   = allContent.filter(c=>!['course','masterclass','ebook','guide','digital_guide','digital'].includes(c.type));

      setContent(allContent);
      setStats({ totalCourses:courses.length, totalGuides:guides.length, totalPosts:posts.length });
      setLoading(false);
    }
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const filtered = content.filter(c => {
    if(filter==='courses') return ['course','masterclass'].includes(c.type);
    if(filter==='guides') return ['ebook','guide','digital_guide','digital'].includes(c.type);
    if(filter==='posts') return !['course','masterclass','ebook','guide','digital_guide','digital'].includes(c.type);
    return true;
  });

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', background:C.midnight, fontFamily:'Inter, system-ui, sans-serif', color:C.white }}>
      <div style={{ padding:'14px 20px', background:C.bgPanel, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#C4A49420', border:'2px solid #C4A494', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#C4A494' }}>PI</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:C.roseGold }}>CUTEME Beauty Academy</div>
            <div style={{ fontSize:10, color:C.textMuted }}>Managed by Piper — courses, guides, masterclasses and tutorials for all genders</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:12 }}>
          {[
            { label:'Courses & Masterclasses', value:stats.totalCourses, col:C.roseGold },
            { label:'Guides & Ebooks',         value:stats.totalGuides,  col:C.warmGold },
            { label:'Published Content',        value:stats.totalPosts,   col:C.blushPink },
          ].map(m=>(
            <div key={m.label} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderTop:`2px solid ${m.col}`, borderRadius:8, padding:'8px 14px', minWidth:120 }}>
              <div style={{ fontSize:20, fontWeight:800, color:m.col }}>{m.value}</div>
              <div style={{ fontSize:8.5, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:1 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, padding:'10px 20px', borderBottom:`1px solid ${C.border}`, background:C.bgCard, flexShrink:0 }}>
        {[['all','All Content'],['courses','Courses'],['guides','Guides & Ebooks'],['posts','Posts']].map(([val,lbl])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{ padding:'5px 14px', borderRadius:9999, background:filter===val?C.roseGold:'transparent', border:`1px solid ${filter===val?C.roseGold:C.border}`, color:filter===val?C.midnight:C.textMuted, fontSize:10, fontWeight:600, cursor:'pointer', transition:'all 150ms' }}>{lbl}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:10, color:C.textMuted, alignSelf:'center' }}>{filtered.length} items</span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {loading ? (
          <div style={{ fontSize:13, color:C.textMuted, padding:20 }}>Piper is loading academy content...</div>
        ) : filtered.length===0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', gap:12, textAlign:'center' }}>
            <div style={{ fontSize:32, opacity:0.3 }}>🎓</div>
            <div style={{ fontSize:13, color:C.textMuted, lineHeight:1.7 }}>Piper is creating content now.<br />Check back soon or connect Teachable to load live courses.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
            {filtered.map(item=>(
              <div key={item.id} style={{ background:C.bgPanel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                {item.imageUrl&&<img src={item.imageUrl} alt={item.title} style={{ width:'100%', height:120, objectFit:'cover' }} />}
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:8, padding:'2px 6px', borderRadius:9999, background:`${C.roseGold}20`, color:C.roseGold, display:'inline-block', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:5 }}>{item.type}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.white, lineHeight:1.3 }}>{item.title}</div>
                    </div>
                    {item.price&&(
                      <div style={{ fontSize:13, fontWeight:800, color:C.warmGold, marginLeft:10, flexShrink:0 }}>
                        {parseFloat(item.price)===0?'FREE':`${item.currency||'USD'} ${parseFloat(item.price).toFixed(2)}`}
                      </div>
                    )}
                  </div>
                  {item.description&&<div style={{ fontSize:10, color:C.textMuted, lineHeight:1.6 }}>{item.description.substring(0,100)}{item.description.length>100?'...':''}</div>}
                  {item.publishedAt&&<div style={{ fontSize:8.5, color:C.textMuted, marginTop:8, fontFamily:'JetBrains Mono, monospace' }}>{new Date(item.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>}
                  <div style={{ fontSize:9, color:C.textMuted, marginTop:6, fontStyle:'italic' }}>Say the course name to Piper to enrol</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
