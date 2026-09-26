// FILE: precci/frontend/app/dashboard/layout.jsx
// CUTEME LTD — Dashboard Layout
// JARVIS navigation listener — Vivienne controls the dashboard in real time.

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  roseGold: '#C4A494', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a',
  online: '#22c55e', white: '#FFFFFF',
};

const NAV = [
  { id: 'command-center',    label: 'Command Center',      href: '/dashboard' },
  { id: 'executive-board',   label: 'Executive Board',     href: '/dashboard/executive-board' },
  { id: 'specialist-agents', label: 'Specialist Agents',   href: '/dashboard/specialist-agents' },
  { id: 'live-operations',   label: 'Live Operations',     href: '/dashboard/live-operations' },
  { id: 'mission-board',     label: 'Mission Board',       href: '/dashboard/mission-board' },
  { id: 'communications',    label: 'Communications',      href: '/dashboard/communications' },
  { id: 'client-sessions',   label: 'Client Sessions',     href: '/dashboard/client-sessions' },
  { id: 'beauty-academy',    label: 'Beauty Academy',      href: '/dashboard/beauty-academy' },
  { id: 'analytics',         label: 'Analytics',           href: '/dashboard/analytics' },
  { id: 'revenue',           label: 'Orders & Revenue',    href: '/dashboard/revenue' },
  { id: 'system-health',     label: 'System Intelligence', href: '/dashboard/system-health' },
  { id: 'settings',          label: 'Settings & Controls', href: '/dashboard/settings' },
];

function useClock() {
  const [t, setT] = useState(null);
  useEffect(() => {
    setT(new Date());
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const clock = useClock();
  const [navFlash, setNavFlash] = useState('');
  const [vivienneMessage, setVivienneMessage] = useState('');
  const [showVivienneMessage, setShowVivienneMessage] = useState(false);

  const fmtTime = clock ? clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';
  const fmtDate = clock ? clock.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

  // JARVIS Realtime navigation listener
  useEffect(() => {
    const ch = supabase
      .channel('jarvis-navigation')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jarvis_commands' }, (payload) => {
        const command = payload.new;
        if (command.response_summary) {
          setVivienneMessage(command.response_summary);
          setShowVivienneMessage(true);
          setTimeout(() => setShowVivienneMessage(false), 6000);
        }
        if (command.navigation_action && command.navigation_action !== 'none') {
          setNavFlash(command.routed_to || '');
          setTimeout(() => setNavFlash(''), 2500);
          setTimeout(() => router.push(command.navigation_action), 300);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [router]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '56px 1fr',
      gridTemplateColumns: '200px 1fr',
      height: '100vh', overflow: 'hidden',
      background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12, color: C.white,
    }}>

      {/* HEADER */}
      <header style={{
        gridColumn: '1/-1', gridRow: 1,
        background: C.bgPanel, borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 172, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${C.roseGold}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.roseGold + '18', fontSize: 12, fontWeight: 900, color: C.roseGold }}>✦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.roseGold, letterSpacing: '0.02em', lineHeight: 1.1 }}>CUTEME LTD</div>
            <div style={{ fontSize: 8, color: C.textMuted, letterSpacing: '0.03em' }}>AI Command Center</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9999, padding: '3px 10px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.online, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.online, animation: 'pulse-dot 2s infinite' }} />
          AI SYSTEM: FULLY OPERATIONAL
        </div>

        {showVivienneMessage && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: C.roseGold + '12', border: `1px solid ${C.roseGold}33`, borderRadius: 8, animation: 'fade-in-up 200ms ease-out' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.roseGold + '20', border: `1.5px solid ${C.roseGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: C.roseGold, flexShrink: 0 }}>VI</div>
            <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.4, flex: 1 }}>{vivienneMessage.substring(0, 120)}</div>
            <button onClick={() => setShowVivienneMessage(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0 }}>✕</button>
          </div>
        )}

        <div style={{ marginLeft: showVivienneMessage ? 0 : 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div suppressHydrationWarning style={{ fontSize: 9, color: C.textMuted }}>{fmtDate}</div>
          <div suppressHydrationWarning style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{fmtTime}</div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside style={{
        gridColumn: 1, gridRow: 2,
        background: C.bgPanel, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 100,
      }}>
        <div style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.roseGold}44, ${C.midnight})`, border: `2px solid ${C.roseGold}`, boxShadow: `0 0 14px ${C.roseGold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.roseGold, flexShrink: 0 }}>PM</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.roseGold, fontStyle: 'italic', lineHeight: 1.1 }}>Precious Mills</div>
              <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Owner & Co-Founder</div>
            </div>
          </div>
          <div style={{ background: C.roseGold + '12', border: `1px solid ${C.roseGold}30`, borderRadius: 6, padding: '5px 8px', fontSize: 9, color: C.textSec, lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' }}>
            You speak. Vivienne executes.<br />You watch. We build.
          </div>
        </div>

        <nav style={{ flex: 1, padding: '6px 0' }}>
          {NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const isFlashing = navFlash && item.label === navFlash;
            return (
              <Link key={item.id} href={item.href} style={{
                display: 'flex', alignItems: 'center',
                padding: '7px 14px',
                background: isFlashing ? `${C.roseGold}22` : isActive ? `${C.roseGold}08` : 'transparent',
                borderLeft: `2px solid ${isFlashing || isActive ? C.roseGold : 'transparent'}`,
                color: isFlashing || isActive ? C.roseGold : C.textMuted,
                fontSize: 11, fontWeight: isFlashing || isActive ? 600 : 400,
                textDecoration: 'none', transition: 'all 150ms',
              }}>
                {isFlashing && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.roseGold, marginRight: 6, animation: 'pulse-dot 0.5s infinite', flexShrink: 0 }} />}
                {item.label}
                {isFlashing && <span style={{ marginLeft: 'auto', fontSize: 8, color: C.roseGold, fontWeight: 700 }}>← Vivienne</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '6px 14px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.roseGold + '05' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.roseGold, animation: 'pulse-dot 3s infinite' }} />
            <span style={{ fontSize: 8.5, color: C.roseGold, fontWeight: 600 }}>Vivienne always listening</span>
          </div>
          <div style={{ fontSize: 7.5, color: C.textMuted, marginTop: 2 }}>Speak to navigate the dashboard</div>
        </div>

        <div style={{ padding: '8px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.online, animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: C.online, textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Status</span>
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>All Systems Operational</div>
          <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>© 2026 CUTEME LTD.</div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ gridColumn: 2, gridRow: 2, overflow: 'auto', background: C.midnight, position: 'relative' }}>
        {children}
        {navFlash && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(135deg, ${C.roseGold}06 0%, transparent 50%)`, animation: 'fade-in-out 2.5s ease forwards', zIndex: 50 }} />
        )}
      </main>

      <style>{`
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @keyframes fade-in-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fade-in-out{0%{opacity:0}10%{opacity:1}80%{opacity:1}100%{opacity:0}}
        @keyframes voice-waveform{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.4)}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#4a2a2f;border-radius:2px}
      `}</style>
    </div>
  );
}